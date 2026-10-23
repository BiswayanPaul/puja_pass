import "server-only";
import { prisma } from "@/lib/prisma";

/** Deletes rows nothing needs any more. Run from the notifications cron. */
export async function cleanupExpiredRecords() {
  const now = new Date();
  const [sessions, tokens, hits] = await prisma.$transaction([
    prisma.session.deleteMany({ where: { expires: { lt: now } } }),
    prisma.verificationToken.deleteMany({ where: { expires: { lt: now } } }),
    // The longest rate-limit window is a day.
    prisma.rateLimitHit.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - 24 * 60 * 60_000) } } }),
  ]);
  return { sessions: sessions.count, tokens: tokens.count, rateLimitHits: hits.count };
}
