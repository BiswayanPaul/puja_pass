"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/session";

// Saved ("hearted") pandals for signed-in visitors, stored in SavedPandal.
// Guests keep theirs in the browser until they sign in (see use-saved-pandals.ts).

const MAX_SAVED = 200;
const idsSchema = z.array(z.string().min(1).max(100)).max(MAX_SAVED);

/** Pandals visitors can see: published, run by a verified club. */
const publicPandal = { published: true, club: { verified: true } } as const;

async function savedIds(userId: string) {
  const rows = await prisma.savedPandal.findMany({ where: { userId }, select: { pandalId: true }, orderBy: { createdAt: "desc" } });
  return rows.map((row) => row.pandalId);
}

/**
 * Called once after sign-in: moves the pandals saved in this browser into the
 * account, then returns everything the account has saved.
 */
export async function syncSavedPandals(localIds: string[]): Promise<string[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const parsed = idsSchema.safeParse(localIds);
  if (parsed.success && parsed.data.length) {
    const valid = await prisma.pandal.findMany({ where: { id: { in: parsed.data }, ...publicPandal }, select: { id: true } });
    await prisma.savedPandal.createMany({ data: valid.map(({ id }) => ({ userId: user.id, pandalId: id })), skipDuplicates: true });
  }
  return savedIds(user.id);
}

/** Saves or unsaves a pandal for the signed-in user. */
export async function setPandalSaved(pandalId: string, saved: boolean): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user || typeof pandalId !== "string") return { ok: false };
  if (!saved) {
    await prisma.savedPandal.deleteMany({ where: { userId: user.id, pandalId } });
    return { ok: true };
  }
  const pandal = await prisma.pandal.findFirst({ where: { id: pandalId, ...publicPandal }, select: { id: true } });
  if (!pandal) return { ok: false };
  if ((await prisma.savedPandal.count({ where: { userId: user.id } })) >= MAX_SAVED) return { ok: false };
  await prisma.savedPandal.upsert({
    where: { userId_pandalId: { userId: user.id, pandalId } },
    update: {},
    create: { userId: user.id, pandalId },
  });
  return { ok: true };
}
