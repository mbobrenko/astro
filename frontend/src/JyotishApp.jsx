import React, { useEffect, useState, useCallback } from "react";
import {
  fetchPlanets,
  fetchAstroDetails,
  fetchMajorDasha,
  fetchSubDasha,
  fetchSubSubDasha,
  fetchGeoDetails,
  fetchTimezone,
  fetchMatchAshtakoot,
} from "./api";
import {
  SIGNS,
  signLordOf,
  relation,
  RELATION_LABEL,
  elementOf,
  elementCompat,
  ganaOf,
  ganaCompat,
  HOUSE_MEANINGS,
  PLANET_CORE,
  DOMAIN_META,
  CANDIDATE_CITIES,
  relocationScore,
} from "./astroData";

/* =========================================================
   СТАТИЧЕСКИЕ СПРАВОЧНИКИ (не зависят от API)
   ========================================================= */

const EN_SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

const NAKSHATRAS = ["Ашвини", "Бхарани", "Криттика", "Рохини", "Мригашира", "Ардра", "Пунарвасу", "Пушья", "Ашлеша", "Магха", "Пурва Пхалгуни", "Уттара Пхалгуни", "Хаста", "Читра", "Свати", "Вишакха", "Анурадха", "Джйештха", "Мула", "Пурва Ашадха", "Уттара Ашадха", "Шравана", "Дханишта", "Шатабхиша", "Пурва Бхадрапада", "Уттара Бхадрапада", "Ревати"];

const NAK_ALIASES = {
  ashwini: 0, aswini: 0,
  bharani: 1,
  krittika: 2, kritika: 2, krithika: 2,
  rohini: 3,
  mrigashira: 4, mrigasira: 4, mrigashirsha: 4, mrigashirisha: 4,
  ardra: 5, ardhra: 5,
  punarvasu: 6,
  pushya: 7, pushyami: 7, pooyam: 7,
  ashlesha: 8, aslesha: 8, ayilyam: 8,
  magha: 9,
  purvaphalguni: 10, poorvaphalguni: 10, purvaphalgun: 10, uttraphalguni: 11,
  uttaraphalguni: 11,
  hasta: 12,
  chitra: 13, chithra: 13,
  swati: 14, swathi: 14,
  vishakha: 15, visakha: 15,
  anuradha: 16,
  jyeshtha: 17, jyeshta: 17, jyestha: 17,
  mula: 18, moola: 18,
  purvaashadha: 19, purvashadha: 19, poorvaashada: 19, purvaashada: 19, purvashada: 19,
  uttaraashadha: 20, uttarashadha: 20, uttaraashada: 20, uttarashada: 20,
  shravana: 21, sravana: 21,
  dhanishta: 22, dhanishtha: 22,
  shatabhisha: 23, satabhisha: 23, sathabhisha: 23,
  purvabhadrapada: 24, poorvabhadrapada: 24, purvabhadra: 24,
  uttarabhadrapada: 25, uttarabhadra: 25,
  revati: 26,
};

const PLANET_EN_TO_CODE = { Sun: "Su", Moon: "Mo", Mars: "Ma", Mercury: "Me", Jupiter: "Ju", Venus: "Ve", Saturn: "Sa", Rahu: "Ra", Ketu: "Ke" };
const PLANET_NAMES = { Su: "Солнце", Mo: "Луна", Ma: "Марс", Me: "Меркурий", Ju: "Юпитер", Ve: "Венера", Sa: "Сатурн", Ra: "Раху", Ke: "Кету", As: "Асцендент" };
const PLANET_ORDER = ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa", "Ra", "Ke"];

const DASHA_TEXTS = {
  Su: { strengths: "Период укрепления авторитета, самостоятельности, видимости — хорошее время заявлять о себе, брать ответственность.", caution: "Избегайте излишней гордыни и конфликтов с руководством/отцовскими фигурами.", comm: "Общайтесь прямо и по существу, с людьми, облечёнными властью — уважительно, но без заискивания." },
  Mo: { strengths: "Время эмоциональной чувствительности, заботы, работы с домом и семьёй — интуиция обостряется.", caution: "Возможны перепады настроения, излишняя зависимость от мнения окружающих.", comm: "Мягкий, эмпатичный тон работает лучше давления; хорошее время для разговоров с близкими." },
  Ma: { strengths: "Энергия, инициатива, способность быстро действовать и отстаивать границы.", caution: "Риск импульсивных решений, конфликтов, травм — сдерживайте раздражительность.", comm: "Короткие, конкретные формулировки; избегайте споров на эмоциях, берите паузу перед ответом." },
  Me: { strengths: "Отличный период для обучения, переговоров, документов, коммуникационных проектов.", caution: "Возможна суетливость, распылённость внимания, поверхностность решений.", comm: "Аргументируйте логически и структурированно; хорошее время для писем, презентаций, сделок." },
  Ju: { strengths: "Период роста, удачи, расширения — благоприятен для образования, наставничества, финансов.", caution: "Остерегайтесь избыточного оптимизма и переоценки своих возможностей.", comm: "Открытый, великодушный тон; хорошее время для разговоров с наставниками и о долгосрочных планах." },
  Ve: { strengths: "Гармония в отношениях, творчество, эстетика, комфорт — сильный период для партнёрства и искусства.", caution: "Возможна склонность к излишествам, потакание себе, откладывание сложных решений.", comm: "Дипломатичный, тёплый тон; хорошее время для романтических и творческих переговоров." },
  Sa: { strengths: "Период дисциплины, структуры, долгосрочного строительства — то, что создано сейчас, будет прочным.", caution: "Возможны задержки, ощущение тяжести, испытания терпения — не форсируйте события.", comm: "Сдержанный, деловой тон; держите слово и сроки, избегайте поспешных обещаний." },
  Ra: { strengths: "Нестандартные возможности, амбиции, прорывы в новых, непривычных областях.", caution: "Риск иллюзий, одержимости целью, обмана — проверяйте факты дважды.", comm: "Держите границы чётко обозначенными, избегайте туманных договорённостей." },
  Ke: { strengths: "Период внутреннего поиска, отпускания лишнего, духовной работы, специализации в узкой области.", caution: "Возможны ощущение потери направления, отстранённость, апатия к мирским делам.", comm: "Немногословность уместна; не форсируйте общение — период больше для внутренней работы, чем для внешней экспансии." },
};

