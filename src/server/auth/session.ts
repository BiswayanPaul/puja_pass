import "server-only";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/auth";
import type { ClubMemberRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

// Authorisation checks (the "data access layer"). Every protected page and
// Server Action calls one of these before reading or writing data; proxy.ts
// only does an early redirect for visitors without a session cookie.
// They read cookies, so call them under <Suspense> (pages) or in actions.

/** The signed-in user, or null. Cached for the duration of one request. */
export const getCurrentUser = cache(async () => {
  const session = await auth();
  return session?.user ?? null;
});

function loginUrl(returnTo: string) {
  return `/login?next=${encodeURIComponent(returnTo)}`;
}

/** The signed-in user; otherwise redirects to /login and back to `returnTo`. */
export async function requireUser(returnTo: string) {
  const user = await getCurrentUser();
  if (!user) redirect(loginUrl(returnTo));
  return user;
}

/** A platform admin. Anyone else gets a 404, so the admin area isn't advertised. */
export async function requirePlatformAdmin() {
  const user = await getCurrentUser();
  if (!user?.isPlatformAdmin) notFound();
  return { id: user.id, name: user.name ?? null, email: user.email ?? null };
}

export type ClubAccess =
  | { ok: true; user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>; clubId: string; role: ClubMemberRole; pandalId: string | null }
  | { ok: false; reason: "no-club" | "role" };

/**
 * The signed-in user's club, if their membership role is one of `roles`.
 * Uses the user's first club (one club per person for now).
 * TODO: let members of several clubs switch between them.
 */
export async function requireClubAccess(roles: ClubMemberRole[], returnTo: string): Promise<ClubAccess> {
  const user = await requireUser(returnTo);
  const membership = await prisma.clubMember.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: { role: true, clubId: true, club: { select: { pandals: { select: { id: true }, orderBy: { createdAt: "asc" }, take: 1 } } } },
  });
  if (!membership) return { ok: false, reason: "no-club" };
  if (!roles.includes(membership.role)) return { ok: false, reason: "role" };
  return { ok: true, user, clubId: membership.clubId, role: membership.role, pandalId: membership.club.pandals[0]?.id ?? null };
}
