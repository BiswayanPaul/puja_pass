"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition, type FormEvent } from "react";
import { CheckCircle2, CircleDashed, ExternalLink, Eye, ImagePlus, Leaf, Loader2, ShieldOff, TriangleAlert, X } from "lucide-react";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { areas } from "@/data/areas";
import { useFestivalDays } from "@/features/festival/festival-context";
import { PandalCard } from "@/features/pandals/components/pandal-card";
import { cn } from "@/lib/utils";
import type { AdminPandalStatus, Area, Pandal } from "@/types";
import { updatePandalProfile, type SaveProfileResult } from "../actions";
import { ClubPageHeader } from "./club-shell";

const amenityOptions = ["Drinking water", "First aid", "Wheelchair access", "Help desk", "Priority queue", "Cloak room", "Food court", "Parking", "Seating area", "Kids' corner"];
const categories = ["Art & Heritage", "Heritage", "Contemporary", "Theme Based", "Family Friendly", "Eco-friendly", "Grand Scale"];

/** live: on the public site · draft: not yet published by PujaPass · blocked: club not verified. */
export function PandalProfileForm({ pandal, status, profileGaps }: { pandal: Pandal; status: AdminPandalStatus; profileGaps: string[] }) {
  const [draft, setDraft] = useState(pandal);
  const [result, setResult] = useState<SaveProfileResult | null>(null);
  const [saving, startSaving] = useTransition();
  const season = useFestivalDays()[0]?.date.slice(0, 4);

  const update = <K extends keyof Pandal>(key: K, value: Pandal[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setResult(null);
  };

  const toggleAmenity = (amenity: string) =>
    update("amenities", draft.amenities.includes(amenity) ? draft.amenities.filter((item) => item !== amenity) : [...draft.amenities, amenity]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    startSaving(async () => {
      try {
        setResult(
          await updatePandalProfile({
            pandalId: pandal.id,
            name: draft.name,
            category: draft.category,
            area: draft.area,
            neighbourhood: draft.neighbourhood,
            address: draft.address,
            description: draft.description,
            highlight: draft.highlight,
            timings: draft.timings,
            themeTitle: draft.theme.title,
            themeDescription: draft.theme.description,
            idolArtist: draft.idolArtist,
            nearestMetro: draft.nearestMetro,
            crowdLevel: draft.crowdLevel,
            freeEntryInfo: draft.freeEntryInfo,
            amenities: draft.amenities,
            ecoFriendly: draft.ecoFriendly,
            gallery: draft.gallery.map((image) => image.src),
          }),
        );
      } catch {
        setResult({ ok: false, error: "We couldn't save your changes. Check your connection and try again." });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 sm:p-6 lg:p-8">
      <ClubPageHeader
        title="Pandal profile"
        description="This is what visitors see on your public pandal page."
        actions={
          <>
            {status === "live" && (
              <Link href={`/pandals/${pandal.slug}`} className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-50">
                <ExternalLink className="size-4" /> View live page
              </Link>
            )}
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-70">
              {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />} Save changes
            </button>
          </>
        }
      />

      {result &&
        (result.ok ? (
          <p className="flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {result.message}
          </p>
        ) : (
          <p className="flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800" role="alert">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {result.error}
          </p>
        ))}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
            <h2 className="font-serif text-xl font-semibold text-stone-950">Basic details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Pandal name"><Input value={draft.name} onChange={(event) => update("name", event.target.value)} required /></Field>
              <Field label="Organising club" hint="The name PujaPass verified. Contact us to change it.">
                <Input value={draft.clubName} readOnly disabled />
              </Field>
              <Field label="Category">
                <Select value={draft.category} onChange={(event) => update("category", event.target.value)}>
                  {[...new Set([draft.category, ...categories])].map((category) => <option key={category}>{category}</option>)}
                </Select>
              </Field>
              <Field label="Area">
                <Select value={draft.area} onChange={(event) => update("area", event.target.value as Area)}>
                  {areas.map((area) => <option key={area}>{area}</option>)}
                </Select>
              </Field>
              <Field label="Neighbourhood"><Input value={draft.neighbourhood} onChange={(event) => update("neighbourhood", event.target.value)} /></Field>
              <Field label="Timings"><Input value={draft.timings} onChange={(event) => update("timings", event.target.value)} /></Field>
              <Field label="Highlight" hint="One line shown on your pandal card, e.g. “Chandannagar lighting across the whole lane”." className="sm:col-span-2">
                <Input value={draft.highlight} maxLength={140} onChange={(event) => update("highlight", event.target.value)} />
              </Field>
              <Field label="Full address" className="sm:col-span-2"><Input value={draft.address} onChange={(event) => update("address", event.target.value)} /></Field>
              <Field label="About the pandal" className="sm:col-span-2"><Textarea value={draft.description} onChange={(event) => update("description", event.target.value)} /></Field>
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
            <h2 className="font-serif text-xl font-semibold text-stone-950">{season ? `Theme ${season}` : "Theme"}</h2>
            <div className="mt-4 grid gap-4">
              <Field label="Theme title"><Input value={draft.theme.title} onChange={(event) => update("theme", { ...draft.theme, title: event.target.value })} /></Field>
              <Field label="Theme description"><Textarea value={draft.theme.description} onChange={(event) => update("theme", { ...draft.theme, description: event.target.value })} /></Field>
              <Field label="Idol artist"><Input value={draft.idolArtist} onChange={(event) => update("idolArtist", event.target.value)} /></Field>
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
            <h2 className="font-serif text-xl font-semibold text-stone-950">Photos</h2>
            <p className="mt-1 text-sm text-stone-500">The first photo is used as the cover image.</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {draft.gallery.map((image, index) => (
                <div key={image.src} className="group relative aspect-square overflow-hidden rounded-xl">
                  <Image src={image.src} alt={image.alt} fill sizes="200px" className="object-cover" />
                  {index === 0 && <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-bold text-stone-900">COVER</span>}
                  <button
                    type="button"
                    aria-label={`Remove ${image.alt}`}
                    onClick={() => update("gallery", draft.gallery.filter((item) => item !== image))}
                    className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
              {/* TODO: photo uploads need file storage (e.g. Supabase Storage). */}
              <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-200 p-3 text-center text-sm font-medium text-stone-400">
                <ImagePlus className="size-6" aria-hidden="true" />
                Photo uploads coming soon
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
            <h2 className="font-serif text-xl font-semibold text-stone-950">Visitor information</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Nearest metro"><Input value={draft.nearestMetro} onChange={(event) => update("nearestMetro", event.target.value)} /></Field>
              <Field label="Expected crowd">
                <Select value={draft.crowdLevel} onChange={(event) => update("crowdLevel", event.target.value as Pandal["crowdLevel"])}>
                  {["Low", "Moderate", "High", "Very High"].map((level) => <option key={level}>{level}</option>)}
                </Select>
              </Field>
              <Field label="Free public entry details" hint="Always shown to visitors, even for ticketed pandals." className="sm:col-span-2">
                <Textarea value={draft.freeEntryInfo} onChange={(event) => update("freeEntryInfo", event.target.value)} />
              </Field>
            </div>
            <fieldset className="mt-5">
              <legend className="text-sm font-semibold text-stone-800">Facilities</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {amenityOptions.map((amenity) => {
                  const active = draft.amenities.includes(amenity);
                  return (
                    <button
                      key={amenity}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleAmenity(amenity)}
                      className={cn("rounded-full border px-3 py-1.5 text-sm font-medium transition-colors", active ? "border-orange-600 bg-orange-600 text-white" : "border-stone-200 text-stone-700 hover:border-orange-300")}
                    >
                      {amenity}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <label className="mt-5 flex items-center justify-between gap-4 rounded-xl bg-lime-50 p-4">
              <span className="flex items-center gap-3">
                <Leaf className="size-5 text-lime-700" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-semibold text-stone-900">Eco-friendly pandal</span>
                  <span className="block text-xs text-stone-600">Shown as a badge and in the Eco-friendly filter.</span>
                </span>
              </span>
              <input type="checkbox" checked={draft.ecoFriendly} onChange={(event) => update("ecoFriendly", event.target.checked)} className="size-5 accent-orange-600" />
            </label>
          </section>
        </div>

        <aside className="space-y-3 xl:sticky xl:top-6 xl:h-fit">
          <p className="text-sm font-semibold text-stone-700">Live preview</p>
          <PandalCard pandal={{ ...draft, imageSrc: draft.gallery[0]?.src ?? draft.imageSrc }} />
          {/* After a save, use the action's answer instead of waiting for the page to re-render. */}
          <ListingStatus status={status} profileGaps={result?.ok ? result.profileGaps : profileGaps} />
        </aside>
      </div>
    </form>
  );
}

function ListingStatus({ status, profileGaps }: { status: AdminPandalStatus; profileGaps: string[] }) {
  if (status === "blocked") {
    return (
      <p className="flex gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">
        <ShieldOff className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Hidden from visitors: your club&apos;s verification is on hold. PujaPass will contact you.
      </p>
    );
  }
  if (status === "live") {
    return (
      <p className="flex gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
        <Eye className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Live: visitors can find and book your pandal.
      </p>
    );
  }
  return (
    <div className="flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
      <CircleDashed className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {profileGaps.length ? (
        <p>
          Draft, not visible to visitors yet. Fill in <span className="font-semibold">{profileGaps.join(", ").toLowerCase()}</span> and save. PujaPass then reviews and
          publishes it.
        </p>
      ) : (
        <p>Draft, not visible yet. Your profile is complete: PujaPass will review and publish it.</p>
      )}
    </div>
  );
}
