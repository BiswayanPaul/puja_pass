"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, FileUp, Loader2 } from "lucide-react";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { areas } from "@/data/pandals";
import { submitClubApplication } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

const steps = ["Club", "Pandal", "Contact", "Review"];

type FormValues = Record<string, string>;

function FileField({ name, label, value }: { name: string; label: string; value?: string }) {
  const [fileName, setFileName] = useState(value ?? "");
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-stone-300 bg-white p-4 hover:border-orange-400">
      <span className="flex size-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
        <FileUp className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-stone-800">{label}</span>
        <span className="block truncate text-xs text-stone-500">{fileName || "PDF, JPG or PNG up to 5 MB"}</span>
      </span>
      <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only" onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")} />
      {/* Only the file name is kept in this UI-only flow. */}
      <input type="hidden" name={name} value={fileName} />
    </label>
  );
}

export function ClubRegisterForm() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<FormValues>({});
  const [status, setStatus] = useState<"editing" | "submitting" | "submitted">("editing");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const entries = Object.fromEntries(form) as FormValues;
    if (step === 1) entries.offers = form.getAll("offers").join(", ");
    setValues((current) => ({ ...current, ...entries }));
    if (step < steps.length - 1) {
      setStep(step + 1);
      return;
    }
    setStatus("submitting");
    setError(null);
    const result = await submitClubApplication({ ...values, ...entries });
    if (result.ok) {
      setStatus("submitted");
    } else {
      setError(result.error);
      setStatus("editing");
    }
  };

  if (status === "submitted") {
    return (
      <div>
        <CheckCircle2 className="size-12 text-emerald-600" aria-hidden="true" />
        <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight text-stone-950">Application received</h1>
        <p className="mt-2 text-stone-600">
          Thank you, {values.contactName || "organiser"}. We&apos;ll review <span className="font-semibold">{values.clubName}</span> and get back to you at {values.email}.
        </p>
        <ol className="mt-8 space-y-4">
          {[
            { title: "Verification", detail: "Our team checks your documents — usually within 2–3 working days." },
            { title: "Set up your pandal profile", detail: "Add photos, theme details, timings and free-entry information." },
            { title: "Publish passes", detail: "Create ticket tiers and slots, then start scanning QR passes at the gate." },
          ].map((item, index) => (
            <li key={item.title} className="flex gap-4">
              <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold", index === 0 ? "bg-orange-600 text-white" : "bg-stone-200 text-stone-600")}>{index + 1}</span>
              <div>
                <p className="font-semibold text-stone-900">{item.title}</p>
                <p className="text-sm text-stone-600">{item.detail}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/club/dashboard" className="rounded-full bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700">Preview the club dashboard</Link>
          <Link href="/" className="rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-800 hover:bg-white">Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-bold tracking-[0.16em] text-orange-600">FOR PUJA CLUBS</p>
      <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-stone-950">Register your club</h1>
      <p className="mt-2 text-stone-600">Offer authorised timed entry, manage capacity and check visitors in with QR codes.</p>

      <ol className="mt-8 flex items-center gap-2" aria-label="Progress">
        {steps.map((label, index) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              aria-current={index === step ? "step" : undefined}
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                index < step ? "bg-emerald-600 text-white" : index === step ? "bg-orange-600 text-white" : "bg-stone-200 text-stone-600",
              )}
            >
              {index < step ? <Check className="size-4" /> : index + 1}
            </span>
            <span className={cn("hidden text-sm font-medium sm:block", index === step ? "text-stone-950" : "text-stone-500")}>{label}</span>
            {index < steps.length - 1 && <span className="h-px flex-1 bg-stone-300" aria-hidden="true" />}
          </li>
        ))}
      </ol>

      <form key={step} onSubmit={handleSubmit} className="mt-8 space-y-4">
        {step === 0 && (
          <>
            <Field label="Club name"><Input name="clubName" required defaultValue={values.clubName} placeholder="e.g. Sreebhumi Sporting Club" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Society registration no."><Input name="registration" required defaultValue={values.registration} placeholder="S/2L/12345" /></Field>
              <Field label="Year established"><Input name="established" type="number" min={1800} max={2026} required defaultValue={values.established} placeholder="1972" /></Field>
            </div>
            <Field label="Area">
              <Select name="area" required defaultValue={values.area ?? ""}>
                <option value="" disabled>Select area</option>
                {areas.map((area) => <option key={area}>{area}</option>)}
              </Select>
            </Field>
            <Field label="Pandal address"><Textarea name="address" required defaultValue={values.address} placeholder="Street, locality, PIN code" /></Field>
          </>
        )}

        {step === 1 && (
          <>
            <Field label="Theme for this year" hint="You can update this later."><Input name="theme" defaultValue={values.theme} placeholder="e.g. Palace of Lights" /></Field>
            <Field label="Short description"><Textarea name="description" required defaultValue={values.description} placeholder="What makes your Puja special?" /></Field>
            <Field label="Expected daily footfall">
              <Select name="footfall" required defaultValue={values.footfall ?? ""}>
                <option value="" disabled>Select a range</option>
                <option>Under 5,000</option>
                <option>5,000 – 25,000</option>
                <option>25,000 – 1,00,000</option>
                <option>Over 1,00,000</option>
              </Select>
            </Field>
            <fieldset>
              <legend className="text-sm font-semibold text-stone-800">What would you like to offer?</legend>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {["Timed entry slots", "Priority darshan", "Guided tours", "Bhog / prasad passes"].map((offer) => (
                  <Checkbox key={offer} name="offers" value={offer} defaultChecked={values.offers?.includes(offer) ?? offer === "Timed entry slots"} label={offer} className="rounded-lg border border-stone-200 bg-white p-3" />
                ))}
              </div>
            </fieldset>
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Contact person"><Input name="contactName" required autoComplete="name" defaultValue={values.contactName} /></Field>
              <Field label="Role in club"><Input name="contactRole" required defaultValue={values.contactRole} placeholder="Secretary" /></Field>
              <Field label="Email"><Input name="email" type="email" required autoComplete="email" defaultValue={values.email} /></Field>
              <Field label="Mobile number"><Input name="phone" type="tel" required autoComplete="tel" defaultValue={values.phone} pattern="[+0-9 ]{10,16}" /></Field>
            </div>
            <FileField name="certificate" label="Society registration certificate" value={values.certificate} />
            <FileField name="permission" label="Police / municipal permission" value={values.permission} />
          </>
        )}

        {step === 3 && (
          <>
            <dl className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white text-sm">
              {[
                ["Club", values.clubName],
                ["Registration no.", values.registration],
                ["Area", values.area],
                ["Address", values.address],
                ["Theme", values.theme || "—"],
                ["Footfall", values.footfall],
                ["Offerings", values.offers || "—"],
                ["Contact", `${values.contactName} (${values.contactRole})`],
                ["Email / phone", `${values.email} · ${values.phone}`],
                ["Documents", [values.certificate, values.permission].filter(Boolean).join(", ") || "Not uploaded yet"],
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-[130px_1fr] gap-3 px-4 py-2.5">
                  <dt className="text-stone-500">{label}</dt>
                  <dd className="font-medium text-stone-900">{value}</dd>
                </div>
              ))}
            </dl>
            <Checkbox required label="I confirm I am authorised to represent this club and that the information above is accurate." />
          </>
        )}

        {error && (
          <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between pt-2">
          {step > 0 ? (
            <button type="button" onClick={() => setStep(step - 1)} className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-white">
              <ArrowLeft className="size-4" /> Back
            </button>
          ) : (
            <Link href="/login?role=club" className="text-sm font-semibold text-orange-700">Already registered? Log in</Link>
          )}
          <button type="submit" disabled={status === "submitting"} className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-6 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-70">
            {status === "submitting" && <Loader2 className="size-4 animate-spin" />}
            {step === steps.length - 1 ? "Submit application" : "Continue"}
            {step < steps.length - 1 && <ArrowRight className="size-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}
