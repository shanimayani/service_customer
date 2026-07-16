import nodemailer from "nodemailer";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** עוטפת את גוף המייל ב-HTML עם כיווניות מימין-לשמאל, כדי שהטקסט בעברית יוצג נכון */
function toRtlHtml(text: string): string {
  const withBreaks = escapeHtml(text).replace(/\n/g, "<br>");
  return `<div dir="rtl" style="text-align: right; font-family: sans-serif; white-space: pre-wrap;">${withBreaks}</div>`;
}

/**
 * שולחת מייל דרך חשבון המייל העסקי (SMTP), מוגדר במשתני סביבה.
 * לא שירות מייל ייעודי — תיבת מייל רגילה (Gmail/Outlook) עם סיסמת אפליקציה.
 */
export async function sendEmail({
  to,
  subject,
  text,
  attachments,
}: {
  to: string;
  subject: string;
  text: string;
  attachments: { filename: string; content: Buffer }[];
}) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM_NAME, SMTP_FROM_EMAIL } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD || !SMTP_FROM_EMAIL) {
    throw new Error("Missing SMTP_* env vars");
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_PORT === "465",
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });

  const info = await transporter.sendMail({
    from: `"${SMTP_FROM_NAME ?? "פרקטי"}" <${SMTP_FROM_EMAIL}>`,
    to,
    subject,
    text,
    html: toRtlHtml(text),
    attachments,
  });

  return { messageId: info.messageId };
}
