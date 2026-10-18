// Data-access layer. Every page/component reads data through these functions
// instead of importing from `src/data` directly, so the mock data can later be
// replaced by database/API calls in this one place.

import { bookings } from "@/data/bookings";
import { pujaDays } from "@/data/festival";
import { pandals } from "@/data/pandals";
import { reviews } from "@/data/reviews";
import { slots } from "@/data/slots";
import { ticketTiers } from "@/data/ticket-tiers";

export function getPandals() {
  return pandals;
}

export function getFeaturedPandals() {
  return pandals.filter((pandal) => pandal.featured);
}

export function getPandalById(id: string) {
  return pandals.find((pandal) => pandal.id === id);
}

export function getNearbyPandals(id: string, limit = 3) {
  const pandal = getPandalById(id);
  if (!pandal) return [];
  return pandals
    .filter((item) => item.id !== id)
    .sort((a, b) => Number(b.area === pandal.area) - Number(a.area === pandal.area) || b.rating - a.rating)
    .slice(0, limit);
}

export function getTiersForPandal(pandalId: string) {
  return ticketTiers.filter((tier) => tier.pandalId === pandalId);
}

export function getTierById(id: string) {
  return ticketTiers.find((tier) => tier.id === id);
}

export function getSlotsForPandal(pandalId: string, date?: string) {
  return slots.filter((slot) => slot.pandalId === pandalId && (!date || slot.date === date));
}

export function getSlotById(id: string) {
  return slots.find((slot) => slot.id === id);
}

export function getReviewsForPandal(pandalId: string) {
  return reviews.filter((review) => review.pandalId === pandalId);
}

export function getPujaDay(date: string) {
  return pujaDays.find((day) => day.date === date);
}

export function getSeedBookings() {
  return bookings;
}
