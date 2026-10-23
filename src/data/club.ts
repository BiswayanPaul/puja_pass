import type { CheckIn, DailySales } from "@/types";

// Sample analytics shown on every club dashboard until real aggregates exist.

/** The festival day the dashboard treats as "today". */
export const CLUB_TODAY = "2026-09-30";

export const todayStats = { checkedIn: 3840, expected: 5910, gateWaitMinutes: 12, scannersOnline: 4 };

export const tierSales = [
  { tierId: "sreebhumi-general", tickets: 16840, revenue: 1667160 },
  { tierId: "sreebhumi-priority", tickets: 3670, revenue: 1097330 },
];

export const dailySales: DailySales[] = [
  { date: "2026-09-28", label: "Shashthi", tickets: 3120, revenue: 412300 },
  { date: "2026-09-29", label: "Saptami", tickets: 4380, revenue: 581900 },
  { date: "2026-09-30", label: "Ashtami", tickets: 5910, revenue: 821790 },
  { date: "2026-10-01", label: "Navami", tickets: 5240, revenue: 709800 },
  { date: "2026-10-02", label: "Dashami", tickets: 1860, revenue: 238700 },
];

export const recentCheckIns: CheckIn[] = [
  { id: "ci-1", passCode: "SRB-2930-8841", holderName: "Riya Banerjee", tierName: "Timed Entry", quantity: 3, time: "18:06", result: "admitted" },
  { id: "ci-2", passCode: "SRB-2930-1180", holderName: "Kunal Saha", tierName: "Priority Darshan", quantity: 2, time: "18:04", result: "admitted" },
  { id: "ci-3", passCode: "SRB-2930-0942", holderName: "Mou Das", tierName: "Timed Entry", quantity: 4, time: "18:03", result: "duplicate" },
  { id: "ci-4", passCode: "SRB-2930-7731", holderName: "Ayan Roy", tierName: "Timed Entry", quantity: 1, time: "18:01", result: "admitted" },
  { id: "ci-5", passCode: "XXX-0000-0000", holderName: "Unknown", tierName: "—", quantity: 0, time: "17:58", result: "invalid" },
  { id: "ci-6", passCode: "SRB-2930-6650", holderName: "Sneha Paul", tierName: "Priority Darshan", quantity: 2, time: "17:55", result: "admitted" },
];

/** Passes the mock scanner recognises. `used` passes return a duplicate warning. */
export const scannablePasses: {
  code: string;
  holderName: string;
  tierName: string;
  quantity: number;
  slot: string;
  used: boolean;
}[] = [
  { code: "SRB-2930-8841", holderName: "Riya Banerjee", tierName: "Timed Entry", quantity: 3, slot: "Ashtami · 6:00 PM – 7:00 PM", used: false },
  { code: "SRB-2930-1180", holderName: "Kunal Saha", tierName: "Priority Darshan", quantity: 2, slot: "Ashtami · 6:00 PM – 7:00 PM", used: false },
  { code: "SRB-2930-0942", holderName: "Mou Das", tierName: "Timed Entry", quantity: 4, slot: "Ashtami · 6:00 PM – 7:00 PM", used: true },
  { code: "SRB-2930-5523", holderName: "Debjit Kar", tierName: "Timed Entry", quantity: 2, slot: "Ashtami · 8:00 PM – 9:00 PM", used: false },
];
