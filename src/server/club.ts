import "server-only";
import { prisma } from "@/lib/prisma";
import { getProfileGaps } from "./admin";
import { pandalInclude, toPandal } from "./mappers";

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
