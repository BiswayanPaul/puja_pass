import type { PujaDay } from "@/types";

export const FESTIVAL_YEAR = 2026;

export const pujaDays: PujaDay[] = [
  { date: "2026-09-28", label: "Shashthi", weekday: "Mon" },
  { date: "2026-09-29", label: "Saptami", weekday: "Tue" },
  { date: "2026-09-30", label: "Ashtami", weekday: "Wed" },
  { date: "2026-10-01", label: "Navami", weekday: "Thu" },
  { date: "2026-10-02", label: "Dashami", weekday: "Fri" },
];

export const FESTIVAL_START = pujaDays[0].date;
export const FESTIVAL_END = pujaDays[pujaDays.length - 1].date;

/** Hourly entry windows offered by ticketed pandals. */
export const slotTimes: [start: string, end: string][] = [
  ["10:00", "11:00"],
  ["12:00", "13:00"],
  ["16:00", "17:00"],
  ["18:00", "19:00"],
  ["20:00", "21:00"],
  ["22:00", "23:00"],
];

/** Convenience fee charged per pass, in rupees. */
export const CONVENIENCE_FEE_PER_PASS = 15;
export const MAX_PASSES_PER_SLOT = 8;
