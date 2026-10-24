import "server-only";
import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/users";
import type { CheckIn, ClubSlot, DailySales, PujaDay } from "@/types";
import { getFestivalDays } from "./festival";

// Club dashboard figures, computed from bookings, passes and check-ins.
// Uncached: call after requireClubAccess(), from a request-time component.
//
// Counted: passes that are valid or used, in confirmed or completed bookings.
// "Visitors" sums each pass's quantity. Revenue is quantity × pass price,
// without PujaPass's convenience fee.

const istDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" });
const istTime = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false });
const istDay = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" });

/** "21:26" today, "1 Oct, 22:58" on other days (India time). */
function scanTime(at: Date) {
  return istDate.format(at) === istDate.format(new Date()) ? istTime.format(at) : `${istDay.format(at)}, ${istTime.format(at)}`;
}
const weekday = new Intl.DateTimeFormat("en-IN", { weekday: "short", timeZone: "UTC" });

type DayTierRow = { date: Date; tierId: string; visitors: number; revenue: number; checkedIn: number };

export type ClubDashboard = {
  totals: { visitors: number; revenue: number; bookings: number; cancelledBookings: number };
  days: PujaDay[];
  sales: DailySales[];
  byTier: { tierId: string; name: string; visitors: number; revenue: number }[];
  day: { date: string; slots: ClubSlot[]; expected: number; checkedIn: number; capacity: number; booked: number };
  recentCheckIns: CheckIn[];
};

/** Today in India, else the next festival day, else the last one. */
function defaultDay(days: PujaDay[]) {
  const today = istDate.format(new Date());
  return days.find((day) => day.date >= today)?.date ?? days.at(-1)?.date ?? today;
}

export async function getClubDashboard(pandalId: string, requestedDay?: string): Promise<ClubDashboard> {
  const [festivalDays, rows, totals, slotDates, tiers, recent] = await Promise.all([
    getFestivalDays(),
    prisma.$queryRaw<DayTierRow[]>`
      SELECT s.date, p."tierId",
             SUM(p.quantity)::int AS visitors,
             SUM(p.quantity * p."unitPrice")::int AS revenue,
             SUM(CASE WHEN p.status = 'USED' THEN p.quantity ELSE 0 END)::int AS "checkedIn"
      FROM "Pass" p
      JOIN "Slot" s ON s.id = p."slotId"
      JOIN "Booking" b ON b.id = p."bookingId"
      WHERE s."pandalId" = ${pandalId} AND b.status IN ('CONFIRMED', 'COMPLETED') AND p.status IN ('VALID', 'USED')
      GROUP BY s.date, p."tierId"`,
    prisma.$queryRaw<{ bookings: number; cancelled: number }[]>`
      SELECT COUNT(DISTINCT b.id) FILTER (WHERE b.status IN ('CONFIRMED', 'COMPLETED'))::int AS bookings,
             COUNT(DISTINCT b.id) FILTER (WHERE b.status = 'CANCELLED')::int AS cancelled
      FROM "Booking" b
      WHERE EXISTS (SELECT 1 FROM "Pass" p JOIN "Slot" s ON s.id = p."slotId" WHERE p."bookingId" = b.id AND s."pandalId" = ${pandalId})`,
    prisma.slot.findMany({ where: { pandalId }, distinct: ["date"], select: { date: true } }),
    prisma.ticketTier.findMany({ where: { pandalId }, select: { id: true, name: true }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] }),
    getRecentCheckIns(pandalId, 8),
  ]);

  // Festival days plus any other day this pandal has windows on (e.g. a past season).
  const days = [...festivalDays];
  for (const { date } of slotDates) {
    const iso = date.toISOString().slice(0, 10);
    if (!days.some((day) => day.date === iso)) days.push({ date: iso, label: weekday.format(date), weekday: weekday.format(date) });
  }
  days.sort((a, b) => a.date.localeCompare(b.date));

  const selected = requestedDay && days.some((day) => day.date === requestedDay) ? requestedDay : defaultDay(days);
  const dayRows = rows.filter((row) => row.date.toISOString().slice(0, 10) === selected);
  const slots = await prisma.slot.findMany({
    where: { pandalId, date: new Date(`${selected}T00:00:00Z`) },
    orderBy: { startTime: "asc" },
  });

  return {
    totals: {
      visitors: rows.reduce((total, row) => total + row.visitors, 0),
      revenue: rows.reduce((total, row) => total + row.revenue, 0),
      bookings: totals[0]?.bookings ?? 0,
      cancelledBookings: totals[0]?.cancelled ?? 0,
    },
    days,
    sales: days.map((day) => {
      const forDay = rows.filter((row) => row.date.toISOString().slice(0, 10) === day.date);
      return {
        date: day.date,
        label: day.label,
        tickets: forDay.reduce((total, row) => total + row.visitors, 0),
        revenue: forDay.reduce((total, row) => total + row.revenue, 0),
      };
    }),
    byTier: tiers.map((tier) => {
      const forTier = rows.filter((row) => row.tierId === tier.id);
      return {
        tierId: tier.id,
        name: tier.name,
        visitors: forTier.reduce((total, row) => total + row.visitors, 0),
        revenue: forTier.reduce((total, row) => total + row.revenue, 0),
      };
    }),
    day: {
      date: selected,
      slots: slots.map((slot) => ({
        id: slot.id,
        date: selected,
        startTime: slot.startTime,
        endTime: slot.endTime,
        capacity: slot.capacity,
        booked: slot.booked,
        salesPaused: slot.salesPaused,
      })),
      expected: dayRows.reduce((total, row) => total + row.visitors, 0),
      checkedIn: dayRows.reduce((total, row) => total + row.checkedIn, 0),
      capacity: slots.reduce((total, slot) => total + slot.capacity, 0),
      booked: slots.reduce((total, slot) => total + slot.booked, 0),
    },
    recentCheckIns: recent,
  };
}

/** The latest gate scans at this pandal, admitted or not. */
export async function getRecentCheckIns(pandalId: string, take: number): Promise<CheckIn[]> {
  const scans = await prisma.checkIn.findMany({
    where: { pandalId },
    orderBy: { createdAt: "desc" },
    take,
    include: { pass: { select: { code: true, holderName: true, quantity: true, tier: { select: { name: true } } } } },
  });
  return scans.map((scan) => ({
    id: scan.id,
    passCode: scan.pass?.code ?? scan.scannedCode,
    holderName: scan.pass ? displayName({ name: scan.pass.holderName }) : "Unknown",
    tierName: scan.pass?.tier.name ?? "—",
    quantity: scan.pass?.quantity ?? 0,
    time: scanTime(scan.createdAt),
    result: scan.result.toLowerCase() as CheckIn["result"],
  }));
}
