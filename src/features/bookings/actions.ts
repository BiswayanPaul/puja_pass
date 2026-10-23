"use server";

import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyBookingKey } from "@/server/booking-links";
import { getBookingSummaries } from "@/server/bookings";
import { bookingNotification, deliverSoon, NotificationTemplate } from "@/server/notifications";
import { pandalTags } from "@/server/pandals";
import type { BookingSummary } from "@/types";

export type CancelBookingResult = { ok: true } | { ok: false; error: string };

class CancelError extends Error {}

/**
 * Cancels a booking opened with its manage link: invalidates the passes, frees
 * the seats, marks the payment refunded and emails the visitor.
 * TODO(payments): issue the refund through Razorpay instead of only recording it.
 */
export async function cancelBooking(reference: string, key: string): Promise<CancelBookingResult> {
  if (verifyBookingKey(reference, key) !== "manage") return { ok: false, error: "Only the link in your confirmation email can cancel this booking." };

  try {
    const { notificationId, pandalIds } = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { reference },
        include: { passes: { select: { id: true, status: true, quantity: true, slotId: true, slot: { select: { pandalId: true } } } } },
      });
      if (!booking) throw new CancelError("This booking no longer exists.");
      if (booking.passes.some((pass) => pass.status === "USED")) throw new CancelError("A pass in this booking has already been used, so it can't be cancelled.");

      // Only one request can move the booking out of CONFIRMED.
      const cancelled = await tx.booking.updateMany({
        where: { id: booking.id, status: "CONFIRMED" },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      });
      if (!cancelled.count) throw new CancelError("This booking is already cancelled.");

      await tx.pass.updateMany({ where: { bookingId: booking.id, status: "VALID" }, data: { status: "CANCELLED" } });
      for (const pass of booking.passes.filter((item) => item.status === "VALID")) {
        await tx.slot.update({ where: { id: pass.slotId }, data: { booked: { decrement: pass.quantity } } });
      }
      await tx.payment.updateMany({ where: { bookingId: booking.id, status: "PAID" }, data: { status: "REFUNDED" } });

      const notification = await tx.notification.create({
        data: bookingNotification(NotificationTemplate.BookingCancelled, booking),
        select: { id: true },
      });
      return { notificationId: notification.id, pandalIds: new Set(booking.passes.map((pass) => pass.slot.pandalId)) };
    });

    for (const pandalId of pandalIds) updateTag(pandalTags.slots(pandalId));
    deliverSoon([notificationId]);
    refresh();
    return { ok: true };
  } catch (error) {
    if (error instanceof CancelError) return { ok: false, error: error.message };
    throw error;
  }
}

const deviceBookingsSchema = z.array(z.object({ reference: z.string().max(20), key: z.string().max(40) })).max(50);

/** Summaries of the bookings this browser remembers (see `device-bookings.ts`). */
export async function getDeviceBookings(entries: { reference: string; key: string }[]): Promise<BookingSummary[]> {
  const parsed = deviceBookingsSchema.safeParse(entries);
  return parsed.success ? getBookingSummaries(parsed.data) : [];
}
