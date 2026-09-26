const RESEND_API_KEY = process.env.RESEND_API_KEY;
const MAIL_FROM = process.env.MAIL_FROM || "Ведическая астрология <onboarding@resend.dev>";

// Отправляет код входа на email через Resend (resend.com — простой HTTP API, без SDK).
// Если ключ не задан (например, локальная разработка до регистрации в Resend) — код просто печатается
// в консоль сервера, чтобы можно было тестировать вход без реального письма.
export async function sendLoginCode(email, code) {
  if (!RESEND_API_KEY) {
    console.log(`[DEV] Код входа для ${email}: ${code}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: MAIL_FROM,
      to: [email],
      subject: `Код входа: ${code}`,
      text: `Ваш код для входа в «Ведическая астрология»: ${code}\n\nКод действует 10 минут. Если вы не запрашивали вход — просто проигнорируйте это письмо.`,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Resend HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
}
