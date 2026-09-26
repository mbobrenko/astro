import pg from "pg";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

// Neon/Render Postgres обычно требуют SSL, но с самоподписанным/не-строгим сертификатом на бесплатных тарифах —
// поэтому rejectUnauthorized:false. Если DATABASE_URL не задан, аккаунты/пакеты/лимиты просто выключены,
// анонимный мягкий пейволл (localStorage) продолжает работать как раньше.
export const pool = connectionString
  ? new Pool({ connectionString, ssl: { rejectUnauthorized: false } })
  : null;

export function dbEnabled() {
  return !!pool;
}

const MIGRATIONS = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS login_codes (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_login_codes_email ON login_codes(email);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS packages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quota INTEGER NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  price_kopeks INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  yookassa_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_packages_user ON packages(user_id);
CREATE INDEX IF NOT EXISTS idx_packages_yk ON packages(yookassa_payment_id);

CREATE TABLE IF NOT EXISTS usage_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id INTEGER NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  request_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, kind, request_key)
);
`;

export async function migrate() {
  if (!pool) {
    console.warn("DATABASE_URL не задан — аккаунты/пакеты/лимиты отключены, работает только анонимный мягкий пейволл.");
    return;
  }
  await pool.query(MIGRATIONS);
  console.log("БД готова (миграции применены).");
}
