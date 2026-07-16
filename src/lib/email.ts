import nodemailer from "nodemailer";

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
    attachments,
  });

  return { messageId: info.messageId };
}
