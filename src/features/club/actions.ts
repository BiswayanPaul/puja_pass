"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { areas } from "@/data/areas";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getProfileGaps } from "@/server/admin";
import { requireClubAccess } from "@/server/auth/session";
import { getFestivalDays } from "@/server/festival";
import { pandalTags } from "@/server/pandals";

export type SaveProfileResult = { ok: true; message: string; profileGaps: string[] } | { ok: false; error: string };
export type ClubActionResult = { ok: true; message: string } | { ok: false; error: string };

const notYours: ClubActionResult = { ok: false, error: "You can only change your own club's pandal." };

/** True if the signed-in user is an owner or admin of the club that runs this pandal. */
async function canManage(pandalId: string) {
  const access = await requireClubAccess(["OWNER", "ADMIN"], "/club/tickets");
  return access.ok && access.pandalId === pandalId;
}

/** Visitors see pass types and slots from a cache; refresh it after every change. */
function pandalChanged(pandalId: string) {
  updateTag(pandalTags.tiers(pandalId));
  updateTag(pandalTags.slots(pandalId));
  refresh();
}

const crowdLevels = { Low: "LOW", Moderate: "MODERATE", High: "HIGH", "Very High": "VERY_HIGH" } as const;

const text = (max: number) => z.string().trim().max(max);

const profileSchema = z.object({
  pandalId: z.string().min(1),
  name: text(120).min(3, "Enter the pandal's name."),
  category: text(40).min(2, "Choose a category."),
  area: z.enum(areas, "Choose an area."),
  neighbourhood: text(120).min(2, "Enter the neighbourhood."),
  address: text(300).min(10, "Enter the full address."),
  description: text(2000).min(20, "Describe the pandal in at least 20 characters."),
  highlight: text(140),
  timings: text(80),
  themeTitle: text(120),
  themeDescription: text(2000),
  idolArtist: text(120),
  nearestMetro: text(120),
  crowdLevel: z.enum(["Low", "Moderate", "High", "Very High"]),
  freeEntryInfo: text(500),
  amenities: z.array(text(40)).max(20),
  ecoFriendly: z.boolean(),
  /** Image URLs to keep, in order; the first becomes the cover. Uploads aren't supported yet. */
  gallery: z.array(z.string()).max(20),
});

export type ProfileInput = z.input<typeof profileSchema>;

/**
 * Saves the club's pandal profile. Only owners and admins of the club that
 * runs this pandal can save it. A live pandal must stay complete.
 */
export async function updatePandalProfile(input: ProfileInput): Promise<SaveProfileResult> {
  const access = await requireClubAccess(["OWNER", "ADMIN"], "/club/pandals");
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  const data = parsed.data;
  if (!access.ok || access.pandalId !== data.pandalId) return { ok: false, error: "You can only edit your own club's pandal." };

  const pandal = await prisma.pandal.findUnique({ where: { id: data.pandalId }, include: { images: true } });
  if (!pandal) return { ok: false, error: "This pandal no longer exists." };

  const gaps = getProfileGaps(data);
  if (pandal.published && gaps.length) {
    return { ok: false, error: `Your pandal is live, so these can't be empty: ${gaps.join(", ").toLowerCase()}.` };
  }

  const kept = data.gallery
    .map((url) => pandal.images.find((image) => image.url === url))
    .filter((image) => image !== undefined);

  await prisma.$transaction([
    prisma.pandal.update({
      where: { id: pandal.id },
      data: {
        name: data.name,
        category: data.category,
        area: data.area,
        neighbourhood: data.neighbourhood,
        address: data.address,
        description: data.description,
        highlight: data.highlight,
        timings: data.timings,
        themeTitle: data.themeTitle,
        themeDescription: data.themeDescription,
        idolArtist: data.idolArtist,
        nearestMetro: data.nearestMetro,
        crowdLevel: crowdLevels[data.crowdLevel],
        freeEntryInfo: data.freeEntryInfo,
        amenities: data.amenities,
        ecoFriendly: data.ecoFriendly,
        ...(kept[0] ? { coverImageUrl: kept[0].url, coverImageAlt: kept[0].alt } : {}),
      },
    }),
    // Removed photos are deleted; the rest are renumbered in the chosen order.
    prisma.pandalImage.deleteMany({ where: { pandalId: pandal.id, id: { notIn: kept.map((image) => image.id) } } }),
    ...kept.map((image, position) => prisma.pandalImage.update({ where: { id: image.id }, data: { position } })),
  ]);

  // The slug never changes, so the public URL stays the same after a rename.
  updateTag(pandalTags.pandal(pandal.slug));
  updateTag(pandalTags.list);
  refresh();
  return {
    ok: true,
    profileGaps: gaps,
    message: pandal.published
      ? "Saved. Your public page is updated."
      : gaps.length
        ? `Saved. Still needed before it can go live: ${gaps.join(", ").toLowerCase()}.`
        : "Saved. Your profile is complete; PujaPass will review and publish it.",
  };
}

// ─── Pass types ─────────────────────────────────────────────────────────────

