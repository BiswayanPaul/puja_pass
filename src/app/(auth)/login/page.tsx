import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-120 animate-pulse rounded-2xl bg-stone-200/60" />}>
      <LoginForm />
    </Suspense>
  );
}
