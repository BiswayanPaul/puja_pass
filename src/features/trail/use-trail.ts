"use client";

import { CONVENIENCE_FEE_PER_PASS, MAX_PASSES_PER_SLOT } from "@/data/festival";
import { createPersistentStore } from "@/lib/create-store";
import type { TrailItem } from "@/types";

// Trail items carry a snapshot of the pandal, pass type and slot so the trail
// renders without fetching. Prices and availability must be re-checked on the
// server at checkout.
const trailStore = createPersistentStore<TrailItem[]>("pujapass:trail:v2", []);

export function addToTrail(item: Omit<TrailItem, "id">) {
  trailStore.set((items) => {
    const existing = items.find((entry) => entry.slotId === item.slotId && entry.tierId === item.tierId);
    if (existing) {
      return items.map((entry) =>
        entry === existing
          ? { ...entry, quantity: Math.min(MAX_PASSES_PER_SLOT, entry.quantity + item.quantity) }
          : entry,
      );
    }
    return [...items, { ...item, id: `${item.slotId}:${item.tierId}` }];
  });
}

export function updateTrailQuantity(id: string, quantity: number) {
  trailStore.set((items) =>
    items.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, Math.min(MAX_PASSES_PER_SLOT, quantity)) } : item)),
  );
}

export function removeFromTrail(id: string) {
  trailStore.set((items) => items.filter((item) => item.id !== id));
}

export function clearTrail() {
  trailStore.set([]);
}

export type TrailLine = TrailItem & { lineTotal: number };

/** Trail items sorted chronologically, with totals. */
export function useTrail() {
  const items = trailStore.useStore();
  const lines: TrailLine[] = items
    .map((item) => ({ ...item, lineTotal: item.unitPrice * item.quantity }))
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));

  const passCount = lines.reduce((total, line) => total + line.quantity, 0);
  const subtotal = lines.reduce((total, line) => total + line.lineTotal, 0);
  const fees = passCount * CONVENIENCE_FEE_PER_PASS;
  return { lines, passCount, subtotal, fees, total: subtotal + fees };
}
