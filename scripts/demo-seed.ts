// Sets up the demo pandal on a live database without touching real clubs:
//   bun run demo:seed you+demo@gmail.com
// 1. Removes the old sample content (real club names with invented data),
//    identified by the exact ids the old seed used. Safe to run repeatedly.
// 2. Builds the demo pandal, owned by the given email (see prisma/demo.ts).

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { seedDemo } from "../prisma/demo";

const ownerEmail = process.argv[2]?.trim().toLowerCase();
if (!ownerEmail || !ownerEmail.includes("@")) {
  console.error("Usage: bun run demo:seed <owner-email>");
  process.exit(1);
}

const LEGACY = {
  pandals: [
    "sreebhumi-sporting-club", "santosh-mitra-square", "badamtala-ashar-sangha", "bagbazar-sarbojanin", "deshapriya-park", "tridhara-sammilani",
    "ekdalia-evergreen", "kumartuli-park", "college-square", "suruchi-sangha", "fd-block-salt-lake", "newtown-cc-block",
    "kankurgachi-milan-tirtha", "beleghata-sandhani", "rajdanga-udayan-sangha",
  ],
  extraClubs: ["club-milan-tirtha", "club-sandhani", "club-udayan"],
  applications: ["app-bandhu-mahal", "app-dakshin-sreepur", "app-lalbagan", "app-milan-tirtha", "app-nabapally", "app-purbachal", "app-sandhani", "app-sreebhumi-duplicate", "app-udayan"],
  users: ["user-admin-1", "user-applicant-1", "user-applicant-2", "user-applicant-3", "user-applicant-4", "user-club-1", "user-visitor-1"],
};

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: (process.env.DIRECT_URL ?? process.env.DATABASE_URL)! }),
  transactionOptions: { maxWait: 20_000, timeout: 120_000 },
});

async function removeLegacySamples() {
  const pandalIds = LEGACY.pandals;
  const clubIds = [...pandalIds.map((id) => `club-${id}`), ...LEGACY.extraClubs];
  const onLegacy = { passes: { some: { slot: { pandalId: { in: pandalIds } } } } };
  const realBookings = await prisma.booking.count({ where: { ...onLegacy, NOT: { contactEmail: { endsWith: "example.com" } } } });

  await prisma.checkIn.deleteMany({ where: { pandalId: { in: pandalIds } } });
  const bookings = await prisma.booking.deleteMany({ where: onLegacy });
  const pandals = await prisma.pandal.deleteMany({ where: { id: { in: pandalIds } } });
  const clubs = await prisma.club.deleteMany({ where: { id: { in: clubIds } } });
  const applications = await prisma.clubApplication.deleteMany({ where: { id: { in: LEGACY.applications } } });
  const users = await prisma.user.deleteMany({ where: { id: { in: LEGACY.users } } });
  return { pandals: pandals.count, clubs: clubs.count, applications: applications.count, users: users.count, bookings: bookings.count, realUsersTestBookings: realBookings };
}

try {
  console.log("Removed old sample content:", await removeLegacySamples());
  console.log("Demo pandal ready:", await seedDemo(prisma, ownerEmail));
  console.log(`Sign in as ${ownerEmail} to see the demo club's dashboard and scanner.`);
} finally {
  await prisma.$disconnect();
}
