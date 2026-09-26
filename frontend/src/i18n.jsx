import React, { createContext, useContext, useState, useCallback } from "react";

/* Фаза 1 перевода: интерфейсная "обвязка" — навигация, формы, аккаунт/тарифы, общие подписи.
   Астрологическое содержание (черты знаков, тексты периодов дашы, значения домов, разборы коотов,
   названия городов, нарративные тексты в "Семья и дети"/"Совместимость"/"Релокация") пока остаётся
   на русском даже при переключении на английский — это фаза 2, отдельная большая работа. */
export const STRINGS = {
  ru: {
    appTitle: "ВЕДИЧЕСКАЯ АСТРОЛОГИЯ",
    appSubtitle: "живые расчёты по данным рождения, сидерический зодиак",

    tab_chart: "Карта",
    tab_dasha: "Периоды жизни",
    tab_houses: "Дома и сферы",
    tab_family: "Семья и дети",
    tab_synastry: "Совместимость",
    tab_relocation: "Релокация",
    tab_pricing: "Тарифы",
    tab_rectify: "Ректификация",

    form_name: "Имя",
    form_gender: "Пол (для совместимости)",
    form_gender_male: "Мужской",
    form_gender_female: "Женский",
    form_birth_date: "Дата рождения",
    form_birth_time: "Время рождения",
    form_label_main: "Данные рождения",
    form_label_second: "Второй профиль",

    loading_chart: "Загрузка карты…",
    loading_dasha: "Загрузка даши…",
    error_prefix: "Ошибка",
    wait_chart_hint: "Сначала дождитесь загрузки карты на вкладке «Карта».",

    paywall_login_hint: "Войдите и купите пакет на вкладке «Тарифы»",
    paywall_soon: "Доступно в полной версии — скоро откроем",
    paywall_buy_button: "Купить пакет →",

    pricing_intro: "Приложение бесплатное. Часть самых «дорогих» по расчётам функций ограничена, чтобы сервис оставался бесплатным и стабильным для всех — но всё, что уже открыто ниже, доступно без ограничений и без регистрации.",
    pricing_free_title: "Бесплатно",
    pricing_paid_title: "Пакет запросов",
    pricing_tiers_line: "10 запросов — 690 ₽ · 15 запросов — 990 ₽ · 20 запросов — 1590 ₽. Когда лимит заканчивается, можно докупить любой из пакетов ещё раз — они складываются. Вход и покупка — ниже.",

    pricing_free_chart: "Полная карта, дома и сферы жизни",
    pricing_free_dasha: "Даша: махадаша и антардаша целиком",
    pricing_free_pratyantar: "Пратьянтардаша — для периода, активного сейчас",
    pricing_free_relocation: "Подбор лучших мест по релокации (1 раз для одних данных рождения) + разбор одного выбранного города",
    pricing_free_compat: "Совместимость (Аштакута): первая проверка для пары — бесплатно",
    pricing_paid_family: "Семья и дети — целиком (дети, партнёр, лучшие периоды), открывается покупкой любого пакета навсегда",
    pricing_paid_pratyantar: "Пратьянтардаша для всех периодов, не только текущего — 1 запрос за период",
    pricing_paid_relocation: "Разбор дополнительных городов и повторный подбор в релокации — 1 запрос за штуку",
    pricing_paid_compat: "Повторная проверка совместимости с другими данными рождения — 1 запрос",
    pricing_paid_rectify: "Ректификация — уточнение неизвестного времени рождения по известным событиям, 1 запрос за расчёт",

    account_login_title: "Вход для покупки пакета",
    account_email_placeholder: "ваш email",
    account_get_code: "Получить код",
    account_code_placeholder: "код из письма",
    account_verify: "Войти",
    account_other_email: "← другой email",
    account_code_sent: "Код отправлен на почту (действует 10 минут).",
    account_logged_in_as: "Вы вошли как",
    account_logout: "Выйти",
    account_remaining: "Остаток пакета:",
    account_of: "из",
    account_exhausted: "Пакет полностью использован.",
    account_none: "Пакет пока не куплен — семья и дети, повторная совместимость, доп. релокации и все пратьянтардаши остаются за пейволлом.",
    account_restock_hint: "Когда лимит закончится — можно докупить любой из пакетов ещё раз, они складываются.",
    account_requests_word: "запросов",

    lang_switch_to: "EN",
  },
  en: {
    appTitle: "VEDIC ASTROLOGY",
    appSubtitle: "live calculations from your birth data, sidereal zodiac",

    tab_chart: "Chart",
    tab_dasha: "Life periods",
    tab_houses: "Houses & areas",
    tab_family: "Family & children",
    tab_synastry: "Compatibility",
    tab_relocation: "Relocation",
    tab_pricing: "Pricing",
    tab_rectify: "Rectification",

    form_name: "Name",
    form_gender: "Gender (for compatibility)",
    form_gender_male: "Male",
    form_gender_female: "Female",
    form_birth_date: "Birth date",
    form_birth_time: "Birth time",
    form_label_main: "Birth data",
    form_label_second: "Second profile",

    loading_chart: "Loading chart…",
    loading_dasha: "Loading dasha…",
    error_prefix: "Error",
    wait_chart_hint: "Please wait for the chart to load on the \"Chart\" tab first.",

    paywall_login_hint: "Log in and buy a package on the \"Pricing\" tab",
    paywall_soon: "Available in the full version — coming soon",
    paywall_buy_button: "Buy a package →",

    pricing_intro: "The app is free. A few of the most computation-heavy features are limited so the service stays free and stable for everyone — but everything already unlocked below has no restrictions and needs no account.",
    pricing_free_title: "Free",
    pricing_paid_title: "Request package",
    pricing_tiers_line: "10 requests — 690 ₽ · 15 requests — 990 ₽ · 20 requests — 1590 ₽. When a package runs out you can buy any package again — they stack. Sign in and purchase below.",

    pricing_free_chart: "Full chart, houses and life areas",
    pricing_free_dasha: "Dasha: full mahadasha and antardasha",
    pricing_free_pratyantar: "Pratyantardasha — for the period active right now",
    pricing_free_relocation: "Best-places relocation search (once per birth data) + analysis of one chosen city",
    pricing_free_compat: "Compatibility (Ashtakoota): first check for a couple — free",
    pricing_paid_family: "Family & children — in full (children, partner, best periods), unlocked forever by any package purchase",
    pricing_paid_pratyantar: "Pratyantardasha for every period, not just the current one — 1 request per period",
    pricing_paid_relocation: "Extra city analysis and repeat relocation search — 1 request each",
    pricing_paid_compat: "Repeat compatibility check with different birth data — 1 request",
    pricing_paid_rectify: "Rectification — narrowing down an uncertain birth time from known life events, 1 request per calculation",

    account_login_title: "Sign in to buy a package",
    account_email_placeholder: "your email",
    account_get_code: "Get code",
    account_code_placeholder: "code from the email",
    account_verify: "Sign in",
    account_other_email: "← different email",
    account_code_sent: "Code sent to your email (valid for 10 minutes).",
    account_logged_in_as: "Signed in as",
    account_logout: "Sign out",
    account_remaining: "Package remaining:",
    account_of: "of",
    account_exhausted: "Package fully used.",
    account_none: "No package yet — family & children, a repeat compatibility check, extra relocations and every pratyantardasha stay behind the paywall.",
    account_restock_hint: "When the limit runs out, you can buy any package again — they stack.",
    account_requests_word: "requests",

    lang_switch_to: "RU",
  },
};

const LangContext = createContext({ lang: "ru", t: (k) => STRINGS.ru[k] ?? k, setLang: () => {} });

export function useLang() {
  return useContext(LangContext);
}

function loadSavedLang() {
  try {
    const v = localStorage.getItem("astro_lang");
    return v === "en" ? "en" : "ru";
  } catch {
    return "ru";
  }
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(loadSavedLang);

  const setLang = useCallback((l) => {
    setLangState(l);
    try {
      localStorage.setItem("astro_lang", l);
    } catch {
      // localStorage недоступен — просто не сохраняем выбор
    }
  }, []);

  const t = useCallback(
    (key) => (STRINGS[lang] && STRINGS[lang][key] !== undefined ? STRINGS[lang][key] : STRINGS.ru[key] ?? key),
    [lang]
  );

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}
