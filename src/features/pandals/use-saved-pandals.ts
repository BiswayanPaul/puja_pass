"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useCurrentUser } from "@/features/auth/use-session";
import { createPersistentStore } from "@/lib/create-store";
import { setPandalSaved, syncSavedPandals } from "./saved-actions";

// Saved pandals. Guests keep them in this browser; signed-in visitors keep
// them in their account (SavedPandal). On sign-in the browser's saves are
// moved into the account, so nothing is lost.

const localStore = createPersistentStore<string[]>("pujapass:saved-pandals", []);

/** The signed-in user's saved ids, shared by every heart on the page. */
let account: { userId: string; ids: string[] } | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

function setAccount(next: typeof account) {
  account = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function loadAccount(userId: string) {
  if (account?.userId === userId || loading) return;
  loading = syncSavedPandals(localStore.get())
    .then((ids) => {
      // The browser's saves now live in the account.
      localStore.set([]);
      setAccount({ userId, ids });
    })
    .catch(() => undefined)
    .finally(() => {
      loading = null;
    });
}

export function useSavedPandals() {
  const { user, status } = useCurrentUser();
  const localIds = localStore.useStore();
  const accountState = useSyncExternalStore(subscribe, () => account, () => null);
  const userId = user?.id;

  useEffect(() => {
    if (userId) loadAccount(userId);
    else if (status === "unauthenticated" && account) setAccount(null);
  }, [userId, status]);

  const signedIn = Boolean(userId);
  // Null until this user's saves have loaded.
  const accountIds = userId && accountState?.userId === userId ? accountState.ids : null;
  const savedIds = signedIn ? (accountIds ?? []) : localIds;

  const toggleSaved = (id: string) => {
    if (!signedIn) {
      localStore.set((ids) => (ids.includes(id) ? ids.filter((savedId) => savedId !== id) : [...ids, id]));
      return;
    }
    if (!accountIds || !userId) return;
    const saved = !accountIds.includes(id);
    const before = accountIds;
    // Update at once; put it back if the server refuses.
    setAccount({ userId, ids: saved ? [id, ...before] : before.filter((savedId) => savedId !== id) });
    setPandalSaved(id, saved)
      .then((result) => {
        if (!result.ok) setAccount({ userId, ids: before });
      })
      .catch(() => setAccount({ userId, ids: before }));
  };

  return {
    savedIds,
    toggleSaved,
    signedIn,
    /** False while the session or the account's saves are still loading. */
    ready: status !== "loading" && (!signedIn || accountIds !== null),
  };
}
