"use server";

import { z } from "zod";
import { areas } from "@/data/pandals";
import { prisma } from "@/lib/prisma";

export type SubmitApplicationResult = { ok: true } | { ok: false; error: string };

const applicationSchema = z.object({
  clubName: z.string().trim().min(3, "Enter the club's name.").max(120),
  registration: z.string().trim().min(3, "Enter the society registration number.").max(40),
  established: z.coerce
    .number()
    .int()
    .min(1800, "Enter a valid year of establishment.")
    .refine((year) => year <= new Date().getFullYear(), "The year of establishment can't be in the future."),
  area: z.enum(areas, "Select an area."),
  address: z.string().trim().min(10, "Enter the full pandal address.").max(300),
  theme: z.string().trim().max(120).optional(),
  description: z.string().trim().min(20, "Describe your Puja in at least 20 characters.").max(1000),
  footfall: z.string().trim().min(1, "Select the expected footfall."),
  offers: z.string().optional(),
  contactName: z.string().trim().min(2, "Enter the contact person's name.").max(80),
  contactRole: z.string().trim().min(2, "Enter the contact person's role.").max(60),
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  phone: z.string().trim().regex(/^[+0-9 ]{10,16}$/, "Enter a valid mobile number."),
  certificate: z.string().trim().max(200).optional(),
  permission: z.string().trim().max(200).optional(),
});

/** Saves a club registration for a platform admin to review. */
export async function submitClubApplication(values: Record<string, string>): Promise<SubmitApplicationResult> {
  const parsed = applicationSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  const input = parsed.data;

  const [club, pending] = await Promise.all([
    prisma.club.findUnique({ where: { registrationNumber: input.registration }, select: { id: true } }),
    prisma.clubApplication.findFirst({ where: { registrationNumber: input.registration, status: "PENDING" }, select: { id: true } }),
  ]);
  if (club) return { ok: false, error: "A club with this registration number is already on PujaPass. Log in instead." };
  if (pending) return { ok: false, error: "An application with this registration number is already being reviewed." };

  // TODO(auth): set `submittedById` to the signed-in user.
  await prisma.clubApplication.create({
    data: {
      clubName: input.clubName,
      registrationNumber: input.registration,
      established: input.established,
      area: input.area,
      address: input.address,
      theme: input.theme || null,
      description: input.description,
      expectedFootfall: input.footfall,
      offerings: input.offers ? input.offers.split(", ").filter(Boolean) : [],
      contactName: input.contactName,
      contactRole: input.contactRole,
      email: input.email,
      phone: input.phone,
      // File names only until uploads are stored.
      certificateUrl: input.certificate || null,
      permissionUrl: input.permission || null,
    },
  });
  return { ok: true };
}
