"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Checkbox, Field, Input } from "@/components/ui/field";
import { signIn } from "../use-session";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    if (form.get("password") !== form.get("confirm")) {
      setError("Passwords don't match.");
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => {
      signIn("visitor", {
        id: `user-${Date.now()}`,
        name: String(form.get("name")),
        email: String(form.get("email")),
        phone: String(form.get("phone")),
      });
      router.push("/pandals");
    }, 600);
  };

  return (
    <div>
      <h1 className="font-serif text-4xl font-semibold tracking-tight text-stone-950">Create your account</h1>
      <p className="mt-2 text-stone-600">Save pandals, build your Puja trail and keep every QR pass in one place.</p>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-4 sm:grid-cols-2">
        <Field label="Full name" className="sm:col-span-2">
          <Input name="name" required autoComplete="name" placeholder="Riya Banerjee" />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
        </Field>
        <Field label="Mobile number">
          <Input name="phone" type="tel" required autoComplete="tel" placeholder="+91 98XXX XXXXX" pattern="[+0-9 ]{10,16}" />
        </Field>
        <Field label="Password" hint="At least 8 characters.">
          <Input name="password" type="password" required minLength={8} autoComplete="new-password" />
        </Field>
        <Field label="Confirm password">
          <Input name="confirm" type="password" required minLength={8} autoComplete="new-password" aria-invalid={Boolean(error)} />
        </Field>
        {error && <p className="text-sm font-medium text-rose-600 sm:col-span-2" role="alert">{error}</p>}
        <Checkbox className="sm:col-span-2" required label="I agree to the Terms of Service and Privacy Policy." />
        <Checkbox className="sm:col-span-2" defaultChecked label="Send me updates about new pandals and Puja offers." />
        <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-600 px-5 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-70 sm:col-span-2">
          {loading && <Loader2 className="size-4 animate-spin" />}
          Create account
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-stone-600">
        Already have an account? <Link href="/login" className="font-semibold text-orange-700 hover:text-orange-800">Log in</Link>
      </p>
      <p className="mt-2 text-center text-sm text-stone-600">
        Representing a Puja club? <Link href="/clubs/register" className="font-semibold text-orange-700 hover:text-orange-800">Register your club</Link>
      </p>
    </div>
  );
}
