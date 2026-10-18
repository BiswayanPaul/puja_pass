"use client";

import { createPersistentStore } from "@/lib/create-store";

const savedStore = createPersistentStore<string[]>("pujapass:saved-pandals", []);

export function useSavedPandals() {
  const savedIds = savedStore.useStore();
  const toggleSaved = (id: string) =>
    savedStore.set((ids) => (ids.includes(id) ? ids.filter((savedId) => savedId !== id) : [...ids, id]));
  return { savedIds, toggleSaved };
}
