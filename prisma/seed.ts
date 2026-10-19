// Seeds the database with the UI mock data from `src/data`.
// Run with `bun run db:seed` (also runs after `prisma migrate reset`).
// It wipes the tables first, so only use it against a development database.

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type { BookingStatus, CrowdLevel, PassStatus, PaymentMethod } from "../src/generated/prisma/enums";
import { bookings } from "../src/data/bookings";
import { pandals } from "../src/data/pandals";
import { reviews } from "../src/data/reviews";
import { slots } from "../src/data/slots";
import { ticketTiers } from "../src/data/ticket-tiers";
import { demoClubAdmin, users } from "../src/data/users";
import type * as UI from "../src/types";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

const crowdLevels: Record<UI.CrowdLevel, CrowdLevel> = { Low: "LOW", Moderate: "MODERATE", High: "HIGH", "Very High": "VERY_HIGH" };
const bookingStatuses: Record<UI.BookingStatus, BookingStatus> = { confirmed: "CONFIRMED", completed: "COMPLETED", cancelled: "CANCELLED" };
const passStatuses: Record<UI.PassStatus, PassStatus> = { valid: "VALID", used: "USED", cancelled: "CANCELLED" };
const paymentMethods: Record<UI.PaymentMethod, PaymentMethod> = { UPI: "UPI", Card: "CARD", "Net Banking": "NET_BANKING" };

/** "12.4K" -> 12400 */
function parseCount(value: string) {
  const number = Number.parseFloat(value);
  return Math.round(value.toUpperCase().endsWith("K") ? number * 1000 : number);
}

/** "2026-09-30" -> Date at UTC midnight, as stored in a @db.Date column. */
function toDate(date: string) {
  return new Date(`${date}T00:00:00Z`);
}

async function main() {
  // Children before parents.
  await prisma.$transaction([
    prisma.checkIn.deleteMany(),
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
    prisma.user.deleteMany(),
  ]);

  await prisma.user.createMany({
    data: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role === "club_admin" ? "CLUB_ADMIN" : "VISITOR",
    })),
  });

  for (const pandal of pandals) {
    const club = await prisma.club.create({
      data: { id: `club-${pandal.id}`, name: pandal.clubName, established: pandal.established, verified: true, verifiedAt: new Date("2026-09-12T00:00:00Z") },
    });

    await prisma.pandal.create({
      data: {
        id: pandal.id,
        slug: pandal.id,
        clubId: club.id,
        name: pandal.name,
        neighbourhood: pandal.neighbourhood,
        address: pandal.address,
        area: pandal.area,
        category: pandal.category,
        coverImageUrl: pandal.imageSrc,
        coverImageAlt: pandal.imageAlt,
        entryType: pandal.entryType === "Free Entry" ? "FREE" : "PAID",
        highlight: pandal.highlight,
        tags: pandal.tags,
        featured: pandal.featured,
        ecoFriendly: pandal.ecoFriendly,
        themeTitle: pandal.theme.title,
        themeDescription: pandal.theme.description,
        description: pandal.description,
        established: pandal.established,
        idolArtist: pandal.idolArtist,
        timings: pandal.timings,
        crowdLevel: crowdLevels[pandal.crowdLevel],
        nearestMetro: pandal.nearestMetro,
        amenities: pandal.amenities,
        freeEntryInfo: pandal.freeEntryInfo,
        mapX: pandal.mapPosition.x,
        mapY: pandal.mapPosition.y,
        ratingAverage: pandal.rating,
        reviewCount: parseCount(pandal.reviewCount),
        images: { create: pandal.gallery.map((image, position) => ({ url: image.src, alt: image.alt, position })) },
      },
    });
  }

  await prisma.clubMember.create({
    data: { userId: demoClubAdmin.id, clubId: `club-${demoClubAdmin.pandalId}`, role: "OWNER" },
  });

  await prisma.ticketTier.createMany({
    data: ticketTiers.map((tier, position) => ({
      id: tier.id,
      pandalId: tier.pandalId,
      name: tier.name,
      description: tier.description,
      price: tier.price,
      perks: tier.perks,
      capacityPerSlot: tier.capacityPerSlot,
      active: tier.active,
      position,
    })),
  });

  await prisma.slot.createMany({
    data: slots.map((slot) => ({
      id: slot.id,
      pandalId: slot.pandalId,
      date: toDate(slot.date),
      startTime: slot.startTime,
      endTime: slot.endTime,
      capacity: slot.capacity,
      booked: slot.booked,
    })),
  });

  await prisma.review.createMany({
    data: reviews.map((review) => ({
      id: review.id,
      pandalId: review.pandalId,
      authorName: review.author,
      rating: review.rating,
      comment: review.comment,
      createdAt: toDate(review.date),
    })),
  });

  const visitor = users.find((user) => user.role === "visitor")!;
  for (const booking of bookings) {
    await prisma.booking.create({
      data: {
        reference: booking.id,
        status: bookingStatuses[booking.status],
        contactName: booking.contact.name,
        contactEmail: booking.contact.email,
        contactPhone: booking.contact.phone,
        subtotal: booking.subtotal,
        fees: booking.fees,
        total: booking.total,
        paymentMethod: paymentMethods[booking.paymentMethod],
        createdAt: new Date(booking.createdAt),
        cancelledAt: booking.status === "cancelled" ? new Date(booking.createdAt) : null,
        userId: visitor.id,
        passes: {
          create: booking.passes.map((pass) => ({
            code: pass.code,
            holderName: pass.holderName,
            quantity: pass.quantity,
            unitPrice: pass.unitPrice,
            status: passStatuses[pass.status],
            checkedInAt: pass.checkedInAt ? new Date(pass.checkedInAt) : null,
            slotId: pass.slotId,
            tierId: pass.tierId,
          })),
        },
        payments: {
          create: {
            providerOrderId: `order_seed_${booking.id}`,
            providerPaymentId: `pay_seed_${booking.id}`,
            amount: booking.total,
            status: booking.status === "cancelled" ? "REFUNDED" : "PAID",
            method: paymentMethods[booking.paymentMethod],
          },
        },
      },
    });
  }

  const counts = {
    users: await prisma.user.count(),
    clubs: await prisma.club.count(),
    pandals: await prisma.pandal.count(),
    ticketTiers: await prisma.ticketTier.count(),
    slots: await prisma.slot.count(),
    reviews: await prisma.review.count(),
    bookings: await prisma.booking.count(),
    passes: await prisma.pass.count(),
  };
  console.log("Seeded:", counts);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
