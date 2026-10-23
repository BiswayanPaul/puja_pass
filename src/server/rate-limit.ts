import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

// A small database-backed rate limiter: no extra service needed on Vercel.
// Each allowed attempt adds a RateLimitHit row; old rows are removed by the
// notifications cron. Two concurrent requests can both slip under the limit,
// which is acceptable for abuse protection.

/** Records an attempt for `key`, or returns false if `limit` was reached within the window. */
export async function rateLimit(key: string, limit: number, windowMs: number) {
  const recent = await prisma.rateLimitHit.count({ where: { key, createdAt: { gte: new Date(Date.now() - windowMs) } } });
  if (recent >= limit) return false;
  await prisma.rateLimitHit.create({ data: { key } });
  return true;
}

/** The visitor's IP address as reported by Vercel's proxy (or "unknown" locally). */
export function ipFromHeaders(source: Headers) {
  return source.get("x-forwarded-for")?.split(",")[0]?.trim() || source.get("x-real-ip") || "unknown";
}

export async function clientIp() {
  return ipFromHeaders(await headers());
}

export const HOUR = 60 * 60_000;
