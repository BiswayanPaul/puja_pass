"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useActionState, useEffect } from "react";
import { Loader2, Mail, TriangleAlert } from "lucide-react";
import { Field, Input } from "@/components/ui/field";
import { signInWithEmail, signInWithGoogle } from "../actions";
import { useCurrentUser } from "../use-session";

// Auth.js sends people back to /login?error=<code> when something fails.
const errorMessages: Record<string, string> = {
  Verification: "That sign-in link has expired or was already used. Ask for a new one below.",
  OAuthAccountNotLinked: "This email already uses a different sign-in method. Try the email link instead.",
  AccessDenied: "Sign-in was cancelled or isn't allowed for this account.",
  EmailSignin: "We couldn't send a sign-in email. Wait a few minutes and try again.",
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6a5.1 5.1 0 0 1-2.2 3.4v2.8h3.6c2-1.9 3.2-4.7 3.2-8.3Z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.4-2.7l-3.6-2.8c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2v2.9A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.7 14c-.2-.7-.4-1.4-.4-2s.2-1.4.4-2V7.1H2a11 11 0 0 0 0 9.8L5.7 14Z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2 7.1L5.7 10c.9-2.7 3.4-4.6 6.3-4.6Z" />
    </svg>
  );
}

/** Passwordless sign-in: Google or a one-time email link. Signing in creates the account if needed. */
export function SignInForm({ mode, googleEnabled }: { mode: "login" | "register"; googleEnabled: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const errorCode = searchParams.get("error");
  const { user } = useCurrentUser();
  const [state, emailAction, sending] = useActionState(signInWithEmail, null);

  // Already signed in: go where they were heading.
  useEffect(() => {
    if (user) router.replace(next.startsWith("/") && !next.startsWith("//") ? next : "/my-bookings");
  }, [user, next, router]);

  const error = state?.error ?? (errorCode ? (errorMessages[errorCode] ?? "Something went wrong signing you in. Please try again.") : null);

  return (
    <div>
      <h1 className="font-serif text-4xl font-semibold tracking-tight text-stone-950">{mode === "register" ? "Create your account" : "Welcome back"}</h1>
      <p className="mt-2 text-stone-600">
        {mode === "register"
          ? "Keep every QR pass in one place and manage your bookings from any device. No password needed."
          : "Sign in to see your passes, or to manage your Puja club. No password needed."}
      </p>

      {error && (
        <p role="alert" className="mt-6 flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {error}
        </p>
      )}

      {googleEnabled && (
        <>
          <form action={signInWithGoogle} className="mt-8">
            <input type="hidden" name="next" value={next} />
            <button type="submit" className="inline-flex w-full items-center justify-center gap-3 rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-900 shadow-sm hover:bg-stone-50">
              <GoogleIcon /> Continue with Google
            </button>
          </form>
          <div className="my-6 flex items-center gap-3 text-xs font-semibold tracking-wider text-stone-400" aria-hidden="true">
            <span className="h-px flex-1 bg-stone-200" /> OR <span className="h-px flex-1 bg-stone-200" />
          </div>
        </>
      )}

      <form action={emailAction} className={googleEnabled ? "space-y-4" : "mt-8 space-y-4"}>
        <input type="hidden" name="next" value={next} />
        <Field label="Email" hint="We'll email you a link that signs you in. It works once and expires in an hour.">
          <Input name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
        </Field>
        <button type="submit" disabled={sending} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-600 px-5 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-70">
          {sending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Mail className="size-4" aria-hidden="true" />}
          Email me a sign-in link
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-stone-600">
        {mode === "register" ? (
          <>Already have an account? <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-orange-700 hover:text-orange-800">Sign in</Link></>
        ) : (
          <>New here? Signing in creates your account.</>
        )}
      </p>
      <p className="mt-2 text-center text-sm text-stone-600">
        Organising a Puja? <Link href="/clubs/register" className="font-semibold text-orange-700 hover:text-orange-800">Register your club</Link>
      </p>
    </div>
  );
}
