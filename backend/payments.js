import crypto from "crypto";
import { pool, dbEnabled } from "./db.js";
import { PACKAGE_QUOTA, PACKAGE_PRICE_KOPEKS } from "./usage.js";

const SHOP_ID = process.env.YOOKASSA_SHOP_ID;
const SECRET_KEY = process.env.YOOKASSA_SECRET_KEY;
const RETURN_URL = process.env.PAYMENT_RETURN_URL || "https://astro-gold-three.vercel.app/?paid=1";
const YK_ENABLED = !!(SHOP_ID && SECRET_KEY);

function ykAuthHeader() {
  return "Basic " + Buffer.from(`${SHOP_ID}:${SECRET_KEY}`).toString("base64");
}
function rub(kopeks) {
  return (kopeks / 100).toFixed(2);
}

export async function createPayment(req, res) {
  if (!dbEnabled()) return res.status(503).json({ error: "accounts_disabled" });
  if (!req.user) return res.status(401).json({ error: "not_logged_in" });

  const pkgRes = await pool.query(
    `INSERT INTO packages (user_id, quota, price_kopeks, status) VALUES ($1,$2,$3,'pending') RETURNING id`,
    [req.user.id, PACKAGE_QUOTA, PACKAGE_PRICE_KOPEKS]
  );
  const packageId = pkgRes.rows[0].id;

  if (!YK_ENABLED) {
    // Тестовый режим: ключи ЮKassa ещё не подключены (нет YOOKASSA_SHOP_ID/YOOKASSA_SECRET_KEY в окружении).
    // Помечаем пакет оплаченным сразу, чтобы можно было проверить весь остальной цикл (вход → лимит → списание)
    // без реальной оплаты. Как только ключи появятся в Render — этот режим перестаёт срабатывать сам собой.
    await pool.query(
      `UPDATE packages SET status='paid', paid_at=now(), yookassa_payment_id=$2 WHERE id=$1`,
      [packageId, `test_${packageId}`]
    );
    return res.json({ ok: true, testMode: true, packageId, confirmationUrl: null });
  }

  const idempotenceKey = crypto.randomUUID();
  const payload = {
    amount: { value: rub(PACKAGE_PRICE_KOPEKS), currency: "RUB" },
    capture: true,
    confirmation: { type: "redirect", return_url: RETURN_URL },
    description: `Пакет ${PACKAGE_QUOTA} запросов — Ведическая астрология`,
    metadata: { packageId: String(packageId), userId: String(req.user.id) },
    receipt: {
      customer: { email: req.user.email },
      items: [
        {
          description: `Пакет из ${PACKAGE_QUOTA} расширенных запросов`,
          quantity: "1.00",
          amount: { value: rub(PACKAGE_PRICE_KOPEKS), currency: "RUB" },
          vat_code: "1",
          payment_subject: "service",
          payment_mode: "full_payment",
        },
      ],
    },
  };

  let ykRes, data;
  try {
    ykRes = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        Authorization: ykAuthHeader(),
        "Content-Type": "application/json",
        "Idempotence-Key": idempotenceKey,
      },
      body: JSON.stringify(payload),
    });
    data = await ykRes.json().catch(() => ({}));
  } catch (e) {
    console.error("YooKassa create payment network error:", e.message);
    return res.status(502).json({ error: "yookassa_unreachable" });
  }
  if (!ykRes.ok) {
    console.error("YooKassa create payment error:", data);
    return res.status(502).json({ error: "yookassa_error", message: data?.description || "Не удалось создать платёж." });
  }

  await pool.query(`UPDATE packages SET yookassa_payment_id=$2 WHERE id=$1`, [packageId, data.id]);
  res.json({ ok: true, packageId, confirmationUrl: data.confirmation?.confirmation_url || null });
}

export async function webhook(req, res) {
  // ЮKassa не подписывает тело уведомления — доверять ему напрямую небезопасно (кто угодно может прислать
  // POST с любым содержимым). Поэтому отвечаем 200 сразу (чтобы не ретраили), а реальный статус платежа
  // перепроверяем у самой ЮKassa своими же ключами по id из уведомления.
  res.json({ ok: true });
  if (!YK_ENABLED || !dbEnabled()) return;
  try {
    const paymentId = req.body?.object?.id;
    if (!paymentId) return;
    const check = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
      headers: { Authorization: ykAuthHeader() },
    });
    const data = await check.json().catch(() => ({}));
    if (!check.ok || data.status !== "succeeded") return;

    const packageId = data.metadata?.packageId;
    if (!packageId) return;
    await pool.query(
      `UPDATE packages SET status='paid', paid_at=now() WHERE id=$1 AND yookassa_payment_id=$2 AND status <> 'paid'`,
      [packageId, paymentId]
    );
  } catch (e) {
    console.error("YooKassa webhook processing error:", e.message);
  }
}

export async function paymentStatus(req, res) {
  if (!dbEnabled()) return res.status(503).json({ error: "accounts_disabled" });
  if (!req.user) return res.status(401).json({ error: "not_logged_in" });
  const packageId = req.params.id;
  const { rows } = await pool.query(`SELECT status FROM packages WHERE id=$1 AND user_id=$2`, [packageId, req.user.id]);
  if (!rows.length) return res.status(404).json({ error: "not_found" });
  res.json({ status: rows[0].status });
}
