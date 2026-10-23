import "server-only";
import { randomUUID } from "node:crypto";
import { sendEmail } from "./email";
import { SignInEmail } from "./emails";

/** Sends an Auth.js email sign-in link. Sent directly, not through the outbox: the visitor is waiting for it. */
export async function sendSignInEmail(to: string, url: string) {
  await sendEmail({ to, subject: "Your PujaPass sign-in link", react: <SignInEmail url={url} />, idempotencyKey: `sign-in-${randomUUID()}` });
}
