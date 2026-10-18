"use client";

import { createPersistentStore } from "@/lib/create-store";
import { getSeedBookings } from "@/lib/queries";
import type { Booking, PaymentMethod } from "@/types";
import type { TrailLine } from "../trail/use-trail";

// Bookings created in this browser via the mock checkout.
const createdBookingsStore = createPersistentStore<Booking[]>("pujapass:bookings", []);

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(length: number) {
  return Array.from({ length }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
}

export function useBookings() {
  const created = createdBookingsStore.useStore();
  // Locally stored copies (new or cancelled) take precedence over seed data.
  return [...created, ...getSeedBookings().filter((seed) => !created.some((booking) => booking.id === seed.id))];
}

export function useBooking(id: string) {
  return useBookings().find((booking) => booking.id === id);
}

export function createBooking({
  lines,
  contact,
  paymentMethod,
  fees,
}: {
  lines: TrailLine[];
  contact: Booking["contact"];
  paymentMethod: PaymentMethod;
  fees: number;
}) {
  const subtotal = lines.reduce((total, line) => total + line.lineTotal, 0);
  const booking: Booking = {
    id: `PP26-${randomCode(6)}`,
    createdAt: new Date().toISOString(),
    status: "confirmed",
    contact,
    paymentMethod,
    passes: lines.map((line) => ({
      id: `pass-${randomCode(8)}`,
      code: `${line.pandal.name.slice(0, 3).toUpperCase()}-${line.slot.date.slice(8, 10)}${line.slot.date.slice(5, 7)}-${randomCode(4)}`,
      pandalId: line.pandalId,
      tierId: line.tierId,
      slotId: line.slotId,
      date: line.slot.date,
      startTime: line.slot.startTime,
      endTime: line.slot.endTime,
      holderName: contact.name,
      quantity: line.quantity,
      unitPrice: line.tier.price,
      status: "valid",
    })),
    subtotal,
    fees,
    total: subtotal + fees,
  };
  createdBookingsStore.set((items) => [booking, ...items]);
  return booking;
}

export function cancelBooking(booking: Booking) {
  const cancelled: Booking = {
    ...booking,
    status: "cancelled",
    passes: booking.passes.map((pass) => ({ ...pass, status: "cancelled" })),
  };
  createdBookingsStore.set((items) =>
    items.some((item) => item.id === booking.id)
      ? items.map((item) => (item.id === booking.id ? cancelled : item))
      : [cancelled, ...items],
  );
}
