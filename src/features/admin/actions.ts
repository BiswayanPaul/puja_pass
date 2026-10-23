"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import type { CrowdLevel } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { getProfileGaps } from "@/server/admin";
import { requirePlatformAdmin } from "@/server/auth/session";
import { pandalTags } from "@/server/pandals";

export type ActionResult =
  { ok: true; message: string } | { ok: false; error: string };

const fail = (error: string): ActionResult => ({ ok: false, error });

/** The parsed form data, or the first validation message. */
function parse<T extends z.ZodType>(
  schema: T,
  formData: FormData,
): { ok: true; data: z.infer<T> } | { ok: false; error: string } {
  const result = schema.safeParse(Object.fromEntries(formData));
  return result.success
    ? { ok: true, data: result.data }
    : { ok: false, error: result.error.issues[0]?.message ?? "Invalid input." };
}

const footfallToCrowd: Record<string, CrowdLevel> = {
  "Under 5,000": "LOW",
  "5,000 – 25,000": "MODERATE",
  "25,000 – 1,00,000": "HIGH",
  "Over 1,00,000": "VERY_HIGH",
};

async function uniqueSlug(tx: Prisma.TransactionClient, name: string) {
  const base =
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "pandal";
  const taken = new Set(
    (
      await tx.pandal.findMany({
        where: { slug: { startsWith: base } },
        select: { slug: true },
      })
    ).map((row) => row.slug),
  );
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  return slug;
}

// ─── Applications ───────────────────────────────────────────────────────────

const approveSchema = z.object({
  applicationId: z.string().min(1),
  notes: z.string().trim().max(1000).optional(),
  documentsOverride: z.literal("on").optional(),
});

/**
 * Approves a pending application: creates the verified club, makes the
 * applicant its owner, and creates an unpublished draft pandal to complete.
 */
