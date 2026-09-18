// Статические справочные таблицы и «эвристические» (не из API) расчёты:
// натальные дружбы планет, стихии/модальности знаков, ганы накшатр, управители знаков.
// Всё это — классические джйотиш-правила, зашитые как данные, а не как вызов API
// (у AstrologyAPI нет отдельных эндпоинтов под бизнес/дружбу и «дома по сферам»).

export const SIGNS = ["Овен", "Телец", "Близнецы", "Рак", "Лев", "Дева", "Весы", "Скорпион", "Стрелец", "Козерог", "Водолей", "Рыбы"];

// Управитель знака (классические 7 планет, без Раху/Кету как управителей)
const SIGN_LORD = ["Ma", "Ve", "Me", "Mo", "Su", "Me", "Ve", "Ma", "Ju", "Sa", "Sa", "Ju"];
export function signLordOf(signIdx) {
  return SIGN_LORD[((signIdx % 12) + 12) % 12];
}

// Натальная (найсаргика) дружба планет — фиксированная классическая таблица
const PLANET_RELATIONS = {
  Su: { friends: ["Mo", "Ma", "Ju"], enemies: ["Ve", "Sa"] },
  Mo: { friends: ["Su", "Me"], enemies: [] },
  Ma: { friends: ["Su", "Mo", "Ju"], enemies: ["Me"] },
  Me: { friends: ["Su", "Ve"], enemies: ["Mo"] },
  Ju: { friends: ["Su", "Mo", "Ma"], enemies: ["Me", "Ve"] },
  Ve: { friends: ["Me", "Sa"], enemies: ["Su", "Mo"] },
  Sa: { friends: ["Me", "Ve"], enemies: ["Su", "Mo", "Ma"] },
  Ra: { friends: ["Ve", "Sa", "Me"], enemies: ["Su", "Mo", "Ma", "Ke"] },
  Ke: { friends: ["Ma", "Ve", "Sa"], enemies: ["Su", "Mo", "Ra"] },
};
export function relation(a, b) {
  if (a === b) return "same";
  const r = PLANET_RELATIONS[a];
  if (!r) return "neutral";
  if (r.friends.includes(b)) return "friend";
  if (r.enemies.includes(b)) return "enemy";
  return "neutral";
}
export const RELATION_LABEL = { same: "усиление своей же темы", friend: "дружественная поддержка", neutral: "нейтральный фон", enemy: "внутреннее трение" };

// Стихия и модальность знака (индекс 0=Овен..11=Рыбы)
const ELEMENTS = ["fire", "earth", "air", "water"];
export function elementOf(signIdx) { return ELEMENTS[((signIdx % 12) + 12) % 12 % 4]; }
const ELEMENT_RU = { fire: "огонь", earth: "земля", air: "воздух", water: "вода" };
export function elementRu(e) { return ELEMENT_RU[e]; }

export function elementCompat(e1, e2) {
  if (e1 === e2) return "высокая";
  const pair = [e1, e2].sort().join("-");
  if (pair === "air-fire") return "хорошая";
  if (pair === "earth-water") return "хорошая";
  if (pair === "fire-water") return "напряжённая";
  if (pair === "air-earth") return "напряжённая";
  return "нейтральная";
}

// Гана накшатры (классическое деление Дева/Мануша/Ракшаса), индекс 0..26 как в NAKSHATRAS
const NAK_GANA = ["D","M","R","M","D","R","D","D","R","R","M","M","D","R","D","R","D","R","R","M","M","D","R","R","M","M","D"];
export function ganaOf(nakIdx) { return NAK_GANA[nakIdx] ?? null; }
export function ganaCompat(g1, g2) {
  if (!g1 || !g2) return "неизвестна";
  if (g1 === g2) return "высокая";
  const pair = [g1, g2].sort().join("");
  if (pair === "DM") return "хорошая";
  if (pair === "MR") return "средняя";
  return "низкая"; // DR
}

// Значения домов (от Асцендента, классические сигнификации)
export const HOUSE_MEANINGS = {
  1: "тело, характер, жизненная сила, то, как вы подаёте себя",
  2: "накопления, семейные ценности, речь, движимое имущество",
  3: "инициатива, усилия, братья/сёстры, общение, короткие поездки",
  4: "дом, мать, эмоциональная опора, недвижимость, покой",
  5: "творчество, дети, интеллект, романтика, спекулятивные решения",
  6: "работа по найму, здоровье, конкуренты, долги, преодоление препятствий",
  7: "партнёрство, брак, деловые союзы, открытые сделки",
  8: "трансформация, общие ресурсы, кризисы, скрытое, долголетие",
  9: "судьба, удача, отец, наставники, высшее образование, дхарма",
  10: "карьера, статус в обществе, достижения, репутация",
  11: "доходы, связи и сети, друзья, исполнение желаний",
  12: "потери, расходы, уединение, духовность, дальние страны",
};

