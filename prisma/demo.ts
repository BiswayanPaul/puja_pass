// The demo pandal: one fictional club with a season of realistic bookings,
// check-ins and reviews, for showing PujaPass to an audience. Everything is
// ordinary database rows, so every page reads it like real data.
//
// Idempotent: running it again regenerates the demo's bookings, slots and
// reviews (on the current festival days) without touching any other club.
// Bookings are written without notifications, so no emails are sent.

import type { Prisma, PrismaClient } from "../src/generated/prisma/client";
import { slotTimes } from "../src/data/festival";

export const DEMO_PANDAL_ID = "pujapass-demo-sarbojanin";
export const DEMO_CLUB_ID = "club-pujapass-demo";

/** Small deterministic random generator, so every run produces the same demo. */
function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const firstNames = ["Ananya", "Arjun", "Debolina", "Rohan", "Ishita", "Sayan", "Priyanka", "Aritra", "Moumita", "Soumya", "Tanushree", "Rahul", "Sneha", "Abhishek", "Paromita", "Subhajit", "Rituparna", "Kaushik", "Madhurima", "Sourav", "Trisha", "Anirban", "Shreya", "Debjit"];
const lastNames = ["Banerjee", "Chatterjee", "Mukherjee", "Ghosh", "Bose", "Das", "Sen", "Roy", "Dutta", "Saha", "Mitra", "Chakraborty", "Bhattacharya", "Paul", "Sarkar", "Majumdar"];
const reviewComments = [
  "Timed entry meant we walked straight in with the kids. The lighting was stunning.",
  "Booked three pandals in one go. The QR scan at the gate took seconds.",
  "Beautiful theme and very well organised queues.",
  "Went on Ashtami evening: crowded outside, calm inside the PujaPass lane.",
  "Loved the idol work. Worth every rupee of the priority pass.",
  "Smooth booking, friendly volunteers, great prasad.",
  "Our family's favourite this year. Will book again next Puja.",
];

