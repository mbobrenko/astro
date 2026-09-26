// Тонкий клиент к нашему локальному бэкенду (Astro/backend),
// который сам ходит в json.astrologyapi.com и прячет ключ.

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

async function post(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // нужно для сессионной куки аккаунта (бэкенд на другом домене)
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      data?.details?.message || data?.message || `Ошибка запроса (${res.status})`;
    throw new Error(message);
  }
  return data;
}

// "Тихий" вариант post — не бросает исключение при не-2xx, просто возвращает тело ответа как есть
// (для проверок статуса/лимита, где "не вошёл"/"лимит исчерпан" — обычный, ожидаемый исход, а не ошибка).
async function postQuiet(path, body) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body ?? {}),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, ...data };
  } catch (e) {
    return { ok: false, status: 0, error: "network_error", message: e.message };
  }
}

async function getQuiet(path) {
  try {
    const res = await fetch(`${API_BASE}${path}`, { credentials: "include" });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, ...data };
  } catch (e) {
    return { ok: false, status: 0, error: "network_error", message: e.message };
  }
}

// birth: { day, month, year, hour, min, lat, lon, tzone } — все числа
function birthPayload(birth) {
  return {
    day: Number(birth.day),
    month: Number(birth.month),
    year: Number(birth.year),
    hour: Number(birth.hour),
    min: Number(birth.min),
    lat: Number(birth.lat),
    lon: Number(birth.lon),
    tzone: Number(birth.tzone),
  };
}

export function fetchPlanets(birth) {
  return post("/api/planets", birthPayload(birth));
}

export function fetchAstroDetails(birth) {
  return post("/api/astro-details", birthPayload(birth));
}

export function fetchMajorDasha(birth) {
  return post("/api/dasha/major", birthPayload(birth));
}

export function fetchSubDasha(birth, mdPlanetEn) {
  return post(`/api/dasha/sub/${mdPlanetEn.toLowerCase()}`, birthPayload(birth));
}

export function fetchGeoDetails(place, maxRows = 5) {
  return post("/api/geo", { place, maxRows });
}

export function fetchTimezone(lat, lon, dateStr /* 'mm-dd-yyyy' */) {
  return post("/api/timezone", { latitude: Number(lat), longitude: Number(lon), date: dateStr });
}

export function fetchMatchAshtakoot(male, female) {
  return post("/api/match/ashtakoot", {
    m_day: Number(male.day),
    m_month: Number(male.month),
    m_year: Number(male.year),
    m_hour: Number(male.hour),
    m_min: Number(male.min),
    m_lat: Number(male.lat),
    m_lon: Number(male.lon),
    m_tzone: Number(male.tzone),
    f_day: Number(female.day),
    f_month: Number(female.month),
    f_year: Number(female.year),
    f_hour: Number(female.hour),
    f_min: Number(female.min),
    f_lat: Number(female.lat),
    f_lon: Number(female.lon),
    f_tzone: Number(female.tzone),
  });
}

export function fetchSubSubDasha(birth, mdPlanetEn, adPlanetEn) {
  return post(`/api/dasha/sub-sub/${mdPlanetEn.toLowerCase()}/${adPlanetEn.toLowerCase()}`, birthPayload(birth));
}

// --- Аккаунт: вход по коду на email, статус, лимит пакета, оплата ---

export function requestLoginCode(email) {
  return post("/api/auth/request-code", { email });
}

export function verifyLoginCode(email, code) {
  return post("/api/auth/verify", { email, code });
}

export function logoutAccount() {
  return postQuiet("/api/auth/logout", {});
}

// Не бросает исключение — "не вошёл"/сервер недоступен трактуются как { loggedIn: false }
export async function fetchAccountStatus() {
  const r = await getQuiet("/api/account/status");
  if (!r.ok) return { loggedIn: false };
  return r;
}

// kind: "pratyantar" | "compat" | "relocation_scan" | "relocation_city"
// Возвращает { allowed, repeat, remaining } — при сетевой ошибке/не вошёл считаем allowed:false,
// чтобы вызывающий код по умолчанию показывал тизер, а не тихо разрешал лишнее.
export async function checkUsage(kind, requestKey) {
  const r = await postQuiet("/api/usage/check", { kind, requestKey });
  if (!r.ok) return { allowed: false, repeat: false, remaining: 0, reason: r.error || "not_logged_in" };
  return r;
}

export function createPackagePayment(tierId) {
  return post("/api/pay/create", { tierId });
}

// Не бросает исключение — используется для показа тарифных пакетов до входа
export async function fetchPackageInfo() {
  const r = await getQuiet("/api/pay/info");
  if (!r.ok) return null;
  return { tiers: r.tiers || [] };
}
