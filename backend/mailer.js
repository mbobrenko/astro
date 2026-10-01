import nodemailer from "nodemailer";

// Отправка кода входа на email. Два варианта, оба настраиваются через .env/Render:
//
// 1) Gmail SMTP (GMAIL_USER + GMAIL_APP_PASSWORD) — рабочий вариант без своего домена: шлёт с
//    обычного Gmail-адреса (у нас — vastrology.support@gmail.com, адрес поддержки) через пароль приложения
//    (Google Account → Безопасность → Пароли приложений, требует включённую двухфакторную
//    аутентификацию). Лимит — 500 писем/сутки, для текущего масштаба с запасом.
// 2) Resend (RESEND_API_KEY) — для будущего, когда появится свой домен: без подтверждённого
//    домена Resend разрешает слать только на e-mail владельца аккаунта, клиентам письма не
//    дойдут (см. https://resend.com/docs/knowledge-base/403-error-resend-dev-domain) — поэтому
//    сейчас это не рабочий вариант, но оставлен на случай, если домен появится.
//
// Если не задано ни то, ни другое (например, локальная разработка) — код просто печатается
// в консоль сервера, чтобы можно было тестировать вход без реального письма.
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const MAIL_FROM = process.env.MAIL_FROM || `Ведическая астрология <${GMAIL_USER || "onboarding@resend.dev"}>`;

let gmailTransport = null;
function getGmailTransport() {
  if (!gmailTransport) {
    gmailTransport = nodemailer.createTransport({
      service: "gmail",
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    });
  }
  return gmailTransport;
}

export async function sendLoginCode(email, code) {
  const subject = `Код входа: ${code}`;
  const text = `Ваш код для входа в «Ведическая астрология»: ${code}\n\nКод действует 10 минут. Если вы не запрашивали вход — просто проигнорируйте это письмо.`;

  if (GMAIL_USER && GMAIL_APP_PASSWORD) {
    await getGmailTransport().sendMail({ from: MAIL_FROM, to: email, subject, text });
    return;
  }

  if (RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
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