export async function seedDemo(prisma: PrismaClient, ownerEmail: string) {
  const rand = random(2026);
  const pick = <T>(items: T[]) => items[Math.floor(rand() * items.length)];
  const code = (length: number) => Array.from({ length }, () => CODE_CHARS[Math.floor(rand() * CODE_CHARS.length)]).join("");

  const festivalDays = await prisma.festivalDay.findMany({ orderBy: { date: "asc" } });
  if (!festivalDays.length) throw new Error("No festival days. Add them in /admin/festival first.");

  // ── Owner, club and pandal ──────────────────────────────────────────────
  const owner = await prisma.user.upsert({ where: { email: ownerEmail }, update: {}, create: { email: ownerEmail, name: "Demo Club Owner" } });
  await prisma.club.upsert({
    where: { id: DEMO_CLUB_ID },
    update: { verified: true },
    create: { id: DEMO_CLUB_ID, name: "PujaPass Demo Sarbojanin Club", registrationNumber: "DEMO-0001", established: 1975, verified: true, verifiedAt: new Date("2026-08-15T00:00:00Z") },
  });
  // The given email is the demo's only owner.
  await prisma.clubMember.deleteMany({ where: { clubId: DEMO_CLUB_ID, userId: { not: owner.id } } });
  await prisma.clubMember.upsert({
    where: { userId_clubId: { userId: owner.id, clubId: DEMO_CLUB_ID } },
    update: { role: "OWNER" },
    create: { userId: owner.id, clubId: DEMO_CLUB_ID, role: "OWNER" },
  });
  if (owner.role === "VISITOR") await prisma.user.update({ where: { id: owner.id }, data: { role: "CLUB_ADMIN" } });

  const profile = {
    name: "PujaPass Demo Sarbojanin",
    neighbourhood: "Salt Lake, Kolkata",
    address: "Demo Park, Sector 1, Salt Lake, Kolkata 700064",
    area: "Salt Lake",
    category: "Art & Heritage",
    coverImageUrl: "/images/Golden Durga Puja Pandal at Night.png",
    coverImageAlt: "A golden pandal facade lit up at night",
    entryType: "PAID" as const,
    highlight: "A demo pandal showing how PujaPass works, end to end",
    tags: ["Most Popular", "Theme Based"],
    featured: true,
    ecoFriendly: true,
    published: true,
    themeTitle: "Alor Utsav",
    themeDescription: "Thousands of hand-made lanterns trace the story of Mahishasura Mardini along the approach lane.",
    description: "A fictional pandal created to demonstrate PujaPass: timed-entry passes, QR check-in at the gate and live dashboards for the club.",
    established: 1975,
    idolArtist: "Demo Studio, Kumartuli",
    timings: "10:00 AM – 1:00 AM",
    crowdLevel: "HIGH" as const,
    nearestMetro: "Karunamoyee (1.2 km)",
    amenities: ["Drinking water", "First aid", "Wheelchair access", "Help desk", "Priority queue"],
    freeEntryInfo: "General entry is free for everyone through the main gate. Passes are only for the dedicated PujaPass lane.",
    mapX: 72,
    mapY: 38,
  };
  await prisma.pandal.upsert({ where: { id: DEMO_PANDAL_ID }, update: profile, create: { id: DEMO_PANDAL_ID, slug: DEMO_PANDAL_ID, clubId: DEMO_CLUB_ID, ...profile } });

  // ── Clear the previous demo season ──────────────────────────────────────
  const demoSlots = { slot: { pandalId: DEMO_PANDAL_ID } };
  await prisma.checkIn.deleteMany({ where: { pandalId: DEMO_PANDAL_ID } });
  await prisma.booking.deleteMany({ where: { passes: { some: demoSlots } } });
  await prisma.$transaction([
    prisma.slot.deleteMany({ where: { pandalId: DEMO_PANDAL_ID } }),
    prisma.ticketTier.deleteMany({ where: { pandalId: DEMO_PANDAL_ID } }),
    prisma.review.deleteMany({ where: { pandalId: DEMO_PANDAL_ID } }),
    prisma.pandalImage.deleteMany({ where: { pandalId: DEMO_PANDAL_ID } }),
  ]);

  await prisma.pandalImage.createMany({
    data: [
      { url: "/images/Golden Durga Puja Pandal at Night.png", alt: "The pandal's golden facade at night" },
      { url: "/images/hd-durga-maa-wallpaper--1768547744065.jpeg", alt: "Close-up of the Durga idol" },
      { url: "/images/Bengali-Women-Performing-Dhunuchi-Dance-On-The-Occasion-Of-Durga-Puja-Hinduism.webp", alt: "Dhunuchi dance in front of the idol" },
      { url: "/images/Grandly Lit Durga Puja Pandal at Night.png", alt: "Visitors outside the lit pandal" },
    ].map((image, position) => ({ ...image, position, pandalId: DEMO_PANDAL_ID })),
  });

  const tiers = [
    { id: `${DEMO_PANDAL_ID}-timed`, name: "Timed Entry", description: "Enter through the dedicated PujaPass lane within your window.", price: 99, capacityPerSlot: 600, perks: ["Dedicated entry lane", "Skip the general queue"], share: 0.78 },
    { id: `${DEMO_PANDAL_ID}-priority`, name: "Priority Darshan", description: "Closest viewing area with a guided walk-through of the pandal.", price: 299, capacityPerSlot: 150, perks: ["Front viewing gallery", "Guided walk-through", "Prasad pack"], share: 0.22 },
  ];
  await prisma.ticketTier.createMany({
    data: tiers.map((tier, position) => ({
      id: tier.id,
      name: tier.name,
      description: tier.description,
      price: tier.price,
      capacityPerSlot: tier.capacityPerSlot,
      perks: tier.perks,
      pandalId: DEMO_PANDAL_ID,
      position,
    })),
  });

  // ── Slots and bookings ──────────────────────────────────────────────────
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  const dayDemand = [0.55, 0.75, 1, 0.9, 0.35]; // Ashtami and Navami are the busiest
  const timeDemand = [0.35, 0.45, 0.7, 1, 0.95, 0.6]; // evenings fill up first
  const capacity = tiers.reduce((total, tier) => total + tier.capacityPerSlot, 0);
  const usedCodes = new Set<string>();
  const usedRefs = new Set<string>();

  const slots: Prisma.SlotCreateManyInput[] = [];
  const bookings: Prisma.BookingCreateManyInput[] = [];
  const passes: Prisma.PassCreateManyInput[] = [];
  const payments: Prisma.PaymentCreateManyInput[] = [];
  const checkIns: Prisma.CheckInCreateManyInput[] = [];

  festivalDays.forEach((day, dayIndex) => {
    const date = day.date.toISOString().slice(0, 10);
    const past = date < today;
    slotTimes.forEach(([startTime, endTime], timeIndex) => {
      const slotId = `${DEMO_PANDAL_ID}_${date}_${startTime.replace(":", "")}`;
      const target = Math.round(capacity * (dayDemand[dayIndex % dayDemand.length] ?? 0.6) * (timeDemand[timeIndex] ?? 0.6) * (0.85 + rand() * 0.15));
      let booked = 0;
      while (booked < target) {
        const tier = rand() < tiers[0].share ? tiers[0] : tiers[1];
        const quantity = Math.min(target - booked, pick([1, 2, 2, 3, 3, 4, 4, 5, 6]));
        const cancelled = rand() < 0.04;
        let reference: string;
        do reference = `PP26-${code(6)}`;
        while (usedRefs.has(reference));
        usedRefs.add(reference);
        let passCode: string;
        do passCode = `PUJ-${date.slice(8, 10)}${date.slice(5, 7)}-${code(4)}`;
        while (usedCodes.has(passCode));
        usedCodes.add(passCode);

        const first = pick(firstNames);
        const last = pick(lastNames);
        const bookingId = `demo-bk-${reference}`;
        const passId = `demo-ps-${reference}`;
        const subtotal = tier.price * quantity;
        const fees = quantity * 15;
        const createdAt = new Date(day.date.getTime() - (1 + rand() * 20) * 86_400_000);
        const method = pick(["UPI", "UPI", "UPI", "CARD", "NET_BANKING"] as const);
        bookings.push({
          id: bookingId,
          reference,
          status: cancelled ? "CANCELLED" : past ? "COMPLETED" : "CONFIRMED",
          contactName: `${first} ${last}`,
          contactEmail: `${first}.${last}.${reference.slice(5)}@demo.pujapass.example`.toLowerCase(),
          contactPhone: `+91 9${Math.floor(rand() * 1e9).toString().padStart(9, "0")}`,
          subtotal,
          fees,
          total: subtotal + fees,
          paymentMethod: method,
          createdAt,
          cancelledAt: cancelled ? new Date(createdAt.getTime() + 86_400_000) : null,
        });
        payments.push({ bookingId, provider: "demo", providerOrderId: `demo_${reference}`, providerPaymentId: `demo_pay_${reference}`, amount: subtotal + fees, status: cancelled ? "REFUNDED" : "PAID", method, createdAt });

        // Past windows: most visitors came, scanned in during their window.
        const attended = !cancelled && past && rand() < 0.88;
        const [hours, minutes] = startTime.split(":").map(Number);
        const checkedInAt = attended ? new Date(day.date.getTime() + ((hours - 5.5) * 60 + minutes - 10 + Math.floor(rand() * 70)) * 60_000) : null;
        passes.push({ id: passId, code: passCode, holderName: `${first} ${last}`, quantity, unitPrice: tier.price, status: cancelled ? "CANCELLED" : attended ? "USED" : "VALID", checkedInAt, bookingId, slotId, tierId: tier.id });
        if (checkedInAt) {
          checkIns.push({ pandalId: DEMO_PANDAL_ID, passId, scannedCode: passCode, result: "ADMITTED", scannedById: owner.id, createdAt: checkedInAt });
          if (rand() < 0.03) checkIns.push({ pandalId: DEMO_PANDAL_ID, passId, scannedCode: passCode, result: "DUPLICATE", scannedById: owner.id, createdAt: new Date(checkedInAt.getTime() + 4 * 60_000) });
        }
        if (past && rand() < 0.01) checkIns.push({ pandalId: DEMO_PANDAL_ID, scannedCode: "not a PujaPass QR code", result: "INVALID", scannedById: owner.id, createdAt: new Date(day.date.getTime() + (hours - 5.5) * 3_600_000) });
        if (!cancelled) booked += quantity;
      }
      slots.push({ id: slotId, pandalId: DEMO_PANDAL_ID, date: day.date, startTime, endTime, capacity, booked });
    });
  });

  await prisma.slot.createMany({ data: slots });
  const chunks = <T>(rows: T[], size = 1000) => Array.from({ length: Math.ceil(rows.length / size) }, (_, index) => rows.slice(index * size, (index + 1) * size));
  for (const chunk of chunks(bookings)) await prisma.booking.createMany({ data: chunk });
  for (const chunk of chunks(passes)) await prisma.pass.createMany({ data: chunk });
  for (const chunk of chunks(payments)) await prisma.payment.createMany({ data: chunk });
  for (const chunk of chunks(checkIns)) await prisma.checkIn.createMany({ data: chunk });

  // ── Reviews ─────────────────────────────────────────────────────────────
  const reviews = Array.from({ length: 48 }, (_, index) => ({
    pandalId: DEMO_PANDAL_ID,
    authorName: `${pick(firstNames)} ${pick(lastNames).charAt(0)}.`,
    rating: rand() < 0.7 ? 5 : rand() < 0.8 ? 4 : 3,
    comment: reviewComments[index % reviewComments.length],
    createdAt: new Date(festivalDays.at(-1)!.date.getTime() - Math.floor(rand() * 5) * 86_400_000),
  }));
  await prisma.review.createMany({ data: reviews });
  await prisma.pandal.update({
    where: { id: DEMO_PANDAL_ID },
    data: { ratingAverage: reviews.reduce((total, review) => total + review.rating, 0) / reviews.length, reviewCount: reviews.length },
  });

  return { owner: owner.email, slots: slots.length, bookings: bookings.length, passes: passes.length, checkIns: checkIns.length, reviews: reviews.length };
}
