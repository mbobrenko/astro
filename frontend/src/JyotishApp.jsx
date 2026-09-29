import React, { useEffect, useState, useCallback } from "react";
import { LangProvider, useLang } from "./i18n.jsx";
import { OFERTA_SECTIONS, OFERTA_SECTIONS_EN } from "./ofertaText.js";
import {
  fetchPlanets,
  fetchMajorDasha,
  fetchSubDasha,
  fetchSubSubDasha,
  fetchGeoDetails,
  fetchTimezone,
  fetchMatchAshtakoot,
  requestLoginCode,
  verifyLoginCode,
  logoutAccount,
  fetchAccountStatus,
  checkUsage,
  createPackagePayment,
  fetchPackageInfo,
  createLavaPackagePayment,
  fetchLavaPackageInfo,
} from "./api";
import {
  SIGNS,
  signLordOf,
  relation,
  RELATION_LABEL,
  RELATION_COLOR,
  RELATION_BADGE_SHORT,
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
  RELATION_BADGE_SHORT_EN,
  houseMeaning,
  planetCore,
  planetFocusAdvice,
  domainTitle,
  verdictLabel,
  regionLabel,
} from "./astroData";

/* =========================================================
   СТАТИЧЕСКИЕ СПРАВОЧНИКИ (не зависят от API)
   ========================================================= */

const EN_SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

const NAKSHATRAS = ["Ашвини", "Бхарани", "Криттика", "Рохини", "Мригашира", "Ардра", "Пунарвасу", "Пушья", "Ашлеша", "Магха", "Пурва Пхалгуни", "Уттара Пхалгуни", "Хаста", "Читра", "Свати", "Вишакха", "Анурадха", "Джйештха", "Мула", "Пурва Ашадха", "Уттара Ашадха", "Шравана", "Дханишта", "Шатабхиша", "Пурва Бхадрапада", "Уттара Бхадрапада", "Ревати"];
const NAKSHATRAS_EN = ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"];
function nakshatraName(idx, lang) { return idx == null ? "—" : (lang === "en" ? NAKSHATRAS_EN : NAKSHATRAS)[idx]; }
function signName(idx, lang) { return idx == null ? "—" : (lang === "en" ? EN_SIGNS : SIGNS)[idx]; }

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
const PLANET_NAMES_EN = { Su: "Sun", Mo: "Moon", Ma: "Mars", Me: "Mercury", Ju: "Jupiter", Ve: "Venus", Sa: "Saturn", Ra: "Rahu", Ke: "Ketu", As: "Ascendant" };
function planetName(code, lang) { return (lang === "en" ? PLANET_NAMES_EN : PLANET_NAMES)[code] || code; }
const PLANET_ORDER = ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa", "Ra", "Ke"];

// Цвет и классический астрологический символ планеты — для цветного выделения в карте и таблицах
const PLANET_COLOR = { Su: "#f5a623", Mo: "#cfe8ff", Ma: "#ff6b6b", Me: "#7ee6b0", Ju: "#ffd166", Ve: "#ff9fd6", Sa: "#8fa3c9", Ra: "#b28ae0", Ke: "#a9a9b8", As: "#e8c46b" };
const PLANET_ICON = { Su: "\u2609", Mo: "\u263D", Ma: "\u2642", Me: "\u263F", Ju: "\u2643", Ve: "\u2640", Sa: "\u2644", Ra: "\u260A", Ke: "\u260B" };

// Компактная цветная плашка "друг / враг / нейтрально / свой период" для таблиц дашы —
// одно и то же по всем трём уровням (маха / антар / пратьянтар), чтобы было видно с первого взгляда.
function RelationBadge({ rel }) {
  const { lang } = useLang();
  if (!rel) return null;
  const color = RELATION_COLOR[rel] || RELATION_COLOR.neutral;
  const label = (lang === "en" ? RELATION_BADGE_SHORT_EN : RELATION_BADGE_SHORT)[rel] || rel;
  return (
    <span style={{
      fontSize: 9.5, fontWeight: 700, color, background: `${color}22`,
      border: `1px solid ${color}66`, borderRadius: 8, padding: "1px 6px",
      textTransform: "uppercase", letterSpacing: 0.3, whiteSpace: "nowrap",
    }}>{label}</span>
  );
}

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

const DASHA_TEXTS_EN = {
  Su: { strengths: "A period of strengthening authority, independence, and visibility — a good time to assert yourself and take on responsibility.", caution: "Watch for excessive pride and conflicts with authority figures or father figures.", comm: "Communicate directly and to the point with people in positions of power — respectfully, but without currying favor." },
  Mo: { strengths: "A time of emotional sensitivity, caregiving, and working on home and family — intuition sharpens.", caution: "Mood swings and excessive dependence on others' opinions are possible.", comm: "A gentle, empathetic tone works better than pressure; a good time for conversations with loved ones." },
  Ma: { strengths: "Energy, initiative, the ability to act quickly and defend your boundaries.", caution: "Risk of impulsive decisions, conflicts, and injuries — keep irritability in check.", comm: "Short, concrete phrasing; avoid arguing on emotion, take a pause before responding." },
  Me: { strengths: "An excellent period for learning, negotiations, paperwork, and communication projects.", caution: "Possible restlessness, scattered attention, and superficial decisions.", comm: "Argue logically and in a structured way; a good time for letters, presentations, and deals." },
  Ju: { strengths: "A period of growth, luck, and expansion — favorable for education, mentorship, and finances.", caution: "Beware of excessive optimism and overestimating your own abilities.", comm: "An open, generous tone; a good time for talks with mentors and about long-term plans." },
  Ve: { strengths: "Harmony in relationships, creativity, aesthetics, comfort — a strong period for partnership and art.", caution: "Possible tendency toward excess, self-indulgence, and postponing hard decisions.", comm: "A diplomatic, warm tone; a good time for romantic and creative negotiations." },
  Sa: { strengths: "A period of discipline, structure, and long-term building — what you build now will be solid.", caution: "Possible delays, a sense of heaviness, tests of patience — don't force events.", comm: "A restrained, businesslike tone; keep your word and deadlines, avoid hasty promises." },
  Ra: { strengths: "Unconventional opportunities, ambition, breakthroughs in new, unfamiliar areas.", caution: "Risk of illusions, obsession with a goal, deception — double-check facts.", comm: "Keep boundaries clearly stated, avoid vague agreements." },
  Ke: { strengths: "A period of inner searching, letting go of the unnecessary, spiritual work, and narrow specialization.", caution: "Possible sense of losing direction, detachment, apathy toward worldly matters.", comm: "Being sparing with words is fitting — this period favors inner work over outward expansion." },
};
function dashaText(code, lang) { return (lang === "en" ? DASHA_TEXTS_EN : DASHA_TEXTS)[code]; }

const SIGN_TRAITS = {
  0: "инициативность, прямота, лидерский импульс", 1: "устойчивость, практичность, любовь к комфорту",
  2: "любознательность, коммуникабельность, гибкость ума", 3: "чувствительность, забота, сильная привязанность к дому",
  4: "уверенность, творческая харизма, потребность в признании", 5: "аналитичность, внимание к деталям, служение",
  6: "дипломатичность, стремление к балансу и партнёрству", 7: "глубина, интенсивность, стратегическое мышление",
  8: "оптимизм, широта взглядов, тяга к смыслу", 9: "дисциплина, целеустремлённость, терпение",
  10: "независимость, оригинальность, социальная направленность", 11: "интуитивность, сострадание, склонность к мечтательности",
};

const SIGN_TRAITS_EN = {
  0: "initiative, directness, a leadership impulse", 1: "steadiness, practicality, a love of comfort",
  2: "curiosity, sociability, mental flexibility", 3: "sensitivity, caring, strong attachment to home",
  4: "confidence, creative charisma, a need for recognition", 5: "an analytical mind, attention to detail, service",
  6: "diplomacy, a drive for balance and partnership", 7: "depth, intensity, strategic thinking",
  8: "optimism, breadth of outlook, a pull toward meaning", 9: "discipline, focus, patience",
  10: "independence, originality, a social orientation", 11: "intuitiveness, compassion, a tendency to dream",
};
function signTraits(idx, lang) { return idx == null ? "" : (lang === "en" ? SIGN_TRAITS_EN : SIGN_TRAITS)[idx]; }

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
const KOOT_LABELS_EN = {
  varna: "Varna — spiritual compatibility",
  vashya: "Vashya — mutual attraction and control",
  tara: "Tara — health and well-being",
  yoni: "Yoni — physical intimacy",
  maitri: "Graha Maitri — friendship of minds",
  gan: "Gana — temperament",
  bhakut: "Bhakut — compatibility of destinies",
  nadi: "Nadi — offspring and family health",
};
function kootLabel(key, lang) { return (lang === "en" ? KOOT_LABELS_EN : KOOT_LABELS)[key] || key; }
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

