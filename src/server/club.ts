import "server-only";
import { prisma } from "@/lib/prisma";
import { getProfileGaps } from "./admin";
import { pandalInclude, toPandal, toTicketTier } from "./mappers";
import type { ClubSlot } from "@/types";

// Reads for the club area. Unlike src/server/pandals.ts these include drafts
// and unverified clubs, so only call them after requireClubAccess().

export async function getClubPandal(pandalId: string) {
  const row = await prisma.pandal.findUnique({ where: { id: pandalId }, include: pandalInclude });
  if (!row) return null;
  return {
    pandal: toPandal(row),
    published: row.published,
    clubVerified: row.club.verified,
    /** Required fields still empty; publishing is blocked until there are none. */
    profileGaps: getProfileGaps(row),
  };
}

/** All pass types, including those not on sale. Uncached so edits show at once. */
export async function getClubTiers(pandalId: string) {
  const rows = await prisma.ticketTier.findMany({ where: { pandalId }, orderBy: [{ position: "asc" }, { createdAt: "asc" }] });
  return rows.map(toTicketTier);
}

/** Every slot with its real booked count and paused state (the public view hides both). */
export async function getClubSlots(pandalId: string): Promise<ClubSlot[]> {
  const rows = await prisma.slot.findMany({ where: { pandalId }, orderBy: [{ date: "asc" }, { startTime: "asc" }] });
  return rows.map((row) => ({
    id: row.id,
    date: row.date.toISOString().slice(0, 10),
    startTime: row.startTime,
    endTime: row.endTime,
    capacity: row.capacity,
    booked: row.booked,
    salesPaused: row.salesPaused,
  }));
}
