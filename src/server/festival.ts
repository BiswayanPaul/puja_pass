import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { PujaDay } from "@/types";

// The Puja season's days, set by platform admins in /admin/festival. Cached
// (the root layout reads it on every page); call updateTag(festivalTag) after
// changing them.

export const festivalTag = "festival";

const weekday = new Intl.DateTimeFormat("en-IN", { weekday: "short", timeZone: "UTC" });

export async function getFestivalDays(): Promise<PujaDay[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(festivalTag);

  const rows = await prisma.festivalDay.findMany({ orderBy: { date: "asc" } });
  // @db.Date values come back as UTC midnight.
  return rows.map((row) => ({ date: row.date.toISOString().slice(0, 10), label: row.label, weekday: weekday.format(row.date) }));
}