// Короткая «суть» планеты — используется как строительный блок для текстов по домам/сферам
export const PLANET_CORE = {
  Su: "воля и естественный авторитет",
  Mo: "эмоциональная вовлечённость и забота",
  Ma: "инициатива, напор, готовность бороться",
  Me: "расчёт, коммуникация, торговля и сделки",
  Ju: "рост, доверие, широкий охват, наставничество",
  Ve: "эстетика, партнёрство, дипломатия, удовольствие от процесса",
  Sa: "дисциплина, терпение, работа на длинной дистанции",
  Ra: "нестандартные и рискованные ходы, одержимость целью",
  Ke: "отстранённость, узкая специализация, минимум социальной игры",
};

// Сферы жизни -> какие дома смотреть
export const DOMAIN_META = {
  business: { title: "Бизнес и карьера", houses: [10, 7, 11] },
  family: { title: "Семья и дом", houses: [2, 4] },
  fate: { title: "Судьба и предназначение", houses: [9, 10] },
  society: { title: "Общество и окружение", houses: [11, 7, 3] },
};

// Кураторский список городов для подбора благоприятной релокации.
// Часовые пояса — стандартные (без учёта летнего времени), для быстрой прикидки достаточно.
export const CANDIDATE_CITIES = [
  { name: "Дубай", country: "ОАЭ", lat: 25.2048, lon: 55.2708, tz: 4 },
  { name: "Бали (Денпасар)", country: "Индонезия", lat: -8.65, lon: 115.2167, tz: 8 },
  { name: "Бангкок", country: "Таиланд", lat: 13.7563, lon: 100.5018, tz: 7 },
  { name: "Сингапур", country: "Сингапур", lat: 1.3521, lon: 103.8198, tz: 8 },
  { name: "Лиссабон", country: "Португалия", lat: 38.7223, lon: -9.1393, tz: 1 },
  { name: "Барселона", country: "Испания", lat: 41.3874, lon: 2.1686, tz: 1 },
  { name: "Стамбул", country: "Турция", lat: 41.0082, lon: 28.9784, tz: 3 },
  { name: "Тбилиси", country: "Грузия", lat: 41.7151, lon: 44.8271, tz: 4 },
  { name: "Ереван", country: "Армения", lat: 40.1792, lon: 44.4991, tz: 4 },
  { name: "Лимассол", country: "Кипр", lat: 34.7071, lon: 33.0226, tz: 2 },
  { name: "Нью-Йорк", country: "США", lat: 40.7128, lon: -74.006, tz: -5 },
  { name: "Майами", country: "США", lat: 25.7617, lon: -80.1918, tz: -5 },
  { name: "Мехико", country: "Мексика", lat: 19.4326, lon: -99.1332, tz: -6 },
  { name: "Буэнос-Айрес", country: "Аргентина", lat: -34.6037, lon: -58.3816, tz: -3 },
  { name: "Кейптаун", country: "ЮАР", lat: -33.9249, lon: 18.4241, tz: 2 },
  { name: "Токио", country: "Япония", lat: 35.6762, lon: 139.6503, tz: 9 },
];

// Эвристическая «сила» карты в конкретной точке: благоприятные планеты в сильных домах
// (кендры/трикона 1,4,5,7,9,10) — плюс; трудные планеты там же — минус; трудные планеты,
// убранные в спокойные дома (6,8,12), — тоже плюс (им там комфортнее). Не классическая
// методика подбора места, а прикидка поверх уже посчитанных домов.
const RELOC_GOOD_HOUSES = new Set([1, 4, 5, 7, 9, 10]);
const RELOC_HARD_HOUSES = new Set([6, 8, 12]);
const RELOC_BENEFIC = ["Ju", "Ve"];
const RELOC_MILD_BENEFIC = ["Mo", "Me"];
const RELOC_MALEFIC = ["Su", "Ma", "Sa", "Ra", "Ke"];

export function relocationScore(details, activeMahaLord) {
  let score = 0;
  for (const code of [...RELOC_BENEFIC, ...RELOC_MILD_BENEFIC, ...RELOC_MALEFIC]) {
    const house = details?.[code]?.house;
    if (!house) continue;
    if (RELOC_BENEFIC.includes(code)) {
      if (RELOC_GOOD_HOUSES.has(house)) score += 3;
      else if (RELOC_HARD_HOUSES.has(house)) score -= 1;
    } else if (RELOC_MILD_BENEFIC.includes(code)) {
      if (RELOC_GOOD_HOUSES.has(house)) score += 2;
    } else if (RELOC_MALEFIC.includes(code)) {
      if (RELOC_HARD_HOUSES.has(house)) score += 1;
      else if (house === 1 || house === 7) score -= 2;
    }
  }
  const mahaHouse = activeMahaLord && details?.[activeMahaLord]?.house;
  if (mahaHouse) {
    if (RELOC_GOOD_HOUSES.has(mahaHouse)) score += 4;
    else if (RELOC_HARD_HOUSES.has(mahaHouse)) score -= 2;
  }
  return score;
}