const SIGN_TRAITS = {
  0: "инициативность, прямота, лидерский импульс", 1: "устойчивость, практичность, любовь к комфорту",
  2: "любознательность, коммуникабельность, гибкость ума", 3: "чувствительность, забота, сильная привязанность к дому",
  4: "уверенность, творческая харизма, потребность в признании", 5: "аналитичность, внимание к деталям, служение",
  6: "дипломатичность, стремление к балансу и партнёрству", 7: "глубина, интенсивность, стратегическое мышление",
  8: "оптимизм, широта взглядов, тяга к смыслу", 9: "дисциплина, целеустремлённость, терпение",
  10: "независимость, оригинальность, социальная направленность", 11: "интуитивность, сострадание, склонность к мечтательности",
};

const KOOT_LABELS = {
  varna: "Варна — духовная совместимость",
  vashya: "Вашья — взаимное влечение и контроль",
  tara: "Тара — здоровье и благополучие",
  yoni: "Йони — физическая близость",
  maitri: "Граха Майтри — дружба умов",
  gan: "Гана — темперамент",
  bhakut: "Бхакут — совместимость судеб",
  nadi: "Нади — потомство и здоровье рода",
};
const KOOT_ORDER = ["varna", "vashya", "tara", "yoni", "maitri", "gan", "bhakut", "nadi"];

const GRID_POS = {
  11: [0, 0], 0: [0, 1], 1: [0, 2], 2: [0, 3],
  10: [1, 0], 3: [1, 3],
  9: [2, 0], 4: [2, 3],
  8: [3, 0], 7: [3, 1], 6: [3, 2], 5: [3, 3],
};

/* =========================================================
   ПОМОЩНИКИ: маппинг ответа AstrologyAPI и вычисления
   ========================================================= */

function mapSign(nameEn) {
  const idx = EN_SIGNS.findIndex((s) => s.toLowerCase() === String(nameEn || "").toLowerCase());
  return { idx: idx >= 0 ? idx : null, ru: idx >= 0 ? SIGNS[idx] : nameEn || "—" };
}

function mapNakshatra(nameEn) {
  const key = String(nameEn || "").toLowerCase().replace(/[^a-z]/g, "");
  const idx = NAK_ALIASES[key];
  return { idx: idx ?? null, ru: idx != null ? NAKSHATRAS[idx] : nameEn || "—" };
}

function parseApiDashaDate(str) {
  const parts = String(str || "").trim().split(/\s+/);
  const [d, m, y] = (parts[0] || "").split("-").map(Number);
  const [h, mi] = (parts[1] || "0:0").split(":").map(Number);
  if (!y) return null;
  return new Date(y, (m || 1) - 1, d || 1, h || 0, mi || 0);
}

function splitBirthForApi(person) {
  const [year, month, day] = (person.date || "1994-01-01").split("-").map(Number);
  const [hour, min] = (person.time || "12:00").split(":").map(Number);
  return {
    day, month, year, hour, min,
    lat: Number(person.lat),
    lon: Number(person.lon),
    tzone: Number(person.tz),
  };
}

function birthDateForApi(dateStr) {
  const [yyyy, mm, dd] = (dateStr || "1994-01-01").split("-");
  return `${mm}-${dd}-${yyyy}`;
}

function buildChartDetails(planetsArr, astroDetails) {
  const details = {};
  (planetsArr || []).forEach((p) => {
    const code = PLANET_EN_TO_CODE[p.name];
    if (!code) return;
    const sign = mapSign(p.sign);
    const nak = mapNakshatra(p.nakshatra);
    details[code] = {
      lon: p.normDegree ?? p.fullDegree ?? null,
      sign: sign.idx ?? 0,
      signName: sign.ru,
      nak: nak.idx,
      nakName: nak.ru,
      pada: p.nakshatra_pad ?? "—",
      house: p.house ?? null,
      retro: p.isRetro === "true" || p.isRetro === true,
    };
  });
  if (astroDetails?.ascendant) {
    const sign = mapSign(astroDetails.ascendant);
    details.As = { lon: null, sign: sign.idx ?? 0, signName: sign.ru, nak: null, nakName: "—", pada: "—", house: null, retro: false };
  }
  return details;
}

// та же абсолютная секунда времени, но переведённая в "местные часы" другого места (для релокации)
function relocatedBirthFields(person, destLat, destLon, destTzone) {
  const orig = splitBirthForApi(person);
  const utcMs = Date.UTC(orig.year, orig.month - 1, orig.day, orig.hour, orig.min) - orig.tzone * 3600000;
  const destLocalMs = utcMs + destTzone * 3600000;
  const d = new Date(destLocalMs);
  return {
    day: d.getUTCDate(), month: d.getUTCMonth() + 1, year: d.getUTCFullYear(),
    hour: d.getUTCHours(), min: d.getUTCMinutes(),
    lat: destLat, lon: destLon, tzone: destTzone,
  };
}

function dashaComboText(mahaCode, antarCode) {
  const a = DASHA_TEXTS[antarCode];
  if (!a) return "";
  const rel = relation(mahaCode, antarCode);
  return `${a.strengths} (${RELATION_LABEL[rel]} по отношению к махадаше ${PLANET_NAMES[mahaCode]})`;
}

function domainOccupantCount(details, houses) {
  if (!details) return 0;
  return houses.reduce((sum, h) => sum + PLANET_ORDER.filter((c) => details[c]?.house === h).length, 0);
}

/* =========================================================
   ДАННЫЕ С СЕРВЕРА: хуки
   ========================================================= */

function useBirthChart(person) {
  const [state, setState] = useState({ loading: false, error: null, details: null });
  const key = `${person.date}|${person.time}|${person.tz}|${person.lat}|${person.lon}`;

  useEffect(() => {
    let cancelled = false;
    const birth = splitBirthForApi(person);
    if (!birth.year || Number.isNaN(birth.lat) || Number.isNaN(birth.lon) || Number.isNaN(birth.tzone)) return;
    const t = setTimeout(async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const [planetsRes, astroRes] = await Promise.all([fetchPlanets(birth), fetchAstroDetails(birth)]);
        if (cancelled) return;
        setState({ loading: false, error: null, details: buildChartDetails(planetsRes, astroRes) });
      } catch (e) {
        if (cancelled) return;
        setState({ loading: false, error: e.message || "Не удалось получить данные", details: null });
      }
    }, 500);
    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
}

