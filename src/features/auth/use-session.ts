"use client";

import { signOut as authSignOut, useSession } from "next-auth/react";

// Client-side view of the Auth.js session, fetched from /api/auth/session so
// static pages can stay static. Use it for UI only (menus, prefilled forms);
// the server re-checks access with src/server/auth/session.ts.

export { SessionProvider } from "next-auth/react";

export function useCurrentUser() {
  const { data, status } = useSession();
  return { user: data?.user ?? null, status };
}

export function signOut() {
  return authSignOut({ redirectTo: "/" });
}
