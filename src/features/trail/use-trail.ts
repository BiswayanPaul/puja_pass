"use client";

import { CONVENIENCE_FEE_PER_PASS, MAX_PASSES_PER_SLOT } from "@/data/festival";
import { createPersistentStore } from "@/lib/create-store";
import { getPandalById, getSlotById, getTierById } from "@/lib/queries";
import type { TrailItem } from "@/types";

const trailStore = createPersistentStore<TrailItem[]>("pujapass:trail", []);

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

export type TrailLine = TrailItem & {
  pandal: NonNullable<ReturnType<typeof getPandalById>>;
  tier: NonNullable<ReturnType<typeof getTierById>>;
  slot: NonNullable<ReturnType<typeof getSlotById>>;
  lineTotal: number;
};

/** Trail items joined with their pandal, tier and slot, sorted chronologically. */
export function useTrail() {
  const items = trailStore.useStore();
  const lines: TrailLine[] = items
    .flatMap((item) => {
      const pandal = getPandalById(item.pandalId);
      const tier = getTierById(item.tierId);
      const slot = getSlotById(item.slotId);
      return pandal && tier && slot ? [{ ...item, pandal, tier, slot, lineTotal: tier.price * item.quantity }] : [];
    })
    .sort((a, b) => `${a.slot.date}${a.slot.startTime}`.localeCompare(`${b.slot.date}${b.slot.startTime}`));

  const passCount = lines.reduce((total, line) => total + line.quantity, 0);
  const subtotal = lines.reduce((total, line) => total + line.lineTotal, 0);
  const fees = passCount * CONVENIENCE_FEE_PER_PASS;
  return { lines, passCount, subtotal, fees, total: subtotal + fees };
}
