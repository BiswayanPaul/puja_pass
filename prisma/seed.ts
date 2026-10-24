// Resets a development database: deletes every row, adds the 2026 festival
// days and builds the demo pandal (prisma/demo.ts).
// Run with `bun run db:seed` (also runs after `prisma migrate reset`).
// It wipes the tables first, so never run it against a live database; use
// `bun run demo:seed <email>` there instead.

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedDemo } from "./demo";

// Like the Prisma CLI, prefer the direct (session-mode) connection over the
// pooled one. A remote database can take seconds to connect, longer than
// Prisma's default 2s wait to start a transaction, so allow more time.
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: connectionString! }),
  transactionOptions: { maxWait: 20_000, timeout: 120_000 },
});

/** The 2026 season; change them in /admin/festival. */
const festivalDays = [
  ["2026-09-28", "Shashthi"],
  ["2026-09-29", "Saptami"],
  ["2026-09-30", "Ashtami"],
  ["2026-10-01", "Navami"],
  ["2026-10-02", "Dashami"],
];

async function main() {
  // Children before parents.
  await prisma.$transaction([
    prisma.checkIn.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.pass.deleteMany(),
    prisma.booking.deleteMany(),
    prisma.review.deleteMany(),
    prisma.savedPandal.deleteMany(),
    prisma.slot.deleteMany(),
    prisma.ticketTier.deleteMany(),
    prisma.pandalImage.deleteMany(),
    prisma.pandal.deleteMany(),
    prisma.clubApplication.deleteMany(),
    prisma.clubMember.deleteMany(),
    prisma.club.deleteMany(),
    prisma.user.deleteMany(), // also removes sessions and linked accounts
    prisma.verificationToken.deleteMany(),
    prisma.rateLimitHit.deleteMany(),
    prisma.festivalDay.deleteMany(),
  ]);

  await prisma.festivalDay.createMany({ data: festivalDays.map(([date, label]) => ({ date: new Date(`${date}T00:00:00Z`), label })) });
  const demo = await seedDemo(prisma, process.env.DEMO_OWNER_EMAIL || "demo-owner@pujapass.example");
  console.log("Seeded:", { festivalDays: festivalDays.length, ...demo });
  console.log("Make yourself an admin with `bun run admin:grant <email>`.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
