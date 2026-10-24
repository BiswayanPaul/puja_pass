// Booking settings. Festival days live in the database (see src/server/festival.ts).

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
