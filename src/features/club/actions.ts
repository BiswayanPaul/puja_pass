"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { areas } from "@/data/pandals";
import { prisma } from "@/lib/prisma";
import { getProfileGaps } from "@/server/admin";
import { requireClubAccess } from "@/server/auth/session";
import { pandalTags } from "@/server/pandals";

export type SaveProfileResult = { ok: true; message: string; profileGaps: string[] } | { ok: false; error: string };

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
