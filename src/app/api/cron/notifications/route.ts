import { timingSafeEqual } from "node:crypto";
import { cleanupExpiredRecords } from "@/server/maintenance";
import { deliverDueNotifications } from "@/server/notifications";

// Retries notifications that failed or were never sent, then deletes expired
// sessions, sign-in tokens and old rate-limit rows. Call it every few
// minutes with `Authorization: Bearer $CRON_SECRET` (Vercel Cron sends this
// header automatically when CRON_SECRET is set).

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function GET(request: Request) {
  if (!authorized(request)) return new Response("Unauthorized", { status: 401 });
  const processed = await deliverDueNotifications();
  const cleaned = await cleanupExpiredRecords();
  return Response.json({ processed, cleaned });
}