const KOOT_WATCH_MEANING_EN = {
  varna: "you may read roles and hierarchy in the relationship differently — spell out expectations explicitly rather than assuming they're obvious to both of you.",
  vashya: "there may be an imbalance of influence — one partner will naturally tend to lead, the other to yield more often; make sure decisions actually get made together.",
  tara: "pay closer attention to each other's health and everyday stability — don't let wellbeing and routine drift on their own.",
  yoni: "physical compatibility may take more time and patience to settle than it seems at the start — don't rush this.",
  maitri: "your ways of thinking and reasoning can differ noticeably — don't expect your partner to reason \"like you do\"; look for common ground deliberately.",
  gan: "temperaments are noticeably different — instead of trying to convince each other, agree on rules and pace in advance.",
  bhakut: "major life goals and plans may diverge — check in on long-term plans regularly rather than assuming things will just work out.",
  nadi: "classically the single most important compatibility factor — worth paying closer attention to than the rest, even when the overall score looks decent.",
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
function lifeAspectHouseDomain(code, details, lang) {
  const house = details?.[code]?.house;
  if (!house) return null;
  const domains = Object.entries(DOMAIN_META)
    .filter(([, dm]) => dm.houses.includes(house))
    .map(([key]) => domainTitle(key, lang));
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

const RELATION_COMBO_PHRASE_EN = {
  same: (mn, an) => `The antardasha shares its planet with the mahadasha itself — the theme of ${an} plays out unobstructed, at full strength, without extra coloring from outside.`,
  friend: (mn, an) => `${an} is friendly toward the main planet of the period (${mn}), so its theme unfolds easily, without inner resistance — both planets "pull" in a similar direction.`,
  neutral: (mn, an) => `${an} is neutral toward ${mn} — the theme of this antardasha will play out on its own, neither amplified nor muted by the mahadasha's background.`,
  enemy: (mn, an) => `${an} is in tension with ${mn} — during this stretch of time an inner conflict between the two planets' themes is possible, so it's worth paying closer attention to your own reactions.`,
};
function relationComboPhrase(lang) { return lang === "en" ? RELATION_COMBO_PHRASE_EN : RELATION_COMBO_PHRASE; }

// Структурированный (а не слитный) разбор антардаши — тот же формат, что у махадаши
// (сильные стороны / осторожно / сфера жизни), чтобы 2-й уровень не уступал 1-му в детальности.
function dashaComboParts(mahaCode, antarCode, details, lang) {
  const a = dashaText(antarCode, lang);
  if (!a) return null;
  const rel = relation(mahaCode, antarCode);
  const phrases = relationComboPhrase(lang);
  const phraseFn = phrases[rel] || phrases.neutral;
  const relationText = phraseFn(planetName(mahaCode, lang), planetName(antarCode, lang));
  const aspect = lifeAspectHouseDomain(antarCode, details, lang);
  const isEn = lang === "en";
  const aspectText = aspect
    ? (isEn
      ? `Natally ${planetName(antarCode, lang)} sits in house ${aspect.house} (${houseMeaning(aspect.house, lang)})${aspect.domains.length ? ` — this period's theme will show up most in: "${aspect.domains.join('", "')}"` : ""}.`
      : `Натально ${planetName(antarCode, lang)} стоит в ${aspect.house} доме (${houseMeaning(aspect.house, lang)})${aspect.domains.length ? ` — тема периода сильнее всего скажется на: «${aspect.domains.join("», «")}»` : ""}.`)
    : "";
  return { relationText, strengths: a.strengths, caution: a.caution, aspectText, rel };
}

// То же самое, но для пратьянтардаши (3-й уровень) — короткая формула «+ / −» на каждый
// под-под-период, а не сплошной текст: плюс (сильная сторона), минус (на что обратить
// внимание), и, если планета в напряжении с антардашой, — отдельная пометка об этом.
function pratyantarComboParts(antarCode, code, details, lang) {
  const rel = relation(antarCode, code);
  const t = dashaText(code, lang);
  const plus = t ? t.strengths : (planetCore(code, lang) || "");
  let minus = t ? t.caution : "";
  const isEn = lang === "en";
  if (rel === "enemy") {
    minus = isEn
      ? `${minus} Additionally — friction with the antardasha theme of ${planetName(antarCode, lang)}; rhythm disruptions are possible in these days.`
      : `${minus} Дополнительно — трение с темой антардаши ${planetName(antarCode, lang)}, возможны сбои ритма в эти дни.`;
  }
  const aspect = lifeAspectHouseDomain(code, details, lang);
  const aspectText = aspect
    ? (isEn
      ? `House ${aspect.house} (${houseMeaning(aspect.house, lang)})${aspect.domains.length ? ` — area "${aspect.domains.join('", "')}"` : ""}.`
      : `${aspect.house} дом (${houseMeaning(aspect.house, lang)})${aspect.domains.length ? ` — сфера «${aspect.domains.join("», «")}»` : ""}.`)
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
function formatTierPrice(tier, lang) {
  const amt = (tier.amountMinor ?? tier.priceKopeks) / 100;
  return lang === "en" ? `$${amt}` : `${amt.toFixed(0)} ₽`;
}

function PricingInfo({ tiers, currency }) {
  const { t, lang } = useLang();
  useEffect(() => { ymGoal("tab_pricing_viewed"); }, []);
  const tierLine = tiers && tiers.length
    ? tiers.map((ti) => `${ti.quota} ${t("account_requests_word")} — ${formatTierPrice(ti, lang)}`).join(" · ")
    : null;
  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      <div style={{ fontSize: 14, color: "#a8a1dd", marginBottom: 14, lineHeight: 1.65 }}>
        {t("pricing_intro")}
      </div>
      <div style={{
        background: "#1c1846", border: "1px solid #332c66", borderRadius: 10,
        padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, fontSize: 13, lineHeight: 1.6,
      }}>
        <div>
          <div style={{ color: "#8fd19e", fontWeight: 600, marginBottom: 8, fontSize: 13 }}>{t("pricing_free_title")}</div>
          <ul style={{ margin: 0, paddingLeft: 18, color: "#c9c4e8" }}>
            <li>{t("pricing_free_chart")}</li>
            <li>{t("pricing_free_dasha")}</li>
            <li>{t("pricing_free_pratyantar")}</li>
            <li>{t("pricing_free_relocation")}</li>
            <li>{t("pricing_free_compat")}</li>
          </ul>
        </div>
        <div>
          <div style={{ color: "#e8c46b", fontWeight: 600, marginBottom: 8, fontSize: 13 }}>{t("pricing_paid_title")}</div>
          <ul style={{ margin: 0, paddingLeft: 18, color: "#c9c4e8" }}>
            <li>{t("pricing_paid_family")}</li>
            <li>{t("pricing_paid_pratyantar")}</li>
            <li>{t("pricing_paid_relocation")}</li>
            <li>{t("pricing_paid_compat")}</li>
            <li>{t("pricing_paid_rectify")}</li>
          </ul>
          <div style={{ fontSize: 12, color: "#c9c4e8", marginTop: 10, lineHeight: 1.6 }}>
            {tierLine ? <>{tierLine}. {t("pricing_tiers_note")}</> : t("pricing_tiers_line")}
          </div>
        </div>
      </div>
    </div>
  );
}

/* Мягкий пейволл: пока без ссылки на оплату/контакт — просто показываем, что дальше есть платная часть,
   и считаем, сколько раз на неё реально натыкаются (goalName шлётся один раз при показе тизера). */
function PaywallTeaser({ title, text, goalName, account, onGoToPricing, packageInfo, buying }) {
  const { t } = useLang();
  useEffect(() => {
    if (goalName) ymGoal(goalName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const canBuy = account?.loggedIn && onGoToPricing;
  return (
    <div style={{
      marginTop: 10, padding: "12px 14px", borderRadius: 8,
      background: "linear-gradient(135deg, #241c52, #1c1846)", border: "1px dashed #4a4088",
    }}>
      <div style={{ fontSize: 12, color: "#e8c46b", fontWeight: 600, marginBottom: 4 }}>🔒 {title}</div>
      <div style={{ fontSize: 13, color: "#c9c4e8", lineHeight: 1.55, marginBottom: 6 }}>{text}</div>
      {canBuy ? (
        <button onClick={onGoToPricing} style={{
          background: "#e8c46b", color: "#151233", border: "none", borderRadius: 16, padding: "7px 14px",
          fontSize: 12, fontWeight: 700, cursor: "pointer",
        }}>
          {t("paywall_buy_button")}
        </button>
      ) : (
        <div style={{ fontSize: 11, color: "#8b84b8", fontStyle: "italic" }}>
          {account ? t("paywall_login_hint") : t("paywall_soon")}
        </div>
      )}
    </div>
  );
}

function OfertaModal({ onClose }) {
  const { lang } = useLang();
  const isEn = lang === "en";
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(8, 6, 24, 0.82)", zIndex: 1000,
        display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "24px 14px",
        overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#1c1846", border: "1px solid #332c66", borderRadius: 12, padding: "24px 22px",
          maxWidth: 720, width: "100%", color: "#f1ede4", fontFamily: "Georgia, 'Times New Roman', serif",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <div style={{ fontSize: 18, color: "#e8c46b", fontWeight: 700 }}>
            {isEn ? "Public offer (terms of use)" : "Публичная оферта"}
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "1px solid #332c66", color: "#c9c4e8", borderRadius: 14,
            width: 30, height: 30, fontSize: 15, cursor: "pointer", flexShrink: 0,
          }}>×</button>
        </div>
        <div style={{ fontSize: 12.5, color: "#9089c9", marginBottom: 18, lineHeight: 1.55 }}>
          {isEn
            ? "These terms govern paid features of the \u201cVedic Astrology\u201d Service (astro-gold-three.vercel.app)."
            : "Эти условия регулируют платные функции Сервиса «Ведическая астрология» (astro-gold-three.vercel.app)."}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {(isEn ? OFERTA_SECTIONS_EN : OFERTA_SECTIONS).map((sec) => (
            <div key={sec.title}>
              <div style={{ fontSize: 14, color: "#e8c46b", fontWeight: 600, marginBottom: 6 }}>{sec.title}</div>
              {sec.body.split("\n\n").map((para, i) => (
                <p key={i} style={{ fontSize: 13.5, color: "#e3dfef", lineHeight: 1.65, marginBottom: 8, whiteSpace: "pre-line" }}>{para}</p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Вход по коду на email + статус пакета + кнопка покупки. Живёт на вкладке «Тарифы». */
function AccountWidget({ account, packageInfo, onLoggedIn, onBuyPackage, buying, onShowOferta }) {
  const { t, lang } = useLang();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState("email"); // email | code
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const tiers = packageInfo?.tiers || [];

  async function handleRequestCode(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      await requestLoginCode(email.trim());
      setStage("code");
      setMsg({ type: "ok", text: t("account_code_sent") });
    } catch (err) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      await verifyLoginCode(email.trim(), code.trim());
      setCode("");
      setStage("email");
      setMsg(null);
      onLoggedIn();
    } catch (err) {
      setMsg({ type: "err", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    await logoutAccount();
    onLoggedIn();
  }

  if (account.loggedIn) {
    return (
      <div style={{ background: "#1c1846", border: "1px solid #332c66", borderRadius: 10, padding: 16, marginTop: 16, fontFamily: "system-ui, sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontSize: 13, color: "#c9c4e8" }}>{t("account_logged_in_as")} <b style={{ color: "#f1ede4" }}>{account.email}</b></div>
          <button onClick={handleLogout} style={{ background: "none", border: "1px solid #332c66", color: "#8b84b8", borderRadius: 14, padding: "4px 12px", fontSize: 11, cursor: "pointer" }}>{t("account_logout")}</button>
        </div>
        <div style={{ fontSize: 13, color: "#c9c4e8", marginTop: 10 }}>
          {account.hasActivePackage
            ? <>{t("account_remaining")} <b style={{ color: "#e8c46b" }}>{account.remaining}</b> {t("account_of")} {account.totalQuota}</>
            : account.totalQuota > 0
              ? t("account_exhausted")
              : t("account_none")}
        </div>
        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {tiers.map((tier) => (
            <button key={tier.id} onClick={() => onBuyPackage(tier.id)} disabled={buying} style={{
              background: "#e8c46b", color: "#151233", border: "none", borderRadius: 20,
              padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: buying ? "default" : "pointer", opacity: buying ? 0.7 : 1,
            }}>
              {tier.quota} {t("account_requests_word")} — {formatTierPrice(tier, lang)}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12.5, color: "#6f6798", marginTop: 6 }}>{t("account_restock_hint")}</div>
        {msg && <div style={{ fontSize: 12, color: msg.type === "err" ? "#e08b8b" : "#8fd19e", marginTop: 8 }}>{msg.text}</div>}
        <button onClick={onShowOferta} style={{
              background: "none", border: "none", color: "#8b84b8", fontSize: 11.5,
              textDecoration: "underline", cursor: "pointer", padding: 0,
            }}>
          {lang === "en" ? "Public offer" : "Публичная оферта"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: "#1c1846", border: "1px solid #332c66", borderRadius: 10, padding: 16, marginTop: 16, fontFamily: "system-ui, sans-serif" }}>
      <div style={{ fontSize: 13, color: "#e8c46b", fontWeight: 600, marginBottom: 8 }}>{t("account_login_title")}</div>
      {stage === "email" ? (
        <form onSubmit={handleRequestCode} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder={t("account_email_placeholder")} style={{ ...inputStyle, flex: 1, minWidth: 180 }} />
          <button type="submit" disabled={busy} style={{
            background: "#e8c46b", color: "#151233", border: "none", borderRadius: 16, padding: "8px 16px",
            fontSize: 12, fontWeight: 700, cursor: busy ? "default" : "pointer",
          }}>{busy ? "…" : t("account_get_code")}</button>
        </form>
      ) : (
        <form onSubmit={handleVerify} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input required value={code} onChange={(e) => setCode(e.target.value)} placeholder={t("account_code_placeholder")}
            style={{ ...inputStyle, flex: 1, minWidth: 140 }} />
          <button type="submit" disabled={busy} style={{
            background: "#e8c46b", color: "#151233", border: "none", borderRadius: 16, padding: "8px 16px",
            fontSize: 12, fontWeight: 700, cursor: busy ? "default" : "pointer",
          }}>{busy ? "…" : t("account_verify")}</button>
          <button type="button" onClick={() => { setStage("email"); setMsg(null); }} style={{
            background: "none", border: "none", color: "#8b84b8", fontSize: 12, cursor: "pointer",
          }}>{t("account_other_email")}</button>
        </form>
      )}
      {msg && <div style={{ fontSize: 12, color: msg.type === "err" ? "#e08b8b" : "#8fd19e", marginTop: 8 }}>{msg.text}</div>}
      <button onClick={onShowOferta} style={{
              background: "none", border: "none", color: "#8b84b8", fontSize: 11.5,
              textDecoration: "underline", cursor: "pointer", padding: 0,
            }}>
        {lang === "en" ? "Public offer" : "Публичная оферта"}
      </button>
    </div>
  );
}

function useBirthChart(person, goalName, lang) {
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
        setState({ loading: false, error: e.message || (lang === "en" ? "Couldn't fetch the data" : "Не удалось получить данные"), details: null });
      }
    }, 500);
    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
}

function useMajorDasha(person, lang) {
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
        setState({ loading: false, error: e.message || (lang === "en" ? "Couldn't fetch the dasha" : "Не удалось получить дашу"), periods: null });
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
  const { lang } = useLang();
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
              <div style={{ fontSize: 10, color: "#9089c9", letterSpacing: 0.4 }}>{signName(sign, lang)}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                {(cells[sign] || []).map((p) => {
                  if (p === "As") {
                    return (
                      <span key={p} title={lang === "en" ? "Ascendant" : "Асцендент"} style={{
                        fontSize: 12, fontWeight: 700, color: "#151233", background: "#e8c46b",
                        padding: "1px 6px", borderRadius: 10,
                      }}>As</span>
                    );
                  }
                  const color = PLANET_COLOR[p] || "#f1ede4";
                  return (
                    <span key={p} title={planetName(p, lang)} style={{
                      fontSize: 12, fontWeight: 700, color, background: `${color}26`,
                      border: `1px solid ${color}66`, padding: "1px 6px 1px 5px", borderRadius: 10,
                      display: "inline-flex", alignItems: "center", gap: 3,
                    }}>
                      <span style={{ fontSize: 13, lineHeight: 1 }}>{PLANET_ICON[p]}</span>
                      {p}{details[p]?.retro ? "℞" : ""}
                    </span>
                  );
                })}
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
  const { t } = useLang();
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
          <span style={labelStyle}>{t("geo_city_label")}</span>
          <input style={inputStyle} value={place} onChange={(e) => setPlace(e.target.value)} placeholder={t("geo_placeholder")} />
        </div>
        <button onClick={search} style={{
          alignSelf: "flex-end", background: "#e8c46b", color: "#151233", border: "none",
          borderRadius: 6, padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", height: 34,
        }}>{t("geo_find_button")}</button>
      </div>
      {status === "loading" && <div style={{ fontSize: 11, color: "#8b84b8", marginBottom: 8 }}>{t("geo_searching")}</div>}
      {status === "error" && <div style={{ fontSize: 11, color: "#e08b8b", marginBottom: 8 }}>{t("geo_not_found")}</div>}
      {status === "ok" && <div style={{ fontSize: 11, color: "#8fd19e", marginBottom: 8 }}>{t("geo_ready")}</div>}
      {status === "picking" && candidates.length > 0 && (
        <div style={{ marginBottom: 10, background: "#151233", borderRadius: 6, padding: 8 }}>
          <div style={{ fontSize: 11, color: "#9089c9", marginBottom: 6 }}>{t("geo_multiple_found")}</div>
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
  const { t } = useLang();
  const upd = (k) => (e) => setPerson({ ...person, [k]: e.target.value });

  const handlePick = useCallback(async (cand) => {
    setPerson({ ...person, lat: Number(cand.latitude), lon: Number(cand.longitude), tz: cand.tz });
  }, [person, setPerson]);

  return (
    <div style={{ background: "#1c1846", borderRadius: 10, padding: 16, marginBottom: 16 }}>
      <div style={{ fontSize: 13, color: "#e8c46b", marginBottom: 10, fontWeight: 600 }}>{label}</div>

      <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div><span style={labelStyle}>{t("form_name")}</span><input style={inputStyle} value={person.name} onChange={upd("name")} placeholder={t("form_name")} /></div>
        <div>
          <span style={labelStyle}>{t("form_gender")}</span>
          <select style={inputStyle} value={person.gender} onChange={upd("gender")}>
            <option value="male">{t("form_gender_male")}</option>
            <option value="female">{t("form_gender_female")}</option>
          </select>
        </div>
        <div><span style={labelStyle}>{t("form_birth_date")}</span><input style={inputStyle} type="date" value={person.date} onChange={upd("date")} /></div>
        <div><span style={labelStyle}>{t("form_birth_time")}</span><input style={inputStyle} type="time" value={person.time} onChange={upd("time")} /></div>
      </div>

      <GeoSearch onPick={handlePick} dateForTz={birthDateForApi(person.date)} />

      <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <div><span style={labelStyle}>{t("form_lat")}</span><input style={inputStyle} type="number" step="0.01" value={person.lat} onChange={upd("lat")} /></div>
        <div><span style={labelStyle}>{t("form_lon")}</span><input style={inputStyle} type="number" step="0.01" value={person.lon} onChange={upd("lon")} /></div>
        <div><span style={labelStyle}>{t("form_tz")}</span><input style={inputStyle} type="number" step="0.5" value={person.tz} onChange={upd("tz")} /></div>
      </div>
    </div>
  );
}

function PlanetTable({ details }) {
  const { lang } = useLang();
  if (!details) return null;
  // Отношение к Асценденту (панчадха-майтри упрощённо, как в дашa-баре/домах) — по аналогии
  // с колонкой "Relation"/"Friendship" в Shri Jyoti Star и похожих программах.
  const lagnaLord = details?.As?.sign != null ? signLordOf(details.As.sign) : null;
  return (
    <div style={{ overflowX: "auto", marginTop: 16 }}>
    <table style={{ width: "100%", minWidth: 480, borderCollapse: "collapse", fontSize: 12 }}>
      <thead><tr style={{ color: "#9089c9", textAlign: "left" }}>
        <th style={{ padding: 6 }}>{lang === "en" ? "Planet" : "Планета"}</th><th>{lang === "en" ? "Sign" : "Знак"}</th><th>{lang === "en" ? "Nakshatra" : "Накшатра"}</th><th>{lang === "en" ? "Pada" : "Пада"}</th><th>{lang === "en" ? "House" : "Дом"}</th><th>{lang === "en" ? "Relation" : "Отношение"}</th>
      </tr></thead>
      <tbody>
        {[...PLANET_ORDER, "As"].map((k) => {
          const v = details[k];
          if (!v) return null;
          const rel = k !== "As" && lagnaLord ? relation(lagnaLord, k) : null;
          return (
            <tr key={k} style={{ borderTop: "1px solid #2e2a5c" }}>
              <td style={{ padding: 6, color: PLANET_COLOR[k] || "#f1ede4", fontWeight: 600 }}>{PLANET_ICON[k] ? PLANET_ICON[k] + " " : ""}{planetName(k, lang)}{v.retro ? " ℞" : ""}</td>
              <td style={{ color: "#c9c4e8" }}>{signName(v.sign, lang)}</td>
              <td style={{ color: "#c9c4e8" }}>{nakshatraName(v.nak, lang)}</td>
              <td style={{ color: "#c9c4e8" }}>{v.pada}</td>
              <td style={{ color: "#c9c4e8" }}>{v.house ?? "—"}</td>
              <td>{rel ? <RelationBadge rel={rel} /> : (k === "As" ? null : <span style={{ color: "#6b6591" }}>—</span>)}</td>
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

function PratyantarList({ birth, mdEn, adEn, open, details, locked, account, onGoToPricing, packageInfo, buying }) {
  const { lang } = useLang();
  const [state, setState] = useState({ loading: false, error: null, subs: null });
  const [unlockedByPackage, setUnlockedByPackage] = useState(false);
  const requestKey = `${mdEn}|${adEn}`;

  // Период не активен сейчас (locked=true от родителя) — если у пользователя есть пакет,
  // пробуем списать из него 1 "новый" запрос вместо жёсткого тизера.
  useEffect(() => {
    if (!open || !locked || unlockedByPackage || !account?.loggedIn) return;
    let cancelled = false;
    (async () => {
      const res = await checkUsage("pratyantar", requestKey);
      if (cancelled) return;
      if (res?.allowed) setUnlockedByPackage(true);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, locked, account?.loggedIn, requestKey]);

  const effectivelyLocked = locked && !unlockedByPackage;

  useEffect(() => {
    if (!open || effectivelyLocked || state.subs || state.loading) return;
    let cancelled = false;
    (async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const data = await fetchSubSubDasha(splitBirthForApi(birth), mdEn, adEn);
        if (cancelled) return;
        setState({ loading: false, error: null, subs: data });
      } catch (e) {
        if (cancelled) return;
        setState({ loading: false, error: e.message || (lang === "en" ? "Failed to fetch pratyantardashas" : "Не удалось получить пратьянтардаши"), subs: null });
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, effectivelyLocked]);

  if (!open) return null;
  if (effectivelyLocked) {
    return (
      <PaywallTeaser
        title={lang === "en" ? "Pratyantardasha — sub-periods" : "Пратьянтардаша — под-периоды"}
        text={lang === "en"
          ? "A detailed breakdown of sub-periods is free for the currently active period. The rest — from a package (1 request per period, re-viewing is free)."
          : "Детальный разбор под-периодов доступен бесплатно для текущего активного периода. Остальные — из пакета (1 запрос за период, повторный просмотр бесплатен)."}
        goalName="paywall_pratyantar_hit"
        account={account}
        onGoToPricing={onGoToPricing}
        packageInfo={packageInfo}
        buying={buying}
      />
    );
  }
  if (state.loading) return <div style={{ fontSize: 11, color: "#8b84b8" }}>{lang === "en" ? "Loading pratyantardashas…" : "Загрузка пратьянтардаш…"}</div>;
  if (state.error) return <div style={{ fontSize: 11, color: "#e08b8b" }}>{lang === "en" ? "Error" : "Ошибка"}: {state.error}</div>;
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
        const parts = pratyantarComboParts(adCode, code, details, lang);
        return (
          <div key={si} style={{
            fontSize: 11, padding: "5px 8px", marginBottom: 1, borderRadius: 5,
            background: active ? "#211c47" : "transparent",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: active ? "#e8c46b" : "#c9c4e8", fontWeight: 600 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>{active ? "⋯ " : ""}{planetName(code, lang) || s.planet}<RelationBadge rel={rel} /></span>
              <span style={{ fontWeight: 400, color: "#766fa0" }}>{start?.toISOString().slice(0, 10)}—{end?.toISOString().slice(0, 10)}</span>
            </div>
            {parts && (
              <div style={{ fontSize: 10.5, lineHeight: 1.5, marginTop: 3 }}>
                <div style={{ color: "#7fd99a" }}>+ {parts.plus}</div>
                <div style={{ color: "#e0a8a8" }}>− {parts.minus}</div>
                {parts.aspectText && <div style={{ color: "#766fa0", marginTop: 1 }}>{lang === "en" ? "Area" : "Сфера"}: {parts.aspectText}</div>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AntardashaList({ birth, mahaCode, majorPlanetEn, open, details, account, onGoToPricing, packageInfo, buying }) {
  const { lang } = useLang();
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
        setState({ loading: false, error: e.message || (lang === "en" ? "Failed to fetch antardashas" : "Не удалось получить антардаши"), subs: null });
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;
  if (state.loading) return <div style={{ fontSize: 12, color: "#8b84b8" }}>{lang === "en" ? "Loading antardashas…" : "Загрузка антардаш…"}</div>;
  if (state.error) return <div style={{ fontSize: 12, color: "#e08b8b" }}>{lang === "en" ? "Error" : "Ошибка"}: {state.error}</div>;
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
        const parts = dashaComboParts(mahaCode, code, details, lang);
        const rel = parts?.rel || relation(mahaCode, code);
        return (
          <div key={si}>
            <div onClick={() => setSubOpen(isOpen ? null : si)} style={{
              display: "flex", justifyContent: "space-between", fontSize: 12, cursor: "pointer",
              color: subActive ? "#e8c46b" : "#8b84b8", padding: "2px 0",
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>{subActive ? "→ " : ""}{planetName(code, lang) || s.planet}<RelationBadge rel={rel} /></span>
              <span>{start?.toISOString().slice(0, 10)} — {end?.toISOString().slice(0, 10)}</span>
            </div>
            {parts && (
              <div style={{ fontSize: 12, color: "#c9c4e8", lineHeight: 1.5, marginBottom: 3 }}>
                <p style={{ marginBottom: 2 }}>{parts.relationText}</p>
                <p style={{ marginBottom: 2 }}><b style={{ color: "#9089c9" }}>{lang === "en" ? "Strengths:" : "Сильные стороны:"}</b> {parts.strengths}</p>
                <p style={{ marginBottom: 2 }}><b style={{ color: "#9089c9" }}>{lang === "en" ? "Caution:" : "Осторожно:"}</b> {parts.caution}</p>
                {parts.aspectText && <p style={{ marginBottom: 2 }}><b style={{ color: "#9089c9" }}>{lang === "en" ? "Life area:" : "Сфера жизни:"}</b> {parts.aspectText}</p>}
              </div>
            )}
            <div onClick={() => setSubOpen(isOpen ? null : si)} style={{
              fontSize: 11, color: "#e8c46b", cursor: "pointer", marginBottom: 3, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 4,
            }}>
              {isOpen ? "▾" : "▸"} {lang === "en"
                ? `sub-periods of ${planetName(code, lang)} (pratyantardasha, its own dates within this antardasha)`
                : `под-периоды ${planetName(code, lang)} (пратьянтардаша, свои даты внутри этой антардаши)`}
            </div>
            <PratyantarList birth={birth} mdEn={majorPlanetEn} adEn={s.planet} open={isOpen} details={details} locked={!subActive} account={account} onGoToPricing={onGoToPricing} packageInfo={packageInfo} buying={buying} />
          </div>
        );
      })}
    </div>
  );
}

function DashaTimeline({ birth, periods, details, account, onGoToPricing, packageInfo, buying }) {
  const { lang } = useLang();
  const now = new Date();
  const [openIdx, setOpenIdx] = useState(null);
  const lagnaLord = details?.As?.sign != null ? signLordOf(details.As.sign) : null;

  return (
    <div>
      <div style={{ display: "flex", height: 30, borderRadius: 4, overflow: "hidden", marginBottom: 14 }}>
        {periods.map((p, i) => {
          const active = p.start && p.end && now >= p.start && now < p.end;
          const rel = lagnaLord ? relation(lagnaLord, p.lord) : null;
          const relColor = rel ? (RELATION_COLOR[rel] || RELATION_COLOR.neutral) : "#151233";
          const relLabel = rel ? ((lang === "en" ? RELATION_BADGE_SHORT_EN : RELATION_BADGE_SHORT)[rel] || "") : "";
          const planetColor = PLANET_COLOR[p.lord] || "#9089c9";
          return (
            <div key={i} title={`${planetName(p.lord, lang)}${relLabel ? " — " + relLabel : ""}`} onClick={() => setOpenIdx(openIdx === i ? null : i)}
              style={{
                flex: Math.max(p.fullYears, 0.2), display: "flex", flexDirection: "column",
                borderRight: "1px solid #151233", cursor: "pointer", boxSizing: "border-box",
                outline: active ? "2px solid #e8c46b" : "none", outlineOffset: -2,
              }}>
              <div style={{ flex: 1, background: active ? planetColor : `${planetColor}b3`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 13, color: "#151233", opacity: 0.85 }}>{PLANET_ICON[p.lord] || ""}</span>
              </div>
              <div style={{ height: 4, background: relColor }} />
            </div>
          );
        })}
      </div>
      {periods.map((p, i) => {
        const active = p.start && p.end && now >= p.start && now < p.end;
        const text = dashaText(p.lord, lang);
        return (
          <div key={i} style={{
            marginBottom: 8, borderRadius: 8, overflow: "hidden",
            border: active ? "1px solid #e8c46b" : "1px solid #2e2a5c",
            background: active ? "#211c47" : "#17143a",
          }}>
            <div onClick={() => setOpenIdx(openIdx === i ? null : i)} style={{
              padding: "10px 14px", display: "flex", justifyContent: "space-between", cursor: "pointer",
            }}>
              <span style={{ color: active ? "#e8c46b" : "#f1ede4", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                {active ? "● " : ""}{lang === "en" ? "Mahadasha" : "Махадаша"} {planetName(p.lord, lang) || p.planetEn}
                <RelationBadge rel={lagnaLord ? relation(lagnaLord, p.lord) : null} />
              </span>
              <span style={{ color: "#9089c9", fontSize: 13 }}>
                {p.start?.toISOString().slice(0, 10)} — {p.end?.toISOString().slice(0, 10)}
              </span>
            </div>
            {openIdx === i && (
              <div style={{ padding: "0 14px 14px", color: "#c9c4e8", fontSize: 13, lineHeight: 1.55 }}>
                {text && (
                  <>
                    <p><b style={{ color: "#e8c46b" }}>{lang === "en" ? "Strengths of the period:" : "Сильные стороны периода:"}</b> {text.strengths}</p>
                    <p><b style={{ color: "#e8c46b" }}>{lang === "en" ? "Caution:" : "Осторожно:"}</b> {text.caution}</p>
                    <p><b style={{ color: "#e8c46b" }}>{lang === "en" ? "Communication style:" : "Стиль коммуникации:"}</b> {text.comm}</p>
                  </>
                )}
                {(() => {
                  const aspect = lifeAspectHouseDomain(p.lord, details, lang);
                  if (!aspect) return null;
                  return (
                    <p>
                      <b style={{ color: "#e8c46b" }}>{lang === "en" ? "Life area:" : "Сфера жизни:"}</b> {lang === "en"
                        ? `the period's ruler natally sits in house ${aspect.house} (${houseMeaning(aspect.house, lang)})${aspect.domains.length ? ` — this shows up most in: ${aspect.domains.join(", ")}` : ""}.`
                        : `управитель периода натально стоит в ${aspect.house} доме (${houseMeaning(aspect.house, lang)})${aspect.domains.length ? ` — сильнее всего это звучит в: ${aspect.domains.join(", ")}` : ""}.`}
                    </p>
                  );
                })()}
                <div style={{ marginTop: 10 }}>
                  <b style={{ color: "#9089c9", fontSize: 12 }}>{lang === "en" ? "Antardashas (click — the pratyantardasha will also open):" : "Антардаши (кликните — раскроется ещё и пратьянтардаша):"}</b>
                  <AntardashaList birth={birth} mahaCode={p.lord} majorPlanetEn={p.planetEn} open={openIdx === i} details={details} account={account} onGoToPricing={onGoToPricing} packageInfo={packageInfo} buying={buying} />
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
const PLANET_PLUS_USE_EN = {
  Su: "it's easier to get recognition and to lead — take the initiative boldly",
  Mo: "it's easier to rely on intuition and mood — trust your first impression",
  Ma: "it's easier to act quickly and decisively — don't be afraid to go first",
  Me: "it's easier to negotiate, explain, and formalize things — make use of talks and paperwork",
  Ju: "it's easier to grow and get support from others — don't be shy about asking and offering",
  Ve: "it's easier to find compromise and negotiate amicably — take the gentle approach",
  Sa: "what you build now will hold for a long time — invest in structure",
  Ra: "unconventional opportunities are opening up — it's worth looking closely at unusual options",
  Ke: "it's easier to let go of the excess and focus on what matters — don't scatter your attention on trifles",
};
function planetPlusUse(code, lang) { return (lang === "en" ? PLANET_PLUS_USE_EN : PLANET_PLUS_USE)[code]; }

// Плюсы/минусы по сфере: благотворные планеты и хорошо расположенная «планета-хозяйка
// дома» — плюс; трудные планеты в доме и хозяйка в слабой позиции (6/8/12 дом) — минус.
// Каждая строка написана так, чтобы обычному человеку было понятно: что происходит, что
// это значит на практике и что с этим делать. Эвристика поверх уже посчитанных домов,
// не замена консультации.
function assessDomain(dmKey, rows, lang) {
  const dm = DOMAIN_META[dmKey];
  const title = domainTitle(dmKey, lang);
  const isEn = lang === "en";
  const pluses = [];
  const minuses = [];
  const watch = [];
  const adviceCodes = [];

  dm.houses.forEach((h) => {
    const row = rows[h - 1];
    if (!row.occupants.length) {
      watch.push(isEn
        ? `House ${h} (${houseMeaning(h, lang)}) — no planet lands directly here. That's neither good nor bad by itself: everything in this part of the theme depends on how the house's ruling planet is doing — see below.`
        : `${h} дом (${houseMeaning(h, lang)}) — сюда напрямую не попала ни одна планета. Это не плохо и не хорошо само по себе: всё в этой части темы зависит от того, как чувствует себя планета-хозяйка дома — смотрите про неё ниже.`);
    }

    row.occupants.forEach((c) => {
      if (NATURAL_BENEFICS.includes(c) || NATURAL_MILD_BENEFICS.includes(c)) {
        pluses.push(isEn
          ? `${planetName(c, lang)} sits in house ${h} — its qualities (${planetCore(c, lang)}) support this area. In practice: ${planetPlusUse(c, lang)}.`
          : `${planetName(c, lang)} находится в ${h} доме — своими качествами (${planetCore(c, lang)}) она поддерживает эту сферу. На практике: ${planetPlusUse(c, lang)}.`);
      } else {
        minuses.push(isEn
          ? `${planetName(c, lang)} sits in house ${h} — this is a planet of a challenging nature (${planetCore(c, lang)}), and here it demands more conscious effort than luck alone. What to do: ${planetFocusAdvice(c, lang)}.`
          : `${planetName(c, lang)} находится в ${h} доме — это планета непростого характера (${planetCore(c, lang)}), и здесь она требует больше сознательных усилий, чем везение само по себе. Что делать: ${planetFocusAdvice(c, lang)}.`);
        adviceCodes.push(c);
      }
    });

    if (row.lordHouse) {
      if (STRONG_HOUSES.has(row.lordHouse)) {
        pluses.push(isEn
          ? `"${title}" is largely governed by ${planetName(row.lord, lang)} — and it currently sits in a strong part of the chart (house ${row.lordHouse}, ${houseMeaning(row.lordHouse, lang)}). In plain terms: this area has a reliable footing, much will come without excessive struggle. In practice: ${planetPlusUse(row.lord, lang)}.`
          : `За «${title.toLowerCase()}» во многом отвечает ${planetName(row.lord, lang)} — и сейчас она сама стоит в сильной части карты (${row.lordHouse} дом, ${houseMeaning(row.lordHouse, lang)}). Проще говоря: у этой сферы есть надёжная опора, многое будет получаться без лишней борьбы. На практике: ${planetPlusUse(row.lord, lang)}.`);
      } else if (DIFFICULT_HOUSES.has(row.lordHouse)) {
        minuses.push(isEn
          ? `The planet responsible for "${title}" — ${planetName(row.lord, lang)} — currently sits in a difficult part of the chart (house ${row.lordHouse}, ${houseMeaning(row.lordHouse, lang)}). In plain terms: this area lacks "fuel" on its own — it won't come easily, the result will have to be built by hand. What to do: ${planetFocusAdvice(row.lord, lang)}.`
          : `Планета, отвечающая за «${title.toLowerCase()}», — ${planetName(row.lord, lang)} — сейчас стоит в непростой части карты (${row.lordHouse} дом, ${houseMeaning(row.lordHouse, lang)}). Проще говоря: этой сфере не хватает «топлива» само по себе — легко не будет, результат придётся создавать своими руками. Что делать: ${planetFocusAdvice(row.lord, lang)}.`);
        adviceCodes.push(row.lord);
      }
    }
  });

  const score = pluses.length - minuses.length;
  const verdict = score > 0 ? "good" : score < 0 ? "watch" : "mixed";
  const advice = [...new Set(adviceCodes)].slice(0, 3).map((c) => `${planetName(c, lang)}: ${planetFocusAdvice(c, lang)}.`);

  const context = dm.houses.map((h) => {
    const row = rows[h - 1];
    return isEn
      ? `House ${h} (${houseMeaning(h, lang)}) — sign ${signName(row.signIdx, lang)}, element ${elementOf(row.signIdx).charAt(0).toUpperCase()}${elementOf(row.signIdx).slice(1)}: in behavior this reads as ${signTraits(row.signIdx, lang)}.`
      : `${h} дом (${houseMeaning(h, lang)}) — знак ${signName(row.signIdx, lang)}, стихия ${elementRu(elementOf(row.signIdx))}: в поведении это ${signTraits(row.signIdx, lang)}.`;
  });

  const summary = houseVerdictSummary(verdict, lang);

  return { pluses, minuses, watch, advice, verdict, context, summary, title };
}

const HOUSE_VERDICT_SUMMARY = {
  good: "В целом сфера хорошо опирается на карту — серьёзных рисков немного, достаточно следить за отмеченными нюансами.",
  mixed: "Сильные и слабые стороны примерно уравновешивают друг друга — результат заметно зависит от текущих даш и ваших сознательных усилий.",
  watch: "Эта сфера — зона роста: без сознательной работы над отмеченными точками возможны трудности, но управлять ситуацией вполне реально.",
};
const HOUSE_VERDICT_SUMMARY_EN = {
  good: "Overall this area rests well on the chart — there aren't many serious risks, it's enough to keep an eye on the nuances noted above.",
  mixed: "Strengths and weaknesses roughly balance out — the outcome depends noticeably on the current dashas and your own conscious effort.",
  watch: "This area is a growth zone: without conscious work on the points noted above, difficulties are possible, but the situation is quite manageable.",
};
function houseVerdictSummary(v, lang) { return (lang === "en" ? HOUSE_VERDICT_SUMMARY_EN : HOUSE_VERDICT_SUMMARY)[v]; }

const HOUSE_VERDICT_META = {
  good: { label: "Сильная сфера", bg: "#1c3a2e", color: "#7fd99a" },
  mixed: { label: "Смешанная картина", bg: "#3a3320", color: "#e8c46b" },
  watch: { label: "Требует внимания", bg: "#3a2020", color: "#e88b8b" },
};
const HOUSE_VERDICT_META_LABEL_EN = { good: "Strong area", mixed: "Mixed picture", watch: "Needs attention" };
function houseVerdictLabel(v, lang) { return lang === "en" ? HOUSE_VERDICT_META_LABEL_EN[v] : HOUSE_VERDICT_META[v]?.label; }

function HousesPanel({ details, account, onGoToPricing, packageInfo, buying }) {
  const { lang } = useLang();
  if (!details?.As) return <div style={{ textAlign: "center", color: "#8b84b8", fontSize: 13 }}>{lang === "en" ? "Please wait for the chart to load on the \"Chart\" tab first." : "Сначала дождитесь загрузки карты на вкладке «Карта»."}</div>;
  const ascSignIdx = details.As.sign ?? 0;
  const rows = buildHouseRows(details);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      <div style={{ fontSize: 14, color: "#a8a1dd", marginBottom: 14, lineHeight: 1.65 }}>
        {lang === "en"
          ? `Houses are counted from the Ascendant (${signName(ascSignIdx, lang)}). For each area: pluses, points to watch, and what can practically be improved.`
          : `Дома считаются от Асцендента (${signName(ascSignIdx, lang)}). По каждой сфере — плюсы, на что обратить внимание и что практически можно поправить.`}
      </div>

      {(() => {
        const domainEntries = Object.entries(DOMAIN_META);
        const unlocked = !!account?.hasActivePackage;
        return domainEntries.map(([key], idx) => {
        if (idx > 0 && !unlocked) return null;
        const a = assessDomain(key, rows, lang);
        const vm = HOUSE_VERDICT_META[a.verdict];
        return (
          <div key={key} style={{ background: "#1c1846", borderRadius: 10, padding: 16, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
              <div style={{ fontSize: 13, color: "#e8c46b", fontWeight: 600 }}>{a.title}</div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: vm.bg, color: vm.color }}>{houseVerdictLabel(a.verdict, lang)}</span>
            </div>
            <div style={{ marginBottom: 10 }}>
              {a.context.map((t, i) => (
                <p key={i} style={{ fontSize: 12, color: "#8b84b8", lineHeight: 1.55, marginBottom: 2 }}>{t}</p>
              ))}
            </div>

            {a.pluses.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: "#7fd99a", fontWeight: 600, marginBottom: 4 }}>{lang === "en" ? "Pluses" : "Плюсы"}</div>
                {a.pluses.map((t, i) => (
                  <p key={i} style={{ fontSize: 13, color: "#c9c4e8", lineHeight: 1.6, marginBottom: 4, paddingLeft: 10, borderLeft: "2px solid #2f5c44" }}>{t}</p>
                ))}
              </div>
            )}

            {(a.minuses.length > 0 || a.watch.length > 0) && (
              <div style={{ marginBottom: a.advice.length ? 10 : 0 }}>
                <div style={{ fontSize: 12, color: "#e88b8b", fontWeight: 600, marginBottom: 4 }}>{lang === "en" ? "Points to watch" : "На что обратить внимание"}</div>
                {[...a.minuses, ...a.watch].map((t, i) => (
                  <p key={i} style={{ fontSize: 13, color: "#c9c4e8", lineHeight: 1.6, marginBottom: 4, paddingLeft: 10, borderLeft: "2px solid #5c2f2f" }}>{t}</p>
                ))}
              </div>
            )}

            {a.advice.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: "#9db8e8", fontWeight: 600, marginBottom: 4 }}>{lang === "en" ? "What can be improved and how" : "Что можно поправить и как"}</div>
                {a.advice.map((t, i) => (
                  <p key={i} style={{ fontSize: 13, color: "#c9c4e8", lineHeight: 1.6, marginBottom: 4, paddingLeft: 10, borderLeft: "2px solid #2f3f5c" }}>{t}</p>
                ))}
              </div>
            )}

            <div style={{ fontSize: 12, color: "#766fa0", lineHeight: 1.55, paddingTop: 8, borderTop: "1px solid #2e2a5c" }}>
              <b style={{ color: "#9089c9" }}>{lang === "en" ? "Bottom line:" : "Итог:"}</b> {a.summary}
            </div>
          </div>
        );
        });
      })()}

      {!(!!account?.hasActivePackage) && Object.keys(DOMAIN_META).length > 1 && (
        <PaywallTeaser
          title={lang === "en" ? `${Object.keys(DOMAIN_META).length - 1} more spheres` : `Ещё ${Object.keys(DOMAIN_META).length - 1} сферы`}
          text={lang === "en"
            ? "The full breakdown (pluses, points to watch, what can be improved) for family, children, destiny and social circle — available with an active request package."
            : "Полный разбор (плюсы, на что обратить внимание, что можно поправить) для семьи, детей, судьбы и окружения — доступен с активным пакетом запросов."}
          goalName="paywall_houses_hit"
          account={account}
          onGoToPricing={onGoToPricing}
          packageInfo={packageInfo}
          buying={buying}
        />
      )}

      <div style={{ background: "#1c1846", borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 13, color: "#e8c46b", marginBottom: 8, fontWeight: 600 }}>{lang === "en" ? "All 12 houses" : "Все 12 домов"}</div>
        <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 380, borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr style={{ color: "#9089c9", textAlign: "left" }}>
            <th style={{ padding: 6 }}>{lang === "en" ? "House" : "Дом"}</th><th>{lang === "en" ? "Sign" : "Знак"}</th><th>{lang === "en" ? "Ruling planet" : "Планета-хозяйка"}</th><th>{lang === "en" ? "Planets inside" : "Планеты внутри"}</th>
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.houseNum} style={{ borderTop: "1px solid #2e2a5c" }}>
                <td style={{ padding: 6, color: "#f1ede4" }}>{r.houseNum}</td>
                <td style={{ color: "#c9c4e8" }}>{signName(r.signIdx, lang)}</td>
                <td style={{ padding: 6, color: PLANET_COLOR[r.lord] || "#c9c4e8", fontWeight: 600 }}>
                  {PLANET_ICON[r.lord] ? <span style={{ fontSize: 12, marginRight: 3 }}>{PLANET_ICON[r.lord]}</span> : null}{planetName(r.lord, lang)}
                </td>
                <td style={{ color: "#c9c4e8", padding: 6 }}>
                  {r.occupants.length ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {r.occupants.map((c) => {
                        const color = PLANET_COLOR[c] || "#f1ede4";
                        return (
                          <span key={c} style={{
                            fontSize: 11, fontWeight: 600, color, background: `${color}26`,
                            border: `1px solid ${color}66`, padding: "1px 6px 1px 5px", borderRadius: 8,
                            display: "inline-flex", alignItems: "center", gap: 3, whiteSpace: "nowrap",
                          }}>
                            <span style={{ fontSize: 12, lineHeight: 1 }}>{PLANET_ICON[c] || ""}</span>{planetName(c, lang)}
                          </span>
                        );
                      })}
                    </div>
                  ) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

// =========================================================
// UI: карьера и бизнес + предрасположенность (достоинство планет)
// =========================================================

// Классические таблицы достоинства планет (уччха/свакшетра/нича — экзальтация/собственный
// знак/падение). Индексы знаков — как в SIGNS/EN_SIGNS (0 = Овен/Aries ... 11 = Рыбы/Pisces).
// Используются только для ранжирования «сильнейших» планет карты, не заменяют полноценный
// расчёт шадбалы/дигбалы.
const PLANET_EXALT_SIGN = { Su: 0, Mo: 1, Ma: 9, Me: 5, Ju: 3, Ve: 11, Sa: 6 };
const PLANET_OWN_SIGNS = { Su: [4], Mo: [3], Ma: [0, 7], Me: [2, 5], Ju: [8, 11], Ve: [1, 6], Sa: [9, 10] };
const PLANET_DEBIL_SIGN = { Su: 6, Mo: 7, Ma: 3, Me: 11, Ju: 9, Ve: 5, Sa: 0 };
const CAREER_PLANETS = ["Su", "Mo", "Ma", "Me", "Ju", "Ve", "Sa"];

function planetDignity(code, signIdx) {
  if (signIdx == null) return { key: "neutral", score: 0 };
  if (PLANET_EXALT_SIGN[code] === signIdx) return { key: "exalted", score: 3 };
  if (PLANET_DEBIL_SIGN[code] === signIdx) return { key: "debilitated", score: -3 };
  if (PLANET_OWN_SIGNS[code]?.includes(signIdx)) return { key: "own", score: 2 };
  return { key: "neutral", score: 0 };
}

const DIGNITY_LABEL = { exalted: "в экзальтации", own: "в своём знаке", neutral: "нейтрально", debilitated: "в падении" };
const DIGNITY_LABEL_EN = { exalted: "exalted", own: "in its own sign", neutral: "neutral", debilitated: "debilitated" };
function careerDignityLabel(key, lang) { return (lang === "en" ? DIGNITY_LABEL_EN : DIGNITY_LABEL)[key]; }

// К каким сферам деятельности предрасположена каждая планета — по её классической природе
// (карака нужных сфер деятельности), не привязано к конкретному дому.
const CAREER_THEME = {
  Su: "руководство, управление, госслужба и публичные роли — там, где нужно быть на виду и принимать решения",
  Mo: "работа с людьми: забота, психология, HR, сфера гостеприимства и питания — там, где важны эмпатия и контакт",
  Ma: "техника, спорт, армия и силовые структуры, хирургия, производство и стройка — там, где нужны решительность и физическая энергия",
  Me: "коммуникации, торговля, IT, аналитика, письмо и журналистика, бухгалтерия — там, где важны точность и обмен информацией",
  Ju: "обучение, право, финансы и консалтинг — там, где ценятся знания, широкий кругозор и умение направлять других",
  Ve: "искусство, дизайн, индустрия красоты, шоу-бизнес и предметы роскоши — там, где важны эстетика и гармония",
  Sa: "структурный, долгий труд: недвижимость, сельское хозяйство, добывающая промышленность, административная работа — там, где ценятся терпение и дисциплина",
};
const CAREER_THEME_EN = {
  Su: "leadership, management, government service, and public-facing roles — where visibility and decisiveness matter",
  Mo: "people-facing work: care, psychology, HR, hospitality and food service — where empathy and personal contact matter",
  Ma: "engineering, sports, the military and security, surgery, manufacturing and construction — where decisiveness and physical energy matter",
  Me: "communication, trade, IT, analytics, writing and journalism, accounting — where precision and the exchange of information matter",
  Ju: "teaching, law, finance, and consulting — where knowledge, a broad outlook, and guiding others are valued",
  Ve: "arts, design, the beauty industry, entertainment, and luxury goods — where aesthetics and harmony matter",
  Sa: "structured, long-haul work: real estate, agriculture, extraction industries, administrative work — where patience and discipline are valued",
};
function careerTheme(code, lang) { return (lang === "en" ? CAREER_THEME_EN : CAREER_THEME)[code]; }

// Ранжирует 7 классических граха по силе (достоинство + дом) — верхние 1-2 считаются
// «сильнейшими» и используются для подсказки предрасположенности.
function assessPredisposition(details) {
  const ranked = CAREER_PLANETS.map((code) => {
    const v = details[code];
    const signIdx = v?.sign ?? null;
    const house = v?.house ?? null;
    const dign = planetDignity(code, signIdx);
    let score = dign.score;
    if (house != null) {
      if (STRONG_HOUSES.has(house)) score += 1;
      else if (DIFFICULT_HOUSES.has(house)) score -= 1;
    }
    return { code, signIdx, house, dignKey: dign.key, score };
  }).sort((a, b) => b.score - a.score);
  return { ranked, top: ranked.slice(0, 2) };
}

function CareerPanel({ details, account, onGoToPricing, packageInfo, buying }) {
  const { lang } = useLang();
  const isEn = lang === "en";
  if (!details?.As) return <div style={{ textAlign: "center", color: "#8b84b8", fontSize: 13 }}>{isEn ? "Please wait for the chart to load on the \"Chart\" tab first." : "Сначала дождитесь загрузки карты на вкладке «Карта»."}</div>;
  const rows = buildHouseRows(details);
  const a = assessDomain("business", rows, lang);
  const vm = HOUSE_VERDICT_META[a.verdict];
  const unlocked = !!account?.hasActivePackage;
  const pred = assessPredisposition(details);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      <div style={{ fontSize: 14, color: "#a8a1dd", marginBottom: 14, lineHeight: 1.65 }}>
        {isEn
          ? "Career and business through the houses of the chart, plus which fields your strongest planets are naturally suited to."
          : "Карьера и бизнес по домам карты, а также к каким сферам деятельности предрасположены ваши сильнейшие планеты."}
      </div>

      <div style={{ background: "#1c1846", borderRadius: 10, padding: 16, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
          <div style={{ fontSize: 13, color: "#e8c46b", fontWeight: 600 }}>{a.title}</div>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: vm.bg, color: vm.color }}>{houseVerdictLabel(a.verdict, lang)}</span>
        </div>
        <div style={{ marginBottom: 10 }}>
          {a.context.map((t, i) => (
            <p key={i} style={{ fontSize: 12, color: "#8b84b8", lineHeight: 1.55, marginBottom: 2 }}>{t}</p>
          ))}
        </div>
        {a.pluses.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: "#7fd99a", fontWeight: 600, marginBottom: 4 }}>{isEn ? "Pluses" : "Плюсы"}</div>
            {a.pluses.map((t, i) => (
              <p key={i} style={{ fontSize: 13, color: "#c9c4e8", lineHeight: 1.6, marginBottom: 4, paddingLeft: 10, borderLeft: "2px solid #2f5c44" }}>{t}</p>
            ))}
          </div>
        )}
        {(a.minuses.length > 0 || a.watch.length > 0) && (
          <div style={{ marginBottom: a.advice.length ? 10 : 0 }}>
            <div style={{ fontSize: 12, color: "#e88b8b", fontWeight: 600, marginBottom: 4 }}>{isEn ? "Points to watch" : "На что обратить внимание"}</div>
            {[...a.minuses, ...a.watch].map((t, i) => (
              <p key={i} style={{ fontSize: 13, color: "#c9c4e8", lineHeight: 1.6, marginBottom: 4, paddingLeft: 10, borderLeft: "2px solid #5c2f2f" }}>{t}</p>
            ))}
          </div>
        )}
        {a.advice.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: "#9db8e8", fontWeight: 600, marginBottom: 4 }}>{isEn ? "What can be improved and how" : "Что можно поправить и как"}</div>
            {a.advice.map((t, i) => (
              <p key={i} style={{ fontSize: 13, color: "#c9c4e8", lineHeight: 1.6, marginBottom: 4, paddingLeft: 10, borderLeft: "2px solid #2f3f5c" }}>{t}</p>
            ))}
          </div>
        )}
        <div style={{ fontSize: 12, color: "#766fa0", lineHeight: 1.55, paddingTop: 8, borderTop: "1px solid #2e2a5c" }}>
          <b style={{ color: "#9089c9" }}>{isEn ? "Bottom line:" : "Итог:"}</b> {a.summary}
        </div>
      </div>

      <div style={{ background: "#1c1846", borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 13, color: "#e8c46b", marginBottom: 8, fontWeight: 600 }}>{isEn ? "Predisposition" : "Предрасположенность"}</div>
        <p style={{ fontSize: 12.5, color: "#a8a1dd", lineHeight: 1.6, marginBottom: unlocked ? 12 : 0 }}>
          {isEn
            ? "Which of the classical planets is placed strongest in your chart (by dignity — exalted / own sign / debilitated — and by house), and which fields of work that planet's nature is drawn to."
            : "Какая из классических планет расположена в вашей карте сильнее всего (по достоинству — экзальтация / свой знак / падение — и по дому), и к каким сферам деятельности тянет её природа."}
        </p>
        {unlocked ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pred.top.map(({ code, dignKey, house, signIdx }) => (
              <div key={code} style={{ paddingLeft: 10, borderLeft: "2px solid #3a3320" }}>
                <div style={{ fontSize: 12, color: "#e8c46b", fontWeight: 600, marginBottom: 2 }}>
                  {planetName(code, lang)} — {careerDignityLabel(dignKey, lang)}{signIdx != null ? ` (${signName(signIdx, lang)}${house != null ? `, ${isEn ? "house" : "дом"} ${house}` : ""})` : ""}
                </div>
                <p style={{ fontSize: 12.5, color: "#c9c4e8", lineHeight: 1.55 }}>{careerTheme(code, lang)}</p>
              </div>
            ))}
          </div>
        ) : (
          <PaywallTeaser
            title={isEn ? "Which fields suit you best" : "К каким сферам вы предрасположены"}
            text={isEn
              ? "A ranking of your strongest planets by classical dignity, and the fields of work each one is naturally drawn to — available with an active request package."
              : "Рейтинг сильнейших планет вашей карты по классическому достоинству и сферы деятельности, к которым каждая из них тяготеет — доступно с активным пакетом запросов."}
            goalName="paywall_career_hit"
            account={account}
            onGoToPricing={onGoToPricing}
            packageInfo={packageInfo}
            buying={buying}
          />
        )}
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
function assessPartner(rows, details, lang) {
  const row7 = rows[6];
  const juHouse = details?.Ju?.house;
  const juSign = details?.Ju?.sign;
  const pluses = [];
  const minuses = [];
  const isEn = lang === "en";

  row7.occupants.forEach((c) => {
    if (NATURAL_BENEFICS.includes(c) || NATURAL_MILD_BENEFICS.includes(c)) {
      pluses.push(isEn
        ? `${planetName(c, lang)} sits right in house 7 (partnership, marriage) — its qualities (${planetCore(c, lang)}) support the theme of relationships.`
        : `${planetName(c, lang)} стоит прямо в 7 доме (партнёрство, брак) — её качества (${planetCore(c, lang)}) поддерживают тему отношений.`);
    } else {
      minuses.push(isEn
        ? `${planetName(c, lang)} sits in house 7 — a challenging planet here means the theme of relationships needs more conscious effort than luck alone. What to do: ${planetFocusAdvice(c, lang)}.`
        : `${planetName(c, lang)} стоит в 7 доме — непростая планета здесь означает, что тема отношений требует больше сознательных усилий, чем везения самого по себе. Что делать: ${planetFocusAdvice(c, lang)}.`);
    }
  });

  if (row7.lordHouse) {
    if (STRONG_HOUSES.has(row7.lordHouse)) {
      pluses.push(isEn
        ? `The ruler of house 7, ${planetName(row7.lord, lang)}, itself sits in a strong part of the chart (house ${row7.lordHouse}, ${houseMeaning(row7.lordHouse, lang)}) — the partnership theme has solid footing.`
        : `Управитель 7 дома, ${planetName(row7.lord, lang)}, сам стоит в сильной части карты (${row7.lordHouse} дом, ${houseMeaning(row7.lordHouse, lang)}) — у партнёрской темы есть устойчивая опора.`);
    } else if (DIFFICULT_HOUSES.has(row7.lordHouse)) {
      minuses.push(isEn
        ? `The ruler of house 7, ${planetName(row7.lord, lang)}, sits in a difficult house (${row7.lordHouse}, ${houseMeaning(row7.lordHouse, lang)}) — partnership will more likely require conscious work than fall into place on its own.`
        : `Управитель 7 дома, ${planetName(row7.lord, lang)}, стоит в непростом доме (${row7.lordHouse}, ${houseMeaning(row7.lordHouse, lang)}) — партнёрство скорее потребует осознанной работы, чем сложится само собой.`);
    }
  }

  if (juHouse) {
    if (STRONG_HOUSES.has(juHouse)) {
      pluses.push(isEn
        ? `Jupiter — the classical karaka for the husband in a female chart — itself sits in a strong part of the chart (house ${juHouse}, ${houseMeaning(juHouse, lang)}). A good sign for the quality of the partnership and the husband's support.`
        : `Юпитер — классическая карака мужа в женской карте — сам стоит в сильной части карты (${juHouse} дом, ${houseMeaning(juHouse, lang)}). Хороший знак для качества партнёрства и поддержки со стороны мужа.`);
    } else if (DIFFICULT_HOUSES.has(juHouse)) {
      minuses.push(isEn
        ? `Jupiter — the karaka for the husband — sits in a difficult house (${juHouse}, ${houseMeaning(juHouse, lang)}). This doesn't mean a "bad husband" — rather that the partnership theme needs more conscious participation and patience from both sides.`
        : `Юпитер — карака мужа — стоит в непростом доме (${juHouse}, ${houseMeaning(juHouse, lang)}). Это не означает «плохого мужа» — скорее что тема партнёрства требует больше сознательного участия и терпения с обеих сторон.`);
    }
  }

  const score = pluses.length - minuses.length;
  const verdict = score > 0 ? "good" : score < 0 ? "watch" : "mixed";
  const juTrait = juSign != null ? signTraits(juSign, lang) : null;

  return { pluses, minuses, verdict, juSign, juTrait, row7 };
}

function FamilyPanel({ person, details, periods, account, onGoToPricing, packageInfo, buying }) {
  const { lang } = useLang();
  const isEn = lang === "en";
  if (person.gender !== "female") {
    return (
      <div style={{ fontFamily: "system-ui, sans-serif" }}>
        <div style={{ background: "#1c1846", borderRadius: 10, padding: 20, textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
          <div style={{ fontSize: 13, color: "#e8c46b", fontWeight: 600, marginBottom: 10 }}>{isEn ? "This breakdown is for a female chart" : "Этот разбор — для женской карты"}</div>
          <p style={{ fontSize: 13, color: "#c9c4e8", lineHeight: 1.6, marginBottom: 10 }}>
            {isEn
              ? "It's built on the classical link \"Jupiter — karaka for the husband,\" which applies specifically to a female chart."
              : "Он построен на классической связке «Юпитер — карака мужа», которая применяется именно к женской карте."}
          </p>
          <p style={{ fontSize: 13, color: "#c9c4e8", lineHeight: 1.6 }}>
            {isEn
              ? "To open it: on the \"Chart\" tab, in the \"Gender (for compatibility)\" field, select \"Female.\""
              : "Чтобы открыть его: на вкладке «Карта» в поле «Пол (для совместимости)» выберите «Женский»."}
          </p>
          <p style={{ fontSize: 12, color: "#8b84b8", lineHeight: 1.6, marginTop: 10 }}>
            {isEn
              ? "In the meantime — the theme of children in general is in \"Houses & areas\" (the \"Children\" card), partnership is in the \"Compatibility\" tab."
              : "А пока — тема детей в целом есть в «Дома и сферы» (карточка «Дети»), партнёрство — во вкладке «Совместимость»."}
          </p>
        </div>
      </div>
    );
  }
  if (!details?.As) {
    return <div style={{ textAlign: "center", color: "#8b84b8", fontSize: 13 }}>{isEn ? "Please wait for the chart to load on the \"Chart\" tab first." : "Сначала дождитесь загрузки карты на вкладке «Карта»."}</div>;
  }

  const intro = (
    <div style={{ fontSize: 14, color: "#a8a1dd", marginBottom: 14, lineHeight: 1.65 }}>
      {isEn
        ? "In a female chart, Jupiter is traditionally read as the karaka (chief significator) of the husband — which is why the themes of \"children\" (5th house) and \"partner\" overlap here: the same planet governs both. This is a symbolic, traditional reading, not a medical forecast or a guarantee of a specific number of children or a specific partner — it shows the chart's tendencies, not facts about the future."
        : "В женской карте Юпитер традиционно читается как карака (главный сигнификатор) мужа — поэтому темы «дети» (5 дом) и «партнёр» здесь и пересекаются: одна и та же планета отвечает за обе. Это символическая традиционная трактовка, не медицинский прогноз и не гарантия конкретного числа детей или конкретного партнёра — она показывает тенденции карты, а не факты будущего."}
    </div>
  );

  const unlocked = account?.loggedIn && account?.totalQuota > 0;

  if (!unlocked) {
    return (
      <div style={{ fontFamily: "system-ui, sans-serif" }}>
        {intro}
        <div style={{ background: "#1c1846", borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, color: "#e8c46b", fontWeight: 600, marginBottom: 8 }}>{isEn ? "Children, partner, and the best periods" : "Дети, партнёр и лучшие периоды"}</div>
          <p style={{ fontSize: 12, color: "#8b84b8", lineHeight: 1.55, marginBottom: 4 }}>
            {isEn
              ? "A breakdown of the theme of children (5th house), of the partner via Jupiter as karaka for the husband, and an assessment of the best life periods for both themes."
              : "Разбор темы детей (5 дом), партнёра через Юпитер как карака мужа, и оценка лучших периодов жизни для обеих тем."}
          </p>
          <PaywallTeaser
            title={isEn ? "Family and children — in the full version" : "Семья и дети — в полной версии"}
            text={isEn
              ? "Unlocked by buying a package (grants access forever, regardless of the remaining quota for other features)."
              : "Открывается покупкой пакета (даёт доступ навсегда, независимо от остатка лимита на другие функции)."}
            goalName="paywall_family_hit"
            account={account}
            onGoToPricing={onGoToPricing}
            packageInfo={packageInfo}
            buying={buying}
          />
        </div>
      </div>
    );
  }

  const rows = buildHouseRows(details);
  const childrenA = assessDomain("children", rows, lang);
  const childrenVm = HOUSE_VERDICT_META[childrenA.verdict];
  const partnerA = assessPartner(rows, details, lang);
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
      {intro}

      <div style={{ background: "#1c1846", borderRadius: 10, padding: 16, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
          <div style={{ fontSize: 13, color: "#e8c46b", fontWeight: 600 }}>{isEn ? "Children — 5th house" : "Дети — 5 дом"}</div>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: childrenVm.bg, color: childrenVm.color }}>{houseVerdictLabel(childrenA.verdict, lang)}</span>
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
          <div style={{ fontSize: 13, color: "#e8c46b", fontWeight: 600 }}>{isEn ? "Partner — 7th house and Jupiter (karaka for the husband)" : "Партнёр — 7 дом и Юпитер (карака мужа)"}</div>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: partnerVm.bg, color: partnerVm.color }}>{houseVerdictLabel(partnerA.verdict, lang)}</span>
        </div>
        {partnerA.juTrait && (
          <p style={{ fontSize: 12, color: "#8b84b8", lineHeight: 1.55, marginBottom: 6 }}>
            {isEn
              ? `Jupiter sits in the sign of ${signName(partnerA.juSign, lang)} — this sign often resonates in a partner as: ${partnerA.juTrait}.`
              : `Юпитер стоит в знаке ${signName(partnerA.juSign, lang)} — по этому знаку в партнёре часто резонируют такие качества: ${partnerA.juTrait}.`}
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
        <div style={{ fontSize: 13, color: "#e8c46b", marginBottom: 6, fontWeight: 600 }}>{isEn ? "Best periods" : "Лучшие периоды"}</div>
        <div style={{ fontSize: 12.5, color: "#6f6798", marginBottom: 10, lineHeight: 1.55 }}>
          {isEn
            ? "For each mahadasha period — how friendly its ruling planet is toward the themes of the 5th and 7th houses and Jupiter. Not about the antardashas within — a general estimate over the big periods of life."
            : "По каждому периоду махадаши — насколько его планета-управитель дружественна темам 5 и 7 домов и Юпитеру. Не про антардаши внутри — общая прикидка по большим периодам жизни."}
        </div>
        {!periods && <div style={{ textAlign: "center", color: "#8b84b8", fontSize: 13 }}>{isEn ? "Wait for the periods to load on the \"Life periods\" tab." : "Дождитесь загрузки периодов на вкладке «Периоды жизни»."}</div>}
        {bestChildren && bestPartner && (
          <div style={{ fontSize: 12.5, color: "#c9c4e8", lineHeight: 1.6, marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid #2e2a5c" }}>
            {isEn
              ? <>For the theme of children, the most notable period is <b style={{ color: "#f1ede4" }}>{planetName(bestChildren.lord, lang)}</b> ({bestChildren.start?.toISOString().slice(0, 10)} — {bestChildren.end?.toISOString().slice(0, 10)}). For partnership — the period <b style={{ color: "#f1ede4" }}>{planetName(bestPartner.lord, lang)}</b> ({bestPartner.start?.toISOString().slice(0, 10)} — {bestPartner.end?.toISOString().slice(0, 10)}).</>
              : <>Для темы детей заметнее всего выглядит период <b style={{ color: "#f1ede4" }}>{planetName(bestChildren.lord, lang)}</b> ({bestChildren.start?.toISOString().slice(0, 10)} — {bestChildren.end?.toISOString().slice(0, 10)}). Для партнёрства — период <b style={{ color: "#f1ede4" }}>{planetName(bestPartner.lord, lang)}</b> ({bestPartner.start?.toISOString().slice(0, 10)} — {bestPartner.end?.toISOString().slice(0, 10)}).</>}
          </div>
        )}
        {scored.map((p, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, padding: "6px 0", borderTop: i ? "1px solid #2e2a5c" : "none" }}>
            <span style={{ color: "#f1ede4" }}>{planetName(p.lord, lang)}</span>
            <span style={{ color: "#766fa0", fontSize: 11 }}>{p.start?.toISOString().slice(0, 10)} — {p.end?.toISOString().slice(0, 10)}</span>
            <span style={{ display: "flex", gap: 6 }}>
              <span title={isEn ? "Children" : "Дети"}>{isEn ? "C" : "Д"} {scoreBadge(p.childrenScore)}</span>
              <span title={isEn ? "Partner" : "Партнёр"}>{isEn ? "P" : "П"} {scoreBadge(p.partnerScore)}</span>
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

function MatchResult({ data, account, onGoToPricing, packageInfo, buying }) {
  const { lang } = useLang();
  const isEn = lang === "en";
  if (!data) return null;
  const total = data.total || {};
  const conclusion = data.conclusion || {};
  const pct = total.total_points ? Math.round((total.received_points / total.total_points) * 100) : 0;
  const verdictText = conclusion.status
    ? (isEn
      ? `Favorable match: ${total.received_points} out of ${total.total_points} points (${pct}%) — above the minimum (${total.minimum_required}).`
      : `Благоприятное сочетание: ${total.received_points} из ${total.total_points} баллов (${pct}%) — выше минимума (${total.minimum_required}).`)
    : (isEn
      ? `The match is below the traditional threshold: ${total.received_points} out of ${total.total_points} points (${pct}%), minimum — ${total.minimum_required}. This isn't a verdict, but it's worth looking more closely at the weak factors below.`
      : `Сочетание ниже традиционного порога: ${total.received_points} из ${total.total_points} баллов (${pct}%), минимум — ${total.minimum_required}. Это не приговор, но стоит внимательнее смотреть на слабые факторы ниже.`);

  const weakKoots = KOOT_ORDER
    .map((key) => ({ key, k: data[key] }))
    .filter(({ k }) => k && k.total_points && k.received_points / k.total_points < 0.5);

  return (
    <div style={{ background: "#1c1846", borderRadius: 10, padding: 16, marginTop: 16 }}>
      <div style={{ fontSize: 13, color: "#e8c46b", marginBottom: 12, fontWeight: 600 }}>{isEn ? "Compatibility (Ashtakoota Guna Milan)" : "Совместимость (Ashtakoota Guna Milan)"}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {KOOT_ORDER.map((key) => {
          const k = data[key];
          if (!k) return null;
          const kpct = k.total_points ? Math.round((k.received_points / k.total_points) * 100) : 0;
          return (
            <div key={key}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#c9c4e8" }}>
                <span>{kootLabel(key, lang)}</span>
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
        <div style={{ fontSize: 15, color: "#f1ede4", fontWeight: 700 }}>{isEn ? "Total:" : "Итого:"} {total.received_points} / {total.total_points}</div>
        <div style={{ fontSize: 13, color: conclusion.status ? "#8fd19e" : "#e0b98b", marginTop: 6, lineHeight: 1.55 }}>{verdictText}</div>
        {conclusion.report && (
          <div style={{ fontSize: 12.5, color: "#6f6798", marginTop: 8, lineHeight: 1.55, fontStyle: "italic" }}>
            {isEn ? "Comment (from AstrologyAPI, in English):" : "Комментарий (оригинал на английском):"} «{conclusion.report}»
          </div>
        )}
      </div>

      <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #2e2a5c" }}>
        <div style={{ fontSize: 12, color: "#e88b8b", fontWeight: 600, marginBottom: 6 }}>{isEn ? "Points to watch" : "На что обратить внимание"}</div>
        {weakKoots.length === 0 ? (
          <p style={{ fontSize: 12, color: "#8fd19e", lineHeight: 1.55 }}>{isEn ? "No weak factors found — every component is above half of its maximum." : "Слабых факторов не выявлено — все составляющие выше половины своего максимума."}</p>
        ) : account?.hasActivePackage ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {weakKoots.map(({ key }) => (
              <div key={key} style={{ paddingLeft: 10, borderLeft: "2px solid #5c2f2f" }}>
                <div style={{ fontSize: 12, color: "#e8c46b", fontWeight: 600, marginBottom: 2 }}>{kootLabel(key, lang)}</div>
                <p style={{ fontSize: 12.5, color: "#c9c4e8", lineHeight: 1.55 }}>{(isEn ? KOOT_WATCH_MEANING_EN : KOOT_WATCH_MEANING)[key]}</p>
              </div>
            ))}
          </div>
        ) : (
          <PaywallTeaser
            title={isEn ? `Weak factors found: ${weakKoots.length}` : `Найдено слабых факторов: ${weakKoots.length}`}
            text={isEn
              ? "What exactly each weak factor means and what to watch for in the pair — available with an active request package."
              : "Что именно означает каждый слабый фактор и на что обратить внимание в паре — доступно с активным пакетом запросов."}
            goalName="paywall_koots_hit"
            account={account}
            onGoToPricing={onGoToPricing}
            packageInfo={packageInfo}
            buying={buying}
          />
        )}
      </div>
    </div>
  );
}

const TENSE_VERDICTS = ["tense", "low"];

const REL_TO_VERDICT = { same: "high", friend: "good", neutral: "neutral", enemy: "tense" };

function heuristicCompat(kind, chart1, chart2, lang) {
  if (!chart1?.details?.Mo || !chart2?.details?.Mo || !chart1?.details?.As || !chart2?.details?.As) return null;
  const moon1 = chart1.details.Mo, moon2 = chart2.details.Mo;
  const asc1 = chart1.details.As, asc2 = chart2.details.As;
  const isEn = lang === "en";
  const conj = isEn ? "and" : "и";

  const items = [];
  const g1 = ganaOf(moon1.nak), g2 = ganaOf(moon2.nak);
  const ganaVerdict = ganaCompat(g1, g2);
  items.push({
    label: isEn ? "Emotional tone (Moon's gana)" : "Эмоциональный тон (гана Луны)",
    verdict: ganaVerdict,
    note: `${nakshatraName(moon1.nak, lang)} ${conj} ${nakshatraName(moon2.nak, lang)}`,
    tip: TENSE_VERDICTS.includes(ganaVerdict)
      ? (isEn
        ? "Temperaments differ noticeably — don't try to \"even out\" each other's reactions; agree in advance on a different pace and on how each of you cools down after a disagreement."
        : "Темпераменты ощутимо разные — не пытайтесь «выровнять» реакции друг друга, договоритесь заранее о разном темпе и о том, как каждый из вас остывает после разногласий.")
      : (isEn
        ? "Temperaments are close in spirit — conflicts on this basis are likely to be few."
        : "Темпераменты близки по духу — конфликтов на этой почве, скорее всего, будет немного."),
  });

  const ec = elementCompat(elementOf(asc1.sign), elementOf(asc2.sign));
  items.push({
    label: isEn ? "Behavior style (Ascendant elements)" : "Стиль поведения (стихии Асцендентов)",
    verdict: ec,
    note: `${signName(asc1.sign, lang)} ${conj} ${signName(asc2.sign, lang)}`,
    tip: TENSE_VERDICTS.includes(ec)
      ? (isEn
        ? "Different elements in behavior mean different priorities in the moment — say your expectations out loud, don't count on your partner to \"just know.\""
        : "Разные стихии в поведении означают разные приоритеты в моменте — проговаривайте ожидания вслух, не полагайтесь, что партнёр «поймёт сам».")
      : (isEn
        ? "Behavior styles are compatible — it's easier to find a common rhythm in everyday situations."
        : "Стили поведения совместимы — легче находить общий ритм в повседневных ситуациях."),
  });

  const houseNum = kind === "business" ? 10 : 11;
  const lord1 = signLordOf((asc1.sign + houseNum - 1) % 12);
  const lord2 = signLordOf((asc2.sign + houseNum - 1) % 12);
  const rel = relation(lord1, lord2);
  const relVerdict = REL_TO_VERDICT[rel] || "neutral";
  items.push({
    label: isEn
      ? (kind === "business" ? "Business drive (10th-house rulers)" : "Social circles (11th-house rulers)")
      : (kind === "business" ? "Деловые устремления (управители 10 домов)" : "Круги общения (управители 11 домов)"),
    verdict: relVerdict,
    note: `${planetName(lord1, lang)} ${conj} ${planetName(lord2, lang)}`,
    tip: TENSE_VERDICTS.includes(relVerdict)
      ? (kind === "business"
        ? (isEn
          ? "The rulers of the business houses are in tension — different strategies around risk and earnings are likely; put roles and areas of responsibility in writing, don't count on things \"sorting themselves out.\""
          : "Управители деловых домов в напряжении — вероятны разные стратегии риска и заработка; закрепите роли и зоны ответственности письменно, не полагайтесь, что «само разрулится».")
        : (isEn
          ? "The rulers of the social-circle houses are in tension — a different social rhythm is likely; don't impose your own pace of socializing on the other."
          : "Управители кругов общения в напряжении — вероятен разный социальный ритм; не навязывайте свой темп общения другому."))
      : (kind === "business"
        ? (isEn
          ? "The rulers of the business houses are friendly toward each other — it's easier to agree on goals and the division of roles."
          : "Управители деловых домов настроены дружественно — легче договориться о целях и распределении ролей.")
        : (isEn
          ? "The rulers of the social-circle houses are friendly toward each other — you're likely on the same social wavelength."
          : "Управители кругов общения настроены дружественно — вам, вероятно, легко на одной социальной волне.")),
  });

  return items;
}

const VERDICT_COLOR = { high: "#8fd19e", good: "#8fd19e", medium: "#e0c98b", neutral: "#c9c4e8", low: "#e0b98b", tense: "#e08b8b", unknown: "#766fa0" };

function HeuristicMatch({ kind, items }) {
  const { lang } = useLang();
  if (!items) return null;
  return (
    <div style={{ background: "#1c1846", borderRadius: 10, padding: 16, marginTop: 16 }}>
      <div style={{ fontSize: 13, color: "#e8c46b", marginBottom: 4, fontWeight: 600 }}>
        {lang === "en"
          ? (kind === "business" ? "Compatibility for a business partnership" : "Compatibility for friendship")
          : (kind === "business" ? "Совместимость для делового партнёрства" : "Совместимость для дружбы")}
      </div>
      <div style={{ fontSize: 12.5, color: "#6f6798", marginBottom: 12, lineHeight: 1.55 }}>
        {lang === "en"
          ? "This isn't classical Ashtakoota (which is designed for marriage only) — a practical heuristic over real chart data: the Moon, the Ascendant, and the rulers of the relevant houses."
          : "Это не классическая Аштакута (она рассчитана только на брак) — практическая эвристика поверх реальных данных карты: Луна, Асцендент и управители профильных домов."}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((it, i) => (
          <div key={i} style={{ fontSize: 13, borderLeft: `2px solid ${TENSE_VERDICTS.includes(it.verdict) ? "#5c2f2f" : "#2f5c44"}`, paddingLeft: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div style={{ color: "#f1ede4" }}>{it.label}</div>
              <div style={{ color: VERDICT_COLOR[it.verdict] || "#c9c4e8", fontWeight: 600, whiteSpace: "nowrap" }}>{verdictLabel(it.verdict, lang)}</div>
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

function RelocationPanel({ person, originalChart, activeMahaLord, account, onGoToPricing, packageInfo, buying }) {
  const { lang } = useLang();
  const isEn = lang === "en";
  const [status, setStatus] = useState(null);
  const [result, setResult] = useState(null);
  const [bestStatus, setBestStatus] = useState(null); // null | "loading" | "done"
  const [bestProgress, setBestProgress] = useState(0);
  const [bestResults, setBestResults] = useState(null);
  const [region, setRegion] = useState("all");
  // Открытый город и кэш подбора хранятся в localStorage (не только в состоянии компонента),
  // иначе они сбрасывались при каждом переключении вкладки — RelocationPanel размонтируется,
  // когда tab !== "relocation", и обычный useState(null) терял бы блокировку пейволла.
  const [unlockedCity, setUnlockedCity] = useState(() => loadSavedJSON("astro_relocation_unlocked_city", null)); // ярлык единственного города, открытого бесплатно
  const [scanCache, setScanCache] = useState(() => loadSavedJSON("astro_relocation_scan_cache", null)); // { key, results } — последний бесплатный подбор

  useEffect(() => { saveSavedJSON("astro_relocation_unlocked_city", unlockedCity); }, [unlockedCity]);
  useEffect(() => { saveSavedJSON("astro_relocation_scan_cache", scanCache); }, [scanCache]);

  const poolCities = region === "all" ? CANDIDATE_CITIES : CANDIDATE_CITIES.filter((c) => c.region === region);
  const scanKey = `${person.date}|${person.time}|${person.tz}|${person.lat}|${person.lon}|${region}`;

  const handlePick = useCallback(async (cand) => {
    const label = `${cand.place_name}${cand.country_code ? ", " + cand.country_code : ""}`;
    if (unlockedCity && unlockedCity !== label) {
      if (account?.loggedIn) {
        const usage = await checkUsage("relocation_city", label);
        if (!usage.allowed) {
          setResult({ label, details: null });
          setStatus("locked");
          return;
        }
        // пакет позволяет — считаем как обычно, ниже
      } else {
        setResult({ label, details: null });
        setStatus("locked");
        return;
      }
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
  }, [person, unlockedCity, account]);

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
      if (account?.loggedIn) {
        const usage = await checkUsage("relocation_scan", scanKey);
        if (!usage.allowed) {
          setBestStatus("locked_scan");
          return;
        }
        // пакет позволяет — продолжаем ниже и реально считаем новый подбор
      } else {
        setBestStatus("locked_scan");
        return;
      }
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
  }, [orig, person, activeMahaLord, poolCities, region, scanKey, scanCache, account]);

  const openCityResult = useCallback(async (r) => {
    const label = `${r.city.name}, ${r.city.country}`;
    if (unlockedCity && unlockedCity !== label) {
      if (account?.loggedIn) {
        const usage = await checkUsage("relocation_city", label);
        if (!usage.allowed) {
          setResult({ label, details: null });
          setStatus("locked");
          return;
        }
      } else {
        setResult({ label, details: null });
        setStatus("locked");
        return;
      }
    }
    setResult({ label, details: r.details });
    setStatus("ready");
    setUnlockedCity(label);
  }, [unlockedCity, account]);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      <div style={{ fontSize: 14, color: "#a8a1dd", marginBottom: 12, lineHeight: 1.65 }}>
        {isEn
          ? "Relocation recalculates the Ascendant and the houses for the same moment of birth, but at a different point on Earth (planets barely shift by sign, but the houses shift noticeably). Below is a search for favorable places across an extended list of locations on every inhabited continent, or a manual check of a specific city."
          : "Релокация пересчитывает Асцендент и дома для той же секунды рождения, но в другой точке Земли (планеты по знакам почти не меняются, а вот дома — заметно). Ниже — подбор благоприятных мест по расширенному списку локаций со всех обитаемых континентов, либо проверка конкретного города вручную."}
      </div>

      {!orig && <div style={{ textAlign: "center", color: "#8b84b8", fontSize: 13 }}>{isEn ? "Wait for the chart to load on the \"Chart\" tab first." : "Сначала дождитесь загрузки карты на вкладке «Карта»."}</div>}

      {orig && (
        <div style={{ background: "#1c1846", borderRadius: 10, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "#e8c46b", marginBottom: 6, fontWeight: 600 }}>{isEn ? "Best relocation options" : "Наилучшие варианты релокации"}</div>
          <div style={{ fontSize: 12.5, color: "#6f6798", marginBottom: 12, lineHeight: 1.55 }}>
            {isEn
              ? `A rough scan across ${CANDIDATE_CITIES.length} points around the world — not just popular capitals, but also less obvious places on every continent: where favorable planets land in strong houses (1,4,5,7,9,10) and difficult ones in calm houses (6,8,12), how this affects the house of the current mahadasha, and separately, how strong the Ascendant's own lord is at that point. The list is large but finite (recalculating literally every point on the planet in a reasonable time isn't realistic) — a heuristic over the chart, not a classical place-selection method. You can narrow the search to a specific region, or manually check any city or coordinates below.`
              : `Прикидка по ${CANDIDATE_CITIES.length} точкам по всему миру — не только популярные столицы, но и менее очевидные места на каждом континенте: где благоприятные планеты попадают в сильные дома (1,4,5,7,9,10), а трудные — в спокойные (6,8,12), как это влияет на дом текущей махадаши, и отдельно — насколько силён управитель Асцендента (Лагна-лорд) в этой точке. Список большой, но конечный (пересчитать буквально каждую точку планеты за разумное время нереально) — эвристика поверх карты, не классическая методика подбора места. Можно сузить поиск до конкретной части света, либо проверить вручную любой город или координаты ниже.`}
          </div>
          <div style={{ marginBottom: 12, maxWidth: 280, marginLeft: "auto", marginRight: "auto" }}>
            <span style={labelStyle}>{isEn ? "Region" : "Часть света"}</span>
            <select style={inputStyle} value={region} onChange={(e) => setRegion(e.target.value)}>
              <option value="all">{isEn ? "Whole world" : "Весь мир"} ({CANDIDATE_CITIES.length})</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>{regionLabel(r, lang)} ({CANDIDATE_CITIES.filter((c) => c.region === r).length})</option>
              ))}
            </select>
          </div>
          <button onClick={findBestPlaces} disabled={bestStatus === "loading"} style={{
            display: "block", margin: "0 auto", background: "#e8c46b", color: "#151233", border: "none",
            borderRadius: 20, padding: "9px 22px", fontSize: 13, fontWeight: 700, cursor: bestStatus === "loading" ? "default" : "pointer",
            opacity: bestStatus === "loading" ? 0.7 : 1,
          }}>
            {bestStatus === "loading"
              ? (isEn ? `Checking ${bestProgress} of ${poolCities.length}…` : `Проверяю ${bestProgress} из ${poolCities.length}…`)
              : (isEn ? "Find the best places" : "Подобрать лучшие места")}
          </button>

          {bestStatus === "locked_scan" && (
            <PaywallTeaser
              title={isEn ? "The search has already been used for free" : "Подбор уже использован бесплатно"}
              text={isEn
                ? "One full search for the best places for this birth data is free (the result above can be revisited without limits). Recalculating for different birth data or another region costs 1 request from the package."
                : "Один полный подбор лучших мест для этих данных рождения — бесплатно (результат выше, можно пересматривать без ограничений). Пересчёт для других данных рождения или другой части света — 1 запрос из пакета."}
              goalName="paywall_relocation_scan_hit"
              account={account}
              onGoToPricing={onGoToPricing}
              packageInfo={packageInfo}
              buying={buying}
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
          <div style={{ fontSize: 13, color: "#e8c46b", marginBottom: 10, fontWeight: 600 }}>{isEn ? "Check your own city" : "Проверить свой город"}</div>
          <GeoSearch onPick={handlePick} dateForTz={birthDateForApi(person.date)} />
        </div>
      )}

      {status === "loading" && <div style={{ textAlign: "center", color: "#8b84b8", fontSize: 13 }}>{isEn ? "Recalculating the chart for the new location…" : "Пересчитываю карту для новой точки…"}</div>}
      {status === "error" && <div style={{ textAlign: "center", color: "#e08b8b", fontSize: 13 }}>{isEn ? "Couldn't recalculate — please try again." : "Не удалось пересчитать — попробуйте ещё раз."}</div>}

      {status === "locked" && result && (
        <div style={{ background: "#1c1846", borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, color: "#e8c46b", marginBottom: 10, fontWeight: 600 }}>{isEn ? `Relocation to ${result.label}` : `Релокация в ${result.label}`}</div>
          <PaywallTeaser
            title={isEn ? "One city is already unlocked for free" : "Один город уже открыт бесплатно"}
            text={isEn
              ? `The detailed breakdown for "${unlockedCity}" remains available at any time. One more city costs 1 request from the package.`
              : `Подробный разбор для «${unlockedCity}» остаётся доступен в любой момент. Ещё один город — 1 запрос из пакета.`}
            goalName="paywall_relocation_hit"
            account={account}
            onGoToPricing={onGoToPricing}
            packageInfo={packageInfo}
            buying={buying}
          />
        </div>
      )}

      {status === "ready" && result && orig && (
        <div style={{ background: "#1c1846", borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, color: "#e8c46b", marginBottom: 10, fontWeight: 600 }}>{isEn ? `Relocation to ${result.label}` : `Релокация в ${result.label}`}</div>

          <p style={{ fontSize: 13, color: "#c9c4e8", lineHeight: 1.6 }}>
            {isEn ? "Ascendant:" : "Асцендент:"} {signName(orig.As?.sign, lang)} → <b style={{ color: "#f1ede4" }}>{signName(result.details.As?.sign, lang)}</b>
          </p>

          {activeMahaLord && orig[activeMahaLord] && result.details[activeMahaLord] && (
            <p style={{ fontSize: 13, color: "#c9c4e8", lineHeight: 1.6 }}>
              {isEn
                ? <>You're currently in the {planetName(activeMahaLord, lang)} mahadasha: house {orig[activeMahaLord].house} → <b style={{ color: "#f1ede4" }}>house {result.details[activeMahaLord].house}</b> ({houseMeaning(result.details[activeMahaLord].house, lang)}) — while you're there, this house's theme sounds louder.</>
                : <>Сейчас у вас идёт махадаша {planetName(activeMahaLord, lang)}: {orig[activeMahaLord].house} дом → <b style={{ color: "#f1ede4" }}>{result.details[activeMahaLord].house} дом</b> ({houseMeaning(result.details[activeMahaLord].house, lang)}) — пока вы там, тема этого дома звучит заметнее.</>}
            </p>
          )}

          {(() => {
            const origAscLord = orig.As?.sign != null ? signLordOf(orig.As.sign) : null;
            const afterAscLord = result.details.As?.sign != null ? signLordOf(result.details.As.sign) : null;
            if (!origAscLord || !afterAscLord) return null;
            const afterHouse = result.details[afterAscLord]?.house;
            const strongNote = afterHouse
              ? (STRONG_HOUSES.has(afterHouse) ? (isEn ? " — a strong position, the whole chart holds steadier" : " — сильная позиция, вся карта держится увереннее") : DIFFICULT_HOUSES.has(afterHouse) ? (isEn ? " — a tricky position, a test for the whole chart" : " — позиция непростая, испытание для карты в целом") : "")
              : "";
            return (
              <p style={{ fontSize: 13, color: "#c9c4e8", lineHeight: 1.6 }}>
                {isEn
                  ? <>Ascendant lord: {planetName(origAscLord, lang)} → <b style={{ color: "#f1ede4" }}>{planetName(afterAscLord, lang)}</b>{afterHouse ? `, itself in house ${afterHouse} (${houseMeaning(afterHouse, lang)})` : ""}{strongNote}.</>
                  : <>Управитель Асцендента: {planetName(origAscLord, lang)} → <b style={{ color: "#f1ede4" }}>{planetName(afterAscLord, lang)}</b>{afterHouse ? `, сам в ${afterHouse} доме (${houseMeaning(afterHouse, lang)})` : ""}{strongNote}.</>}
              </p>
            );
          })()}

          <div style={{ fontSize: 12.5, color: "#6f6798", marginTop: 10, lineHeight: 1.55 }}>
            {isEn
              ? "Below is the same logic as in the overall city ranking above (favorable planets in strong houses, difficult ones in calm houses). The overall ranking score also factors in two big standalone things not tied to any single area: which house the current mahadasha's lord ends up in, and how strong the Ascendant's own lord is. So a high-ranking place's individual areas below may well look modest or barely change — that isn't a mistake."
              : "Ниже — та же логика, что и в общем рейтинге городов выше (благоприятные планеты в сильных домах, трудные — в слабых). Общий балл в рейтинге учитывает ещё и два больших отдельных фактора, не привязанных ни к одной конкретной сфере: в каком доме окажется управитель текущей махадаши, и насколько силён управитель самого Асцендента. Поэтому у высокого места в рейтинге отдельные сферы ниже вполне могут выглядеть скромно или почти не меняться — это не ошибка."}
          </div>
          <div style={{ marginTop: 8 }}>
            {(() => {
              const origRows = buildHouseRows(orig);
              const afterRows = buildHouseRows(result.details);
              return Object.entries(DOMAIN_META).map(([key, dm]) => {
                const before = domainScore(dm, origRows);
                const after = domainScore(dm, afterRows);
                const diff = after - before;
                const verdict = diff > 0 ? (isEn ? "looks stronger" : "выглядит сильнее") : diff < 0 ? (isEn ? "looks weaker" : "выглядит слабее") : (isEn ? "unchanged" : "без изменений");
                const color = diff > 0 ? "#8fd19e" : diff < 0 ? "#e0b98b" : "#c9c4e8";
                return (
                  <div key={key} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0", borderTop: "1px solid #2e2a5c" }}>
                    <span style={{ color: "#f1ede4" }}>{domainTitle(key, lang)}</span>
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
function loadSavedJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function saveSavedJSON(key, value) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage недоступен (приватный режим и т.п.) — просто не сохраняем
  }
}

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

// Типы событий для ректификации — дом, который проверяется на резонанс с текущей
// дашой на дату события (классические карaки/дома для каждого типа событий).
const EVENT_TYPES = [
  { id: "marriage", label: "Брак / отношения", labelEn: "Marriage / relationship", house: 7 },
  { id: "child", label: "Рождение ребёнка", labelEn: "Birth of a child", house: 5 },
  { id: "career", label: "Карьера / статус", labelEn: "Career / status", house: 10 },
  { id: "relocation", label: "Переезд", labelEn: "Relocation", house: 4 },
  { id: "health", label: "Здоровье / кризис", labelEn: "Health / crisis", house: 8 },
  { id: "loss", label: "Утрата близкого", labelEn: "Loss of a loved one", house: 8 },
  { id: "education", label: "Образование", labelEn: "Education", house: 9 },
];
function eventTypeLabel(meta, lang) {
  if (!meta) return "";
  return lang === "en" ? (meta.labelEn || meta.label) : meta.label;
}

function buildCandidateTimes(fromTime, toTime, stepMin) {
  const toMin = (t) => { const [h, m] = String(t || "0:0").split(":").map(Number); return (h || 0) * 60 + (m || 0); };
  const toStr = (min) => { const h = Math.floor(min / 60) % 24; const m = ((min % 60) + 60) % 60; return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`; };
  const start = toMin(fromTime);
  const end = toMin(toTime);
  if (!(end > start)) return [];
  const step = Math.max(5, Number(stepMin) || 20);
  const times = [];
  for (let m = start; m <= end; m += step) times.push(toStr(m));
  if (times[times.length - 1] !== toStr(end)) times.push(toStr(end));
  return times.slice(0, 15); // жёсткий предел — не больше 15 запросов /planets за один расчёт
}

/* =========================================================
   UI: ректификация (уточнение времени рождения по событиям)
   ========================================================= */

/* Инструмент для астролога, а не для автоматического "угадывания" за клиента: показывает,
   у какого кандидата на время рождения дашa на дату известного события резонирует с домом
   этого события (владение/присутствие в доме) — метод, а не готовый ответ. Финальный выбор
   времени остаётся за астрологом. Один расчёт = 1 запрос из пакета (несколько кандидатов —
   несколько обращений к AstrologyAPI внутри одного "запроса" пакета, отсюда лимит в 15 кандидатов). */
function RectificationPanel({ person, account, onGoToPricing, packageInfo, buying }) {
  const { lang } = useLang();
  const isEn = lang === "en";
  const [date, setDate] = useState(person?.date || "");
  const [fromTime, setFromTime] = useState("12:00");
  const [toTime, setToTime] = useState("14:00");
  const [stepMin, setStepMin] = useState(20);
  const [lat, setLat] = useState(person?.lat ?? "");
  const [lon, setLon] = useState(person?.lon ?? "");
  const [tz, setTz] = useState(person?.tz ?? "3");
  const [events, setEvents] = useState([{ id: 1, type: "marriage", date: "", note: "" }]);
  const [result, setResult] = useState({ loading: false, error: null, locked: false, candidates: null });

  const prefillFromChart = useCallback(() => {
    if (!person) return;
    setDate(person.date || "");
    setLat(person.lat ?? "");
    setLon(person.lon ?? "");
    setTz(person.tz ?? "3");
  }, [person]);

  const handlePick = useCallback(async (cand) => {
    setLat(Number(cand.latitude));
    setLon(Number(cand.longitude));
    setTz(cand.tz);
  }, []);

  const addEvent = useCallback(() => {
    setEvents((evs) => [...evs, { id: (evs[evs.length - 1]?.id || 0) + 1, type: "marriage", date: "", note: "" }]);
  }, []);
  const removeEvent = useCallback((id) => {
    setEvents((evs) => evs.filter((e) => e.id !== id));
  }, []);
  const updateEvent = useCallback((id, patch) => {
    setEvents((evs) => evs.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  const times = buildCandidateTimes(fromTime, toTime, stepMin);
  const validEvents = events.filter((e) => e.date);
  const requestKey = JSON.stringify({ date, fromTime, toTime, stepMin, lat, lon, tz, events: validEvents.map((e) => ({ t: e.type, d: e.date })) });

  const run = useCallback(async () => {
    if (!date || lat === "" || lon === "" || !times.length) {
      setResult({ loading: false, error: isEn ? "Fill in the date, place, and a valid time range (\"to\" later than \"from\")." : "Заполните дату, место и корректный диапазон времени («до» позже «от»).", locked: false, candidates: null });
      return;
    }
    if (!validEvents.length) {
      setResult({ loading: false, error: isEn ? "Add at least one event with a known date." : "Добавьте хотя бы одно событие с известной датой.", locked: false, candidates: null });
      return;
    }

    if (!account?.loggedIn) {
      setResult({ loading: false, error: null, locked: true, candidates: null });
      return;
    }
    const usage = await checkUsage("rectify", requestKey);
    if (!usage.allowed) {
      setResult({ loading: false, error: null, locked: true, candidates: null });
      return;
    }

    setResult({ loading: true, error: null, locked: false, candidates: null });
    try {
      const midTime = times[Math.floor((times.length - 1) / 2)];
      const baseBirth = { date, time: midTime, lat, lon, tz };

      const mahaRaw = await fetchMajorDasha(splitBirthForApi(baseBirth));
      const mahaPeriods = (mahaRaw || []).map((p) => ({
        lord: PLANET_EN_TO_CODE[p.planet] || p.planet,
        planetEn: p.planet,
        start: parseApiDashaDate(p.start),
        end: parseApiDashaDate(p.end),
      }));

      const eventsWithMaha = validEvents.map((e) => {
        const edate = new Date(e.date);
        const period = mahaPeriods.find((p) => p.start && p.end && edate >= p.start && edate < p.end);
        return { ...e, mahaLord: period?.lord || null, mahaPlanetEn: period?.planetEn || null };
      });

      const distinctMahaEn = [...new Set(eventsWithMaha.map((e) => e.mahaPlanetEn).filter(Boolean))];
      const subCache = {};
      for (const enName of distinctMahaEn) {
        try {
          const subs = await fetchSubDasha(splitBirthForApi(baseBirth), enName);
          subCache[enName] = (subs || []).map((s) => ({
            lord: PLANET_EN_TO_CODE[s.planet] || s.planet,
            start: parseApiDashaDate(s.start),
            end: parseApiDashaDate(s.end),
          }));
        } catch {
          subCache[enName] = null;
        }
      }

      const eventsResolved = eventsWithMaha.map((e) => {
        let antarLord = null;
        if (e.mahaPlanetEn && subCache[e.mahaPlanetEn]) {
          const edate = new Date(e.date);
          const sp = subCache[e.mahaPlanetEn].find((s) => s.start && s.end && edate >= s.start && edate < s.end);
          antarLord = sp?.lord || null;
        }
        return { ...e, antarLord };
      });

      const candidates = [];
      for (const time of times) {
        try {
          const birth = splitBirthForApi({ date, time, lat, lon, tz });
          const planetsRes = await fetchPlanets(birth);
          const details = buildChartDetails(planetsRes);
          const rows = buildHouseRows(details);
          let score = 0;
          const breakdown = eventsResolved.map((e) => {
            const meta = EVENT_TYPES.find((t) => t.id === e.type);
            const row = meta && rows ? rows[meta.house - 1] : null;
            let matched = null;
            if (row) {
              if (e.antarLord && (e.antarLord === row.lord || row.occupants.includes(e.antarLord))) {
                score += 3; matched = "antar";
              } else if (e.mahaLord && e.mahaLord !== e.antarLord && (e.mahaLord === row.lord || row.occupants.includes(e.mahaLord))) {
                score += 1; matched = "maha";
              }
            }
            return { type: e.type, date: e.date, house: meta?.house, matched };
          });
          candidates.push({ time, ascSign: details.As?.sign, ascDeg: details.As?.lon, score, breakdown, error: null });
        } catch (e2) {
          candidates.push({ time, error: e2.message || (isEn ? "Request error" : "Ошибка запроса"), score: -1, breakdown: [] });
        }
      }
      candidates.sort((a, b) => b.score - a.score);
      setResult({ loading: false, error: null, locked: false, candidates });
      ymGoal("rectify_calculated");
    } catch (e) {
      setResult({ loading: false, error: e.message || (isEn ? "Couldn't complete the calculation" : "Не удалось выполнить расчёт"), locked: false, candidates: null });
    }
  }, [date, fromTime, toTime, stepMin, lat, lon, tz, events, account, requestKey, times, validEvents]);

  const estimatedCalls = 1 + times.length; // fetchMajorDasha + N×fetchPlanets (fetchSubDasha по числу разных махадаш — заранее неизвестно, обычно 1-3)

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      <div style={{ fontSize: 14, color: "#a8a1dd", marginBottom: 14, lineHeight: 1.65 }}>
        {isEn
          ? "A tool for narrowing down an unknown birth time from known life events. For each candidate time in the chosen range, it checks whether the planet ruling the dasha/antardasha on the event's date matches the house that event usually belongs to (rulership or presence in the house). This is a method to guide professional analysis, not a ready-made answer — the final choice of time is yours."
          : "Инструмент для уточнения неизвестного времени рождения по известным жизненным событиям. Для каждого времени-кандидата в выбранном диапазоне считается, совпадает ли планета, управляющая дашой/антардашой на дату события, с домом, за который это событие обычно отвечает (владение или присутствие в доме). Это метод-подсказка для профессионального анализа, а не готовый ответ — финальный выбор времени остаётся за вами."}
      </div>

      <div style={{ background: "#1c1846", borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 13, color: "#e8c46b", fontWeight: 600 }}>{isEn ? "Birth date and time range" : "Дата и диапазон времени рождения"}</div>
          {person && (
            <button onClick={prefillFromChart} style={{
              background: "none", border: "1px solid #332c66", color: "#9089c9", borderRadius: 14,
              padding: "4px 10px", fontSize: 11, cursor: "pointer",
            }}>{isEn ? "fill in from the \"Chart\" tab" : "заполнить из вкладки «Карта»"}</button>
          )}
        </div>
        <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div><span style={labelStyle}>{isEn ? "Birth date" : "Дата рождения"}</span><input style={inputStyle} type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div><span style={labelStyle}>{isEn ? "From (approx. not earlier)" : "От (примерно не раньше)"}</span><input style={inputStyle} type="time" value={fromTime} onChange={(e) => setFromTime(e.target.value)} /></div>
          <div><span style={labelStyle}>{isEn ? "To (approx. not later)" : "До (примерно не позже)"}</span><input style={inputStyle} type="time" value={toTime} onChange={(e) => setToTime(e.target.value)} /></div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <span style={labelStyle}>{isEn ? "Step, minutes" : "Шаг перебора, минут"}</span>
          <input style={{ ...inputStyle, maxWidth: 120 }} type="number" min={5} step={5} value={stepMin} onChange={(e) => setStepMin(e.target.value)} />
        </div>

        <GeoSearch onPick={handlePick} dateForTz={birthDateForApi(date)} />

        <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <div><span style={labelStyle}>{isEn ? "Latitude" : "Широта"}</span><input style={inputStyle} type="number" step="0.01" value={lat} onChange={(e) => setLat(e.target.value)} /></div>
          <div><span style={labelStyle}>{isEn ? "Longitude" : "Долгота"}</span><input style={inputStyle} type="number" step="0.01" value={lon} onChange={(e) => setLon(e.target.value)} /></div>
          <div><span style={labelStyle}>{isEn ? "Time zone (UTC+)" : "Часовой пояс (UTC+)"}</span><input style={inputStyle} type="number" step="0.5" value={tz} onChange={(e) => setTz(e.target.value)} /></div>
        </div>
      </div>

      <div style={{ background: "#1c1846", borderRadius: 10, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "#e8c46b", fontWeight: 600, marginBottom: 10 }}>{isEn ? "Known events" : "Известные события"}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {events.map((e) => (
            <div key={e.id} style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1.5fr auto", gap: 8, alignItems: "center" }}>
              <select style={inputStyle} value={e.type} onChange={(ev) => updateEvent(e.id, { type: ev.target.value })}>
                {EVENT_TYPES.map((t) => <option key={t.id} value={t.id}>{eventTypeLabel(t, lang)}</option>)}
              </select>
              <input style={inputStyle} type="date" value={e.date} onChange={(ev) => updateEvent(e.id, { date: ev.target.value })} />
              <input style={inputStyle} placeholder={isEn ? "note (optional)" : "заметка (необязательно)"} value={e.note} onChange={(ev) => updateEvent(e.id, { note: ev.target.value })} />
              <button onClick={() => removeEvent(e.id)} style={{
                background: "none", border: "1px solid #332c66", color: "#e0a8a8", borderRadius: 14,
                width: 28, height: 28, cursor: "pointer", fontSize: 14,
              }}>×</button>
            </div>
          ))}
        </div>
        <button onClick={addEvent} style={{
          marginTop: 10, background: "none", border: "1px dashed #4a4088", color: "#9089c9",
          borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer",
        }}>{isEn ? "+ add an event" : "+ добавить событие"}</button>
      </div>

      <div style={{ marginBottom: 10, fontSize: 12.5, color: "#6f6798" }}>
        {isEn
          ? <>Candidate times in range: {times.length || 0}. One calculation costs 1 request from the package (internally — up to {estimatedCalls} calls to AstrologyAPI; repeating with the same data is free).</>
          : <>Кандидатов времени в диапазоне: {times.length || 0}. Один расчёт спишет 1 запрос из пакета (внутри — до {estimatedCalls} обращений к AstrologyAPI, повтор с теми же данными — бесплатно).</>}
      </div>

      <button onClick={run} disabled={result.loading} style={{
        background: "#e8c46b", color: "#151233", border: "none", borderRadius: 20,
        padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: result.loading ? "default" : "pointer",
        opacity: result.loading ? 0.7 : 1, marginBottom: 16,
      }}>{result.loading ? (isEn ? "Calculating…" : "Считаю…") : (isEn ? "Calculate" : "Рассчитать")}</button>

      {result.error && <div style={{ color: "#e08b8b", fontSize: 13, marginBottom: 12 }}>{result.error}</div>}

      {result.locked && (
        <PaywallTeaser
          title={isEn ? "Rectification — narrowing down the birth time" : "Ректификация — уточнение времени рождения"}
          text={isEn
            ? "Calculating across several candidate times uses several calls to AstrologyAPI, so it's available from the request package (1 request per calculation; repeating with the same data is free)."
            : "Расчёт по нескольким кандидатам времени задействует несколько обращений к AstrologyAPI, поэтому доступен из пакета запросов (1 запрос на расчёт, повтор с теми же данными — бесплатно)."}
          goalName="paywall_rectify_hit"
          account={account}
          onGoToPricing={onGoToPricing}
          packageInfo={packageInfo}
          buying={buying}
        />
      )}

      {result.candidates && (
        <div style={{ background: "#1c1846", border: "1px solid #332c66", borderRadius: 10, padding: 16 }}>
          <div style={{ fontSize: 13, color: "#e8c46b", fontWeight: 600, marginBottom: 10 }}>{isEn ? "Result by candidate" : "Результат по кандидатам"}</div>
          <div style={{ fontSize: 12, color: "#766fa0", marginBottom: 10, lineHeight: 1.8, display: "flex", gap: 14, flexWrap: "wrap" }}>
            <span><span style={{ color: "#7fd99a" }}>●</span> {isEn ? "antardasha rules/sits in the right house (weight 3)" : "антардаша владеет/стоит в нужном доме (вес 3)"}</span>
            <span><span style={{ color: "#e8c46b" }}>●</span> {isEn ? "match only at the mahadasha level (weight 1)" : "совпадение только на уровне махадаши (вес 1)"}</span>
            <span><span style={{ color: "#4a4570" }}>●</span> {isEn ? "no match · the letter in the circle is the event type's first letter" : "совпадения нет · буква в кружке — первая буква типа события"}</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 480, borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ color: "#9089c9", textAlign: "left" }}>
                  <th style={{ padding: 6 }}>{isEn ? "Time" : "Время"}</th>
                  <th style={{ padding: 6 }}>{isEn ? "Ascendant" : "Асцендент"}</th>
                  <th style={{ padding: 6 }}>{isEn ? "Total" : "Сумма"}</th>
                  <th style={{ padding: 6 }}>{isEn ? "Events" : "События"}</th>
                </tr>
              </thead>
              <tbody>
                {result.candidates.map((c, i) => (
                  <tr key={c.time} style={{ borderTop: "1px solid #2e2a5c", background: i === 0 && !c.error ? "#211c47" : "transparent" }}>
                    <td style={{ padding: 6, color: i === 0 && !c.error ? "#e8c46b" : "#f1ede4", fontWeight: i === 0 ? 700 : 400 }}>{c.time}</td>
                    <td style={{ color: "#c9c4e8", padding: 6 }}>
                      {c.error ? <span style={{ color: "#e08b8b" }}>{c.error}</span> : `${signName(c.ascSign, lang) || "—"} ${c.ascDeg != null ? Number(c.ascDeg).toFixed(1) + "°" : ""}`}
                    </td>
                    <td style={{ color: "#c9c4e8", padding: 6, fontWeight: 700 }}>{c.error ? "—" : c.score}</td>
                    <td style={{ padding: 6 }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {(c.breakdown || []).map((b, bi) => {
                          const meta = EVENT_TYPES.find((t) => t.id === b.type);
                          const color = b.matched === "antar" ? "#7fd99a" : b.matched === "maha" ? "#e8c46b" : "#4a4570";
                          const verdict = b.matched === "antar" ? (isEn ? "antardasha rules/sits in the house" : "антардаша владеет/стоит в доме") : b.matched === "maha" ? (isEn ? "mahadasha rules/sits in the house" : "махадаша владеет/стоит в доме") : (isEn ? "no match" : "совпадения нет");
                          return (
                            <span key={bi} title={`${eventTypeLabel(meta, lang) || b.type} (${b.date}): ${verdict}`} style={{
                              display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18,
                              borderRadius: "50%", background: `${color}33`, border: `1px solid ${color}`,
                              fontSize: 9, color, fontWeight: 700,
                            }}>{(eventTypeLabel(meta, lang) || "?")[0]}</span>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function JyotishAppInner() {
  const { t, lang, setLang } = useLang();
  const [tab, setTab] = useState("chart");
  const [person1, setPerson1] = useState(() => loadSavedPerson("astro_person1", defaultPerson1));
  const [person2, setPerson2] = useState(() => loadSavedPerson("astro_person2", defaultPerson2));

  useEffect(() => { saveSavedPerson("astro_person1", person1); }, [person1]);
  useEffect(() => { saveSavedPerson("astro_person2", person2); }, [person2]);
  const [matchKind, setMatchKind] = useState("marriage"); // marriage | business | friendship

  // Аккаунт (вход по email-коду) + пакет запросов — реальная, серверная часть пейволла.
  // Без аккаунта всё работает как раньше (анонимный мягкий пейволл на localStorage).
  const [account, setAccount] = useState({ loggedIn: false });
  // Оба тарифа (рублёвый и валютный) сейчас идут через Lava.top — она работает и в RU-зоне,
  // так что пока не держим отдельно ЮKassa для рублей (её код в payments.js/backend не трогали,
  // можно будет вернуть). Показываем/используем нужную валюту по текущему языку интерфейса —
  // пока это единственный сигнал зоны, который у нас есть.
  const [packageInfoRub, setPackageInfoRub] = useState(null);
  const [packageInfoUsd, setPackageInfoUsd] = useState(null);
  const packageInfo = lang === "en" ? packageInfoUsd : packageInfoRub;
  const [buying, setBuying] = useState(false);
  const [ofertaOpen, setOfertaOpen] = useState(false);

  const refreshAccount = useCallback(async () => {
    const s = await fetchAccountStatus();
    setAccount(s);
  }, []);
  useEffect(() => { refreshAccount(); }, [refreshAccount]);
  useEffect(() => {
    fetchLavaPackageInfo("RUB").then(setPackageInfoRub);
    fetchLavaPackageInfo("USD").then(setPackageInfoUsd);
  }, []);

  const buyPackage = useCallback(async (tierId) => {
    setBuying(true);
    try {
      const currency = lang === "en" ? "USD" : "RUB";
      const r = await createLavaPackagePayment(tierId, currency);
      if (r.confirmationUrl) {
        window.location.href = r.confirmationUrl; // редирект на страницу оплаты Lava.top
        return;
      }
      // Тестовый режим (ключи провайдера ещё не подключены на бэкенде) — пакет уже "оплачен", просто обновляем статус.
      await refreshAccount();
    } catch (e) {
      alert(e.message || (lang === "en" ? "Couldn't start the payment. Please try again." : "Не удалось начать оплату. Попробуйте ещё раз."));
    } finally {
      setBuying(false);
    }
  }, [refreshAccount, lang]);
  // Тизеры не покупают конкретный пакет напрямую (тарифов теперь несколько) — просто ведут на вкладку «Тарифы»,
  // где человек выбирает нужный размер пакета сам.
  const goToPricing = useCallback(() => setTab("pricing"), []);

  const chart1 = useBirthChart(person1, "chart_calculated", lang);
  const chart2 = useBirthChart(person2, "partner_chart_calculated", lang);
  const dasha1 = useMajorDasha(person1, lang);

  const now = new Date();
  const activeMaha = dasha1.periods?.find((p) => p.start && p.end && now >= p.start && now < p.end);

  const [matchState, setMatchState] = useState({ loading: false, error: null, data: null, locked: false });
  // Кэш первой бесплатной проверки совместимости — переживает переключение вкладок и перезагрузку страницы
  // (та же история, что и с релокацией: без этого состояние жило бы только в памяти компонента).
  const [matchCache, setMatchCache] = useState(() => loadSavedJSON("astro_match_cache", null));
  useEffect(() => { saveSavedJSON("astro_match_cache", matchCache); }, [matchCache]);
  const matchKey = `${person1.gender}|${person1.date}|${person1.time}|${person1.tz}|${person1.lat}|${person1.lon}|${person2.date}|${person2.time}|${person2.tz}|${person2.lat}|${person2.lon}`;

  const runMatch = useCallback(async () => {
    if (matchCache && matchCache.key === matchKey) {
      // те же двое, что уже проверяли бесплатно — показываем сохранённый результат без нового запроса
      setMatchState({ loading: false, error: null, data: matchCache.data, locked: false });
      return;
    }
    if (matchCache && matchCache.key !== matchKey) {
      // другая пара/другие данные — это уже вторая проверка
      if (account?.loggedIn) {
        const usage = await checkUsage("compat", matchKey);
        if (!usage.allowed) {
          setMatchState({ loading: false, error: null, data: null, locked: true });
          return;
        }
        // пакет позволяет — считаем как обычно, продолжаем ниже
      } else {
        setMatchState({ loading: false, error: null, data: null, locked: true });
        return;
      }
    }
    setMatchState({ loading: true, error: null, data: null, locked: false });
    try {
      const male = person1.gender === "male" ? person1 : person2;
      const female = person1.gender === "female" ? person1 : person2;
      const data = await fetchMatchAshtakoot(splitBirthForApi(male), splitBirthForApi(female));
      setMatchState({ loading: false, error: null, data, locked: false });
      setMatchCache({ key: matchKey, data });
      ymGoal("compat_marriage_calculated");
    } catch (e) {
      setMatchState({ loading: false, error: e.message || (lang === "en" ? "Couldn't calculate compatibility" : "Не удалось рассчитать совместимость"), data: null, locked: false });
    }
  }, [person1, person2, matchCache, matchKey, account]);

  const heuristicItems = matchKind !== "marriage" ? heuristicCompat(matchKind, chart1, chart2, lang) : null;

  const tabs = [
    { id: "chart", label: t("tab_chart") },
    { id: "dasha", label: t("tab_dasha") },
    { id: "houses", label: t("tab_houses") },
    { id: "career", label: t("tab_career") },
    { id: "family", label: t("tab_family") },
    { id: "synastry", label: t("tab_synastry") },
    { id: "relocation", label: t("tab_relocation") },
    { id: "rectify", label: t("tab_rectify") },
    { id: "pricing", label: t("tab_pricing") },
  ];

  return (
    <div className="app-root" style={{ fontFamily: "Georgia, 'Times New Roman', serif", background: "#0d0b26", minHeight: "100svh", width: "100%", maxWidth: 960, margin: "0 auto", boxSizing: "border-box", padding: 20, color: "#f1ede4", position: "relative", overflow: "hidden" }}>
      <div className={`const-${tab}`} style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }} />
      <div style={{ textAlign: "center", marginBottom: 18, position: "relative", zIndex: 1 }}>
        <button onClick={() => setLang(lang === "ru" ? "en" : "ru")} style={{
          position: "absolute", right: 0, top: 0, background: "#1c1846", color: "#c9c4e8",
          border: "1px solid #332c66", borderRadius: 14, padding: "4px 12px", fontSize: 11,
          cursor: "pointer", fontFamily: "system-ui, sans-serif", fontWeight: 600,
        }}>{t("lang_switch_to")}</button>
        <div style={{ fontSize: 22, letterSpacing: 2, color: "#e8c46b" }}>{t("appTitle")}</div>
        <div style={{ fontSize: 11, color: "#6f6798", marginTop: 2, fontFamily: "system-ui, sans-serif" }}>
          {t("appSubtitle")}
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
          <BirthForm person={person1} setPerson={setPerson1} label={t("form_label_main")} />
          {chart1.loading && <div style={{ textAlign: "center", color: "#8b84b8", fontSize: 13 }}>{t("loading_chart")}</div>}
          {chart1.error && <div style={{ textAlign: "center", color: "#e08b8b", fontSize: 13 }}>{t("error_prefix")}: {chart1.error}</div>}
          {chart1.details && (
            <>
              <ChartWheel details={chart1.details} />
              <div style={{ marginTop: 16, background: "#1c1846", borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 13, color: "#e8c46b", marginBottom: 8, fontWeight: 600 }}>{lang === "en" ? "Personality (by Ascendant and Moon)" : "Личность (по Асценденту и Луне)"}</div>
                <p style={{ fontSize: 13, color: "#c9c4e8", lineHeight: 1.6 }}>
                  {lang === "en"
                    ? <>Ascendant in {signName(chart1.details.As?.sign, lang)} — core qualities: {signTraits(chart1.details.As?.sign, lang)}.{" "}Moon in the nakshatra "{nakshatraName(chart1.details.Mo?.nak, lang)}" ({signName(chart1.details.Mo?.sign, lang)}) — the emotional nature leans toward: {signTraits(chart1.details.Mo?.sign, lang)}.</>
                    : <>Асцендент в {signName(chart1.details.As?.sign, lang)} — базовые качества: {signTraits(chart1.details.As?.sign, lang)}.{" "}Луна в накшатре «{nakshatraName(chart1.details.Mo?.nak, lang)}» ({signName(chart1.details.Mo?.sign, lang)}) — эмоциональная природа склоняется к: {signTraits(chart1.details.Mo?.sign, lang)}.</>}
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
            {lang === "en"
              ? "Vimshottari dasha — all 3 levels: mahadasha → antardasha → pratyantardasha, each with its own start and end date. Clicking a mahadasha row expands its antardashas with a breakdown; clicking the \"sub-periods\" row under an antardasha expands its own pratyantardashas (their own dates within the parent period), each with a short \"+\" (strength) and \"−\" (what to watch)."
              : "Вимшоттари даша — все 3 уровня: махадаша → антардаша → пратьянтардаша, у каждого своя дата начала и конца. Клик по строке махадаши раскрывает её антардаши с разбором; клик по строке «под-периоды» под нужной антардашей — раскрывает её собственные пратьянтардаши (свои даты внутри родительского периода), каждая — с коротким «+» (сильная сторона) и «−» (на что обратить внимание)."}
          </div>
          {dasha1.loading && <div style={{ textAlign: "center", color: "#8b84b8", fontSize: 13 }}>{t("loading_dasha")}</div>}
          {dasha1.error && <div style={{ textAlign: "center", color: "#e08b8b", fontSize: 13 }}>{t("error_prefix")}: {dasha1.error}</div>}
          {dasha1.periods && <DashaTimeline birth={person1} periods={dasha1.periods} details={chart1.details} account={account} onGoToPricing={goToPricing} packageInfo={packageInfo} buying={buying} />}
        </div>
      )}

      {tab === "houses" && <HousesPanel details={chart1.details} account={account} onGoToPricing={goToPricing} packageInfo={packageInfo} buying={buying} />}

      {tab === "career" && <CareerPanel details={chart1.details} account={account} onGoToPricing={goToPricing} packageInfo={packageInfo} buying={buying} />}

      {tab === "family" && <FamilyPanel person={person1} details={chart1.details} periods={dasha1.periods} account={account} onGoToPricing={goToPricing} packageInfo={packageInfo} buying={buying} />}

      {tab === "synastry" && (
        <div style={{ fontFamily: "system-ui, sans-serif" }}>
          <BirthForm person={person2} setPerson={setPerson2} label={t("form_label_second")} />

          <div style={{ display: "flex", gap: 6, marginBottom: 16, justifyContent: "center" }}>
            {[["marriage", lang === "en" ? "Marriage" : "Брак"], ["business", lang === "en" ? "Business partnership" : "Бизнес-партнёрство"], ["friendship", lang === "en" ? "Friendship" : "Дружба"]].map(([id, lbl]) => (
              <button key={id} onClick={() => { setMatchKind(id); if (id !== "marriage") ymGoal(`compat_${id}_viewed`); }} style={{
                background: matchKind === id ? "#332c66" : "#1c1846", color: matchKind === id ? "#f1ede4" : "#8b84b8",
                border: "1px solid #332c66", borderRadius: 16, padding: "6px 14px", fontSize: 12, cursor: "pointer",
              }}>{lbl}</button>
            ))}
          </div>

          <div className="grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: "#9089c9", marginBottom: 6, textAlign: "center" }}>{person1.name || (lang === "en" ? "Profile 1" : "Профиль 1")}</div>
              {chart1.details ? <ChartWheel details={chart1.details} /> : <div style={{ fontSize: 12, color: "#8b84b8", textAlign: "center" }}>{lang === "en" ? "Loading…" : "Загрузка…"}</div>}
            </div>
            <div>
              <div style={{ fontSize: 12, color: "#9089c9", marginBottom: 6, textAlign: "center" }}>{person2.name || (lang === "en" ? "Profile 2" : "Профиль 2")}</div>
              {chart2.details ? <ChartWheel details={chart2.details} /> : <div style={{ fontSize: 12, color: "#8b84b8", textAlign: "center" }}>{lang === "en" ? "Loading…" : "Загрузка…"}</div>}
            </div>
          </div>

          {matchKind === "marriage" ? (
            <>
              <button onClick={runMatch} disabled={matchState.loading} style={{
                display: "block", margin: "0 auto", background: "#e8c46b", color: "#151233", border: "none",
                borderRadius: 20, padding: "9px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>
                {matchState.loading ? (lang === "en" ? "Calculating…" : "Считаю…") : (lang === "en" ? "Calculate compatibility (Ashtakoota)" : "Рассчитать совместимость (Аштакута)")}
              </button>
              {matchState.error && <div style={{ textAlign: "center", color: "#e08b8b", fontSize: 13, marginTop: 10 }}>{t("error_prefix")}: {matchState.error}</div>}
              {matchState.locked && (
                <PaywallTeaser
                  title={lang === "en" ? "The first check has already been used for free" : "Первая проверка уже использована бесплатно"}
                  text={lang === "en"
                    ? "Compatibility calculation (Ashtakoota) is free once per couple. Checking with different birth data costs 1 request from the package."
                    : "Расчёт совместимости (Аштакута) — бесплатно один раз для одной пары. Проверка с другими данными рождения — 1 запрос из пакета."}
                  goalName="paywall_compat_hit"
                  account={account}
                  onGoToPricing={goToPricing}
                  packageInfo={packageInfo}
                  buying={buying}
                />
              )}
              <MatchResult data={matchState.data} account={account} onGoToPricing={goToPricing} packageInfo={packageInfo} buying={buying} />
            </>
          ) : (
            <HeuristicMatch kind={matchKind} items={heuristicItems} />
          )}
        </div>
      )}

      {tab === "relocation" && (
        <RelocationPanel person={person1} originalChart={chart1} activeMahaLord={activeMaha?.lord} account={account} onGoToPricing={goToPricing} packageInfo={packageInfo} buying={buying} />
      )}

      {tab === "rectify" && (
        <RectificationPanel person={person1} account={account} onGoToPricing={goToPricing} packageInfo={packageInfo} buying={buying} />
      )}

      {tab === "pricing" && (
        <>
          <PricingInfo tiers={packageInfo?.tiers} currency={packageInfo?.currency} />
          <AccountWidget account={account} packageInfo={packageInfo} onLoggedIn={refreshAccount} onBuyPackage={buyPackage} buying={buying} onShowOferta={() => setOfertaOpen(true)} />
        </>
      )}

      {ofertaOpen && <OfertaModal onClose={() => setOfertaOpen(false)} />}
    </div>
  );
}

export default function JyotishApp() {
  return (
    <LangProvider>
      <JyotishAppInner />
    </LangProvider>
  );
}
