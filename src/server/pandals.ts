import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { pandalInclude, toPandal, toReview, toSlot, toTicketTier } from "./mappers";

// Pandal reads from the database. Results are cached with `use cache` so pages
// stay prerendered; call `revalidateTag(tag)` from a Server Action after a club
// edits its data (see `pandalTags`).

export const pandalTags = {
  list: "pandals",
  pandal: (slug: string) => `pandal:${slug}`,
  tiers: (pandalId: string) => `pandal-tiers:${pandalId}`,
  slots: (pandalId: string) => `pandal-slots:${pandalId}`,
  reviews: (pandalId: string) => `pandal-reviews:${pandalId}`,
};

export async function getPandals() {
  "use cache";
  cacheLife("hours");
  cacheTag(pandalTags.list);

  const rows = await prisma.pandal.findMany({
    where: { published: true },
    include: pandalInclude,
    orderBy: [{ featured: "desc" }, { ratingAverage: "desc" }],
  });
  return rows.map(toPandal);
}

export async function getFeaturedPandals(limit = 3) {
  const pandals = await getPandals();
  return pandals.filter((pandal) => pandal.featured).slice(0, limit);
}

export async function getPandalSlugs() {
  "use cache";
  cacheLife("hours");
  cacheTag(pandalTags.list);

  const rows = await prisma.pandal.findMany({ where: { published: true }, select: { slug: true } });
  return rows.map((row) => row.slug);
}

export async function getPandalBySlug(slug: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(pandalTags.pandal(slug));

  const row = await prisma.pandal.findUnique({ where: { slug }, include: pandalInclude });
  return row?.published ? toPandal(row) : null;
}

/** Same-area pandals first, then the highest rated. */
export async function getNearbyPandals(pandalId: string, limit = 3) {
  const pandals = await getPandals();
  const pandal = pandals.find((item) => item.id === pandalId);
  if (!pandal) return [];
  return pandals
    .filter((item) => item.id !== pandalId)
    .sort((a, b) => Number(b.area === pandal.area) - Number(a.area === pandal.area) || b.rating - a.rating)
    .slice(0, limit);
}

export async function getTiersForPandal(pandalId: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(pandalTags.tiers(pandalId));

  const rows = await prisma.ticketTier.findMany({ where: { pandalId }, orderBy: { position: "asc" } });
  return rows.map(toTicketTier);
}

/** Availability changes often; the checkout re-checks capacity on the server anyway. */
export async function getSlotsForPandal(pandalId: string, date?: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(pandalTags.slots(pandalId));

  const rows = await prisma.slot.findMany({
    where: { pandalId, ...(date ? { date: new Date(`${date}T00:00:00Z`) } : {}) },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
  return rows.map(toSlot);
}

export async function getReviewsForPandal(pandalId: string, limit = 3) {
  "use cache";
  cacheLife("hours");
  cacheTag(pandalTags.reviews(pandalId));

  const rows = await prisma.review.findMany({ where: { pandalId }, orderBy: { createdAt: "desc" }, take: limit });
  return rows.map(toReview);
}
