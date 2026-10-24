import "server-only";
import { after } from "next/server";
import QRCode from "qrcode";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { bookingShareText, whatsappShareUrl } from "@/lib/share";
import { bookingUrl, passQrUrl } from "../booking-links";
import { bookingInclude, toBooking } from "../bookings";
import { getFestivalDays } from "../festival";
import { BookingCancelledEmail, BookingConfirmedEmail } from "./emails";
import { sendEmail } from "./email";

// The notification outbox. Write rows with `bookingNotification()` inside the
// same transaction as the change, call `deliverSoon()` after it commits, and
// let /api/cron/notifications retry anything that failed.

export const NotificationTemplate = {
  BookingConfirmed: "booking_confirmed",
  BookingCancelled: "booking_cancelled",
} as const;

type NotificationTemplate = (typeof NotificationTemplate)[keyof typeof NotificationTemplate];

const MAX_ATTEMPTS = 5;
/** A SENDING row older than this belongs to a crashed attempt and is picked up again. */
const STUCK_AFTER_MS = 10 * 60_000;

export function bookingNotification(
  template: NotificationTemplate,
  booking: { id: string; contactEmail: string },
): Prisma.NotificationCreateManyInput {
  return { channel: "EMAIL", template, recipient: booking.contactEmail, bookingId: booking.id };
}

/** Sends the given notifications once the current response has been sent. */
export function deliverSoon(ids: string[]) {
  after(async () => {
    for (const id of ids) await deliverNotification(id);
  });
}

type NotificationWithBooking = Prisma.NotificationGetPayload<{ include: { booking: { include: typeof bookingInclude } } }>;

async function send(notification: NotificationWithBooking) {
  if (notification.channel !== "EMAIL") throw new Error(`${notification.channel} delivery is not enabled yet.`);
  if (!notification.booking) throw new Error("The booking for this notification no longer exists.");
  const booking = await toBooking(notification.booking);

  if (notification.template === NotificationTemplate.BookingConfirmed) {
    const viewUrl = bookingUrl(booking.id, "view");
    const attachments = await Promise.all(
      booking.passes.map(async (pass) => ({
        filename: `pass-${pass.code}.png`,
        content: await QRCode.toBuffer(passQrUrl(pass.code), { width: 336, margin: 1, errorCorrectionLevel: "M" }),
        contentId: `qr-${pass.code}`,
      })),
    );
    return sendEmail({
      to: notification.recipient,
      subject: `Your PujaPass passes · ${booking.id}`,
      react: (
        <BookingConfirmedEmail
          booking={booking}
          manageUrl={bookingUrl(booking.id, "manage")}
          whatsappShareUrl={whatsappShareUrl(bookingShareText(booking.id, viewUrl))}
          festivalDays={await getFestivalDays()}
          qrContentIds={Object.fromEntries(attachments.map((attachment, index) => [booking.passes[index].code, attachment.contentId]))}
        />
      ),
      attachments,
      idempotencyKey: notification.id,
    });
  }

  if (notification.template === NotificationTemplate.BookingCancelled) {
    return sendEmail({
      to: notification.recipient,
      subject: `Booking cancelled · ${booking.id}`,
      react: <BookingCancelledEmail booking={booking} />,
      idempotencyKey: notification.id,
    });
  }

  throw new Error(`Unknown notification template "${notification.template}".`);
}

/** Tries to send one notification. Safe to call twice: only one caller can claim it. */
export async function deliverNotification(id: string) {
  const claimed = await prisma.notification.updateMany({
    where: { id, status: "PENDING", sendAfter: { lte: new Date() } },
    data: { status: "SENDING", attempts: { increment: 1 } },
  });
  if (!claimed.count) return;

  const notification = await prisma.notification.findUniqueOrThrow({
    where: { id },
    include: { booking: { include: bookingInclude } },
  });
  try {
    const providerMessageId = await send(notification);
    await prisma.notification.update({
      where: { id },
      data: { status: "SENT", sentAt: new Date(), providerMessageId, lastError: null },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const giveUp = notification.attempts >= MAX_ATTEMPTS;
    console.error(`[notifications] ${notification.template} to ${notification.recipient} failed (attempt ${notification.attempts}): ${message}`);
    await prisma.notification.update({
      where: { id },
      data: {
        status: giveUp ? "FAILED" : "PENDING",
        lastError: message.slice(0, 1000),
        // Back off 2, 4, 8, 16 minutes between attempts.
        sendAfter: new Date(Date.now() + 2 ** notification.attempts * 60_000),
      },
    });
  }
}

/** Sends every notification that is due, oldest first. Used by the cron route. */
export async function deliverDueNotifications(limit = 25) {
  await prisma.notification.updateMany({
    where: { status: "SENDING", updatedAt: { lt: new Date(Date.now() - STUCK_AFTER_MS) } },
    data: { status: "PENDING" },
  });
  const due = await prisma.notification.findMany({
    where: { status: "PENDING", sendAfter: { lte: new Date() } },
    select: { id: true },
    orderBy: { sendAfter: "asc" },
    take: limit,
  });
  for (const { id } of due) await deliverNotification(id);
  return due.length;
}
