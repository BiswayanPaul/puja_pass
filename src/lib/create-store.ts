"use client";

import { useSyncExternalStore } from "react";

/**
 * Tiny client store persisted to localStorage. Used for UI-only state (trail,
 * mock bookings, mock session) until a real backend exists.
 * The server snapshot is always `initial`, so hydration never mismatches.
 */
export function createPersistentStore<T>(key: string, initial: T) {
  let value: T = initial;
  let loaded = false;
  const listeners = new Set<() => void>();

  function load() {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) value = JSON.parse(raw) as T;
    } catch {
      // Ignore unavailable or corrupt storage.
    }
  }

  function get() {
    load();
    return value;
  }

  function set(next: T | ((current: T) => T)) {
    load();
    value = typeof next === "function" ? (next as (current: T) => T)(value) : next;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore quota or privacy-mode errors.
    }
    listeners.forEach((listener) => listener());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      if (event.key !== key) return;
      loaded = false;
      listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  function useStore() {
    return useSyncExternalStore(subscribe, get, () => initial);
  }

  return { get, set, useStore };
}

const noopSubscribe = () => () => {};

/** False during SSR and hydration, true afterwards. Use to avoid flashing "not found" before stored data loads. */
export function useIsClient() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
