"use client";

import { demoClubAdmin, demoVisitor } from "@/data/users";
import { createPersistentStore } from "@/lib/create-store";
import type { User, UserRole } from "@/types";

// Mock session. Replace with real auth (cookies / provider) when the backend lands.
const sessionStore = createPersistentStore<User | null>("pujapass:session", null);

export function useSession() {
  return sessionStore.useStore();
}

export function signIn(role: UserRole, overrides: Partial<User> = {}) {
  const base = role === "club_admin" ? demoClubAdmin : demoVisitor;
  const user = { ...base, ...overrides };
  sessionStore.set(user);
  return user;
}

export function signOut() {
  sessionStore.set(null);
}
