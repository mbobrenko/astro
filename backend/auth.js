import crypto from "crypto";
import { pool, dbEnabled } from "./db.js";
import { sendLoginCode } from "./mailer.js";

const SESSION_COOKIE = "astro_session";
const SESSION_DAYS = 30;
const CODE_TTL_MIN = 10;

function genCode() {
  return String(crypto.randomInt(100000, 1000000)); // 6 цифр
}
function genToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function requestCode(req, res) {
  if (!dbEnabled()) return res.status(503).json({ error: "accounts_disabled", message: "Аккаунты временно недоступны." });
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "invalid_email", message: "Некорректный email." });
  }
  const code = genCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MIN * 60000);
  await pool.query("INSERT INTO login_codes (email, code, expires_at) VALUES ($1,$2,$3)", [email, code, expiresAt]);
  try {
    await sendLoginCode(email, code);
  } catch (e) {
    console.error("Не удалось отправить письмо с кодом:", e.message);
    return res.status(502).json({ error: "email_failed", message: "Не удалось отправить письмо. Попробуйте ещё раз." });
  }
  res.json({ ok: true });
}

export async function verifyCode(req, res) {
  if (!dbEnabled()) return res.status(503).json({ error: "accounts_disabled" });
  const email = String(req.body?.email || "").trim().toLowerCase();
  const code = String(req.body?.code || "").trim();
  if (!email || !code) return res.status(400).json({ error: "missing_fields" });

  const { rows } = await pool.query(
    `SELECT id FROM login_codes WHERE email=$1 AND code=$2 AND used=false AND expires_at > now() ORDER BY id DESC LIMIT 1`,
    [email, code]
  );
  if (!rows.length) return res.status(400).json({ error: "invalid_code", message: "Код неверный или истёк." });

  await pool.query("UPDATE login_codes SET used=true WHERE id=$1", [rows[0].id]);

  let userRes = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
  let userId;
  if (userRes.rows.length) {
    userId = userRes.rows[0].id;
  } else {
    const ins = await pool.query("INSERT INTO users (email) VALUES ($1) RETURNING id", [email]);
    userId = ins.rows[0].id;
  }

  const token = genToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400000);
  await pool.query("INSERT INTO sessions (token, user_id, expires_at) VALUES ($1,$2,$3)", [token, userId, expiresAt]);

  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: SESSION_DAYS * 86400000,
  });
  res.json({ ok: true, email });
}

export async function logout(req, res) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (token && dbEnabled()) {
    await pool.query("DELETE FROM sessions WHERE token=$1", [token]);
  }
  res.clearCookie(SESSION_COOKIE, { httpOnly: true, secure: true, sameSite: "none" });
  res.json({ ok: true });
}

// Middleware: подтягивает req.user, если есть валидная сессия. Не блокирует запрос, если сессии нет —
// анонимные пользователи как и раньше идут по бесплатному мягкому пейволлу без аккаунта.
export async function attachUser(req, _res, next) {
  req.user = null;
  if (!dbEnabled()) return next();
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return next();
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.email FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token=$1 AND s.expires_at > now()`,
      [token]
    );
    if (rows.length) req.user = rows[0];
  } catch (e) {
    console.error("attachUser error:", e.message);
  }
  next();
}

export async function me(req, res) {
  res.json({ loggedIn: !!req.user, email: req.user?.email || null });
}
