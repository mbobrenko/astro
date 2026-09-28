import { pool, dbEnabled } from "./db.js";
import { PACKAGE_TIERS_USD, findTierUsd } from "./usage.js";

// Lava.top (LAVALANE LTD, Кипр) — второй платёжный провайдер, для валютных (не-RU) платежей.
// В отличие от ЮKassa, счёт создаётся не "с нуля", а привязан к заранее созданному в личном
// кабинете Lava.top продукту ("офферу") с ценой "Цена по запросу API" — сумма передаётся в
// каждом запросе отдельно (см. LAVA_OFFER_ID в .env).
const API_KEY = process.env.LAVA_API_KEY;
const OFFER_ID = process.env.LAVA_OFFER_ID;
const WEBHOOK_SECRET = process.env.LAVA_WEBHOOK_SECRET;
const RETURN_URL_OK = process.env.PAYMENT_RETURN_URL || "https://astro-gold-three.vercel.app/?paid=1";
const RETURN_URL_FAIL = process.env.LAVA_FAIL_URL || "https://astro-gold-three.vercel.app/?paid=0";

// Считаем интеграцию "включённой", только когда есть и ключ, и id оффера — без оффера создать
// счёт всё равно нечем.
const LAVA_ENABLED = !!(API_KEY && OFFER_ID);

function lavaHeaders() {
  return { "X-Api-Key": API_KEY, "Content-Type": "application/json" };
}

export async function lavaPackageInfo(_req, res) {
  res.json({ tiers: PACKAGE_TIERS_USD, currency: "USD" });
}

export async function createLavaPayment(req, res) {
  if (!dbEnabled()) return res.status(503).json({ error: "accounts_disabled" });
  if (!req.user) return res.status(401).json({ error: "not_logged_in" });

  const tier = findTierUsd(req.body?.tierId);
  if (!tier) return res.status(400).json({ error: "invalid_tier", message: "Unknown package." });

  const pkgRes = await pool.query(
    `INSERT INTO packages (user_id, quota, provider, currency, amount_minor, status)
     VALUES ($1,$2,'lava','USD',$3,'pending') RETURNING id`,
    [req.user.id, tier.quota, tier.amountMinor]
  );
  const packageId = pkgRes.rows[0].id;

  if (!LAVA_ENABLED) {
    // Тестовый режим: LAVA_API_KEY и/или LAVA_OFFER_ID ещё не заполнены в окружении.
    // Помечаем пакет оплаченным сразу — чтобы можно было проверить остальной цикл
    // (вход → лимит → списание) без реального оффера/платежа.
    await pool.query(
      `UPDATE packages SET status='paid', paid_at=now(), lava_payment_id=$2 WHERE id=$1`,
      [packageId, `test_${packageId}`]
    );
    return res.json({ ok: true, testMode: true, packageId, confirmationUrl: null });
  }

  const amountUsd = (tier.amountMinor / 100).toFixed(2);
  const payload = {
    email: req.user.email,
    offerId: OFFER_ID,
    currency: "USD",
    amount: amountUsd,
    successful_return_url: RETURN_URL_OK,
    failure_return_url: RETURN_URL_FAIL,
    cancel_return_url: RETURN_URL_FAIL,
  };

  let lavaRes, data;
  try {
    lavaRes = await fetch("https://gate.lava.top/api/v3/invoice", {
      method: "POST",
      headers: lavaHeaders(),
      body: JSON.stringify(payload),
    });
    data = await lavaRes.json().catch(() => ({}));
  } catch (e) {
    console.error("Lava.top create invoice network error:", e.message);
    return res.status(502).json({ error: "lava_unreachable" });
  }
  if (!lavaRes.ok) {
    console.error("Lava.top create invoice error:", data);
    return res.status(502).json({
      error: "lava_error",
      message: data?.message || data?.error || "Не удалось создать счёт в Lava.top.",
    });
  }

  // ВАЖНО (временно): точную схему ответа Lava.top (в каком поле id счёта, в каком — ссылка на
  // оплату) не удалось подтвердить по документации — Swagger на gate.lava.top/docs рендерится
  // через JS и не отдаёт содержимое текстовому фетчеру, а живой тестовый вызов сделать не вышло:
  // сеть до gate.lava.top не доступна ни из облачной песочницы, ни с этого компьютера через
  // текущие настройки исходящего трафика. Поэтому пока: сохраняем сырой ответ целиком в БД и
  // перебираем несколько вероятных названий полей. После первого реального вызова — посмотреть
  // lava_raw_response в БД (или лог сервера) и заменить перебор на точные имена полей.
  const invoiceId = data.id || data.invoiceId || data.invoice_id || data.paymentId || null;
  const payUrl = data.paymentUrl || data.payment_url || data.url || data.link || null;

  await pool.query(`UPDATE packages SET lava_payment_id=$2, lava_raw_response=$3 WHERE id=$1`, [
    packageId,
    invoiceId,
    JSON.stringify(data),
  ]);

  if (!payUrl) {
    console.warn("Lava.top: не нашла ссылку на оплату в ответе, сырой ответ:", JSON.stringify(data));
  }
  res.json({ ok: true, packageId, confirmationUrl: payUrl });
}

export async function lavaWebhook(req, res) {
  // Отвечаем 200 сразу (чтобы Lava.top не слала повторы), реальную проверку делаем асинхронно.
  // Как и с ЮKassa: телу вебхука не доверяем напрямую (даже если совпал секрет) — статус платежа
  // перепроверяем отдельным запросом к самой Lava.top по id счёта, своим же ключом.
  res.json({ ok: true });
  if (!LAVA_ENABLED || !dbEnabled()) return;

  try {
    // Подлинность: секрет в заголовке X-Api-Key (задаётся в настройках вебхука в личном кабинете
    // Lava.top) + документация отдельно просит держать в белом списке IP 158.160.60.174, откуда
    // приходят вебхуки — эту часть стоит настроить на уровне файрвола/прокси перед боевым запуском.
    const gotSecret = req.headers["x-api-key"];
    if (WEBHOOK_SECRET && gotSecret !== WEBHOOK_SECRET) {
      console.warn("Lava.top webhook: секрет в X-Api-Key не совпал, игнорирую запрос.");
      return;
    }

    const body = req.body || {};
    console.log("Lava.top webhook, сырое тело (для первичной сверки полей):", JSON.stringify(body));

    const invoiceId =
      body.id || body.invoiceId || body.invoice_id || body.paymentId || body?.data?.id || null;
    if (!invoiceId) {
      console.warn("Lava.top webhook: не нашла id счёта в теле уведомления, пропускаю.");
      return;
    }

    const check = await fetch(`https://gate.lava.top/api/v1/invoices/${invoiceId}`, {
      headers: lavaHeaders(),
    });
    const data = await check.json().catch(() => ({}));
    if (!check.ok) {
      console.warn("Lava.top webhook: не удалось перепроверить счёт через GET /invoices:", data);
      return;
    }

    const statusStr = String(data.status || data.invoiceStatus || "").toLowerCase();
    const isPaid = ["paid", "success", "succeeded", "completed"].includes(statusStr);
    if (!isPaid) return;

    await pool.query(
      `UPDATE packages SET status='paid', paid_at=now(), lava_raw_response=$2
       WHERE lava_payment_id=$1 AND status <> 'paid'`,
      [invoiceId, JSON.stringify(data)]
    );
  } catch (e) {
    console.error("Lava.top webhook processing error:", e.message);
  }
}
