"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowLeft, CreditCard, Landmark, Loader2, Lock, Route, Smartphone } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import { Checkbox, Field, Input, Select } from "@/components/ui/field";
import { useSession } from "@/features/auth/use-session";
import { rememberBooking } from "@/features/bookings/device-bookings";
import { placeBooking } from "@/features/checkout/actions";
import { TrailSummary } from "@/features/trail/components/trail-summary";
import { clearTrail, useTrail } from "@/features/trail/use-trail";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PaymentMethod } from "@/types";

const paymentMethods: { value: PaymentMethod; label: string; description: string; icon: typeof Smartphone }[] = [
  { value: "UPI", label: "UPI", description: "GPay, PhonePe, Paytm or any UPI app", icon: Smartphone },
  { value: "Card", label: "Debit / Credit card", description: "Visa, Mastercard, RuPay", icon: CreditCard },
  { value: "Net Banking", label: "Net banking", description: "All major Indian banks", icon: Landmark },
];

export function CheckoutForm() {
  const router = useRouter();
  const user = useSession();
  const trail = useTrail();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("UPI");
  const [status, setStatus] = useState<"idle" | "processing" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  if (status === "done") {
    return <p className="py-20 text-center text-stone-600">Payment successful. Opening your passes…</p>;
  }

  if (!trail.lines.length) {
    return (
      <EmptyState
        icon={Route}
        title="Nothing to check out yet"
        description="Add at least one time slot to your Puja trail before checking out."
        action={<Link href="/pandals" className="rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-700">Explore pandals</Link>}
      />
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("processing");
    setError(null);
    try {
      // The server re-prices the trail and reserves the seats; payment is simulated for now.
      const result = await placeBooking({
        lines: trail.lines.map(({ slotId, tierId, quantity }) => ({ slotId, tierId, quantity })),
        contact: {
          name: String(form.get("name")),
          email: String(form.get("email")),
          phone: String(form.get("phone")),
        },
        paymentMethod,
        expectedTotal: trail.total,
      });
      if (!result.ok) {
        setError(result.error);
        setStatus("idle");
        return;
      }
      rememberBooking(result.reference, result.manageKey);
      setStatus("done");
      clearTrail();
      router.push(`${result.path}&new=1`);
    } catch {
      setError("We couldn't complete your booking. Check your connection and try again.");
      setStatus("idle");
    }
  };

  return (
    // Keyed by user so the defaults refresh once the stored session loads.
    <form key={user?.id ?? "guest"} onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-6">
        <Link href="/trail" className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-700 hover:text-orange-800">
          <ArrowLeft className="size-4" /> Back to trail
        </Link>

        <section className="rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="font-serif text-2xl font-semibold text-stone-950">Contact details</h2>
          <p className="mt-1 text-sm text-stone-600">
            Your passes will be sent here.{" "}
            {!user && <>Have an account? <Link href="/login?next=/checkout" className="font-semibold text-orange-700">Log in</Link></>}
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" className="sm:col-span-2">
              <Input name="name" required autoComplete="name" defaultValue={user?.name} placeholder="Name of the lead visitor" />
            </Field>
            <Field label="Email" hint="We'll email your passes here.">
              <Input name="email" type="email" required autoComplete="email" defaultValue={user?.email} placeholder="you@example.com" />
            </Field>
            <Field label="Mobile number" hint="Only used about your visit.">
              <Input name="phone" type="tel" required autoComplete="tel" defaultValue={user?.phone} placeholder="+91 98XXX XXXXX" pattern="[+0-9 ]{10,16}" />
            </Field>
          </div>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="font-serif text-2xl font-semibold text-stone-950">Payment</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Payment method">
            {paymentMethods.map(({ value, label, description, icon: Icon }) => (
              <label
                key={value}
                className={cn(
                  "cursor-pointer rounded-xl border p-4 transition-colors",
                  paymentMethod === value ? "border-orange-500 bg-orange-50/70 ring-2 ring-orange-500/15" : "border-stone-200 hover:border-orange-300",
                )}
              >
                <input type="radio" name="paymentMethod" value={value} checked={paymentMethod === value} onChange={() => setPaymentMethod(value)} className="sr-only" />
                <Icon className="size-5 text-orange-600" aria-hidden="true" />
                <span className="mt-2 block text-sm font-semibold text-stone-950">{label}</span>
                <span className="mt-0.5 block text-xs text-stone-500">{description}</span>
              </label>
            ))}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {paymentMethod === "UPI" && (
              <Field label="UPI ID" className="sm:col-span-2">
                <Input required placeholder="yourname@okbank" pattern="[a-zA-Z0-9.\-_]+@[a-zA-Z]+" />
              </Field>
            )}
            {paymentMethod === "Card" && (
              <>
                <Field label="Card number" className="sm:col-span-2">
                  <Input required inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9012 3456" />
                </Field>
                <Field label="Expiry">
                  <Input required autoComplete="cc-exp" placeholder="MM / YY" />
                </Field>
                <Field label="CVV">
                  <Input required inputMode="numeric" autoComplete="cc-csc" placeholder="•••" maxLength={4} />
                </Field>
              </>
            )}
            {paymentMethod === "Net Banking" && (
              <Field label="Bank" className="sm:col-span-2">
                <Select required defaultValue="">
                  <option value="" disabled>Select your bank</option>
                  <option>State Bank of India</option>
                  <option>HDFC Bank</option>
                  <option>ICICI Bank</option>
                  <option>Axis Bank</option>
                  <option>Bank of Baroda</option>
                </Select>
              </Field>
            )}
          </div>
          <p className="mt-4 rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-500">Demo checkout — no real payment is taken.</p>
        </section>

        <Checkbox
          required
          label={<>I agree to the <Link href="/#about" className="font-semibold text-orange-700">booking terms</Link> and understand passes are valid only for the selected slot.</>}
        />
      </div>

      <aside className="lg:sticky lg:top-6 lg:h-fit">
        <TrailSummary trail={trail}>
          {error && (
            <p role="alert" className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={status === "processing"}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-600 px-5 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-70"
          >
            {status === "processing" ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
            {status === "processing" ? "Processing payment…" : `Pay ${formatINR(trail.total)}`}
          </button>
          <p className="mt-3 text-center text-xs text-stone-500">Secured payment · Instant QR passes</p>
        </TrailSummary>
      </aside>
    </form>
  );
}