export async function approveApplication(
  _: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requirePlatformAdmin();
  const input = parse(approveSchema, formData);
  if (!input.ok) return fail(input.error);
  const { applicationId, notes, documentsOverride } = input.data;

  const application = await prisma.clubApplication.findUnique({
    where: { id: applicationId },
  });
  if (!application) return fail("This application no longer exists.");
  if (application.status !== "PENDING")
    return fail("This application has already been reviewed.");

  const missingDocuments =
    !application.certificateUrl || !application.permissionUrl;
  if (missingDocuments && !documentsOverride) {
    return fail(
      "Documents are missing. Confirm you have checked them another way, or reject the application.",
    );
  }
  const duplicate = await prisma.club.findUnique({
    where: { registrationNumber: application.registrationNumber },
  });
  if (duplicate)
    return fail(
      `${duplicate.name} is already registered with ${application.registrationNumber}.`,
    );

  const reviewNotes =
    [
      notes,
      missingDocuments
        ? "Missing documents were verified outside PujaPass."
        : null,
    ]
      .filter(Boolean)
      .join(" ") || null;

  try {
    await prisma.$transaction(async (tx) => {
      // Claim the application first so two admins can't approve it twice.
      const claimed = await tx.clubApplication.updateMany({
        where: { id: applicationId, status: "PENDING" },
        data: {
          status: "APPROVED",
          reviewedAt: new Date(),
          reviewedById: admin.id,
          reviewNotes,
        },
      });
      if (!claimed.count) throw new Error("ALREADY_REVIEWED");

      const club = await tx.club.create({
        data: {
          name: application.clubName,
          registrationNumber: application.registrationNumber,
          established: application.established,
          verified: true,
          verifiedAt: new Date(),
        },
      });

      await tx.pandal.create({
        data: {
          clubId: club.id,
          slug: await uniqueSlug(tx, application.clubName),
          name: application.clubName,
          neighbourhood: `${application.area}, Kolkata`,
          address: application.address,
          area: application.area,
          category: "Community",
          coverImageUrl: "/images/Grandly Lit Durga Puja Pandal at Night.png",
          coverImageAlt: "Placeholder photo until the club uploads its own",
          entryType: "FREE",
          highlight: "",
          tags: [],
          themeTitle: application.theme ?? "",
          themeDescription: "",
          description: application.description,
          established: application.established,
          idolArtist: "",
          timings: "",
          crowdLevel:
            footfallToCrowd[application.expectedFootfall] ?? "MODERATE",
          nearestMetro: "",
          amenities: [],
          freeEntryInfo: "General entry is free for everyone.",
          published: false,
        },
      });

      if (application.submittedById) {
        await tx.clubMember.create({
          data: {
            userId: application.submittedById,
            clubId: club.id,
            role: "OWNER",
          },
        });
        await tx.user.updateMany({
          where: { id: application.submittedById, role: "VISITOR" },
          data: { role: "CLUB_ADMIN" },
        });
      }

      await tx.clubApplication.update({
        where: { id: applicationId },
        data: { clubId: club.id },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ALREADY_REVIEWED")
      return fail("This application has already been reviewed.");
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return fail(
        `Another club is already registered with ${application.registrationNumber}.`,
      );
    }
    throw error;
  }

  refresh();
  return {
    ok: true,
    message: `${application.clubName} is approved. A draft pandal was created for the club to complete.`,
  };
}

const rejectSchema = z.object({
  applicationId: z.string().min(1),
  notes: z
    .string()
    .trim()
    .min(10, "Tell the club why, in at least 10 characters.")
    .max(1000),
});

export async function rejectApplication(
  _: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requirePlatformAdmin();
  const input = parse(rejectSchema, formData);
  if (!input.ok) return fail(input.error);
  const { applicationId, notes } = input.data;

  const rejected = await prisma.clubApplication.updateMany({
    where: { id: applicationId, status: "PENDING" },
    data: {
      status: "REJECTED",
      reviewNotes: notes,
      reviewedAt: new Date(),
      reviewedById: admin.id,
    },
  });
  if (!rejected.count)
    return fail("This application has already been reviewed.");

  refresh();
  return {
    ok: true,
    message: "Application rejected. The club can apply again.",
  };
}

// ─── Clubs ──────────────────────────────────────────────────────────────────

const revokeSchema = z.object({
  clubId: z.string().min(1),
  note: z
    .string()
    .trim()
    .min(10, "Record why, in at least 10 characters.")
    .max(1000),
});

/** Unverifies a club and takes all of its pandals off the public site. */
export async function revokeClubVerification(
  _: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requirePlatformAdmin();
  const input = parse(revokeSchema, formData);
  if (!input.ok) return fail(input.error);
  const { clubId, note } = input.data;

  const club = await prisma.club.findUnique({
    where: { id: clubId },
    include: { pandals: { select: { id: true, slug: true } } },
  });
  if (!club) return fail("This club no longer exists.");
  if (!club.verified) return fail("This club is already unverified.");

  await prisma.$transaction([
    prisma.club.update({
      where: { id: clubId },
      data: { verified: false, verificationNote: note },
    }),
    prisma.pandal.updateMany({
      where: { clubId },
      data: { published: false, featured: false },
    }),
  ]);

  updateTag(pandalTags.list);
  for (const pandal of club.pandals) updateTag(pandalTags.pandal(pandal.slug));
  refresh();
  return {
    ok: true,
    message: `${club.name} is unverified and its pandals are hidden.`,
  };
}

const restoreSchema = z.object({ clubId: z.string().min(1) });

/** Re-verifies a club. Its pandals stay unpublished until an admin publishes them. */
export async function restoreClubVerification(
  _: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requirePlatformAdmin();
  const input = parse(restoreSchema, formData);
  if (!input.ok) return fail(input.error);

  const restored = await prisma.club.updateMany({
    where: { id: input.data.clubId, verified: false },
    data: { verified: true, verifiedAt: new Date(), verificationNote: null },
  });
  if (!restored.count) return fail("This club is already verified.");

  refresh();
  return {
    ok: true,
    message: "Club verified again. Publish its pandals from the Pandals page.",
  };
}

// ─── Pandals ────────────────────────────────────────────────────────────────

const publishSchema = z.object({
  pandalId: z.string().min(1),
  publish: z.enum(["true", "false"]),
});

export async function setPandalPublished(
  _: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requirePlatformAdmin();
  const input = parse(publishSchema, formData);
  if (!input.ok) return fail(input.error);
  const publish = input.data.publish === "true";

  const pandal = await prisma.pandal.findUnique({
    where: { id: input.data.pandalId },
    include: { club: { select: { verified: true } } },
  });
  if (!pandal) return fail("This pandal no longer exists.");
  if (publish) {
    if (!pandal.club.verified)
      return fail("Verify the club before publishing its pandal.");
    const gaps = getProfileGaps(pandal);
    if (gaps.length)
      return fail(
        `Complete the profile first: ${gaps.join(", ").toLowerCase()}.`,
      );
  }

  await prisma.pandal.update({
    where: { id: pandal.id },
    // Unpublishing also removes the pandal from the featured list.
    data: publish ? { published: true } : { published: false, featured: false },
  });

  updateTag(pandalTags.list);
  updateTag(pandalTags.pandal(pandal.slug));
  refresh();
  return {
    ok: true,
    message: publish
      ? `${pandal.name} is live.`
      : `${pandal.name} is hidden from visitors.`,
  };
}

const featureSchema = z.object({
  pandalId: z.string().min(1),
  featured: z.enum(["true", "false"]),
});

export async function setPandalFeatured(
  _: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requirePlatformAdmin();
  const input = parse(featureSchema, formData);
  if (!input.ok) return fail(input.error);
  const featured = input.data.featured === "true";

  const updated = await prisma.pandal.updateMany({
    // Only live pandals can be featured.
    where: {
      id: input.data.pandalId,
      ...(featured ? { published: true, club: { verified: true } } : {}),
    },
    data: { featured },
  });
  if (!updated.count) return fail("Only live pandals can be featured.");

  updateTag(pandalTags.list);
  refresh();
  return {
    ok: true,
    message: featured
      ? "Added to featured pandals."
      : "Removed from featured pandals.",
  };
}
