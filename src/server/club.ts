import "server-only";
import { prisma } from "@/lib/prisma";
import { pandalInclude, toPandal } from "./mappers";

// Reads for the club area. Unlike src/server/pandals.ts these include drafts
// and unverified clubs, so only call them after requireClubAccess().

export async function getClubPandal(pandalId: string) {
  const row = await prisma.pandal.findUnique({ where: { id: pandalId }, include: pandalInclude });
  return row ? toPandal(row) : null;
}
