import { pool, dbEnabled } from "./db.js";

export const PACKAGE_QUOTA = Number(process.env.PACKAGE_QUOTA || 25);
// 690 ₽ по умолчанию — правится переменной окружения без деплоя кода.
export const PACKAGE_PRICE_KOPEKS = Number(process.env.PACKAGE_PRICE_KOPEKS || 69000);

export async function getActivePackage(userId) {
  if (!dbEnabled()) return null;
  const { rows } = await pool.query(
    `SELECT * FROM packages WHERE user_id=$1 AND status='paid' AND used < quota ORDER BY paid_at ASC LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

export async function accountStatus(userId) {
  if (!dbEnabled() || !userId) return null;
  const pkg = await getActivePackage(userId);
  const totalRes = await pool.query(
    `SELECT COALESCE(SUM(quota),0) AS quota, COALESCE(SUM(used),0) AS used FROM packages WHERE user_id=$1 AND status='paid'`,
    [userId]
  );
  const totals = totalRes.rows[0];
  return {
    hasActivePackage: !!pkg,
    remaining: pkg ? pkg.quota - pkg.used : 0,
    totalQuota: Number(totals.quota),
    totalUsed: Number(totals.used),
  };
}

/**
 * Проверяет/списывает использование "новой" сущности (kind+requestKey) из активного пакета пользователя.
 * Повторный просмотр уже когда-либо засчитанной сущности (тот же kind+requestKey) — всегда бесплатен,
 * даже если у пользователя сейчас нет активного пакета (он мог быть куплен и использован раньше).
 * Возвращает { allowed, repeat, remaining, reason? }.
 */
export async function consumeUsage(userId, kind, requestKey) {
  if (!dbEnabled()) return { allowed: true, repeat: false, remaining: null };

  const seen = await pool.query(
    `SELECT 1 FROM usage_log WHERE user_id=$1 AND kind=$2 AND request_key=$3 LIMIT 1`,
    [userId, kind, requestKey]
  );
  const pkg = await getActivePackage(userId);
  if (seen.rows.length) {
    return { allowed: true, repeat: true, remaining: pkg ? pkg.quota - pkg.used : 0 };
  }

  if (!pkg) {
    return { allowed: false, repeat: false, remaining: 0, reason: "no_package" };
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const upd = await client.query(
      `UPDATE packages SET used = used + 1 WHERE id=$1 AND used < quota RETURNING used, quota`,
      [pkg.id]
    );
    if (!upd.rows.length) {
      await client.query("ROLLBACK");
      return { allowed: false, repeat: false, remaining: 0, reason: "quota_exhausted" };
    }
    const ins = await client.query(
      `INSERT INTO usage_log (user_id, package_id, kind, request_key) VALUES ($1,$2,$3,$4)
       ON CONFLICT (user_id, kind, request_key) DO NOTHING RETURNING id`,
      [userId, pkg.id, kind, requestKey]
    );
    if (!ins.rows.length) {
      // Гонка: параллельный запрос уже засчитал этот же ключ первым — откатываем списание,
      // для текущего запроса это бесплатный повтор.
      await client.query("ROLLBACK");
      return { allowed: true, repeat: true, remaining: pkg.quota - pkg.used };
    }
    await client.query("COMMIT");
    const row = upd.rows[0];
    return { allowed: true, repeat: false, remaining: row.quota - row.used };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function checkUsageHandler(req, res) {
  if (!dbEnabled()) return res.status(503).json({ error: "accounts_disabled" });
  if (!req.user) return res.status(401).json({ error: "not_logged_in" });
  const { kind, requestKey } = req.body || {};
  if (!kind || !requestKey) return res.status(400).json({ error: "missing_fields" });
  try {
    const result = await consumeUsage(req.user.id, kind, String(requestKey));
    res.json(result);
  } catch (e) {
    console.error("consumeUsage error:", e.message);
    res.status(500).json({ error: "internal_error" });
  }
}

export async function accountStatusHandler(req, res) {
  if (!req.user) return res.json({ loggedIn: false });
  const status = await accountStatus(req.user.id);
  res.json({ loggedIn: true, email: req.user.email, ...status });
}
