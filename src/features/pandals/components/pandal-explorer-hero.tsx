"use client";

import { MapPin, Search } from "lucide-react";
import Image from "next/image";

type PandalExplorerHeroProps = { query: string; onQueryChange: (query: string) => void; onSearch: () => void };

export function PandalExplorerHero({ query, onQueryChange, onSearch }: PandalExplorerHeroProps) {
  return (
    <section className="relative isolate overflow-hidden bg-stone-950 pt-16 text-white">
      <Image src="/images/Visitors_Card_Image.png" alt="Visitors walking through an illuminated Durga Puja pandal" fill preload sizes="100vw" className="-z-20 object-cover object-center" />
      <div className="absolute inset-0 -z-10 bg-linear-to-r from-black/90 via-black/65 to-black/20" />
      <div className="mx-auto max-w-7xl px-4 py-18 sm:px-6 lg:px-8 lg:py-22">
        <div className="max-w-2xl">
          <p className="text-sm font-bold tracking-[0.16em] text-orange-300">EXPLORE PANDALS</p>
          <h1 className="mt-3 font-serif text-5xl font-semibold leading-[0.95] tracking-tight sm:text-6xl">Kolkata&apos;s Most <span className="text-orange-300">Beautiful Pandals</span></h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-stone-100 sm:text-lg">Discover, plan and experience Durga Puja with authorised passes from verified Puja Clubs.</p>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); onSearch(); }} className="mt-8 grid max-w-3xl overflow-hidden rounded-2xl bg-white p-2 text-stone-900 shadow-2xl sm:grid-cols-[1fr_190px_auto]" aria-label="Search pandals">
          <label className="flex items-center gap-3 px-4 py-3"><Search className="size-5 shrink-0 text-orange-600" aria-hidden="true" /><input value={query} onChange={(event) => onQueryChange(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-stone-500" placeholder="Search by pandal name, location or area..." /></label>
          <label className="flex items-center gap-2 border-y border-stone-200 px-4 py-3 sm:border-x sm:border-y-0"><MapPin className="size-4 text-stone-900" aria-hidden="true" /><select className="w-full bg-transparent text-sm font-medium outline-none"><option>Kolkata</option><option>North Kolkata</option><option>South Kolkata</option><option>Central Kolkata</option></select></label>
          <button type="submit" className="rounded-xl bg-orange-600 px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-700">Search Pandals</button>
        </form>
      </div>
    </section>
  );
}
