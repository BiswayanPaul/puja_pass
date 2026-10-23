import { NextResponse, type NextRequest } from "next/server";

// Optimistic check only: sends visitors without a session cookie to /login
// before a protected page renders. It doesn't read the database, so a stale
// or forged cookie gets through here; every page and action re-checks the
// real session in src/server/auth/session.ts.

const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

export function proxy(request: NextRequest) {
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (hasSession) return NextResponse.next();

  const login = new URL("/login", request.url);
  login.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(login);
}

export const config = {
  // /clubs/register stays public (and indexable); its form asks visitors to sign in.
  matcher: ["/admin/:path*", "/club/:path*"],
};