function useMajorDasha(person) {
  const [state, setState] = useState({ loading: false, error: null, periods: null });
  const key = `${person.date}|${person.time}|${person.tz}|${person.lat}|${person.lon}`;

  useEffect(() => {
    let cancelled = false;
    const birth = splitBirthForApi(person);
    if (!birth.year || Number.isNaN(birth.lat) || Number.isNaN(birth.lon) || Number.isNaN(birth.tzone)) return;
    const t = setTimeout(async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const data = await fetchMajorDasha(birth);
        if (cancelled) return;
        const periods = (data || []).map((p) => {
          const start = parseApiDashaDate(p.start);
          const end = parseApiDashaDate(p.end);
          const fullYears = start && end ? (end - start) / (365.2425 * 86400000) : 0;
          return { lord: PLANET_EN_TO_CODE[p.planet] || p.planet, planetEn: p.planet, start, end, fullYears };
        });
        setState({ loading: false, error: null, periods });
      } catch (e) {
        if (cancelled) return;
        setState({ loading: false, error: e.message || "Не удалось получить дашу", periods: null });
      }
    }, 500);
    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
}

/* =========================================================
   UI: карта
   ========================================================= */

function ChartWheel({ details }) {
  if (!details) return null;
  const cells = {};
  Object.entries(details).forEach(([k, v]) => {
    if (v.sign == null) return;
    if (!cells[v.sign]) cells[v.sign] = [];
    cells[v.sign].push(k);
  });
  const grid = Array.from({ length: 4 }, () => Array(4).fill(null));
  Object.entries(GRID_POS).forEach(([sign, [r, c]]) => (grid[r][c] = Number(sign)));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, maxWidth: 340, margin: "0 auto", background: "#2a2550" }}>
      {grid.flat().map((sign, idx) => (
        <div key={idx} style={{
          background: sign === null ? "transparent" : "#151233",
          minHeight: 78, padding: 6, border: sign === null ? "none" : "1px solid #3a3570",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
        }}>
          {sign !== null && (
            <>
              <div style={{ fontSize: 10, color: "#9089c9", letterSpacing: 0.4 }}>{SIGNS[sign]}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                {(cells[sign] || []).map((p) => (
                  <span key={p} style={{
                    fontSize: 12, fontWeight: 600, color: p === "As" ? "#e8c46b" : "#f1ede4",
                    background: p === "As" ? "transparent" : "#332c66", padding: p === "As" ? 0 : "1px 5px", borderRadius: 3,
                  }}>{p}{details[p]?.retro ? "℞" : ""}</span>
                ))}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

const inputStyle = { background: "#151233", border: "1px solid #332c66", color: "#f1ede4", borderRadius: 6, padding: "8px 10px", fontSize: 13, width: "100%" };
const labelStyle = { fontSize: 11, color: "#9089c9", marginBottom: 4, display: "block" };

function GeoSearch({ onPick, dateForTz }) {
  const [place, setPlace] = useState("");
  const [status, setStatus] = useState(null);
  const [candidates, setCandidates] = useState([]);

  const search = useCallback(async () => {
    if (!place.trim()) return;
    setStatus("loading"); setCandidates([]);
    try {
      const geo = await fetchGeoDetails(place.trim(), 5);
      const list = geo?.geonames || [];
      if (!list.length) { setStatus("error"); return; }
      setCandidates(list); setStatus("picking");
    } catch { setStatus("error"); }
  }, [place]);

  const pick = useCallback(async (cand) => {
    setStatus("loading");
    try {
      const tzData = await fetchTimezone(cand.latitude, cand.longitude, dateForTz);
      const tz = typeof tzData?.timezone === "number" ? tzData.timezone : 0;
      await onPick({ ...cand, tz });
      setPlace(`${cand.place_name}${cand.country_code ? ", " + cand.country_code : ""}`);
      setCandidates([]);
      setStatus("ok");
    } catch { setStatus("error"); }
  }, [dateForTz, onPick]);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
        <div style={{ flex: 1 }}>
          <span style={labelStyle}>Город (латиницей точнее, например Moscow)</span>
          <input style={inputStyle} value={place} onChange={(e) => setPlace(e.target.value)} placeholder="например, Moscow" />
        </div>
        <button onClick={search} style={{
          alignSelf: "flex-end", background: "#e8c46b", color: "#151233", border: "none",
          borderRadius: 6, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", height: 34,
        }}>Найти</button>
      </div>
      {status === "loading" && <div style={{ fontSize: 11, color: "#8b84b8", marginBottom: 8 }}>Ищу…</div>}
      {status === "error" && <div style={{ fontSize: 11, color: "#e08b8b", marginBottom: 8 }}>Не нашёл — попробуйте латиницей.</div>}
      {status === "ok" && <div style={{ fontSize: 11, color: "#8fd19e", marginBottom: 8 }}>Готово.</div>}
      {status === "picking" && candidates.length > 0 && (
        <div style={{ marginBottom: 10, background: "#151233", borderRadius: 6, padding: 8 }}>
          <div style={{ fontSize: 11, color: "#9089c9", marginBottom: 6 }}>Нашлось несколько мест — выберите нужное:</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {candidates.map((c, i) => (
              <button key={i} onClick={() => pick(c)} style={{
                textAlign: "left", background: "#211c47", color: "#f1ede4", border: "1px solid #332c66",
                borderRadius: 5, padding: "7px 10px", fontSize: 12, cursor: "pointer",
              }}>
                {c.place_name}{c.country_code ? `, ${c.country_code}` : ""}
                <span style={{ color: "#8b84b8" }}> — {Number(c.latitude).toFixed(2)}, {Number(c.longitude).toFixed(2)}, {c.timezone_id}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BirthForm({ person, setPerson, label }) {
  const upd = (k) => (e) => setPerson({ ...person, [k]: e.target.value });

  const handlePick = useCallback(async (cand) => {
    setPerson({ ...person, lat: Number(cand.latitude), lon: Number(cand.longitude), tz: cand.tz });
  }, [person, setPerson]);

  return (
    <div style={{ background: "#1c1846", borderRadius: 10, padding: 16, marginBottom: 16 }}>
      <div style={{ fontSize: 13, color: "#e8c46b", marginBottom: 10, fontWeight: 600 }}>{label}</div>

      <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div><span style={labelStyle}>Имя</span><input style={inputStyle} value={person.name} onChange={upd("name")} placeholder="Имя" /></div>
        <div>
          <span style={labelStyle}>Пол (для совместимости)</span>
          <select style={inputStyle} value={person.gender} onChange={upd("gender")}>
            <option value="male">Мужской</option>
            <option value="female">Женский</option>
          </select>
        </div>
        <div><span style={labelStyle}>Дата рождения</span><input style={inputStyle} type="date" value={person.date} onChange={upd("date")} /></div>
        <div><span style={labelStyle}>Время рождения</span><input style={inputStyle} type="time" value={person.time} onChange={upd("time")} /></div>
      </div>

      <GeoSearch onPick={handlePick} dateForTz={birthDateForApi(person.date)} />

      <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <div><span style={labelStyle}>Широта</span><input style={inputStyle} type="number" step="0.01" value={person.lat} onChange={upd("lat")} /></div>
        <div><span style={labelStyle}>Долгота</span><input style={inputStyle} type="number" step="0.01" value={person.lon} onChange={upd("lon")} /></div>
        <div><span style={labelStyle}>Часовой пояс (UTC+)</span><input style={inputStyle} type="number" step="0.5" value={person.tz} onChange={upd("tz")} /></div>
      </div>
    </div>
  );
}

function PlanetTable({ details }) {
  if (!details) return null;
  return (
    <div style={{ overflowX: "auto", marginTop: 16 }}>
    <table style={{ width: "100%", minWidth: 420, borderCollapse: "collapse", fontSize: 12 }}>
      <thead><tr style={{ color: "#9089c9", textAlign: "left" }}>
        <th style={{ padding: 6 }}>Планета</th><th>Знак</th><th>Накшатра</th><th>Пада</th><th>Дом</th>
      </tr></thead>
      <tbody>
        {[...PLANET_ORDER, "As"].map((k) => {
          const v = details[k];
          if (!v) return null;
          return (
            <tr key={k} style={{ borderTop: "1px solid #2e2a5c" }}>
              <td style={{ padding: 6, color: "#f1ede4" }}>{PLANET_NAMES[k]}{v.retro ? " ℞" : ""}</td>
              <td style={{ color: "#c9c4e8" }}>{v.signName}</td>
              <td style={{ color: "#c9c4e8" }}>{v.nakName}</td>
              <td style={{ color: "#c9c4e8" }}>{v.pada}</td>
              <td style={{ color: "#c9c4e8" }}>{v.house ?? "—"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
    </div>
  );
}

/* =========================================================
   UI: даша (маха → антар → пратьянтар)
   ========================================================= */

function PratyantarList({ birth, mdEn, adEn, open }) {
  const [state, setState] = useState({ loading: false, error: null, subs: null });

  useEffect(() => {
    if (!open || state.subs || state.loading) return;
    let cancelled = false;
    (async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const data = await fetchSubSubDasha(splitBirthForApi(birth), mdEn, adEn);
        if (cancelled) return;
        setState({ loading: false, error: null, subs: data });
      } catch (e) {
        if (cancelled) return;
        setState({ loading: false, error: e.message || "Не удалось получить пратьянтардаши", subs: null });
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;
  if (state.loading) return <div style={{ fontSize: 11, color: "#8b84b8" }}>Загрузка пратьянтардаш…</div>;
  if (state.error) return <div style={{ fontSize: 11, color: "#e08b8b" }}>Ошибка: {state.error}</div>;
  if (!state.subs) return null;

  const now = new Date();
  const adCode = PLANET_EN_TO_CODE[adEn] || adEn;
  return (
    <div style={{ marginTop: 4, marginLeft: 12, display: "flex", flexDirection: "column", gap: 2, borderLeft: "1px solid #2e2a5c", paddingLeft: 8 }}>
      {state.subs.map((s, si) => {
        const start = parseApiDashaDate(s.start);
        const end = parseApiDashaDate(s.end);
        const active = start && end && now >= start && now < end;
        const code = PLANET_EN_TO_CODE[s.planet] || s.planet;
        const rel = relation(adCode, code);
        return (
          <div key={si} style={{ fontSize: 11, color: active ? "#e8c46b" : "#766fa0", display: "flex", justifyContent: "space-between" }}>
            <span>{active ? "⋯ " : ""}{PLANET_NAMES[code] || s.planet} · {RELATION_LABEL[rel]}</span>
            <span>{start?.toISOString().slice(0, 10)}—{end?.toISOString().slice(0, 10)}</span>
          </div>
        );
      })}
    </div>
  );
}

function AntardashaList({ birth, mahaCode, majorPlanetEn, open }) {
  const [state, setState] = useState({ loading: false, error: null, subs: null });
  const [subOpen, setSubOpen] = useState(null);

  useEffect(() => {
    if (!open || state.subs || state.loading) return;
    let cancelled = false;
    (async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const data = await fetchSubDasha(splitBirthForApi(birth), majorPlanetEn);
        if (cancelled) return;
        setState({ loading: false, error: null, subs: data });
      } catch (e) {
        if (cancelled) return;
        setState({ loading: false, error: e.message || "Не удалось получить антардаши", subs: null });
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;
  if (state.loading) return <div style={{ fontSize: 12, color: "#8b84b8" }}>Загрузка антардаш…</div>;
  if (state.error) return <div style={{ fontSize: 12, color: "#e08b8b" }}>Ошибка: {state.error}</div>;
  if (!state.subs) return null;

  const now = new Date();
  return (
    <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
      {state.subs.map((s, si) => {
        const start = parseApiDashaDate(s.start);
        const end = parseApiDashaDate(s.end);
        const subActive = start && end && now >= start && now < end;
        const code = PLANET_EN_TO_CODE[s.planet] || s.planet;
        const isOpen = subOpen === si;
        return (
          <div key={si}>
            <div onClick={() => setSubOpen(isOpen ? null : si)} style={{
              display: "flex", justifyContent: "space-between", fontSize: 12, cursor: "pointer",
              color: subActive ? "#e8c46b" : "#8b84b8", padding: "2px 0",
            }}>
              <span>{subActive ? "→ " : ""}{PLANET_NAMES[code] || s.planet}</span>
              <span>{start?.toISOString().slice(0, 10)} — {end?.toISOString().slice(0, 10)}</span>
            </div>
            <div style={{ fontSize: 11, color: "#9089c9", lineHeight: 1.5, marginBottom: 2 }}>
              {dashaComboText(mahaCode, code)}
            </div>
            <PratyantarList birth={birth} mdEn={majorPlanetEn} adEn={s.planet} open={isOpen} />
          </div>
        );
      })}
    </div>
  );
}

function DashaTimeline({ birth, periods }) {
  const now = new Date();
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <div>
      <div style={{ display: "flex", height: 26, borderRadius: 4, overflow: "hidden", marginBottom: 14 }}>
        {periods.map((p, i) => {
          const active = p.start && p.end && now >= p.start && now < p.end;
          return (
            <div key={i} title={PLANET_NAMES[p.lord]} onClick={() => setOpenIdx(openIdx === i ? null : i)}
              style={{
                flex: Math.max(p.fullYears, 0.2), background: active ? "#e8c46b" : "#332c66",
                borderRight: "1px solid #151233", cursor: "pointer",
              }} />
          );
        })}
      </div>
      {periods.map((p, i) => {
        const active = p.start && p.end && now >= p.start && now < p.end;
        const text = DASHA_TEXTS[p.lord];
        return (
          <div key={i} style={{
            marginBottom: 8, borderRadius: 8, overflow: "hidden",
            border: active ? "1px solid #e8c46b" : "1px solid #2e2a5c",
            background: active ? "#211c47" : "#17143a",
          }}>
            <div onClick={() => setOpenIdx(openIdx === i ? null : i)} style={{
              padding: "10px 14px", display: "flex", justifyContent: "space-between", cursor: "pointer",
            }}>
              <span style={{ color: active ? "#e8c46b" : "#f1ede4", fontWeight: 600 }}>
                {active ? "● " : ""}Махадаша {PLANET_NAMES[p.lord] || p.planetEn}
              </span>
              <span style={{ color: "#9089c9", fontSize: 13 }}>
                {p.start?.toISOString().slice(0, 10)} — {p.end?.toISOString().slice(0, 10)}
              </span>
            </div>
            {openIdx === i && (
              <div style={{ padding: "0 14px 14px", color: "#c9c4e8", fontSize: 13, lineHeight: 1.55 }}>
                {text && (
                  <>
                    <p><b style={{ color: "#e8c46b" }}>Сильные стороны периода:</b> {text.strengths}</p>
                    <p><b style={{ color: "#e8c46b" }}>Осторожно:</b> {text.caution}</p>
                    <p><b style={{ color: "#e8c46b" }}>Стиль коммуникации:</b> {text.comm}</p>
                  </>
                )}
                <div style={{ marginTop: 10 }}>
                  <b style={{ color: "#9089c9", fontSize: 12 }}>Антардаши (кликните — раскроется ещё и пратьянтардаша):</b>
                  <AntardashaList birth={birth} mahaCode={p.lord} majorPlanetEn={p.planetEn} open={openIdx === i} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* =========================================================
   UI: дома и сферы жизни
   ========================================================= */

function HousesPanel({ details }) {
  if (!details?.As) return <div style={{ textAlign: "center", color: "#8b84b8", fontSize: 13 }}>Сначала дождитесь загрузки карты на вкладке «Карта».</div>;
  const ascSignIdx = details.As.sign ?? 0;

  const rows = Array.from({ length: 12 }, (_, i) => {
    const houseNum = i + 1;
    const signIdx = (ascSignIdx + i) % 12;
    const lord = signLordOf(signIdx);
    const occupants = PLANET_ORDER.filter((c) => details[c]?.house === houseNum);
    return { houseNum, signIdx, lord, lordHouse: details[lord]?.house ?? null, occupants };
  });

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      <div style={{ fontSize: 12, color: "#9089c9", marginBottom: 14, lineHeight: 1.6 }}>
        Дома считаются от Асцендента ({SIGNS[ascSignIdx]}). Для каждой сферы — ключевые дома, кто там стоит и где сейчас управитель дома.
      </div>

      {Object.entries(DOMAIN_META).map(([key, dm]) => (
        <div key={key} style={{ background: "#1c1846", borderRadius: 10, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: "#e8c46b", marginBottom: 8, fontWeight: 600 }}>{dm.title}</div>
          {dm.houses.map((h) => {
            const row = rows[h - 1];
            return (
              <p key={h} style={{ fontSize: 13, color: "#c9c4e8", lineHeight: 1.6, marginBottom: 8 }}>
                <b style={{ color: "#f1ede4" }}>{h} дом</b> ({HOUSE_MEANINGS[h]}): {row.occupants.length
                  ? row.occupants.map((c) => `${PLANET_NAMES[c]} — ${PLANET_CORE[c]}`).join("; ")
                  : "прямых планет нет — смотрите на управителя"}.
                {" "}Управитель — {PLANET_NAMES[row.lord]}, сам находится в {row.lordHouse ?? "—"} доме{row.lordHouse ? ` (${HOUSE_MEANINGS[row.lordHouse]})` : ""}.
              </p>
            );
          })}
        </div>
      ))}

      <div style={{ background: "#1c1846", borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 13, color: "#e8c46b", marginBottom: 8, fontWeight: 600 }}>Все 12 домов</div>
        <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 380, borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr style={{ color: "#9089c9", textAlign: "left" }}>
            <th style={{ padding: 6 }}>Дом</th><th>Знак</th><th>Управитель</th><th>Планеты внутри</th>
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.houseNum} style={{ borderTop: "1px solid #2e2a5c" }}>
                <td style={{ padding: 6, color: "#f1ede4" }}>{r.houseNum}</td>
                <td style={{ color: "#c9c4e8" }}>{SIGNS[r.signIdx]}</td>
                <td style={{ color: "#c9c4e8" }}>{PLANET_NAMES[r.lord]}</td>
                <td style={{ color: "#c9c4e8" }}>{r.occupants.map((c) => PLANET_NAMES[c]).join(", ") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   UI: синастрия (брак / бизнес / дружба)
   ========================================================= */

function MatchResult({ data }) {
  if (!data) return null;
  const total = data.total || {};
  const conclusion = data.conclusion || {};
  const pct = total.total_points ? Math.round((total.received_points / total.total_points) * 100) : 0;
  const verdictRu = conclusion.status
    ? `Благоприятное сочетание: ${total.received_points} из ${total.total_points} баллов (${pct}%) — выше минимума (${total.minimum_required}).`
    : `Сочетание ниже традиционного порога: ${total.received_points} из ${total.total_points} баллов (${pct}%), минимум — ${total.minimum_required}. Это не приговор, но стоит внимательнее смотреть на слабые факторы ниже.`;

  return (
    <div style={{ background: "#1c1846", borderRadius: 10, padding: 16, marginTop: 16 }}>
      <div style={{ fontSize: 13, color: "#e8c46b", marginBottom: 12, fontWeight: 600 }}>Совместимость (Ashtakoota Guna Milan)</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {KOOT_ORDER.map((key) => {
          const k = data[key];
          if (!k) return null;
          const kpct = k.total_points ? Math.round((k.received_points / k.total_points) * 100) : 0;
          return (
            <div key={key}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#c9c4e8" }}>
                <span>{KOOT_LABELS[key] || key}</span>
                <span>{k.received_points} / {k.total_points}</span>
              </div>
              <div style={{ height: 5, background: "#2e2a5c", borderRadius: 3, marginTop: 3 }}>
                <div style={{ width: `${kpct}%`, height: "100%", background: "#e8c46b", borderRadius: 3 }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #2e2a5c" }}>
        <div style={{ fontSize: 15, color: "#f1ede4", fontWeight: 700 }}>Итого: {total.received_points} / {total.total_points}</div>
        <div style={{ fontSize: 13, color: conclusion.status ? "#8fd19e" : "#e0b98b", marginTop: 6, lineHeight: 1.55 }}>{verdictRu}</div>
        {conclusion.report && (
          <div style={{ fontSize: 11, color: "#6f6798", marginTop: 8, lineHeight: 1.5, fontStyle: "italic" }}>
            Комментарий (оригинал на английском): «{conclusion.report}»
          </div>
        )}
      </div>
    </div>
  );
}

function heuristicCompat(kind, chart1, chart2) {
  if (!chart1?.details?.Mo || !chart2?.details?.Mo || !chart1?.details?.As || !chart2?.details?.As) return null;
  const moon1 = chart1.details.Mo, moon2 = chart2.details.Mo;
  const asc1 = chart1.details.As, asc2 = chart2.details.As;

  const items = [];
  const g1 = ganaOf(moon1.nak), g2 = ganaOf(moon2.nak);
  items.push({ label: "Эмоциональный тон (гана Луны)", verdict: ganaCompat(g1, g2), note: `${moon1.nakName} и ${moon2.nakName}` });

  const ec = elementCompat(elementOf(asc1.sign), elementOf(asc2.sign));
  items.push({ label: "Стиль поведения (стихии Асцендентов)", verdict: ec, note: `${asc1.signName} и ${asc2.signName}` });

  const houseNum = kind === "business" ? 10 : 11;
  const lord1 = signLordOf((asc1.sign + houseNum - 1) % 12);
  const lord2 = signLordOf((asc2.sign + houseNum - 1) % 12);
  const rel = relation(lord1, lord2);
  const relRu = { same: "высокая", friend: "хорошая", neutral: "нейтральная", enemy: "напряжённая" }[rel];
  items.push({
    label: kind === "business" ? "Деловые устремления (управители 10 домов)" : "Круги общения (управители 11 домов)",
    verdict: relRu, note: `${PLANET_NAMES[lord1]} и ${PLANET_NAMES[lord2]}`,
  });

  return items;
}

const VERDICT_COLOR = { "высокая": "#8fd19e", "хорошая": "#8fd19e", "средняя": "#e0c98b", "нейтральная": "#c9c4e8", "низкая": "#e0b98b", "напряжённая": "#e08b8b", "неизвестна": "#766fa0" };

function HeuristicMatch({ kind, items }) {
  if (!items) return null;
  return (
    <div style={{ background: "#1c1846", borderRadius: 10, padding: 16, marginTop: 16 }}>
      <div style={{ fontSize: 13, color: "#e8c46b", marginBottom: 4, fontWeight: 600 }}>
        {kind === "business" ? "Совместимость для делового партнёрства" : "Совместимость для дружбы"}
      </div>
      <div style={{ fontSize: 11, color: "#6f6798", marginBottom: 12, lineHeight: 1.5 }}>
        Это не классическая Аштакута (она рассчитана только на брак) — практическая эвристика поверх реальных данных карты: Луна, Асцендент и управители профильных домов.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((it, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <div>
              <div style={{ color: "#f1ede4" }}>{it.label}</div>
              <div style={{ color: "#8b84b8", fontSize: 11 }}>{it.note}</div>
            </div>
            <div style={{ color: VERDICT_COLOR[it.verdict] || "#c9c4e8", fontWeight: 600, whiteSpace: "nowrap" }}>{it.verdict}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   UI: релокация
   ========================================================= */

function RelocationPanel({ person, originalChart, activeMahaLord }) {
  const [status, setStatus] = useState(null);
  const [result, setResult] = useState(null);
  const [bestStatus, setBestStatus] = useState(null); // null | "loading" | "done"
  const [bestProgress, setBestProgress] = useState(0);
  const [bestResults, setBestResults] = useState(null);

  const handlePick = useCallback(async (cand) => {
    setStatus("loading");
    try {
      const fields = relocatedBirthFields(person, Number(cand.latitude), Number(cand.longitude), cand.tz);
      const [planetsRes, astroRes] = await Promise.all([fetchPlanets(fields), fetchAstroDetails(fields)]);
      const details = buildChartDetails(planetsRes, astroRes);
      setResult({ label: `${cand.place_name}${cand.country_code ? ", " + cand.country_code : ""}`, details });
      setStatus("ready");
    } catch (e) {
      setStatus("error");
    }
  }, [person]);

  const orig = originalChart?.details;

  const findBestPlaces = useCallback(async () => {
    if (!orig) return;
    setBestStatus("loading");
    setBestProgress(0);
    setBestResults(null);
    const found = [];
    const queue = [...CANDIDATE_CITIES];
    async function worker() {
      while (queue.length) {
        const city = queue.shift();
        try {
          const fields = relocatedBirthFields(person, city.lat, city.lon, city.tz);
          const [planetsRes, astroRes] = await Promise.all([fetchPlanets(fields), fetchAstroDetails(fields)]);
          const details = buildChartDetails(planetsRes, astroRes);
          found.push({ city, details, score: relocationScore(details, activeMahaLord) });
        } catch {
          // город пропускаем, если не получилось посчитать
        }
        setBestProgress((p) => p + 1);
      }
    }
    await Promise.all([worker(), worker(), worker()]);
    found.sort((a, b) => b.score - a.score);
    setBestResults(found.slice(0, 6));
    setBestStatus("done");
  }, [orig, person, activeMahaLord]);

  const openCityResult = useCallback((r) => {
    setResult({ label: `${r.city.name}, ${r.city.country}`, details: r.details });
    setStatus("ready");
  }, []);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      <div style={{ fontSize: 12, color: "#9089c9", marginBottom: 12, lineHeight: 1.6 }}>
        Релокация пересчитывает Асцендент и дома для той же секунды рождения, но в другой точке Земли (планеты по знакам почти не меняются, а вот дома — заметно). Ниже — подбор благоприятных мест по кураторскому списку городов, либо проверка конкретного города вручную.
      </div>

      {!orig && <div style={{ textAlign: "center", color: "#8b84b8", fontSize: 13 }}>Сначала дождитесь загрузки карты на вкладке «Карта».</div>}

      {orig && (
        <div style={{ background: "#1c1846", borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "#e8c46b", marginBottom: 6, fontWeight: 600 }}>Наилучшие варианты релокации</div>
          <div style={{ fontSize: 11, color: "#6f6798", marginBottom: 12, lineHeight: 1.5 }}>
            Прикидка по {CANDIDATE_CITIES.length} городам мира: где благоприятные планеты попадают в сильные дома (1,4,5,7,9,10), а трудные — в спокойные (6,8,12), и как это влияет на дом текущей махадаши. Эвристика поверх карты, не классическая методика подбора места — понравившийся вариант стоит дополнительно проверить вручную ниже.
          </div>
          <button onClick={findBestPlaces} disabled={bestStatus === "loading"} style={{
            display: "block", margin: "0 auto", background: "#e8c46b", color: "#151233", border: "none",
            borderRadius: 20, padding: "9px 22px", fontSize: 13, fontWeight: 700, cursor: bestStatus === "loading" ? "default" : "pointer",
            opacity: bestStatus === "loading" ? 0.7 : 1,
          }}>
            {bestStatus === "loading" ? `Проверяю ${bestProgress} из ${CANDIDATE_CITIES.length}…` : "Подобрать лучшие места"}
          </button>

          {bestResults && (
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
              {bestResults.map((r, i) => (
                <button key={r.city.name} onClick={() => openCityResult(r)} style={{
                  textAlign: "left", background: "#211c47", border: "1px solid #332c66", borderRadius: 6,
                  padding: "8px 12px", cursor: "pointer", display: "flex", justifyContent: "space-between",
                  alignItems: "center", color: "#f1ede4", fontSize: 13,
                }}>
                  <span>{i + 1}. {r.city.name}, {r.city.country}</span>
                  <span style={{ color: r.score > 0 ? "#8fd19e" : r.score < 0 ? "#e08b8b" : "#c9c4e8", fontWeight: 700 }}>
                    {r.score > 0 ? "+" : ""}{r.score}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {orig && (
        <div style={{ background: "#1c1846", borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "#e8c46b", marginBottom: 10, fontWeight: 600 }}>Проверить свой город</div>
          <GeoSearch onPick={handlePick} dateForTz={birthDateForApi(person.date)} />
        </div>
      )}

      {status === "loading" && <div style={{ textAlign: "center", color: "#8b84b8", fontSize: 13 }}>Пересчитываю карту для новой точки…</div>}
      {status === "error" && <div style={{ textAlign: "center", color: "#e08b8b", fontSize: 13 }}>Не удалось пересчитать — попробуйте ещё раз.</div>}

      {result && orig && (
        <div style={{ background: "#1c1846", borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, color: "#e8c46b", marginBottom: 10, fontWeight: 600 }}>Релокация в {result.label}</div>

          <p style={{ fontSize: 13, color: "#c9c4e8", lineHeight: 1.6 }}>
            Асцендент: {orig.As?.signName} → <b style={{ color: "#f1ede4" }}>{result.details.As?.signName}</b>
          </p>

          {activeMahaLord && orig[activeMahaLord] && result.details[activeMahaLord] && (
            <p style={{ fontSize: 13, color: "#c9c4e8", lineHeight: 1.6 }}>
              Сейчас у вас идёт махадаша {PLANET_NAMES[activeMahaLord]}: {orig[activeMahaLord].house} дом → <b style={{ color: "#f1ede4" }}>{result.details[activeMahaLord].house} дом</b> ({HOUSE_MEANINGS[result.details[activeMahaLord].house]}) — пока вы там, тема этого дома звучит заметнее.
            </p>
          )}

          <div style={{ marginTop: 12 }}>
            {Object.entries(DOMAIN_META).map(([key, dm]) => {
              const before = domainOccupantCount(orig, dm.houses);
              const after = domainOccupantCount(result.details, dm.houses);
              const diff = after - before;
              const verdict = diff > 0 ? "усиливается" : diff < 0 ? "ослабевает" : "без изменений";
              const color = diff > 0 ? "#8fd19e" : diff < 0 ? "#e0b98b" : "#c9c4e8";
              return (
                <div key={key} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0", borderTop: "1px solid #2e2a5c" }}>
                  <span style={{ color: "#f1ede4" }}>{dm.title}</span>
                  <span style={{ color }}>{verdict} ({before} → {after})</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   Главный компонент
   ========================================================= */

const defaultPerson1 = { name: "Профиль 1", gender: "male", date: "1994-06-15", time: "08:30", tz: 3, lat: 55.75, lon: 37.62 };
const defaultPerson2 = { name: "Профиль 2", gender: "female", date: "1992-03-22", time: "14:10", tz: 3, lat: 55.75, lon: 37.62 };

export default function JyotishApp() {
  const [tab, setTab] = useState("chart");
  const [person1, setPerson1] = useState(defaultPerson1);
  const [person2, setPerson2] = useState(defaultPerson2);
  const [matchKind, setMatchKind] = useState("marriage"); // marriage | business | friendship

  const chart1 = useBirthChart(person1);
  const chart2 = useBirthChart(person2);
  const dasha1 = useMajorDasha(person1);

  const now = new Date();
  const activeMaha = dasha1.periods?.find((p) => p.start && p.end && now >= p.start && now < p.end);

  const [matchState, setMatchState] = useState({ loading: false, error: null, data: null });

  const runMatch = useCallback(async () => {
    setMatchState({ loading: true, error: null, data: null });
    try {
      const male = person1.gender === "male" ? person1 : person2;
      const female = person1.gender === "female" ? person1 : person2;
      const data = await fetchMatchAshtakoot(splitBirthForApi(male), splitBirthForApi(female));
      setMatchState({ loading: false, error: null, data });
    } catch (e) {
      setMatchState({ loading: false, error: e.message || "Не удалось рассчитать совместимость", data: null });
    }
  }, [person1, person2]);

  const heuristicItems = matchKind !== "marriage" ? heuristicCompat(matchKind, chart1, chart2) : null;

  const tabs = [
    { id: "chart", label: "Карта" },
    { id: "dasha", label: "Периоды жизни" },
    { id: "houses", label: "Дома и сферы" },
    { id: "synastry", label: "Совместимость" },
    { id: "relocation", label: "Релокация" },
  ];

  return (
    <div className="app-root" style={{ fontFamily: "Georgia, 'Times New Roman', serif", background: "#0d0b26", minHeight: "100svh", width: "100%", maxWidth: 960, margin: "0 auto", boxSizing: "border-box", padding: 20, color: "#f1ede4" }}>
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 22, letterSpacing: 2, color: "#e8c46b" }}>ДЖЙОТИШ</div>
        <div style={{ fontSize: 11, color: "#6f6798", marginTop: 2, fontFamily: "system-ui, sans-serif" }}>
          живые расчёты по данным рождения, сидерический зодиак
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 18, justifyContent: "center", flexWrap: "wrap", fontFamily: "system-ui, sans-serif" }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: tab === t.id ? "#e8c46b" : "#1c1846", color: tab === t.id ? "#151233" : "#c9c4e8",
            border: "none", borderRadius: 20, padding: "7px 16px", fontSize: 13, cursor: "pointer", fontWeight: 600,
          }}>{t.label}</button>
        ))}
      </div>

      {tab === "chart" && (
        <div style={{ fontFamily: "system-ui, sans-serif" }}>
          <BirthForm person={person1} setPerson={setPerson1} label="Данные рождения" />
          {chart1.loading && <div style={{ textAlign: "center", color: "#8b84b8", fontSize: 13 }}>Загрузка карты…</div>}
          {chart1.error && <div style={{ textAlign: "center", color: "#e08b8b", fontSize: 13 }}>Ошибка: {chart1.error}</div>}
          {chart1.details && (
            <>
              <ChartWheel details={chart1.details} />
              <div style={{ marginTop: 16, background: "#1c1846", borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 13, color: "#e8c46b", marginBottom: 8, fontWeight: 600 }}>Личность (по Асценденту и Луне)</div>
                <p style={{ fontSize: 13, color: "#c9c4e8", lineHeight: 1.6 }}>
                  Асцендент в {chart1.details.As?.signName} — базовые качества: {SIGN_TRAITS[chart1.details.As?.sign]}.
                  {" "}Луна в накшатре «{chart1.details.Mo?.nakName}» ({chart1.details.Mo?.signName}) — эмоциональная природа склоняется к: {SIGN_TRAITS[chart1.details.Mo?.sign]}.
                </p>
              </div>
              <PlanetTable details={chart1.details} />
            </>
          )}
        </div>
      )}

      {tab === "dasha" && (
        <div style={{ fontFamily: "system-ui, sans-serif" }}>
          <div style={{ fontSize: 12, color: "#9089c9", marginBottom: 12 }}>
            Вимшоттари даша: махадаша → антардаша → пратьянтардаша. Клик по строке раскрывает следующий уровень; серая строчка под антардашей — как она сочетается с темой махадаши.
          </div>
          {dasha1.loading && <div style={{ textAlign: "center", color: "#8b84b8", fontSize: 13 }}>Загрузка даши…</div>}
          {dasha1.error && <div style={{ textAlign: "center", color: "#e08b8b", fontSize: 13 }}>Ошибка: {dasha1.error}</div>}
          {dasha1.periods && <DashaTimeline birth={person1} periods={dasha1.periods} />}
        </div>
      )}

      {tab === "houses" && <HousesPanel details={chart1.details} />}

      {tab === "synastry" && (
        <div style={{ fontFamily: "system-ui, sans-serif" }}>
          <BirthForm person={person2} setPerson={setPerson2} label="Второй профиль" />

          <div style={{ display: "flex", gap: 6, marginBottom: 16, justifyContent: "center" }}>
            {[["marriage", "Брак"], ["business", "Бизнес-партнёрство"], ["friendship", "Дружба"]].map(([id, lbl]) => (
              <button key={id} onClick={() => setMatchKind(id)} style={{
                background: matchKind === id ? "#332c66" : "#1c1846", color: matchKind === id ? "#f1ede4" : "#8b84b8",
                border: "1px solid #332c66", borderRadius: 16, padding: "6px 14px", fontSize: 12, cursor: "pointer",
              }}>{lbl}</button>
            ))}
          </div>

          <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: "#9089c9", marginBottom: 6, textAlign: "center" }}>{person1.name || "Профиль 1"}</div>
              {chart1.details ? <ChartWheel details={chart1.details} /> : <div style={{ fontSize: 12, color: "#8b84b8", textAlign: "center" }}>Загрузка…</div>}
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#9089c9", marginBottom: 6, textAlign: "center" }}>{person2.name || "Профиль 2"}</div>
              {chart2.details ? <ChartWheel details={chart2.details} /> : <div style={{ fontSize: 12, color: "#8b84b8", textAlign: "center" }}>Загрузка…</div>}
            </div>
          </div>

          {matchKind === "marriage" ? (
            <>
              <button onClick={runMatch} disabled={matchState.loading} style={{
                display: "block", margin: "0 auto", background: "#e8c46b", color: "#151233", border: "none",
                borderRadius: 20, padding: "9px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>
                {matchState.loading ? "Считаю…" : "Рассчитать совместимость (Аштакута)"}
              </button>
              {matchState.error && <div style={{ textAlign: "center", color: "#e08b8b", fontSize: 13, marginTop: 10 }}>Ошибка: {matchState.error}</div>}
              <MatchResult data={matchState.data} />
            </>
          ) : (
            <HeuristicMatch kind={matchKind} items={heuristicItems} />
          )}
        </div>
      )}

      {tab === "relocation" && (
        <RelocationPanel person={person1} originalChart={chart1} activeMahaLord={activeMaha?.lord} />
      )}

      <div style={{ marginTop: 20, fontSize: 10, color: "#4a4478", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
        Данные планет, даша и совместимости — расчёты через защищённый серверный API (ключ хранится только на сервере, не передаётся в браузер). Дома/сферы, бизнес- и дружеская совместимость, релокация — авторская логика поверх этих данных.
      </div>
    </div>
  );
}
