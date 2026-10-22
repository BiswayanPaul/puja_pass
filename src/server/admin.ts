import "server-only";
import { notFound } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";
import type { ClubApplicationStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import type {
  AdminClub,
  AdminOverview,
  AdminPandal,
  AdminPandalStatus,
  ApplicationStatus,
  ClubApplicationDetail,
  ClubApplicationSummary,
} from "@/types";

// Platform admin reads. These are per-request and uncached: call them from
// components under <Suspense>, after `await connection()`.

/** Pending applications older than this are flagged (the club form promises 2–3 working days). */
export const REVIEW_DUE_DAYS = 3;

/**
 * The signed-in platform admin.
 * TODO(auth): read the session and check `role === "PLATFORM_ADMIN"`. Until
 * auth exists the admin area only works in development, as the seeded admin.
 */
export async function requirePlatformAdmin() {
  if (process.env.NODE_ENV !== "development") notFound();
  const admin = await prisma.user.findFirst({
    where: { role: "PLATFORM_ADMIN" },
    select: { id: true, name: true, email: true },
    orderBy: { createdAt: "asc" },
  });
  if (!admin) throw new Error("No platform admin user found. Run `bun run db:seed`.");
  return admin;
}

/** Fields a pandal needs before it can go live; also enforced when publishing. */
export function getProfileGaps(pandal: {
  description: string;
  highlight: string;
  themeTitle: string;
  timings: string;
  nearestMetro: string;
  freeEntryInfo: string;
}) {
  const required = {
    Description: pandal.description,
    Highlight: pandal.highlight,
    Theme: pandal.themeTitle,
    Timings: pandal.timings,
    "Nearest metro": pandal.nearestMetro,
    "Free entry info": pandal.freeEntryInfo,
  };
  return Object.entries(required)
    .filter(([, value]) => !value.trim())
    .map(([label]) => label);
}

function toStatus(status: ClubApplicationStatus): ApplicationStatus {
  return status.toLowerCase() as ApplicationStatus;
}

function daysSince(date: Date) {
  return Math.floor((Date.now() - date.getTime()) / 86_400_000);
}

const applicationSummarySelect = {
  id: true,
  clubName: true,
  registrationNumber: true,
  area: true,
  established: true,
  contactName: true,
  status: true,
  createdAt: true,
  reviewedAt: true,
  certificateUrl: true,
  permissionUrl: true,
  clubId: true,
} satisfies Prisma.ClubApplicationSelect;

type ApplicationSummaryRow = Prisma.ClubApplicationGetPayload<{ select: typeof applicationSummarySelect }>;

/** Existing clubs by registration number, ignoring the club an application itself created. */
async function findDuplicateClubs(rows: ApplicationSummaryRow[]) {
  const numbers = [...new Set(rows.map((row) => row.registrationNumber))];
  const clubs = await prisma.club.findMany({
    where: { registrationNumber: { in: numbers } },
    select: { id: true, name: true, registrationNumber: true },
  });
  return (row: ApplicationSummaryRow) =>
    clubs.find((club) => club.registrationNumber === row.registrationNumber && club.id !== row.clubId)?.name ?? null;
}

function toApplicationSummary(row: ApplicationSummaryRow, duplicateOfClub: string | null): ClubApplicationSummary {
  return {
    id: row.id,
    clubName: row.clubName,
    registrationNumber: row.registrationNumber,
    area: row.area,
    established: row.established,
    contactName: row.contactName,
    status: toStatus(row.status),
    submittedAt: row.createdAt.toISOString(),
    waitingDays: row.status === "PENDING" ? daysSince(row.createdAt) : 0,
    hasCertificate: Boolean(row.certificateUrl),
    hasPermission: Boolean(row.permissionUrl),
    duplicateOfClub,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
  };
}

/** Pending applications come oldest first so the longest wait is reviewed first. */
export async function getApplications(status: ApplicationStatus) {
  const rows = await prisma.clubApplication.findMany({
    where: { status: status.toUpperCase() as ClubApplicationStatus },
    select: applicationSummarySelect,
    orderBy: status === "pending" ? { createdAt: "asc" } : { reviewedAt: "desc" },
  });
  const duplicateOf = await findDuplicateClubs(rows);
  return rows.map((row) => toApplicationSummary(row, duplicateOf(row)));
}

export async function getApplicationCounts() {
  const groups = await prisma.clubApplication.groupBy({ by: ["status"], _count: true });
  const counts: Record<ApplicationStatus, number> = { pending: 0, approved: 0, rejected: 0 };
  for (const group of groups) counts[toStatus(group.status)] = group._count;
  return counts;
}

export async function getApplication(id: string): Promise<ClubApplicationDetail | null> {
  const row = await prisma.clubApplication.findUnique({
    where: { id },
    select: {
      ...applicationSummarySelect,
      address: true,
      theme: true,
      description: true,
      expectedFootfall: true,
      offerings: true,
      contactRole: true,
      email: true,
      phone: true,
      reviewNotes: true,
      reviewedBy: { select: { name: true } },
      submittedBy: { select: { name: true, email: true } },
      club: { select: { id: true, name: true, verified: true } },
    },
  });
  if (!row) return null;

  const [duplicateOf, related] = await Promise.all([
    findDuplicateClubs([row]),
    prisma.clubApplication.findMany({
      where: { registrationNumber: row.registrationNumber, id: { not: row.id } },
      select: { id: true, clubName: true, status: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    ...toApplicationSummary(row, duplicateOf(row)),
    address: row.address,
    theme: row.theme,
    description: row.description,
    expectedFootfall: row.expectedFootfall,
    offerings: row.offerings,
    contactRole: row.contactRole,
    email: row.email,
    phone: row.phone,
    certificate: row.certificateUrl,
    permission: row.permissionUrl,
    reviewNotes: row.reviewNotes,
    reviewedBy: row.reviewedBy?.name ?? null,
    submittedBy: row.submittedBy,
    club: row.club,
    relatedApplications: related.map((item) => ({ id: item.id, clubName: item.clubName, status: toStatus(item.status) })),
  };
}

export async function getAdminClubs(): Promise<AdminClub[]> {
  const rows = await prisma.club.findMany({
    include: {
      pandals: { select: { id: true, name: true, slug: true, published: true }, orderBy: { name: "asc" } },
      members: { select: { role: true, user: { select: { name: true } } } },
    },
    // Unverified clubs first: they are the ones that need attention.
    orderBy: [{ verified: "asc" }, { name: "asc" }],
  });
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    registrationNumber: row.registrationNumber,
    established: row.established,
    verified: row.verified,
    verifiedAt: row.verifiedAt?.toISOString() ?? null,
    verificationNote: row.verificationNote,
    owner: row.members.find((member) => member.role === "OWNER")?.user.name ?? null,
    memberCount: row.members.length,
    pandals: row.pandals,
  }));
}

function pandalStatus(published: boolean, clubVerified: boolean): AdminPandalStatus {
  if (!clubVerified) return "blocked";
  return published ? "live" : "draft";
}

export async function getAdminPandals(): Promise<AdminPandal[]> {
  const rows = await prisma.pandal.findMany({
    include: {
      club: { select: { id: true, name: true, verified: true } },
      _count: { select: { ticketTiers: { where: { active: true } }, slots: true } },
    },
    orderBy: { name: "asc" },
  });
  const order: Record<AdminPandalStatus, number> = { draft: 0, blocked: 1, live: 2 };
  return rows
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      area: row.area,
      imageSrc: row.coverImageUrl,
      imageAlt: row.coverImageAlt,
      clubId: row.club.id,
      clubName: row.club.name,
      clubVerified: row.club.verified,
      status: pandalStatus(row.published, row.club.verified),
      featured: row.featured,
      profileGaps: getProfileGaps(row),
      activeTierCount: row._count.ticketTiers,
      slotCount: row._count.slots,
    }))
    .sort((a, b) => order[a.status] - order[b.status]);
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const [applications, pending, clubs, pandals] = await Promise.all([
    getApplicationCounts(),
    prisma.clubApplication.findMany({ where: { status: "PENDING" }, select: { createdAt: true } }),
    prisma.club.groupBy({ by: ["verified"], _count: true }),
    getAdminPandals(),
  ]);
  return {
    applications,
    overdueApplications: pending.filter((row) => daysSince(row.createdAt) > REVIEW_DUE_DAYS).length,
    clubs: {
      verified: clubs.find((group) => group.verified)?._count ?? 0,
      unverified: clubs.find((group) => !group.verified)?._count ?? 0,
    },
    pandals: {
      live: pandals.filter((pandal) => pandal.status === "live").length,
      draft: pandals.filter((pandal) => pandal.status === "draft").length,
      blocked: pandals.filter((pandal) => pandal.status === "blocked").length,
    },
    readyToPublish: pandals.filter((pandal) => pandal.status === "draft" && !pandal.profileGaps.length).length,
  };
}
