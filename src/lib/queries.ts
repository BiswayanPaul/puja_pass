// Mock lookups still used by the client-side bookings feature
// (`src/features/bookings`). Pandal, ticket-tier, slot and review data for
// pages now comes from the database via `src/server/pandals.ts`.
//
// Delete this file once bookings move to the database (they need auth first).
// The seed keeps pandal/tier ids equal to the mock ids, so these lookups still
// resolve for seeded data.

import { bookings } from "@/data/bookings";
import { pandals } from "@/data/pandals";
import { ticketTiers } from "@/data/ticket-tiers";

export function getPandalById(id: string) {
  return pandals.find((pandal) => pandal.id === id);
}

export function getTierById(id: string) {
  return ticketTiers.find((tier) => tier.id === id);
}

export function getSeedBookings() {
  return bookings;
}
