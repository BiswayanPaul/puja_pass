"use client";

import { createPersistentStore } from "@/lib/create-store";

// Bookings made in this browser, so "My bookings" can list them without an
// account. Only the reference and its manage key are stored; the details are
// always read from the server.
// TODO(auth): list a signed-in visitor's bookings from their account instead.
const deviceBookingsStore = createPersistentStore<{ reference: string; key: string }[]>("pujapass:device-bookings", []);

export function useDeviceBookings() {
  return deviceBookingsStore.useStore();
}

export function rememberBooking(reference: string, key: string) {
  deviceBookingsStore.set((items) => [{ reference, key }, ...items.filter((item) => item.reference !== reference)]);
}
