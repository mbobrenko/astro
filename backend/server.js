import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { migrate } from "./db.js";
import { requestCode, verifyCode, logout, attachUser } from "./auth.js";
import { checkUsageHandler, accountStatusHandler } from "./usage.js";
import { createPayment, webhook, paymentStatus } from "./payments.js";

dotenv.config();

const { ASTROLOGY_API_KEY, PORT = 3001, ALLOWED_ORIGIN } = process.env;

if (!ASTROLOGY_API_KEY) {
  console.error(
    "ASTROLOGY_API_KEY не задан. Создайте backend/.env на основе .env.example и впишите ключ с astrologyapi.com."
  );
  process.exit(1);
}

const UPSTREAM_BASE = "https://json.astrologyapi.com/v1";

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: ALLOWED_ORIGIN ? ALLOWED_ORIGIN.split(",") : true,
    credentials: true, // нужно для сессионной куки входа (кросс-доменной — фронтенд и бэкенд на разных хостах)
  })
);
app.use(cookieParser());
app.use(attachUser); // подтягивает req.user из сессии, если она есть; анонимных не блокирует

/**
 * Проксирует запрос на json.astrologyapi.com, подставляя ключ на сервере.
 * upstreamPath — путь после /v1/, например "planets" или `sub_vdasha/${md}`.
 */
async function callAstrologyApi(upstreamPath, body) {
  const res = await fetch(`${UPSTREAM_BASE}/${upstreamPath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-astrologyapi-key": ASTROLOGY_API_KEY,
    },
    body: JSON.stringify(body ?? {}),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const err = new Error(`AstrologyAPI ${upstreamPath} -> HTTP ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// Оборачивает обработчик, чтобы не дублировать try/catch в каждом роуте
function proxy(upstreamPathFn) {
  return async (req, res) => {
    try {
      const upstreamPath = upstreamPathFn(req);
      const data = await callAstrologyApi(upstreamPath, req.body);
      res.json(data);
    } catch (err) {
      console.error(err.message);
      res.status(err.status || 502).json({
        error: "astrology_api_error",
        message: err.message,
        details: err.data,
      });
    }
  };
}

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// --- Аккаунты: вход по одноразовому коду на email ---
app.post("/api/auth/request-code", requestCode);
app.post("/api/auth/verify", verifyCode);
app.post("/api/auth/logout", logout);
app.get("/api/account/status", accountStatusHandler);

// --- Лимит платного пакета: фронтенд спрашивает разрешение перед "новым" (не кэшированным) запросом ---
app.post("/api/usage/check", checkUsageHandler);

// --- Оплата пакета через ЮKassa ---
app.post("/api/pay/create", createPayment);
app.post("/api/pay/webhook", webhook);
app.get("/api/pay/status/:id", paymentStatus);

// --- Геокодинг места рождения и исторический часовой пояс ---
app.post("/api/geo", proxy(() => "geo_details"));
app.post("/api/timezone", proxy(() => "timezone_with_dst"));

// --- Сидерические позиции планет, аянамша, асцендент/накшатра рождения ---
app.post("/api/planets", proxy(() => "planets"));
app.post("/api/planets/extended", proxy(() => "planets/extended"));
app.post("/api/ayanamsha", proxy(() => "ayanamsha"));
app.post("/api/astro-details", proxy(() => "astro_details"));
app.post("/api/birth-details", proxy(() => "birth_details"));

// --- Карта (южноиндийский/другие стили) ---
app.post("/api/chart/:chartId", proxy((req) => `horo_chart/${req.params.chartId}`));

// --- Вимшоттари даша ---
app.post("/api/dasha/major", proxy(() => "major_vdasha"));
app.post("/api/dasha/sub/:md", proxy((req) => `sub_vdasha/${req.params.md}`));
app.post(
  "/api/dasha/sub-sub/:md/:ad",
  proxy((req) => `sub_sub_vdasha/${req.params.md}/${req.params.ad}`)
);

// --- Синастрия / совместимость (Аштакута) ---
app.post("/api/match/ashtakoot", proxy(() => "match_ashtakoot_points"));
app.post("/api/match/percentage", proxy(() => "match_percentage"));

app.listen(PORT, () => {
  console.log(`Astro backend слушает на http://localhost:${PORT}`);
});

migrate().catch((e) => console.error("Ошибка миграции БД:", e.message));
