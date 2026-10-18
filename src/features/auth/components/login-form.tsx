"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Building2, Eye, EyeOff, Info, Loader2, UserRound } from "lucide-react";
import { Checkbox, Field, Input } from "@/components/ui/field";
import { demoClubAdmin, demoVisitor } from "@/data/users";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";
import { signIn } from "../use-session";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<UserRole>(searchParams.get("role") === "club" ? "club_admin" : "visitor");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const demo = role === "club_admin" ? demoClubAdmin : demoVisitor;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setTimeout(() => {
      signIn(role);
      const next = searchParams.get("next");
      router.push(next?.startsWith("/") ? next : role === "club_admin" ? "/club/dashboard" : "/my-bookings");
    }, 600);
  };

  return (
    <div>
      <h1 className="font-serif text-4xl font-semibold tracking-tight text-stone-950">Welcome back</h1>
      <p className="mt-2 text-stone-600">Log in to manage your passes or your Puja club.</p>

      <div role="tablist" aria-label="Account type" className="mt-8 grid grid-cols-2 gap-1 rounded-xl bg-stone-200/70 p-1">
        {([
          { value: "visitor", label: "Visitor", icon: UserRound },
          { value: "club_admin", label: "Puja Club", icon: Building2 },
        ] as const).map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={role === value}
            onClick={() => setRole(value)}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors",
              role === value ? "bg-white text-stone-950 shadow-sm" : "text-stone-600 hover:text-stone-900",
            )}
          >
            <Icon className="size-4" aria-hidden="true" /> {label}
          </button>
        ))}
      </div>

      <form key={role} onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Field label="Email or mobile number">
          <Input name="email" required autoComplete="username" defaultValue={demo.email} />
        </Field>
        <Field label="Password">
          <span className="relative block">
            <Input name="password" type={showPassword ? "text" : "password"} required autoComplete="current-password" defaultValue="puja2026" className="pr-10" />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-stone-400 hover:text-stone-700">
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </span>
        </Field>
        <div className="flex items-center justify-between">
          <Checkbox label="Keep me signed in" defaultChecked />
          <Link href="/login" className="text-sm font-semibold text-orange-700 hover:text-orange-800">Forgot password?</Link>
        </div>
        <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-600 px-5 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-70">
          {loading && <Loader2 className="size-4 animate-spin" />}
          {role === "club_admin" ? "Log in to club dashboard" : "Log in"}
        </button>
      </form>

      <p className="mt-5 flex gap-2 rounded-xl bg-orange-50 p-3 text-xs leading-5 text-orange-900">
        <Info className="size-4 shrink-0" aria-hidden="true" />
        Demo mode: the form is pre-filled with a sample {role === "club_admin" ? "club admin" : "visitor"} account. Any password works.
      </p>

      <p className="mt-8 text-center text-sm text-stone-600">
        {role === "club_admin" ? (
          <>Organising a Puja? <Link href="/clubs/register" className="font-semibold text-orange-700 hover:text-orange-800">Register your club</Link></>
        ) : (
          <>New to PujaPass? <Link href="/register" className="font-semibold text-orange-700 hover:text-orange-800">Create an account</Link></>
        )}
      </p>
    </div>
  );
}
