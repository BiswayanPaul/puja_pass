"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn } from "@/auth";
import { areas } from "@/data/pandals";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/server/auth/session";
import { HOUR, rateLimit } from "@/server/rate-limit";

// ─── Sign in ────────────────────────────────────────────────────────────────

export type SignInResult = { error: string };

/** Only same-site paths, so a crafted ?next= can't send people to another site. */
function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/my-bookings";
}

/** Emails a one-time sign-in link, then redirects to /login/check-email. */
export async function signInWithEmail(_: SignInResult | null, formData: FormData): Promise<SignInResult> {
  const email = z.email().safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!email.success) return { error: "Enter a valid email address." };
  const failed = { error: "We couldn't send a sign-in email. If you've asked several times, wait 15 minutes and try again." };
  let target: string;
  try {
    // `redirectTo` is where the emailed link lands; we redirect to the "check your email" page ourselves.
    target = await signIn("email", { email: email.data, redirectTo: safeNext(formData.get("next")), redirect: false });
  } catch (error) {
    if (error instanceof AuthError) return failed;
    throw error;
  }
  // When sending fails (e.g. rate limited), Auth.js returns its error page URL instead of throwing.
  if (new URL(target, "http://localhost").searchParams.has("error")) return failed;
  redirect("/login/check-email");
}

export async function signInWithGoogle(formData: FormData) {
  await signIn("google", { redirectTo: safeNext(formData.get("next")) });
}

// ─── Club applications ──────────────────────────────────────────────────────

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

/** Saves a club registration for a platform admin to review. The applicant becomes the club's owner on approval. */
export async function submitClubApplication(values: Record<string, string>): Promise<SubmitApplicationResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in to register your club." };

  const parsed = applicationSchema.safeParse(values);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  const input = parsed.data;
  if (!(await rateLimit(`club-application:${user.id}`, 3, 24 * HOUR))) {
    return { ok: false, error: "You've sent several applications today. Our team will be in touch about them." };
  }

  const [club, pending] = await Promise.all([
    prisma.club.findUnique({ where: { registrationNumber: input.registration }, select: { id: true } }),
    prisma.clubApplication.findFirst({ where: { registrationNumber: input.registration, status: "PENDING" }, select: { id: true } }),
  ]);
  if (club) return { ok: false, error: "A club with this registration number is already on PujaPass. Log in instead." };
  if (pending) return { ok: false, error: "An application with this registration number is already being reviewed." };

  await prisma.clubApplication.create({
    data: {
      submittedById: user.id,
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
