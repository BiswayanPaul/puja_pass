// Makes an account a platform admin: `bun run admin:grant you@example.com`.
// Creates the user if they haven't signed in yet; they sign in with that email.

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !email.includes("@")) {
  console.error("Usage: bun run admin:grant <email>");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: (process.env.DIRECT_URL ?? process.env.DATABASE_URL)! }) });
const user = await prisma.user.upsert({
  where: { email },
  update: { role: "PLATFORM_ADMIN" },
  create: { email, role: "PLATFORM_ADMIN" },
});
console.log(`${user.email} is now a platform admin.`);
await prisma.$disconnect();
