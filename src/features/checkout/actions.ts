"use server";

import { randomInt } from "node:crypto";
import { updateTag } from "next/cache";
import { z } from "zod";
import { CONVENIENCE_FEE_PER_PASS, MAX_PASSES_PER_SLOT } from "@/data/festival";
import { Prisma } from "@/generated/prisma/client";
import type { PaymentMethod as DbPaymentMethod } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { bookingKey, bookingPath } from "@/server/booking-links";
import { bookingNotification, deliverSoon, NotificationTemplate } from "@/server/notifications";
import { pandalTags } from "@/server/pandals";
import type { PaymentMethod } from "@/types";

export type PlaceBookingResult =
  | { ok: true; reference: string; manageKey: string; path: string }
  | { ok: false; error: string };

const bookingSchema = z.object({
  lines: z
    .array(z.object({ slotId: z.string().min(1), tierId: z.string().min(1), quantity: z.number().int().min(1).max(MAX_PASSES_PER_SLOT) }))
    .min(1, "Your trail is empty.")
    .max(20),
  contact: z.object({
    name: z.string().trim().min(2, "Enter the lead visitor's name.").max(80),
    email: z.email("Enter a valid email address.").trim().toLowerCase(),
    phone: z.string().trim().regex(/^[+0-9 ]{10,16}$/, "Enter a valid mobile number."),
  }),
  paymentMethod: z.enum(["UPI", "Card", "Net Banking"]),
  /** The total the visitor saw; the booking is refused if server prices differ. */
  expectedTotal: z.number().int().nonnegative(),
});

const paymentMethods: Record<PaymentMethod, DbPaymentMethod> = { UPI: "UPI", Card: "CARD", "Net Banking": "NET_BANKING" };

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const randomCode = (length: number) => Array.from({ length }, () => CODE_CHARS[randomInt(CODE_CHARS.length)]).join("");

class BookingError extends Error {}

/**
 * Books every line of the trail in one transaction and emails the passes.
 * Payment is simulated for now: the booking is confirmed straight away.
 * TODO(payments): create a PENDING booking and confirm it from the Razorpay webhook.
 */
export async function placeBooking(input: z.input<typeof bookingSchema>): Promise<PlaceBookingResult> {
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check your details and try again." };
  const { contact, paymentMethod, expectedTotal } = parsed.data;

  // The same slot and pass type added twice becomes one line.
  const merged = new Map<string, { slotId: string; tierId: string; quantity: number }>();
  for (const line of parsed.data.lines) {
    const key = `${line.slotId}:${line.tierId}`;
    const existing = merged.get(key);
    merged.set(key, { ...line, quantity: (existing?.quantity ?? 0) + line.quantity });
  }
  const lines = [...merged.values()];
  if (lines.some((line) => line.quantity > MAX_PASSES_PER_SLOT)) {
    return { ok: false, error: `You can book at most ${MAX_PASSES_PER_SLOT} visitors per slot and pass type.` };
  }

  const [slots, tiers] = await Promise.all([
    prisma.slot.findMany({
      where: { id: { in: lines.map((line) => line.slotId) } },
      include: { pandal: { select: { id: true, name: true, published: true, club: { select: { verified: true } } } } },
    }),
    prisma.ticketTier.findMany({ where: { id: { in: lines.map((line) => line.tierId) } } }),
  ]);

  const priced: ((typeof lines)[number] & { slot: (typeof slots)[number]; tier: (typeof tiers)[number] })[] = [];
  for (const line of lines) {
    const slot = slots.find((item) => item.id === line.slotId);
    const tier = tiers.find((item) => item.id === line.tierId);
    if (!slot || !tier || tier.pandalId !== slot.pandalId) return { ok: false, error: "One of the slots in your trail no longer exists. Remove it and try again." };
    if (!slot.pandal.published || !slot.pandal.club.verified) return { ok: false, error: `${slot.pandal.name} isn't taking bookings right now.` };
    if (!tier.active) return { ok: false, error: `${tier.name} passes for ${slot.pandal.name} are no longer on sale.` };
    if (slot.salesPaused) return { ok: false, error: `Sales are paused for ${slot.pandal.name} at ${slot.startTime}.` };
    // TODO: refuse slots that have already started, once the festival dates are real (the seed's are in the past).
    priced.push({ ...line, slot, tier });
  }

  const visitors = priced.reduce((total, line) => total + line.quantity, 0);
  const subtotal = priced.reduce((total, line) => total + line.tier.price * line.quantity, 0);
  const fees = visitors * CONVENIENCE_FEE_PER_PASS;
  if (subtotal + fees !== expectedTotal) {
    return { ok: false, error: "Prices have changed since you added these slots. Review your trail and try again." };
  }

  // Seats per slot across pass types: capacity is shared by the whole slot.
  const seatsBySlot = new Map<string, number>();
  for (const line of priced) seatsBySlot.set(line.slotId, (seatsBySlot.get(line.slotId) ?? 0) + line.quantity);

  for (let attempt = 1; ; attempt++) {
    const reference = `PP26-${randomCode(6)}`;
    try {
      const booking = await prisma.$transaction(async (tx) => {
        for (const [slotId, seats] of seatsBySlot) {
          // Atomic check-and-reserve: no row is updated if it would oversell.
          const reserved = await tx.$executeRaw`
            UPDATE "Slot" SET booked = booked + ${seats}
            WHERE id = ${slotId} AND "salesPaused" = false AND booked + ${seats} <= capacity`;
          if (!reserved) {
            const slot = priced.find((line) => line.slotId === slotId)!.slot;
            throw new BookingError(`Not enough places left at ${slot.pandal.name} for ${slot.startTime}. Pick another slot or fewer visitors.`);
          }
        }

        const created = await tx.booking.create({
          data: {
            reference,
            status: "CONFIRMED",
            contactName: contact.name,
            contactEmail: contact.email,
            contactPhone: contact.phone,
            subtotal,
            fees,
            total: subtotal + fees,
            paymentMethod: paymentMethods[paymentMethod],
            // TODO(auth): set userId for signed-in visitors.
            passes: {
              create: priced.map((line) => ({
                code: `${line.slot.pandal.name.replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase()}-${line.slot.date.toISOString().slice(8, 10)}${line.slot.date.toISOString().slice(5, 7)}-${randomCode(4)}`,
                holderName: contact.name,
                quantity: line.quantity,
                unitPrice: line.tier.price,
                slotId: line.slotId,
                tierId: line.tierId,
              })),
            },
            payments: {
              create: {
                provider: "demo",
                providerOrderId: `demo_${reference}`,
                providerPaymentId: `demo_pay_${reference}`,
                amount: subtotal + fees,
                status: "PAID",
                method: paymentMethods[paymentMethod],
              },
            },
          },
        });
        const notification = await tx.notification.create({
          data: bookingNotification(NotificationTemplate.BookingConfirmed, created),
          select: { id: true },
        });
        return { reference: created.reference, notificationId: notification.id };
      });

      for (const pandalId of new Set(priced.map((line) => line.slot.pandal.id))) updateTag(pandalTags.slots(pandalId));
      deliverSoon([booking.notificationId]);
      return { ok: true, reference: booking.reference, manageKey: bookingKey(booking.reference, "manage"), path: bookingPath(booking.reference, "manage") };
    } catch (error) {
      if (error instanceof BookingError) return { ok: false, error: error.message };
      // A clashing booking reference or pass code: try again with new random ones.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" && attempt < 3) continue;
      throw error;
    }
  }
}
