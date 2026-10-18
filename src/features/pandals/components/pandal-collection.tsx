"use client";

import { ArrowRight, Crown, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { PandalCard } from "./pandal-card";
import type { Pandal } from "@/types";

type PandalCollectionProps = { title: string; description: string; pandals: Pandal[]; featured?: boolean; resultCount?: number; sortBy?: string; onSortChange?: (sort: string) => void };

export function PandalCollection({ title, description, pandals, featured = false, resultCount, sortBy = "Most Popular", onSortChange }: PandalCollectionProps) {
  return <section className={featured ? "rounded-2xl border border-orange-100 bg-orange-50/60 p-4 sm:p-5" : "pt-2"}><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><h2 className="font-serif text-3xl font-semibold tracking-tight text-stone-950">{featured && <Crown className="mr-2 inline size-6 text-orange-500" aria-hidden="true" />}{title}{typeof resultCount === "number" && <span className="ml-2 text-base font-sans font-medium text-stone-500">({resultCount})</span>}</h2><p className="hidden text-sm text-stone-600 lg:block">{description}</p></div>{featured ? <Link href="#all-pandals" className="inline-flex items-center gap-2 text-sm font-semibold text-orange-700 hover:text-orange-800">View all featured <ArrowRight className="size-4" /></Link> : <label className="flex items-center gap-2 text-sm text-stone-600"><SlidersHorizontal className="size-4" />Sort by <select value={sortBy} onChange={(event) => onSortChange?.(event.target.value)} className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700"><option>Most Popular</option><option>Highest Rated</option><option>Nearest</option></select></label>}</div>{pandals.length ? <div className={featured ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3" : "grid gap-4 sm:grid-cols-2 xl:grid-cols-4"}>{pandals.map((pandal) => <PandalCard key={pandal.id} pandal={pandal} featured={featured} />)}</div> : <div className="rounded-xl border border-dashed border-stone-300 bg-white p-10 text-center"><p className="font-serif text-2xl font-semibold text-stone-950">No pandals found</p><p className="mt-2 text-sm text-stone-600">Try removing a filter or searching for another area.</p></div>}</section>;
}

