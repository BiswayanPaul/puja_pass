import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";

export const metadata: Metadata = { title: "Check your email", robots: { index: false } };

// Auth.js redirects here after sending an email sign-in link.
export default function CheckEmailPage() {
  return (
    <div>
      <span className="flex size-14 items-center justify-center rounded-full bg-orange-50 text-orange-600">
        <MailCheck className="size-7" aria-hidden="true" />
      </span>
      <h1 className="mt-5 font-serif text-4xl font-semibold tracking-tight text-stone-950">Check your email</h1>
      <p className="mt-2 text-stone-600">
        We&apos;ve sent you a sign-in link. Open it on this device to finish signing in. It works once and expires in an hour.
      </p>
      <p className="mt-6 rounded-xl bg-stone-100 p-4 text-sm text-stone-600">
        Nothing in your inbox after a minute? Check your spam folder, or{" "}
        <Link href="/login" className="font-semibold text-orange-700 hover:text-orange-800">ask for a new link</Link>.
      </p>
    </div>
  );
}
