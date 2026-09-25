import React, { useEffect, useState, useCallback } from "react";
import {
  fetchPlanets,
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
  elementRu,
  ganaOf,
  ganaCompat,
  HOUSE_MEANINGS,
  PLANET_CORE,
  DOMAIN_META,
  CANDIDATE_CITIES,
  REGIONS,
  relocationScore,
  STRONG_HOUSES,
  DIFFICULT_HOUSES,
  NATURAL_BENEFICS,
  NATURAL_MILD_BENEFICS,
  NATURAL_MALEFICS,
  PLANET_FOCUS_ADVICE,
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

// Что практически значит низкий балл по конкретной коуте — обывательским языком,
// плюс что с этим можно делать. Используется как раздел «на что обратить внимание».
const KOOT_WATCH_MEANING = {
  varna: "партнёры могут по-разному понимать роли и иерархию в паре — проговаривайте ожидания от отношений явно, не полагайтесь на «само собой понятно».",
  vashya: "возможен дисбаланс влияния — один из двоих будет естественнее вести, другой чаще уступать; следите, чтобы решения принимались вместе.",
  tara: "стоит внимательнее относиться к здоровью и бытовой стабильности друг друга — не пускать самочувствие и рутину на самотёк.",
  yoni: "физической притирке может потребоваться больше времени и терпения, чем кажется на старте — не торопите этот процесс.",
  maitri: "образ мышления и логика могут ощутимо различаться — не ждите, что партнёр рассуждает «как вы», ищите общий язык осознанно.",
  gan: "темпераменты заметно разные — не переубеждайте друг друга, а договаривайтесь о правилах и ритме заранее.",
  bhakut: "крупные жизненные цели и планы могут расходиться — сверяйте долгосрочные планы регулярно, не полагайтесь, что «само сложится».",
  nadi: "по классике это самый весомый фактор совместимости — стоит отнестись к нему внимательнее остальных, даже если общий балл неплохой.",
};

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

// Ответ /planets уже содержит Асцендент отдельной записью (name: "Ascendant", со знаком,
// накшатрой и домом=1) — отдельный вызов astro_details ради одного только Асцендента не
// нужен и только тратит лишние кредиты API. astroDetails оставлен вторым (необязательным)
// параметром как запасной вариант на случай, если однажды в /planets Асцендент не придёт.
function buildChartDetails(planetsArr, astroDetails) {
  const details = {};
  (planetsArr || []).forEach((p) => {
    if (p.name === "Ascendant") {
      const sign = mapSign(p.sign);
      const nak = mapNakshatra(p.nakshatra);
      details.As = {
        lon: p.normDegree ?? p.fullDegree ?? null,
        sign: sign.idx ?? 0,
        signName: sign.ru,
        nak: nak.idx,
        nakName: nak.ru,
        pada: p.nakshatra_pad ?? "—",
        house: p.house ?? 1,
        retro: false,
      };
      return;
    }
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
  if (!details.As && astroDetails?.ascendant) {
    const sign = mapSign(astroDetails.ascendant);
    details.As = { lon: null, sign: sign.idx ?? 0, signName: sign.ru, nak: null, nakName: "—", pada: "—", house: 1, retro: false };
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

// В каком натальном доме стоит планета и какие сферы жизни (из DOMAIN_META) это затрагивает —
// связывает периоды даши с уже посчитанными домами, а не только с классическими дружбами планет.
function lifeAspectHouseDomain(code, details) {
  const house = details?.[code]?.house;
  if (!house) return null;
  const domains = Object.entries(DOMAIN_META)
    .filter(([, dm]) => dm.houses.includes(house))
    .map(([, dm]) => dm.title);
  return { house, domains };
}

// Как антардаша сочетается с махадашой — не просто ярлык («трение»/«дружба»), а развёрнутое
// объяснение обывательским языком: как звучит связка, чем характерен сам период антардаши,
// на что обратить внимание и в какой сфере жизни это заметнее всего.
const RELATION_COMBO_PHRASE = {
  same: (mn, an) => `Антардаша совпадает по планете с самой махадашой — тема ${an} звучит без помех, на полную мощность, без дополнительной окраски со стороны.`,
  friend: (mn, an) => `${an} дружественна главной планете периода (${mn}), поэтому её тема раскрывается легко, без внутреннего сопротивления — обе планеты «тянут» в схожую сторону.`,
  neutral: (mn, an) => `${an} нейтральна по отношению к ${mn} — тема этой антардаши будет звучать сама по себе, не усиливаясь и не гасясь фоном махадаши.`,
  enemy: (mn, an) => `${an} находится в напряжении с ${mn} — в этот отрезок времени возможен внутренний конфликт между темами двух планет, стоит быть внимательнее к своим реакциям.`,
};

// Структурированный (а не слитный) разбор антардаши — тот же формат, что у махадаши
// (сильные стороны / осторожно / сфера жизни), чтобы 2-й уровень не уступал 1-му в детальности.
function dashaComboParts(mahaCode, antarCode, details) {
  const a = DASHA_TEXTS[antarCode];
  if (!a) return null;
  const rel = relation(mahaCode, antarCode);
  const phraseFn = RELATION_COMBO_PHRASE[rel] || RELATION_COMBO_PHRASE.neutral;
  const relationText = phraseFn(PLANET_NAMES[mahaCode], PLANET_NAMES[antarCode]);
  const aspect = lifeAspectHouseDomain(antarCode, details);
  const aspectText = aspect
    ? `Натально ${PLANET_NAMES[antarCode]} стоит в ${aspect.house} доме (${HOUSE_MEANINGS[aspect.house]})${aspect.domains.length ? ` — тема периода сильнее всего скажется на: «${aspect.domains.join("», «")}»` : ""}.`
    : "";
  return { relationText, strengths: a.strengths, caution: a.caution, aspectText };
}

// То же самое, но для пратьянтардаши (3-й уровень) — короткая формула «+ / −» на каждый
// под-под-период, а не сплошной текст: плюс (сильная сторона), минус (на что обратить
// внимание), и, если планета в напряжении с антардашой, — отдельная пометка об этом.
function pratyantarComboParts(antarCode, code, details) {
  const rel = relation(antarCode, code);
  const t = DASHA_TEXTS[code];
  const plus = t ? t.strengths : (PLANET_CORE[code] || "");
  let minus = t ? t.caution : "";
  if (rel === "enemy") {
    minus = `${minus} Дополнительно — трение с темой антардаши ${PLANET_NAMES[antarCode]}, возможны сбои ритма в эти дни.`;
  }
  const aspect = lifeAspectHouseDomain(code, details);
  const aspectText = aspect
    ? `${aspect.house} дом (${HOUSE_MEANINGS[aspect.house]})${aspect.domains.length ? ` — сфера «${aspect.domains.join("», «")}»` : ""}.`
    : "";
  return { plus, minus, aspectText, rel };
}

// Строит те же 12 строк «дом → знак/хозяин/кто внутри», что использует вкладка «Дома и
// сферы» — общий помощник, чтобы релокация оценивала сферы той же логикой, а не отдельной
// несвязанной метрикой (иначе топ карточки вверху и разбор внизу могут выглядеть нестыкованно).
function buildHouseRows(details) {
  if (!details?.As) return null;
  const ascSignIdx = details.As.sign ?? 0;
  return Array.from({ length: 12 }, (_, i) => {
    const houseNum = i + 1;
    const signIdx = (ascSignIdx + i) % 12;
    const lord = signLordOf(signIdx);
    const occupants = PLANET_ORDER.filter((c) => details[c]?.house === houseNum);
    return { houseNum, signIdx, lord, lordHouse: details[lord]?.house ?? null, occupants };
  });
}

// Числовая «сила сферы» той же природы, что и плюсы/минусы в «Дома и сферы»: благотворная
// планета в доме сферы — плюс, трудная — минус; хозяйка дома в сильной части карты — плюс,
// в слабой — минус. Используется, чтобы сравнение «до/после релокации» было по тем же
// правилам, что и общий рейтинг городов вверху панели.
function domainScore(dm, rows) {
  if (!rows) return 0;
  let score = 0;
  dm.houses.forEach((h) => {
    const row = rows[h - 1];
    row.occupants.forEach((c) => {
      if (NATURAL_BENEFICS.includes(c)) score += 2;
      else if (NATURAL_MILD_BENEFICS.includes(c)) score += 1;
      else score -= 1;
    });
    if (row.lordHouse) {
      if (STRONG_HOUSES.has(row.lordHouse)) score += 2;
      else if (DIFFICULT_HOUSES.has(row.lordHouse)) score -= 2;
    }
  });
  return score;
}

/* =========================================================
   ДАННЫЕ С СЕРВЕРА: хуки
   ========================================================= */

/* Яндекс.Метрика: цели (безопасный вызов — если счётчик не загрузился, просто ничего не делает) */
function ymGoal(name, params) {
  try {
    if (typeof window !== "undefined" && typeof window.ym === "function") {
      window.ym(112840604, "reachGoal", name, params);
    }
  } catch {
    // трекинг не должен ломать приложение
  }
}

/* Честное сравнение бесплатного и полного доступа — без цены, её ещё нет. Отдельная вкладка,
   а не свёрнутый блок под табами — так её проще найти и не нужно объяснять каждый раз заново. */
function PricingInfo() {
  useEffect(() => { ymGoal("tab_pricing_viewed"); }, []);
  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      <div style={{ fontSize: 12, color: "#9089c9", marginBottom: 14, lineHeight: 1.6 }}>
        Приложение бесплатное. Часть самых «дорогих» по расчётам функций ограничена, чтобы сервис оставался бесплатным и стабильным для всех — но всё, что уже открыто ниже, доступно без ограничений и без регистрации.
      </div>
      <div style={{
        background: "#1c1846", border: "1px solid #332c66", borderRadius: 10,
        padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 13, lineHeight: 1.6,
      }}>
        <div>
          <div style={{ color: "#8fd19e", fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Бесплатно</div>
          <ul style={{ margin: 0, paddingLeft: 18, color: "#c9c4e8" }}>
            <li>Полная карта, дома и сферы жизни</li>
            <li>Даша: махадаша и антардаша целиком</li>
            <li>Пратьянтардаша — для периода, активного сейчас</li>
            <li>Семья и дети — целиком</li>
            <li>Подбор лучших мест по релокации (1 раз для одних данных рождения) + разбор одного выбранного города</li>
            <li>Совместимость: общий балл и вердикт</li>
          </ul>
        </div>
        <div>
          <div style={{ color: "#e8c46b", fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Полная версия (скоро)</div>
          <ul style={{ margin: 0, paddingLeft: 18, color: "#c9c4e8" }}>
            <li>Пратьянтардаша для всех периодов, не только текущего</li>
            <li>Разбор любого числа городов в релокации, пересчёт для других данных рождения</li>
            <li>Расшифровка слабых коотов совместимости — что именно значит каждый фактор</li>
          </ul>
          <div style={{ fontSize: 11, color: "#6f6798", marginTop: 8, fontStyle: "italic" }}>Цена и способ оплаты — уточняются.</div>
        </div>
      </div>
    </div>
  );
}

/* Мягкий пейволл: пока без ссылки на оплату/контакт — просто показываем, что дальше есть платная часть,
   и считаем, сколько раз на неё реально натыкаются (goalName шлётся один раз при показе тизера). */
function PaywallTeaser({ title, text, goalName }) {
  useEffect(() => {
    if (goalName) ymGoal(goalName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div style={{
      marginTop: 10, padding: "12px 14px", borderRadius: 8,
      background: "linear-gradient(135deg, #241c52, #1c1846)", border: "1px dashed #4a4088",
    }}>
      <div style={{ fontSize: 12, color: "#e8c46b", fontWeight: 600, marginBottom: 4 }}>🔒 {title}</div>
      <div style={{ fontSize: 11.5, color: "#c9c4e8", lineHeight: 1.5, marginBottom: 6 }}>{text}</div>
      <div style={{ fontSize: 11, color: "#8b84b8", fontStyle: "italic" }}>Доступно в полной версии — скоро откроем</div>
    </div>
  );
}

function useBirthChart(person, goalName) {
  const [state, setState] = useState({ loading: false, error: null, details: null });
  const key = `${person.date}|${person.time}|${person.tz}|${person.lat}|${person.lon}`;

  useEffect(() => {
    let cancelled = false;
    const birth = splitBirthForApi(person);
    if (!birth.year || Number.isNaN(birth.lat) || Number.isNaN(birth.lon) || Number.isNaN(birth.tzone)) return;
    const t = setTimeout(async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const planetsRes = await fetchPlanets(birth);
        if (cancelled) return;
        setState({ loading: false, error: null, details: buildChartDetails(planetsRes) });
        if (goalName) ymGoal(goalName);
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

function PratyantarList({ birth, mdEn, adEn, open, details, locked }) {
  const [state, setState] = useState({ loading: false, error: null, subs: null });

  useEffect(() => {
    if (!open || locked || state.subs || state.loading) return;
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
  }, [open, locked]);

  if (!open) return null;
  if (locked) {
    return (
      <PaywallTeaser
        title="Пратьянтардаша — под-периоды"
        text="Детальный разбор под-периодов доступен бесплатно для текущего активного периода. Остальные — в полной версии."
        goalName="paywall_pratyantar_hit"
      />
    );
  }
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
        const parts = pratyantarComboParts(adCode, code, details);
        return (
          <div key={si} style={{
            fontSize: 11, padding: "5px 8px", marginBottom: 1, borderRadius: 5,
            background: active ? "#211c47" : "transparent",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: active ? "#e8c46b" : "#c9c4e8", fontWeight: 600 }}>
              <span>{active ? "⋯ " : ""}{PLANET_NAMES[code] || s.planet} · {RELATION_LABEL[rel]}</span>
              <span style={{ fontWeight: 400, color: "#766fa0" }}>{start?.toISOString().slice(0, 10)}—{end?.toISOString().slice(0, 10)}</span>
            </div>
            {parts && (
              <div style={{ fontSize: 10.5, lineHeight: 1.5, marginTop: 3 }}>
                <div style={{ color: "#7fd99a" }}>+ {parts.plus}</div>
                <div style={{ color: "#e0a8a8" }}>− {parts.minus}</div>
                {parts.aspectText && <div style={{ color: "#766fa0", marginTop: 1 }}>Сфера: {parts.aspectText}</div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AntardashaList({ birth, mahaCode, majorPlanetEn, open, details }) {
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
        const parts = dashaComboParts(mahaCode, code, details);
        return (
          <div key={si}>
            <div onClick={() => setSubOpen(isOpen ? null : si)} style={{
              display: "flex", justifyContent: "space-between", fontSize: 12, cursor: "pointer",
              color: subActive ? "#e8c46b" : "#8b84b8", padding: "2px 0",
            }}>
              <span>{subActive ? "→ " : ""}{PLANET_NAMES[code] || s.planet}</span>
              <span>{start?.toISOString().slice(0, 10)} — {end?.toISOString().slice(0, 10)}</span>
            </div>
            {parts && (
              <div style={{ fontSize: 12, color: "#c9c4e8", lineHeight: 1.5, marginBottom: 3 }}>
                <p style={{ marginBottom: 2 }}>{parts.relationText}</p>
                <p style={{ marginBottom: 2 }}><b style={{ color: "#9089c9" }}>Сильные стороны:</b> {parts.strengths}</p>
                <p style={{ marginBottom: 2 }}><b style={{ color: "#9089c9" }}>Осторожно:</b> {parts.caution}</p>
                {parts.aspectText && <p style={{ marginBottom: 2 }}><b style={{ color: "#9089c9" }}>Сфера жизни:</b> {parts.aspectText}</p>}
              </div>
            )}
            <div onClick={() => setSubOpen(isOpen ? null : si)} style={{
              fontSize: 11, color: "#e8c46b", cursor: "pointer", marginBottom: 3, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 4,
            }}>
              {isOpen ? "▾" : "▸"} под-периоды {PLANET_NAMES[code]} (пратьянтардаша, свои даты внутри этой антардаши)
            </div>
            <PratyantarList birth={birth} mdEn={majorPlanetEn} adEn={s.planet} open={isOpen} details={details} locked={!subActive} />
          </div>
        );
      })}
    </div>
  );
}

function DashaTimeline({ birth, periods, details }) {
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
                {(() => {
                  const aspect = lifeAspectHouseDomain(p.lord, details);
                  if (!aspect) return null;
                  return (
                    <p>
                      <b style={{ color: "#e8c46b" }}>Сфера жизни:</b> управитель периода натально стоит в {aspect.house} доме ({HOUSE_MEANINGS[aspect.house]}){aspect.domains.length ? ` — сильнее всего это звучит в: ${aspect.domains.join(", ")}` : ""}.
                    </p>
                  );
                })()}
                <div style={{ marginTop: 10 }}>
                  <b style={{ color: "#9089c9", fontSize: 12 }}>Антардаши (кликните — раскроется ещё и пратьянтардаша):</b>
                  <AntardashaList birth={birth} mahaCode={p.lord} majorPlanetEn={p.planetEn} open={openIdx === i} details={details} />
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

// Короткая формулировка «чем полезна такая поддержка на практике» — используется в плюсах,
// чтобы не просто констатировать факт («планета хорошо расположена»), а объяснить, что это
// значит для обывателя и как этим пользоваться.
const PLANET_PLUS_USE = {
  Su: "проще получить признание и вести за собой — смело берите инициативу",
  Mo: "проще опираться на интуицию и настроение — доверяйте первому ощущению",
  Ma: "проще действовать быстро и решительно — не бойтесь начинать первым",
  Me: "проще договариваться, объяснять и оформлять — используйте переговоры и документы",
  Ju: "проще расти и получать поддержку со стороны — не стесняйтесь просить и предлагать",
  Ve: "проще находить компромисс и договариваться по-хорошему — используйте мягкий подход",
  Sa: "то, что вы выстроите сейчас, будет держаться долго — вкладывайтесь в системность",
  Ra: "открываются нестандартные возможности — стоит присматриваться к необычным вариантам",
  Ke: "легче отпустить лишнее и сосредоточиться на главном — не распыляйтесь на мелочи",
};

// Плюсы/минусы по сфере: благотворные планеты и хорошо расположенная «планета-хозяйка
// дома» — плюс; трудные планеты в доме и хозяйка в слабой позиции (6/8/12 дом) — минус.
// Каждая строка написана так, чтобы обычному человеку было понятно: что происходит, что
// это значит на практике и что с этим делать. Эвристика поверх уже посчитанных домов,
// не замена консультации.
function assessDomain(dm, rows) {
  const pluses = [];
  const minuses = [];
  const watch = [];
  const adviceCodes = [];

  dm.houses.forEach((h) => {
    const row = rows[h - 1];
    if (!row.occupants.length) {
      watch.push(`${h} дом (${HOUSE_MEANINGS[h]}) — сюда напрямую не попала ни одна планета. Это не плохо и не хорошо само по себе: всё в этой части темы зависит от того, как чувствует себя планета-хозяйка дома — смотрите про неё ниже.`);
    }

    row.occupants.forEach((c) => {
      if (NATURAL_BENEFICS.includes(c) || NATURAL_MILD_BENEFICS.includes(c)) {
        pluses.push(`${PLANET_NAMES[c]} находится в ${h} доме — своими качествами (${PLANET_CORE[c]}) она поддерживает эту сферу. На практике: ${PLANET_PLUS_USE[c]}.`);
      } else {
        minuses.push(`${PLANET_NAMES[c]} находится в ${h} доме — это планета непростого характера (${PLANET_CORE[c]}), и здесь она требует больше сознательных усилий, чем везение само по себе. Что делать: ${PLANET_FOCUS_ADVICE[c]}.`);
        adviceCodes.push(c);
      }
    });

    if (row.lordHouse) {
      if (STRONG_HOUSES.has(row.lordHouse)) {
        pluses.push(`За «${dm.title.toLowerCase()}» во многом отвечает ${PLANET_NAMES[row.lord]} — и сейчас она сама стоит в сильной части карты (${row.lordHouse} дом, ${HOUSE_MEANINGS[row.lordHouse]}). Проще говоря: у этой сферы есть надёжная опора, многое будет получаться без лишней борьбы. На практике: ${PLANET_PLUS_USE[row.lord]}.`);
      } else if (DIFFICULT_HOUSES.has(row.lordHouse)) {
        minuses.push(`Планета, отвечающая за «${dm.title.toLowerCase()}», — ${PLANET_NAMES[row.lord]} — сейчас стоит в непростой части карты (${row.lordHouse} дом, ${HOUSE_MEANINGS[row.lordHouse]}). Проще говоря: этой сфере не хватает «топлива» само по себе — легко не будет, результат придётся создавать своими руками. Что делать: ${PLANET_FOCUS_ADVICE[row.lord]}.`);
        adviceCodes.push(row.lord);
      }
    }
  });

  const score = pluses.length - minuses.length;
  const verdict = score > 0 ? "good" : score < 0 ? "watch" : "mixed";
  const advice = [...new Set(adviceCodes)].slice(0, 3).map((c) => `${PLANET_NAMES[c]}: ${PLANET_FOCUS_ADVICE[c]}.`);

  const context = dm.houses.map((h) => {
    const row = rows[h - 1];
    return `${h} дом (${HOUSE_MEANINGS[h]}) — знак ${SIGNS[row.signIdx]}, стихия ${elementRu(elementOf(row.signIdx))}: в поведении это ${SIGN_TRAITS[row.signIdx]}.`;
  });

  const summary = HOUSE_VERDICT_SUMMARY[verdict];

  return { pluses, minuses, watch, advice, verdict, context, summary };
}

const HOUSE_VERDICT_SUMMARY = {
  good: "В целом сфера хорошо опирается на карту — серьёзных рисков немного, достаточно следить за отмеченными нюансами.",
  mixed: "Сильные и слабые стороны примерно уравновешивают друг друга — результат заметно зависит от текущих даш и ваших сознательных усилий.",
  watch: "Эта сфера — зона роста: без сознательной работы над отмеченными точками возможны трудности, но управлять ситуацией вполне реально.",
};

const HOUSE_VERDICT_META = {
  good: { label: "Сильная сфера", bg: "#1c3a2e", color: "#7fd99a" },
  mixed: { label: "Смешанная картина", bg: "#3a3320", color: "#e8c46b" },
  watch: { label: "Требует внимания", bg: "#3a2020", color: "#e88b8b" },
};

function HousesPanel({ details }) {
  if (!details?.As) return <div style={{ textAlign: "center", color: "#8b84b8", fontSize: 13 }}>Сначала дождитесь загрузки карты на вкладке «Карта».</div>;
  const ascSignIdx = details.As.sign ?? 0;
  const rows = buildHouseRows(details);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      <div style={{ fontSize: 12, color: "#9089c9", marginBottom: 14, lineHeight: 1.6 }}>
        Дома считаются от Асцендента ({SIGNS[ascSignIdx]}). По каждой сфере — плюсы, на что обратить внимание и что практически можно поправить.
      </div>

      {Object.entries(DOMAIN_META).map(([key, dm]) => {
        const a = assessDomain(dm, rows);
        const vm = HOUSE_VERDICT_META[a.verdict];
        return (
          <div key={key} style={{ background: "#1c1846", borderRadius: 10, padding: 16, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
              <div style={{ fontSize: 13, color: "#e8c46b", fontWeight: 600 }}>{dm.title}</div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: vm.bg, color: vm.color }}>{vm.label}</span>
            </div>
            <div style={{ marginBottom: 10 }}>
              {a.context.map((t, i) => (
                <p key={i} style={{ fontSize: 12, color: "#8b84b8", lineHeight: 1.55, marginBottom: 2 }}>{t}</p>
              ))}
            </div>

            {a.pluses.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: "#7fd99a", fontWeight: 600, marginBottom: 4 }}>Плюсы</div>
                {a.pluses.map((t, i) => (
                  <p key={i} style={{ fontSize: 13, color: "#c9c4e8", lineHeight: 1.6, marginBottom: 4, paddingLeft: 10, borderLeft: "2px solid #2f5c44" }}>{t}</p>
                ))}
              </div>
            )}

            {(a.minuses.length > 0 || a.watch.length > 0) && (
              <div style={{ marginBottom: a.advice.length ? 10 : 0 }}>
                <div style={{ fontSize: 12, color: "#e88b8b", fontWeight: 600, marginBottom: 4 }}>На что обратить внимание</div>
                {[...a.minuses, ...a.watch].map((t, i) => (
                  <p key={i} style={{ fontSize: 13, color: "#c9c4e8", lineHeight: 1.6, marginBottom: 4, paddingLeft: 10, borderLeft: "2px solid #5c2f2f" }}>{t}</p>
                ))}
              </div>
            )}

            {a.advice.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: "#9db8e8", fontWeight: 600, marginBottom: 4 }}>Что можно поправить и как</div>
                {a.advice.map((t, i) => (
                  <p key={i} style={{ fontSize: 13, color: "#c9c4e8", lineHeight: 1.6, marginBottom: 4, paddingLeft: 10, borderLeft: "2px solid #2f3f5c" }}>{t}</p>
                ))}
              </div>
            )}

            <div style={{ fontSize: 12, color: "#766fa0", lineHeight: 1.55, paddingTop: 8, borderTop: "1px solid #2e2a5c" }}>
              <b style={{ color: "#9089c9" }}>Итог:</b> {a.summary}
            </div>
          </div>
        );
      })}

      <div style={{ background: "#1c1846", borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 13, color: "#e8c46b", marginBottom: 8, fontWeight: 600 }}>Все 12 домов</div>
        <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 380, borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr style={{ color: "#9089c9", textAlign: "left" }}>
            <th style={{ padding: 6 }}>Дом</th><th>Знак</th><th>Планета-хозяйка</th><th>Планеты внутри</th>
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
   UI: семья и дети (для женской карты — Юпитер как карака мужа)
   ========================================================= */

// Оценка периода махадаши для двух смежных тем: дети (5 дом) и партнёр (7 дом + Юпитер —
// классическая карака мужа в женской карте, поэтому темы «дети» и «муж» у Юпитера
// пересекаются не случайно). Не самостоятельная методика, а прикидка поверх уже посчитанных
// домов и классических дружб планет — тот же принцип, что и в остальных эвристиках приложения.
function familyRowScore(lordCode, row, details) {
  let s = 0;
  if (lordCode === row.lord) s += 3;
  if (details?.[lordCode]?.house === row.houseNum) s += 2;
  const rel = relation(lordCode, row.lord);
  if (rel === "friend" || rel === "same") s += 2;
  else if (rel === "enemy") s -= 2;
  if (lordCode !== "Ju") {
    const relJu = relation(lordCode, "Ju");
    if (relJu === "friend") s += 1;
    else if (relJu === "enemy") s -= 1;
  } else {
    s += 2;
  }
  if (NATURAL_BENEFICS.includes(lordCode) && lordCode !== row.lord) s += 1;
  else if (NATURAL_MALEFICS.includes(lordCode) && lordCode !== row.lord) s -= 1;
  return s;
}

function familyScoreVerdict(score) {
  if (score >= 5) return "good";
  if (score <= 0) return "watch";
  return "mixed";
}

// Разбор 7 дома и Юпитера как караки мужа — отдельная (не из DOMAIN_META) логика, чтобы не
// путать тему партнёрства с темой бизнеса, которая тоже частично завязана на 7 дом.
function assessPartner(rows, details) {
  const row7 = rows[6];
  const juHouse = details?.Ju?.house;
  const juSign = details?.Ju?.sign;
  const pluses = [];
  const minuses = [];

  row7.occupants.forEach((c) => {
    if (NATURAL_BENEFICS.includes(c) || NATURAL_MILD_BENEFICS.includes(c)) {
      pluses.push(`${PLANET_NAMES[c]} стоит прямо в 7 доме (партнёрство, брак) — её качества (${PLANET_CORE[c]}) поддерживают тему отношений.`);
    } else {
      minuses.push(`${PLANET_NAMES[c]} стоит в 7 доме — непростая планета здесь означает, что тема отношений требует больше сознательных усилий, чем везения самого по себе. Что делать: ${PLANET_FOCUS_ADVICE[c]}.`);
    }
  });

  if (row7.lordHouse) {
    if (STRONG_HOUSES.has(row7.lordHouse)) {
      pluses.push(`Управитель 7 дома, ${PLANET_NAMES[row7.lord]}, сам стоит в сильной части карты (${row7.lordHouse} дом, ${HOUSE_MEANINGS[row7.lordHouse]}) — у партнёрской темы есть устойчивая опора.`);
    } else if (DIFFICULT_HOUSES.has(row7.lordHouse)) {
      minuses.push(`Управитель 7 дома, ${PLANET_NAMES[row7.lord]}, стоит в непростом доме (${row7.lordHouse}, ${HOUSE_MEANINGS[row7.lordHouse]}) — партнёрство скорее потребует осознанной работы, чем сложится само собой.`);
    }
  }

  if (juHouse) {
    if (STRONG_HOUSES.has(juHouse)) {
      pluses.push(`Юпитер — классическая карака мужа в женской карте — сам стоит в сильной части карты (${juHouse} дом, ${HOUSE_MEANINGS[juHouse]}). Хороший знак для качества партнёрства и поддержки со стороны мужа.`);
    } else if (DIFFICULT_HOUSES.has(juHouse)) {
      minuses.push(`Юпитер — карака мужа — стоит в непростом доме (${juHouse}, ${HOUSE_MEANINGS[juHouse]}). Это не означает «плохого мужа» — скорее что тема партнёрства требует больше сознательного участия и терпения с обеих сторон.`);
    }
  }

  const score = pluses.length - minuses.length;
  const verdict = score > 0 ? "good" : score < 0 ? "watch" : "mixed";
  const juTrait = juSign != null ? SIGN_TRAITS[juSign] : null;

  return { pluses, minuses, verdict, juSign, juTrait, row7 };
}

function FamilyPanel({ person, details, periods }) {
  if (person.gender !== "female") {
    return (
      <div style={{ fontFamily: "system-ui, sans-serif" }}>
        <div style={{ background: "#1c1846", borderRadius: 10, padding: 20, textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
          <div style={{ fontSize: 13, color: "#e8c46b", fontWeight: 600, marginBottom: 10 }}>Этот разбор — для женской карты</div>
          <p style={{ fontSize: 13, color: "#c9c4e8", lineHeight: 1.6, marginBottom: 10 }}>
            Он построен на классической связке «Юпитер — карака мужа», которая применяется именно к женской карте.
          </p>
          <p style={{ fontSize: 13, color: "#c9c4e8", lineHeight: 1.6 }}>
            Чтобы открыть его: на вкладке «Карта» в поле «Пол (для совместимости)» выберите «Женский».
          </p>
          <p style={{ fontSize: 12, color: "#8b84b8", lineHeight: 1.6, marginTop: 10 }}>
            А пока — тема детей в целом есть в «Дома и сферы» (карточка «Дети»), партнёрство — во вкладке «Совместимость».
          </p>
        </div>
      </div>
    );
  }
  if (!details?.As) {
    return <div style={{ textAlign: "center", color: "#8b84b8", fontSize: 13 }}>Сначала дождитесь загрузки карты на вкладке «Карта».</div>;
  }
  const rows = buildHouseRows(details);
  const childrenA = assessDomain(DOMAIN_META.children, rows);
  const childrenVm = HOUSE_VERDICT_META[childrenA.verdict];
  const partnerA = assessPartner(rows, details);
  const partnerVm = HOUSE_VERDICT_META[partnerA.verdict];

  const scored = (periods || []).map((p) => {
    const childrenScore = familyRowScore(p.lord, rows[4], details);
    const partnerScore = familyRowScore(p.lord, rows[6], details);
    return { ...p, childrenScore, partnerScore };
  });
  const bestChildren = scored.length ? scored.reduce((a, b) => (b.childrenScore > a.childrenScore ? b : a)) : null;
  const bestPartner = scored.length ? scored.reduce((a, b) => (b.partnerScore > a.partnerScore ? b : a)) : null;

  const scoreBadge = (score) => {
    const v = familyScoreVerdict(score);
    const m = HOUSE_VERDICT_META[v];
    return <span style={{ fontSize: 10.5, fontWeight: 600, padding: "2px 7px", borderRadius: 14, background: m.bg, color: m.color, whiteSpace: "nowrap" }}>{score > 0 ? "+" : ""}{score}</span>;
  };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      <div style={{ fontSize: 12, color: "#9089c9", marginBottom: 14, lineHeight: 1.6 }}>
        В женской карте Юпитер традиционно читается как карака (главный сигнификатор) мужа — поэтому темы «дети» (5 дом) и «партнёр» здесь и пересекаются: одна и та же планета отвечает за обе. Это символическая традиционная трактовка, не медицинский прогноз и не гарантия конкретного числа детей или конкретного партнёра — она показывает тенденции карты, а не факты будущего.
      </div>

      <div style={{ background: "#1c1846", borderRadius: 10, padding: 16, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
          <div style={{ fontSize: 13, color: "#e8c46b", fontWeight: 600 }}>Дети — 5 дом</div>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: childrenVm.bg, color: childrenVm.color }}>{childrenVm.label}</span>
        </div>
        {childrenA.context.map((t, i) => (
          <p key={i} style={{ fontSize: 12, color: "#8b84b8", lineHeight: 1.55, marginBottom: 6 }}>{t}</p>
        ))}
        {childrenA.pluses.map((t, i) => (
          <p key={`p${i}`} style={{ fontSize: 13, color: "#c9c4e8", lineHeight: 1.6, marginBottom: 4, paddingLeft: 10, borderLeft: "2px solid #2f5c44" }}>{t}</p>
        ))}
        {[...childrenA.minuses, ...childrenA.watch].map((t, i) => (
          <p key={`m${i}`} style={{ fontSize: 13, color: "#c9c4e8", lineHeight: 1.6, marginBottom: 4, paddingLeft: 10, borderLeft: "2px solid #5c2f2f" }}>{t}</p>
        ))}
      </div>

      <div style={{ background: "#1c1846", borderRadius: 10, padding: 16, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
          <div style={{ fontSize: 13, color: "#e8c46b", fontWeight: 600 }}>Партнёр — 7 дом и Юпитер (карака мужа)</div>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: partnerVm.bg, color: partnerVm.color }}>{partnerVm.label}</span>
        </div>
        {partnerA.juTrait && (
          <p style={{ fontSize: 12, color: "#8b84b8", lineHeight: 1.55, marginBottom: 6 }}>
            Юпитер стоит в знаке {SIGNS[partnerA.juSign]} — по этому знаку в партнёре часто резонируют такие качества: {partnerA.juTrait}.
          </p>
        )}
        {partnerA.pluses.map((t, i) => (
          <p key={`p${i}`} style={{ fontSize: 13, color: "#c9c4e8", lineHeight: 1.6, marginBottom: 4, paddingLeft: 10, borderLeft: "2px solid #2f5c44" }}>{t}</p>
        ))}
        {partnerA.minuses.map((t, i) => (
          <p key={`m${i}`} style={{ fontSize: 13, color: "#c9c4e8", lineHeight: 1.6, marginBottom: 4, paddingLeft: 10, borderLeft: "2px solid #5c2f2f" }}>{t}</p>
        ))}
      </div>

      <div style={{ background: "#1c1846", borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 13, color: "#e8c46b", marginBottom: 6, fontWeight: 600 }}>Лучшие периоды</div>
        <div style={{ fontSize: 11, color: "#6f6798", marginBottom: 10, lineHeight: 1.5 }}>
          По каждому периоду махадаши — насколько его планета-управитель дружественна темам 5 и 7 домов и Юпитеру. Не про антардаши внутри — общая прикидка по большим периодам жизни.
        </div>
        {!periods && <div style={{ textAlign: "center", color: "#8b84b8", fontSize: 13 }}>Дождитесь загрузки периодов на вкладке «Периоды жизни».</div>}
        {bestChildren && bestPartner && (
          <div style={{ fontSize: 12.5, color: "#c9c4e8", lineHeight: 1.6, marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #2e2a5c" }}>
            Для темы детей заметнее всего выглядит период <b style={{ color: "#f1ede4" }}>{PLANET_NAMES[bestChildren.lord]}</b> ({bestChildren.start?.toISOString().slice(0, 10)} — {bestChildren.end?.toISOString().slice(0, 10)}). Для партнёрства — период <b style={{ color: "#f1ede4" }}>{PLANET_NAMES[bestPartner.lord]}</b> ({bestPartner.start?.toISOString().slice(0, 10)} — {bestPartner.end?.toISOString().slice(0, 10)}).
          </div>
        )}
        {scored.map((p, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, padding: "6px 0", borderTop: i ? "1px solid #2e2a5c" : "none" }}>
            <span style={{ color: "#f1ede4" }}>{PLANET_NAMES[p.lord]}</span>
            <span style={{ color: "#766fa0", fontSize: 11 }}>{p.start?.toISOString().slice(0, 10)} — {p.end?.toISOString().slice(0, 10)}</span>
            <span style={{ display: "flex", gap: 6 }}>
              <span title="Дети">Д {scoreBadge(p.childrenScore)}</span>
              <span title="Партнёр">П {scoreBadge(p.partnerScore)}</span>
            </span>
          </div>
        ))}
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

  const weakKoots = KOOT_ORDER
    .map((key) => ({ key, k: data[key] }))
    .filter(({ k }) => k && k.total_points && k.received_points / k.total_points < 0.5);

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

      <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #2e2a5c" }}>
        <div style={{ fontSize: 12, color: "#e88b8b", fontWeight: 600, marginBottom: 6 }}>На что обратить внимание</div>
        {weakKoots.length === 0 ? (
          <p style={{ fontSize: 12, color: "#8fd19e", lineHeight: 1.55 }}>Слабых факторов не выявлено — все составляющие выше половины своего максимума.</p>
        ) : (
          <PaywallTeaser
            title={`Найдено слабых факторов: ${weakKoots.length}`}
            text="Что именно означает каждый слабый фактор и на что обратить внимание в паре — в полной версии."
            goalName="paywall_koots_hit"
          />
        )}
      </div>
    </div>
  );
}

const TENSE_VERDICTS = ["напряжённая", "низкая"];

function heuristicCompat(kind, chart1, chart2) {
  if (!chart1?.details?.Mo || !chart2?.details?.Mo || !chart1?.details?.As || !chart2?.details?.As) return null;
  const moon1 = chart1.details.Mo, moon2 = chart2.details.Mo;
  const asc1 = chart1.details.As, asc2 = chart2.details.As;

  const items = [];
  const g1 = ganaOf(moon1.nak), g2 = ganaOf(moon2.nak);
  const ganaVerdict = ganaCompat(g1, g2);
  items.push({
    label: "Эмоциональный тон (гана Луны)", verdict: ganaVerdict, note: `${moon1.nakName} и ${moon2.nakName}`,
    tip: TENSE_VERDICTS.includes(ganaVerdict)
      ? "Темпераменты ощутимо разные — не пытайтесь «выровнять» реакции друг друга, договоритесь заранее о разном темпе и о том, как каждый из вас остывает после разногласий."
      : "Темпераменты близки по духу — конфликтов на этой почве, скорее всего, будет немного.",
  });

  const ec = elementCompat(elementOf(asc1.sign), elementOf(asc2.sign));
  items.push({
    label: "Стиль поведения (стихии Асцендентов)", verdict: ec, note: `${asc1.signName} и ${asc2.signName}`,
    tip: TENSE_VERDICTS.includes(ec)
      ? "Разные стихии в поведении означают разные приоритеты в моменте — проговаривайте ожидания вслух, не полагайтесь, что партнёр «поймёт сам»."
      : "Стили поведения совместимы — легче находить общий ритм в повседневных ситуациях.",
  });

  const houseNum = kind === "business" ? 10 : 11;
  const lord1 = signLordOf((asc1.sign + houseNum - 1) % 12);
  const lord2 = signLordOf((asc2.sign + houseNum - 1) % 12);
  const rel = relation(lord1, lord2);
  const relRu = { same: "высокая", friend: "хорошая", neutral: "нейтральная", enemy: "напряжённая" }[rel];
  items.push({
    label: kind === "business" ? "Деловые устремления (управители 10 домов)" : "Круги общения (управители 11 домов)",
    verdict: relRu, note: `${PLANET_NAMES[lord1]} и ${PLANET_NAMES[lord2]}`,
    tip: TENSE_VERDICTS.includes(relRu)
      ? (kind === "business"
        ? "Управители деловых домов в напряжении — вероятны разные стратегии риска и заработка; закрепите роли и зоны ответственности письменно, не полагайтесь, что «само разрулится»."
        : "Управители кругов общения в напряжении — вероятен разный социальный ритм; не навязывайте свой темп общения другому.")
      : (kind === "business"
        ? "Управители деловых домов настроены дружественно — легче договориться о целях и распределении ролей."
        : "Управители кругов общения настроены дружественно — вам, вероятно, легко на одной социальной волне."),
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
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((it, i) => (
          <div key={i} style={{ fontSize: 13, borderLeft: `2px solid ${TENSE_VERDICTS.includes(it.verdict) ? "#5c2f2f" : "#2f5c44"}`, paddingLeft: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ color: "#f1ede4" }}>{it.label}</div>
              <div style={{ color: VERDICT_COLOR[it.verdict] || "#c9c4e8", fontWeight: 600, whiteSpace: "nowrap" }}>{it.verdict}</div>
            </div>
            <div style={{ color: "#8b84b8", fontSize: 11, marginTop: 1 }}>{it.note}</div>
            {it.tip && <div style={{ color: "#9089c9", fontSize: 12, lineHeight: 1.5, marginTop: 4 }}>{it.tip}</div>}
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
  const [region, setRegion] = useState("all");
  const [unlockedCity, setUnlockedCity] = useState(null); // ярлык единственного города, открытого бесплатно
  const [scanCache, setScanCache] = useState(null); // { key, results } — последний бесплатный подбор

  const poolCities = region === "all" ? CANDIDATE_CITIES : CANDIDATE_CITIES.filter((c) => c.region === region);
  const scanKey = `${person.date}|${person.time}|${person.tz}|${person.lat}|${person.lon}|${region}`;

  const handlePick = useCallback(async (cand) => {
    const label = `${cand.place_name}${cand.country_code ? ", " + cand.country_code : ""}`;
    if (unlockedCity && unlockedCity !== label) {
      setResult({ label, details: null });
      setStatus("locked");
      return;
    }
    if (unlockedCity && unlockedCity === label) {
      // тот же город, что уже открыт бесплатно — просто показываем, без нового запроса к API
      setStatus("ready");
      return;
    }
    setStatus("loading");
    try {
      const fields = relocatedBirthFields(person, Number(cand.latitude), Number(cand.longitude), cand.tz);
      const planetsRes = await fetchPlanets(fields);
      const details = buildChartDetails(planetsRes);
      setResult({ label, details });
      setStatus("ready");
      setUnlockedCity(label);
      ymGoal("relocation_city_checked");
    } catch (e) {
      setStatus("error");
    }
  }, [person, unlockedCity]);

  const orig = originalChart?.details;

  const findBestPlaces = useCallback(async () => {
    if (!orig) return;
    if (scanCache && scanCache.key === scanKey) {
      // те же данные рождения и та же часть света — уже считали, показываем без новых запросов к API
      setBestResults(scanCache.results);
      setBestStatus("done");
      ymGoal("relocation_scan_cached", { region });
      return;
    }
    if (scanCache && scanCache.key !== scanKey) {
      // другие данные рождения или другая часть света — это уже новый платный запрос
      setBestStatus("locked_scan");
      return;
    }
    ymGoal("relocation_scan_started", { region, cities: poolCities.length });
    setBestStatus("loading");
    setBestProgress(0);
    setBestResults(null);
    const found = [];
    const queue = [...poolCities];
    async function worker() {
      while (queue.length) {
        const city = queue.shift();
        try {
          const fields = relocatedBirthFields(person, city.lat, city.lon, city.tz);
          const planetsRes = await fetchPlanets(fields);
          const details = buildChartDetails(planetsRes);
          found.push({ city, details, score: relocationScore(details, activeMahaLord) });
        } catch {
          // город пропускаем, если не получилось посчитать
        }
        setBestProgress((p) => p + 1);
      }
    }
    await Promise.all([worker(), worker(), worker()]);
    found.sort((a, b) => b.score - a.score);
    const top = found.slice(0, 8);
    setBestResults(top);
    setBestStatus("done");
    setScanCache({ key: scanKey, results: top });
    ymGoal("relocation_scan_completed", { region, found: found.length });
  }, [orig, person, activeMahaLord, poolCities, region, scanKey, scanCache]);

  const openCityResult = useCallback((r) => {
    const label = `${r.city.name}, ${r.city.country}`;
    if (unlockedCity && unlockedCity !== label) {
      setResult({ label, details: null });
      setStatus("locked");
      return;
    }
    setResult({ label, details: r.details });
    setStatus("ready");
    setUnlockedCity(label);
  }, [unlockedCity]);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      <div style={{ fontSize: 12, color: "#9089c9", marginBottom: 12, lineHeight: 1.6 }}>
        Релокация пересчитывает Асцендент и дома для той же секунды рождения, но в другой точке Земли (планеты по знакам почти не меняются, а вот дома — заметно). Ниже — подбор благоприятных мест по расширенному списку локаций со всех обитаемых континентов, либо проверка конкретного города вручную.
      </div>

      {!orig && <div style={{ textAlign: "center", color: "#8b84b8", fontSize: 13 }}>Сначала дождитесь загрузки карты на вкладке «Карта».</div>}

      {orig && (
        <div style={{ background: "#1c1846", borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "#e8c46b", marginBottom: 6, fontWeight: 600 }}>Наилучшие варианты релокации</div>
          <div style={{ fontSize: 11, color: "#6f6798", marginBottom: 12, lineHeight: 1.5 }}>
            Прикидка по {CANDIDATE_CITIES.length} точкам по всему миру — не только популярные столицы, но и менее очевидные места на каждом континенте: где благоприятные планеты попадают в сильные дома (1,4,5,7,9,10), а трудные — в спокойные (6,8,12), как это влияет на дом текущей махадаши, и отдельно — насколько силён управитель Асцендента (Лагна-лорд) в этой точке. Список большой, но конечный (пересчитать буквально каждую точку планеты за разумное время нереально) — эвристика поверх карты, не классическая методика подбора места. Можно сузить поиск до конкретной части света, либо проверить вручную любой город или координаты ниже.
          </div>
          <div style={{ marginBottom: 12, maxWidth: 280, marginLeft: "auto", marginRight: "auto" }}>
            <span style={labelStyle}>Часть света</span>
            <select style={inputStyle} value={region} onChange={(e) => setRegion(e.target.value)}>
              <option value="all">Весь мир ({CANDIDATE_CITIES.length})</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r} ({CANDIDATE_CITIES.filter((c) => c.region === r).length})</option>
              ))}
            </select>
          </div>
          <button onClick={findBestPlaces} disabled={bestStatus === "loading"} style={{
            display: "block", margin: "0 auto", background: "#e8c46b", color: "#151233", border: "none",
            borderRadius: 20, padding: "9px 22px", fontSize: 13, fontWeight: 700, cursor: bestStatus === "loading" ? "default" : "pointer",
            opacity: bestStatus === "loading" ? 0.7 : 1,
          }}>
            {bestStatus === "loading" ? `Проверяю ${bestProgress} из ${poolCities.length}…` : "Подобрать лучшие места"}
          </button>

          {bestStatus === "locked_scan" && (
            <PaywallTeaser
              title="Подбор уже использован бесплатно"
              text="Один полный подбор лучших мест для этих данных рождения — бесплатно (результат выше, можно пересматривать без ограничений). Чтобы пересчитать для других данных рождения или другой части света — полная версия."
              goalName="paywall_relocation_scan_hit"
            />
          )}

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

      {status === "locked" && result && (
        <div style={{ background: "#1c1846", borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, color: "#e8c46b", marginBottom: 10, fontWeight: 600 }}>Релокация в {result.label}</div>
          <PaywallTeaser
            title="Один город уже открыт бесплатно"
            text={`Подробный разбор для «${unlockedCity}» остаётся доступен в любой момент. Чтобы посмотреть ещё один город — полная версия.`}
            goalName="paywall_relocation_hit"
          />
        </div>
      )}

      {status === "ready" && result && orig && (
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

          {(() => {
            const origAscLord = orig.As?.sign != null ? signLordOf(orig.As.sign) : null;
            const afterAscLord = result.details.As?.sign != null ? signLordOf(result.details.As.sign) : null;
            if (!origAscLord || !afterAscLord) return null;
            const afterHouse = result.details[afterAscLord]?.house;
            const strongNote = afterHouse
              ? (STRONG_HOUSES.has(afterHouse) ? " — сильная позиция, вся карта держится увереннее" : DIFFICULT_HOUSES.has(afterHouse) ? " — позиция непростая, испытание для карты в целом" : "")
              : "";
            return (
              <p style={{ fontSize: 13, color: "#c9c4e8", lineHeight: 1.6 }}>
                Управитель Асцендента: {PLANET_NAMES[origAscLord]} → <b style={{ color: "#f1ede4" }}>{PLANET_NAMES[afterAscLord]}</b>{afterHouse ? `, сам в ${afterHouse} доме (${HOUSE_MEANINGS[afterHouse]})` : ""}{strongNote}.
              </p>
            );
          })()}

          <div style={{ fontSize: 11, color: "#6f6798", marginTop: 10, lineHeight: 1.5 }}>
            Ниже — та же логика, что и в общем рейтинге городов выше (благоприятные планеты в сильных домах, трудные — в слабых). Общий балл в рейтинге учитывает ещё и два больших отдельных фактора, не привязанных ни к одной конкретной сфере: в каком доме окажется управитель текущей махадаши, и насколько силён управитель самого Асцендента. Поэтому у высокого места в рейтинге отдельные сферы ниже вполне могут выглядеть скромно или почти не меняться — это не ошибка.
          </div>
          <div style={{ marginTop: 8 }}>
            {(() => {
              const origRows = buildHouseRows(orig);
              const afterRows = buildHouseRows(result.details);
              return Object.entries(DOMAIN_META).map(([key, dm]) => {
                const before = domainScore(dm, origRows);
                const after = domainScore(dm, afterRows);
                const diff = after - before;
                const verdict = diff > 0 ? "выглядит сильнее" : diff < 0 ? "выглядит слабее" : "без изменений";
                const color = diff > 0 ? "#8fd19e" : diff < 0 ? "#e0b98b" : "#c9c4e8";
                return (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0", borderTop: "1px solid #2e2a5c" }}>
                    <span style={{ color: "#f1ede4" }}>{dm.title}</span>
                    <span style={{ color }}>{verdict} ({before > 0 ? "+" : ""}{before} → {after > 0 ? "+" : ""}{after})</span>
                  </div>
                );
              });
            })()}
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

// Запоминаем последние введённые данные рождения в этом браузере, чтобы они не терялись
// при обновлении страницы или между визитами (сервер их не хранит и не видит).
function loadSavedPerson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return fallback;
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}
function saveSavedPerson(key, person) {
  try {
    localStorage.setItem(key, JSON.stringify(person));
  } catch {
    // localStorage недоступен (приватный режим и т.п.) — просто не сохраняем
  }
}

export default function JyotishApp() {
  const [tab, setTab] = useState("chart");
  const [person1, setPerson1] = useState(() => loadSavedPerson("astro_person1", defaultPerson1));
  const [person2, setPerson2] = useState(() => loadSavedPerson("astro_person2", defaultPerson2));

  useEffect(() => { saveSavedPerson("astro_person1", person1); }, [person1]);
  useEffect(() => { saveSavedPerson("astro_person2", person2); }, [person2]);
  const [matchKind, setMatchKind] = useState("marriage"); // marriage | business | friendship

  const chart1 = useBirthChart(person1, "chart_calculated");
  const chart2 = useBirthChart(person2, "partner_chart_calculated");
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
      ymGoal("compat_marriage_calculated");
    } catch (e) {
      setMatchState({ loading: false, error: e.message || "Не удалось рассчитать совместимость", data: null });
    }
  }, [person1, person2]);

  const heuristicItems = matchKind !== "marriage" ? heuristicCompat(matchKind, chart1, chart2) : null;

  const tabs = [
    { id: "chart", label: "Карта" },
    { id: "dasha", label: "Периоды жизни" },
    { id: "houses", label: "Дома и сферы" },
    { id: "family", label: "Семья и дети" },
    { id: "synastry", label: "Совместимость" },
    { id: "relocation", label: "Релокация" },
    { id: "pricing", label: "Тарифы" },
  ];

  return (
    <div className="app-root" style={{ fontFamily: "Georgia, 'Times New Roman', serif", background: "#0d0b26", minHeight: "100svh", width: "100%", maxWidth: 960, margin: "0 auto", boxSizing: "border-box", padding: 20, color: "#f1ede4" }}>
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 22, letterSpacing: 2, color: "#e8c46b" }}>ВЕДИЧЕСКАЯ АСТРОЛОГИЯ</div>
        <div style={{ fontSize: 11, color: "#6f6798", marginTop: 2, fontFamily: "system-ui, sans-serif" }}>
          живые расчёты по данным рождения, сидерический зодиак
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 18, justifyContent: "center", flexWrap: "wrap", fontFamily: "system-ui, sans-serif" }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id); ymGoal(`tab_${t.id}`); }} style={{
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
            Вимшоттари даша — все 3 уровня: махадаша → антардаша → пратьянтардаша, у каждого своя дата начала и конца. Клик по строке махадаши раскрывает её антардаши с разбором; клик по строке «под-периоды» под нужной антардашей — раскрывает её собственные пратьянтардаши (свои даты внутри родительского периода), каждая — с коротким «+» (сильная сторона) и «−» (на что обратить внимание).
          </div>
          {dasha1.loading && <div style={{ textAlign: "center", color: "#8b84b8", fontSize: 13 }}>Загрузка даши…</div>}
          {dasha1.error && <div style={{ textAlign: "center", color: "#e08b8b", fontSize: 13 }}>Ошибка: {dasha1.error}</div>}
          {dasha1.periods && <DashaTimeline birth={person1} periods={dasha1.periods} details={chart1.details} />}
        </div>
      )}

      {tab === "houses" && <HousesPanel details={chart1.details} />}

      {tab === "family" && <FamilyPanel person={person1} details={chart1.details} periods={dasha1.periods} />}

      {tab === "synastry" && (
        <div style={{ fontFamily: "system-ui, sans-serif" }}>
          <BirthForm person={person2} setPerson={setPerson2} label="Второй профиль" />

          <div style={{ display: "flex", gap: 6, marginBottom: 16, justifyContent: "center" }}>
            {[["marriage", "Брак"], ["business", "Бизнес-партнёрство"], ["friendship", "Дружба"]].map(([id, lbl]) => (
              <button key={id} onClick={() => { setMatchKind(id); if (id !== "marriage") ymGoal(`compat_${id}_viewed`); }} style={{
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

      {tab === "pricing" && <PricingInfo />}
    </div>
  );
}
