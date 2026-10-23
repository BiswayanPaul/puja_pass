import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInForm } from "@/features/auth/components/sign-in-form";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-120 animate-pulse rounded-2xl bg-stone-200/60" />}>
      <SignInForm mode="login" googleEnabled={Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET)} />
    </Suspense>
  );
}
