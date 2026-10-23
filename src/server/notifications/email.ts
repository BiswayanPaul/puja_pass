import "server-only";
import { render } from "@react-email/components";
import nodemailer, { type Transporter } from "nodemailer";
import type { ReactElement } from "react";
import { Resend } from "resend";

export type EmailAttachment = { filename: string; content: Buffer; contentId?: string };

type Email = {
  to: string;
  subject: string;
  react: ReactElement;
  attachments?: EmailAttachment[];
  /** Stable per message, so a retry can't deliver it twice. */
  idempotencyKey: string;
};

// Two ways to send, chosen by what is configured in `.env`:
// - SMTP (SMTP_USER + SMTP_PASS), e.g. a Gmail account with an App password.
//   Free, about 500 recipients a day, sent from that account's address.
// - Resend (RESEND_API_KEY), which needs a verified domain to email customers.
// SMTP wins when both are set.

let smtp: Transporter | null = null;
let resend: Resend | null = null;

async function sendWithSmtp({ to, subject, react, attachments, idempotencyKey }: Email) {
  const user = process.env.SMTP_USER!;
  smtp ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: { user, pass: process.env.SMTP_PASS },
  });
  const info = await smtp.sendMail({
    // Gmail only sends as the signed-in account, so default to it.
    from: process.env.EMAIL_FROM || `PujaPass <${user}>`,
    to,
    subject,
    html: await render(react),
    text: await render(react, { plainText: true }),
    attachments: attachments?.map(({ filename, content, contentId }) => ({ filename, content, cid: contentId })),
    // A fixed Message-ID lets mail servers drop a duplicate if a retry repeats a send.
    messageId: `<${idempotencyKey}@pujapass>`,
  });
  return info.messageId;
}

async function sendWithResend({ to, subject, react, attachments, idempotencyKey }: Email, apiKey: string) {
  resend ??= new Resend(apiKey);
  const { data, error } = await resend.emails.send(
    { from: process.env.EMAIL_FROM || "PujaPass <onboarding@resend.dev>", to, subject, react, attachments },
    // Resend drops a repeat with the same key, so a retry after a timeout can't send twice.
    { idempotencyKey },
  );
  if (error) throw new Error(`Resend: ${error.message}`);
  return data.id;
}

/**
 * Sends one email and returns the provider's message id.
 * In development with nothing configured, the email is only logged.
 * EMAIL_REDIRECT_TO sends everything to one inbox instead (for testing).
 */
export async function sendEmail(email: Email) {
  const redirectTo = process.env.EMAIL_REDIRECT_TO;
  const message = redirectTo ? { ...email, to: redirectTo, subject: `${email.subject} [for ${email.to}]` } : email;

  if (process.env.SMTP_USER && process.env.SMTP_PASS) return sendWithSmtp(message);

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) return sendWithResend(message, apiKey);

  if (process.env.NODE_ENV === "development") {
    console.info(`[email] No email provider configured; would send "${email.subject}" to ${email.to}`);
    return `dev-log-${email.idempotencyKey}`;
  }
  throw new Error("No email provider configured: set SMTP_USER and SMTP_PASS, or RESEND_API_KEY.");
}
