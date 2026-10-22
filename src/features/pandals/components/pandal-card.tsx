"use client";

import { ArrowRight, BadgeCheck, Heart, MapPin, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Pandal } from "@/types";
import { useSavedPandals } from "../use-saved-pandals";

type PandalCardProps = { pandal: Pandal; featured?: boolean };

export function PandalCard({ pandal, featured = false }: PandalCardProps) {
  const { savedIds, toggleSaved } = useSavedPandals();
  const isSaved = savedIds.includes(pandal.id);
  return (
    <article className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={pandal.imageSrc}
          alt={pandal.imageAlt}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {pandal.clubVerified && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold tracking-wide text-white">
            <BadgeCheck className="size-3.5" aria-hidden="true" />
            VERIFIED
          </span>
        )}
        {featured && <span className="absolute left-3 top-12 rounded-full bg-orange-400 px-2.5 py-1 text-[11px] font-bold text-stone-950">FEATURED</span>}
        <button type="button" onClick={() => toggleSaved(pandal.id)} aria-label={`${isSaved ? "Remove" : "Save"} ${pandal.name}`} className={isSaved ? "absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-white text-orange-600 shadow backdrop-blur" : "absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur transition-colors hover:bg-white hover:text-orange-600"}><Heart className={isSaved ? "size-4 fill-current" : "size-4"} aria-hidden="true" /></button>
        <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-stone-800">
          {pandal.category}
        </span>
      </div>
      <div className="flex items-end justify-between gap-3 p-4">
        <div>
          <h3 className="font-serif text-xl font-semibold text-stone-950">
            {pandal.name}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-stone-500">
            <MapPin className="size-3.5 text-orange-600" aria-hidden="true" />
            {pandal.neighbourhood}
          </p>
          <p className="mt-1 flex items-center gap-1 text-sm text-stone-500"><Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" /> <span className="font-medium text-amber-600">{pandal.rating}</span> ({pandal.reviewCount} reviews)</p>
          <div className="mt-3 flex flex-wrap gap-2"><span className={pandal.entryType === "Free Entry" ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700" : "rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700"}>{pandal.entryType}</span><span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">{pandal.highlight}</span></div>
        </div>
        <Link
          href={`/pandals/${pandal.slug}`}
          aria-label={`View ${pandal.name}`}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-700 transition-colors hover:bg-orange-600 hover:text-white"
        >
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

