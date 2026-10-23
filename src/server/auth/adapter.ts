import "server-only";
import type { Adapter, AdapterAccount, AdapterUser } from "next-auth/adapters";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

// Auth.js database adapter for our Prisma 7 client. (The official
// @auth/prisma-adapter only supports Prisma up to 6.) Implements what database
// sessions, Google sign-in and email links need.

type UserRow = { id: string; email: string | null; emailVerified: Date | null; name: string | null; image: string | null; role: string };

function toAdapterUser(user: UserRow): AdapterUser {
  return { id: user.id, email: user.email ?? "", emailVerified: user.emailVerified, name: user.name, image: user.image, role: user.role };
}

const isNotFound = (error: unknown) => error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";

export function prismaAdapter(): Adapter {
  return {
    async createUser({ email, emailVerified, name, image }) {
      return toAdapterUser(await prisma.user.create({ data: { email: email.toLowerCase(), emailVerified, name: name ?? null, image } }));
    },
    async getUser(id) {
      const user = await prisma.user.findUnique({ where: { id } });
      return user && toAdapterUser(user);
    },
    async getUserByEmail(email) {
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      return user && toAdapterUser(user);
    },
    async getUserByAccount({ provider, providerAccountId }) {
      const account = await prisma.account.findUnique({
        where: { provider_providerAccountId: { provider, providerAccountId } },
        include: { user: true },
      });
      return account && toAdapterUser(account.user);
    },
    async updateUser({ id, email, emailVerified, name, image }) {
      return toAdapterUser(
        await prisma.user.update({ where: { id }, data: { email: email?.toLowerCase(), emailVerified, name, image } }),
      );
    },
    async linkAccount(account: AdapterAccount) {
      await prisma.account.create({
        data: {
          userId: account.userId,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: account.refresh_token,
          access_token: account.access_token,
          expires_at: account.expires_at,
          token_type: account.token_type,
          scope: account.scope,
          id_token: account.id_token,
          session_state: typeof account.session_state === "string" ? account.session_state : null,
        },
      });
    },
    async createSession(session) {
      return prisma.session.create({ data: session });
    },
    async getSessionAndUser(sessionToken) {
      const session = await prisma.session.findUnique({ where: { sessionToken }, include: { user: true } });
      if (!session) return null;
      const { user, ...rest } = session;
      return { session: rest, user: toAdapterUser(user) };
    },
    async updateSession({ sessionToken, expires }) {
      try {
        return await prisma.session.update({ where: { sessionToken }, data: { expires } });
      } catch (error) {
        if (isNotFound(error)) return null;
        throw error;
      }
    },
    async deleteSession(sessionToken) {
      await prisma.session.deleteMany({ where: { sessionToken } });
    },
    async createVerificationToken(token) {
      return prisma.verificationToken.create({ data: token });
    },
    async useVerificationToken({ identifier, token }) {
      // One-time use: deleting returns the token, or nothing if it was used already.
      try {
        return await prisma.verificationToken.delete({ where: { identifier_token: { identifier, token } } });
      } catch (error) {
        if (isNotFound(error)) return null;
        throw error;
      }
    },
  };
}
