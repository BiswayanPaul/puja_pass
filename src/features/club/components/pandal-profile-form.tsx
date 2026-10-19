"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { CheckCircle2, ExternalLink, ImagePlus, Leaf, X } from "lucide-react";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { areas } from "@/data/pandals";
import { PandalCard } from "@/features/pandals/components/pandal-card";
import { cn } from "@/lib/utils";
import type { Area, Pandal } from "@/types";
import { ClubPageHeader } from "./club-shell";

const amenityOptions = ["Drinking water", "First aid", "Wheelchair access", "Help desk", "Priority queue", "Cloak room", "Food court", "Parking", "Seating area", "Kids' corner"];
const categories = ["Art & Heritage", "Heritage", "Contemporary", "Theme Based", "Family Friendly", "Eco-friendly", "Grand Scale"];

export function PandalProfileForm({ pandal }: { pandal: Pandal }) {
  const [draft, setDraft] = useState(pandal);
  const [saved, setSaved] = useState(false);

  const update = <K extends keyof Pandal>(key: K, value: Pandal[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };

  const toggleAmenity = (amenity: string) =>
    update("amenities", draft.amenities.includes(amenity) ? draft.amenities.filter((item) => item !== amenity) : [...draft.amenities, amenity]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: persist via API once the backend exists.
    setSaved(true);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 sm:p-6 lg:p-8">
      <ClubPageHeader
        title="Pandal profile"
        description="This is what visitors see on your public pandal page."
        actions={
          <>
            <Link href={`/pandals/${pandal.slug}`} className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-50">
              <ExternalLink className="size-4" /> View live page
            </Link>
            <button type="submit" className="rounded-full bg-orange-600 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-700">Save changes</button>
          </>
        }
      />

      {saved && (
        <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800" role="status">
          <CheckCircle2 className="size-4" /> Changes saved. They will appear on your public page shortly.
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
            <h2 className="font-serif text-xl font-semibold text-stone-950">Basic details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Pandal name"><Input value={draft.name} onChange={(event) => update("name", event.target.value)} required /></Field>
              <Field label="Organising club"><Input value={draft.clubName} onChange={(event) => update("clubName", event.target.value)} required /></Field>
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
              <Field label="Full address" className="sm:col-span-2"><Input value={draft.address} onChange={(event) => update("address", event.target.value)} /></Field>
              <Field label="About the pandal" className="sm:col-span-2"><Textarea value={draft.description} onChange={(event) => update("description", event.target.value)} /></Field>
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
            <h2 className="font-serif text-xl font-semibold text-stone-950">Theme {2026}</h2>
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
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 text-sm font-medium text-stone-500 hover:border-orange-400 hover:text-orange-700">
                <ImagePlus className="size-6" aria-hidden="true" />
                Add photo
                <input type="file" accept="image/*" className="sr-only" />
              </label>
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
          <p className="text-xs text-stone-500">Listing status: <span className="font-semibold text-emerald-700">Published</span> · Verified on 12 Sep 2026</p>
        </aside>
      </div>
    </form>
  );
}
