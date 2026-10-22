import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { CrowdLevel as DbCrowdLevel } from "@/generated/prisma/enums";
import { formatCompact } from "@/lib/format";
import type { Area, CrowdLevel, Pandal, Review, Slot, TicketTier } from "@/types";

// Converts database rows into the UI types in `src/types`, so components don't
// depend on Prisma's generated types.

export const pandalInclude = {
  club: { select: { name: true, verified: true } },
  images: { orderBy: { position: "asc" } },
} satisfies Prisma.PandalInclude;

type PandalRow = Prisma.PandalGetPayload<{ include: typeof pandalInclude }>;

const crowdLevels: Record<DbCrowdLevel, CrowdLevel> = {
  LOW: "Low",
  MODERATE: "Moderate",
  HIGH: "High",
  VERY_HIGH: "Very High",
};

/** @db.Date columns come back as UTC midnight. */
function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function toPandal(row: PandalRow): Pandal {
  const mapPosition = { x: row.mapX ?? 50, y: row.mapY ?? 50 };
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    clubName: row.club.name,
    clubVerified: row.club.verified,
    neighbourhood: row.neighbourhood,
    address: row.address,
    area: row.area as Area,
    category: row.category,
    imageSrc: row.coverImageUrl,
    imageAlt: row.coverImageAlt,
    gallery: row.images.map((image) => ({ src: image.url, alt: image.alt })),
    rating: Math.round(row.ratingAverage * 10) / 10,
    reviewCount: formatCompact(row.reviewCount),
    entryType: row.entryType === "FREE" ? "Free Entry" : "Paid Entry",
    highlight: row.highlight,
    tags: row.tags,
    featured: row.featured,
    ecoFriendly: row.ecoFriendly,
    theme: { title: row.themeTitle, description: row.themeDescription },
    description: row.description,
    established: row.established,
    idolArtist: row.idolArtist,
    timings: row.timings,
    crowdLevel: crowdLevels[row.crowdLevel],
    nearestMetro: row.nearestMetro,
    amenities: row.amenities,
    freeEntryInfo: row.freeEntryInfo,
    mapPosition,
    // Placeholder until pandals have real coordinates: rough distance from the
    // city centre on the stylised map. Replace with a haversine on latitude/longitude.
    distanceKm: Math.round(Math.hypot(mapPosition.x - 50, mapPosition.y - 47) * 2.5) / 10,
  };
}

export function toTicketTier(row: Prisma.TicketTierGetPayload<object>): TicketTier {
  return {
    id: row.id,
    pandalId: row.pandalId,
    name: row.name,
    description: row.description,
    price: row.price,
    perks: row.perks,
    capacityPerSlot: row.capacityPerSlot,
    active: row.active,
  };
}

export function toSlot(row: Prisma.SlotGetPayload<object>): Slot {
  return {
    id: row.id,
    pandalId: row.pandalId,
    date: toDateString(row.date),
    startTime: row.startTime,
    endTime: row.endTime,
    capacity: row.capacity,
    // A paused slot shows as sold out to visitors.
    booked: row.salesPaused ? row.capacity : row.booked,
  };
}

export function toReview(row: Prisma.ReviewGetPayload<object>): Review {
  return {
    id: row.id,
    pandalId: row.pandalId,
    author: row.authorName,
    rating: row.rating,
    date: toDateString(row.createdAt),
    comment: row.comment,
  };
}
