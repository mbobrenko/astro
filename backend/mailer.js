// Отправка кода входа на email.
//
// Основной способ — EmailJS (EMAILJS_SERVICE_ID / EMAILJS_TEMPLATE_ID / EMAILJS_PUBLIC_KEY /
// EMAILJS_PRIVATE_KEY): шлёт через обычный Gmail-адрес поддержки (vastrology.support@gmail.com,
// подключён как "Service" в личном кабинете EmailJS) по HTTPS API — без своего домена и без
// подключения к серверу Gmail напрямую. Это важно: Render на бесплатном тарифе блокирует
// исходящие подключения по SMTP-портам (25/465/587) — именно поэтому прежний вариант через
// nodemailer+Gmail SMTP зависал на каждом запросе кода (см. историю коммитов). EmailJS работает
// через обычный HTTPS (порт 443), который Render не блокирует.
// Бесплатный лимит EmailJS — 200 писем в месяц (сбрасывается ежемесячно), с запасом для текущего
// масштаба; при росте можно повысить лимит в личном кабинете EmailJS.
//
// Resend (RESEND_API_KEY) оставлен как запасной вариант на случай появления своего домена: без
// подтверждённого домена Resend разрешает слать только на e-mail владельца аккаунта, клиентам
// письма не дойдут (см. https://resend.com/docs/knowledge-base/403-error-resend-dev-domain).
//
// Если не задано ничего из вышеперечисленного (например, локальная разработка) — код просто
// печатается в консоль сервера, чтобы можно было тестировать вход без реального письма.
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY;
const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const MAIL_FROM = process.env.MAIL_FROM || "Ведическая астрология <vastrology.support@gmail.com>";

// Бюджет ожидания на отправку письма. Раньше зависание на SMTP вешало весь HTTP-запрос
// /api/auth/request-code навсегда (без таймаута) — теперь любой сбой внешнего сервиса максимум
// на EMAIL_TIMEOUT_MS, а не бесконечно.
const EMAIL_TIMEOUT_MS = 12000;

export async function sendLoginCode(email, code) {
  const subject = `Код входа: ${code}`;
  const text = `Ваш код для входа в «Ведическая астрология»: ${code}\n\nКод действует 10 минут. Если вы не запрашивали вход — просто проигнорируйте это письмо.`;

  if (EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY) {
    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(EMAIL_TIMEOUT_MS),
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        accessToken: EMAILJS_PRIVATE_KEY || undefined,
        // Имена полей — под шаблон "One-Time Password" в личном кабинете EmailJS: там "To Email"
        // = {{email}}, сам код = {{passcode}}. Если шаблон поменяют, эти поля нужно поправить
        // вместе с ним.
        template_params: {
          email,
          passcode: code,
          subject,
          message: text,
        },
      }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`EmailJS HTTP ${res.status}: ${t.slice(0, 200)}`);
    }
    return;
  }

  if (RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(EMAIL_TIMEOUT_MS),
      body: JSON.stringify({ from: MAIL_FROM, to: [email], subject, text }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`Resend HTTP ${res.status}: ${t.slice(0, 200)}`);
    }
    return;
  }

  console.log(`[DEV] Код входа для ${email}: ${code}`);
}
