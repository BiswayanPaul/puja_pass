import NextAuth from "next-auth";
import type { EmailConfig } from "next-auth/providers/email";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { prismaAdapter } from "@/server/auth/adapter";
import { sendSignInEmail } from "@/server/notifications/sign-in-email";
import { HOUR, ipFromHeaders, rateLimit } from "@/server/rate-limit";
import type { SessionClub } from "@/types";

// Auth.js configuration. Passwordless: "Continue with Google" (enabled when
// AUTH_GOOGLE_ID/AUTH_GOOGLE_SECRET are set) or a one-time email link.
// Sessions live in the database so they can be revoked. Authorisation checks
// live in src/server/auth/session.ts, not here.

/** Thrown when sign-in emails are requested too often; shown on /login as error=EmailSignin. */
class TooManySignInEmails extends Error {}

const emailLink: EmailConfig = {
  id: "email",
  type: "email",
  name: "Email",
  maxAge: 60 * 60,
  async sendVerificationRequest({ identifier, url, request }) {
    // Each link is an email from our Gmail account (≈500/day), so cap them. The
    // per-IP cap is generous because Indian mobile networks share IPs widely.
    const ip = ipFromHeaders(request.headers);
    const allowed =
      (await rateLimit(`sign-in:email:${identifier}`, 3, HOUR / 4)) && (await rateLimit(`sign-in:ip:${ip}`, 20, HOUR));
    if (!allowed) throw new TooManySignInEmails("Too many sign-in emails requested.");
    await sendSignInEmail(identifier, url);
  },
};

async function primaryClub(userId: string): Promise<SessionClub | null> {
  const membership = await prisma.clubMember.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: {
      role: true,
      club: {
        select: {
          id: true,
          name: true,
          verified: true,
          pandals: { select: { slug: true, published: true }, orderBy: { createdAt: "asc" }, take: 1 },
        },
      },
    },
  });
  if (!membership) return null;
  const { club, role } = membership;
  return { id: club.id, name: club.name, verified: club.verified, role, pandal: club.pandals[0] ?? null };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: prismaAdapter(),
  session: { strategy: "database", maxAge: 30 * 24 * 60 * 60 },
  // Vercel and localhost both set the Host header we can trust.
  trustHost: true,
  providers: [
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? // Google verifies email addresses, so it's safe to sign into an account first created with an email link.
        [Google({ allowDangerousEmailAccountLinking: true })]
      : []),
    emailLink,
  ],
  pages: { signIn: "/login", verifyRequest: "/login/check-email", error: "/login" },
  callbacks: {
    async session({ session, user }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
          isPlatformAdmin: user.role === "PLATFORM_ADMIN",
          club: await primaryClub(user.id),
        },
      };
    },
  },
  events: {
    // Bookings made as a guest with this (now verified) email join the account.
    async signIn({ user }) {
      if (!user.id || !user.email) return;
      await prisma.booking.updateMany({ where: { userId: null, contactEmail: user.email.toLowerCase() }, data: { userId: user.id } });
    },
  },
});
