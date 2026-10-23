import "server-only";
import QRCode from "qrcode";
import type { Prisma } from "@/generated/prisma/client";
import type { BookingStatus as DbBookingStatus, PassStatus as DbPassStatus, PaymentMethod as DbPaymentMethod } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import type { Booking, BookingAccess, BookingStatus, BookingSummary, PassCheck, PassStatus, PaymentMethod } from "@/types";
import { bookingPath, passQrUrl, verifyBookingKey } from "./booking-links";

// Booking reads. Bookings are private, so these are never cached: call them
// under <Suspense>, and only after checking the booking key.

export const bookingInclude = {
  passes: {
    include: {
      tier: { select: { name: true } },
      slot: {
        select: {
          date: true,
          startTime: true,
          endTime: true,
          pandal: { select: { slug: true, name: true, neighbourhood: true, address: true, coverImageUrl: true } },
        },
      },
    },
    orderBy: [{ slot: { date: "asc" } }, { slot: { startTime: "asc" } }],
  },
} satisfies Prisma.BookingInclude;

export type BookingRow = Prisma.BookingGetPayload<{ include: typeof bookingInclude }>;

const bookingStatuses: Record<DbBookingStatus, BookingStatus> = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  EXPIRED: "cancelled",
};

const passStatuses: Record<DbPassStatus, PassStatus> = { VALID: "valid", USED: "used", CANCELLED: "cancelled" };

export const paymentMethods: Record<DbPaymentMethod, PaymentMethod> = { UPI: "UPI", CARD: "Card", NET_BANKING: "Net Banking" };

/** @db.Date columns come back as UTC midnight. */
function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function toBooking(row: BookingRow): Promise<Booking> {
  return {
    id: row.reference,
    createdAt: row.createdAt.toISOString(),
    status: bookingStatuses[row.status],
    contact: { name: row.contactName, email: row.contactEmail, phone: row.contactPhone },
    subtotal: row.subtotal,
    fees: row.fees,
    total: row.total,
    paymentMethod: row.paymentMethod ? paymentMethods[row.paymentMethod] : "UPI",
    passes: await Promise.all(
      row.passes.map(async (pass) => ({
        id: pass.id,
        code: pass.code,
        status: passStatuses[pass.status],
        holderName: pass.holderName,
        quantity: pass.quantity,
        unitPrice: pass.unitPrice,
        checkedInAt: pass.checkedInAt?.toISOString(),
        date: toDateString(pass.slot.date),
        startTime: pass.slot.startTime,
        endTime: pass.slot.endTime,
        tierName: pass.tier.name,
        pandal: {
          slug: pass.slot.pandal.slug,
          name: pass.slot.pandal.name,
          neighbourhood: pass.slot.pandal.neighbourhood,
          address: pass.slot.pandal.address,
          imageSrc: pass.slot.pandal.coverImageUrl,
        },
        qrSvg: await QRCode.toString(passQrUrl(pass.code), { type: "svg", margin: 1, errorCorrectionLevel: "M" }),
      })),
    ),
  };
}

/**
 * The booking, if the key opens it or the signed-in user owns it, with the
 * access granted: owners always get "manage".
 */
export async function getBookingForViewer(reference: string, key: string | undefined, userId: string | undefined) {
  const keyAccess = verifyBookingKey(reference, key);
  if (!keyAccess && !userId) return null;
  const row = await prisma.booking.findUnique({ where: { reference }, include: bookingInclude });
  if (!row) return null;
  const access: BookingAccess | null = userId && row.userId === userId ? "manage" : keyAccess;
  return access ? { booking: await toBooking(row), access } : null;
}

/**
 * Summaries for "My bookings": the signed-in user's bookings plus those
 * remembered on this device (entries with a wrong key are skipped).
 */
export async function getBookingSummaries(entries: { reference: string; key: string }[], userId?: string): Promise<BookingSummary[]> {
  const references = entries.filter((entry) => verifyBookingKey(entry.reference, entry.key)).map((entry) => entry.reference);
  if (!references.length && !userId) return [];
  const rows = await prisma.booking.findMany({
    where: { OR: [{ reference: { in: references } }, ...(userId ? [{ userId }] : [])] },
    include: bookingInclude,
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => {
    const pandals = new Map(row.passes.map((pass) => [pass.slot.pandal.slug, pass.slot.pandal]));
    return {
      reference: row.reference,
      status: bookingStatuses[row.status],
      createdAt: row.createdAt.toISOString(),
      total: row.total,
      pandals: [...pandals.values()].map((pandal) => ({ name: pandal.name, imageSrc: pandal.coverImageUrl })),
      dates: [...new Set(row.passes.map((pass) => toDateString(pass.slot.date)))],
      passCount: row.passes.length,
      visitors: row.passes.reduce((total, pass) => total + pass.quantity, 0),
      firstStartTime: row.passes[0]?.slot.startTime ?? "",
      href: bookingPath(row.reference, "manage"),
    };
  });
}

/** The pass behind a scanned QR code. Call only with a code from `verifyPassToken`. */
export async function getPassCheck(code: string): Promise<PassCheck | null> {
  const pass = await prisma.pass.findUnique({
    where: { code },
    include: {
      tier: { select: { name: true } },
      booking: { select: { status: true } },
      slot: { select: { date: true, startTime: true, endTime: true, pandal: { select: { slug: true, name: true, neighbourhood: true } } } },
    },
  });
  if (!pass) return null;
  const bookingCancelled = pass.booking.status === "CANCELLED" || pass.booking.status === "EXPIRED";
  return {
    code: pass.code,
    status: bookingCancelled ? "cancelled" : passStatuses[pass.status],
    quantity: pass.quantity,
    tierName: pass.tier.name,
    date: toDateString(pass.slot.date),
    startTime: pass.slot.startTime,
    endTime: pass.slot.endTime,
    checkedInAt: pass.checkedInAt?.toISOString(),
    pandal: pass.slot.pandal,
  };
}
