// Тонкий клиент к нашему локальному бэкенду (Astro/backend),
// который сам ходит в json.astrologyapi.com и прячет ключ.

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

async function post(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