const tierSchema = z.object({
  pandalId: z.string().min(1),
  /** Absent when creating a new pass type. */
  tierId: z.string().min(1).optional(),
  name: text(60).min(2, "Name the pass type."),
  description: text(300).min(5, "Describe what the pass includes."),
  price: z.number("Enter a price.").int("Prices are in whole rupees.").min(0).max(100_000),
  capacityPerSlot: z.number("Enter how many visitors per slot.").int().min(1, "Allow at least 1 visitor per slot.").max(100_000),
  perks: z.array(text(60)).max(10),
});

export async function saveTicketTier(input: z.input<typeof tierSchema>): Promise<ClubActionResult> {
  const parsed = tierSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  const { pandalId, tierId, ...data } = parsed.data;
  if (!(await canManage(pandalId))) return notYours;

  if (tierId) {
    const updated = await prisma.ticketTier.updateMany({ where: { id: tierId, pandalId }, data });
    if (!updated.count) return { ok: false, error: "This pass type no longer exists." };
  } else {
    const position = await prisma.ticketTier.count({ where: { pandalId } });
    await prisma.ticketTier.create({ data: { ...data, pandalId, position } });
  }
  pandalChanged(pandalId);
  return { ok: true, message: tierId ? "Pass type saved." : "Pass type created and on sale." };
}

export async function setTierActive(tierId: string, active: boolean): Promise<ClubActionResult> {
  const tier = await prisma.ticketTier.findUnique({ where: { id: tierId }, select: { pandalId: true } });
  if (!tier || !(await canManage(tier.pandalId))) return notYours;
  await prisma.ticketTier.update({ where: { id: tierId }, data: { active } });
  pandalChanged(tier.pandalId);
  return { ok: true, message: active ? "Back on sale." : "Taken off sale. Existing passes stay valid." };
}

// ─── Entry windows (slots) ──────────────────────────────────────────────────

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour times like 18:00.");

const addSlotsSchema = z.object({
  pandalId: z.string().min(1),
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1, "Pick at least one day."),
  windows: z
    .array(z.object({ start: time, end: time }).refine((window) => window.end > window.start, "Each window must end after it starts (same day)."))
    .min(1, "Pick at least one entry window.")
    .max(24),
  capacity: z.number("Enter a capacity.").int().min(1, "Allow at least 1 visitor per window.").max(100_000),
});

/** Creates every chosen window on every chosen day; windows that already exist are left alone. */
export async function addSlots(input: z.input<typeof addSlotsSchema>): Promise<ClubActionResult> {
  const parsed = addSlotsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  const { pandalId, dates, windows, capacity } = parsed.data;
  if (!(await canManage(pandalId))) return notYours;
  const festivalDays = await getFestivalDays();
  if (!dates.every((date) => festivalDays.some((day) => day.date === date))) return { ok: false, error: "Pick festival days only." };

  const rows = dates.flatMap((date) =>
    windows.map((window) => ({ pandalId, date: new Date(`${date}T00:00:00Z`), startTime: window.start, endTime: window.end, capacity })),
  );
  // Unique on (pandal, date, start time): an existing window isn't duplicated or changed.
  const { count } = await prisma.slot.createMany({ data: rows, skipDuplicates: true });
  pandalChanged(pandalId);
  const skipped = rows.length - count;
  return {
    ok: true,
    message: `Added ${count} entry ${count === 1 ? "window" : "windows"}.${skipped ? ` ${skipped} already existed and ${skipped === 1 ? "was" : "were"} left unchanged.` : ""}`,
  };
}

const updateSlotSchema = z.object({
  slotId: z.string().min(1),
  capacity: z.number().int().min(1, "Capacity must be at least 1.").max(100_000).optional(),
  salesPaused: z.boolean().optional(),
});

export async function updateSlot(input: z.input<typeof updateSlotSchema>): Promise<ClubActionResult> {
  const parsed = updateSlotSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the value and try again." };
  const { slotId, capacity, salesPaused } = parsed.data;
  const slot = await prisma.slot.findUnique({ where: { id: slotId }, select: { pandalId: true, booked: true } });
  if (!slot || !(await canManage(slot.pandalId))) return notYours;

  // Conditional update, so a booking made meanwhile can't leave the slot oversold.
  const updated = await prisma.slot.updateMany({
    where: { id: slotId, ...(capacity !== undefined ? { booked: { lte: capacity } } : {}) },
    data: { capacity, salesPaused },
  });
  if (!updated.count) return { ok: false, error: `Capacity can't go below the ${slot.booked} places already booked.` };
  pandalChanged(slot.pandalId);
  return { ok: true, message: salesPaused === undefined ? "Capacity saved." : salesPaused ? "Sales paused for this window." : "Sales reopened." };
}

/** Removes an entry window nobody has booked. Booked windows should be paused instead. */
export async function deleteSlot(slotId: string): Promise<ClubActionResult> {
  const slot = await prisma.slot.findUnique({ where: { id: slotId }, select: { pandalId: true, _count: { select: { passes: true } } } });
  if (!slot || !(await canManage(slot.pandalId))) return notYours;
  if (slot._count.passes) return { ok: false, error: "This window has bookings. Pause its sales instead." };
  try {
    await prisma.slot.delete({ where: { id: slotId } });
  } catch (error) {
    // A booking arrived between the check and the delete.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return { ok: false, error: "This window has bookings. Pause its sales instead." };
    }
    throw error;
  }
  pandalChanged(slot.pandalId);
  return { ok: true, message: "Entry window removed." };
}
