"use client";

import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Clock3, MapPin, Minus, Plus, Route, ShieldCheck, Trash2 } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import { MAX_PASSES_PER_SLOT } from "@/data/festival";
import { PandalCard } from "@/features/pandals/components/pandal-card";
import type { Pandal } from "@/types";
import { formatINR, formatPujaDate, formatTimeRange } from "@/lib/format";
import { clearTrail, removeFromTrail, updateTrailQuantity, useTrail, type TrailLine } from "../use-trail";
import { TrailSummary } from "./trail-summary";

function groupByDate(lines: TrailLine[]) {
  const groups = new Map<string, TrailLine[]>();
  for (const line of lines) groups.set(line.date, [...(groups.get(line.date) ?? []), line]);
  return [...groups.entries()];
}

export function TrailView({ suggestions }: { suggestions: Pandal[] }) {
  const trail = useTrail();

  if (!trail.lines.length) {
    return (
      <div className="space-y-12">
        <EmptyState
          icon={Route}
          title="Your trail is empty"
          description="Browse participating pandals, pick a time slot and add it here. You can combine passes from several pandals into one checkout."
          action={
            <Link href="/pandals" className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-700">
              Explore pandals <ArrowRight className="size-4" />
            </Link>
          }
        />
        <section>
          <h2 className="font-serif text-3xl font-semibold text-stone-950">Popular starting points</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {suggestions.map((pandal) => <PandalCard key={pandal.id} pandal={pandal} />)}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-8">
        {groupByDate(trail.lines).map(([date, lines]) => (
          <section key={date}>
            <h2 className="flex items-center gap-3 font-serif text-2xl font-semibold text-stone-950">
              <span className="size-3 rounded-full bg-orange-600 ring-4 ring-orange-100" aria-hidden="true" />
              {formatPujaDate(date)}
            </h2>
            <ol className="mt-4 space-y-3 border-l-2 border-dashed border-orange-200 pl-5 ml-1.5">
              {lines.map((line) => {
                const clash = lines.find((other) => other !== line && other.pandalId !== line.pandalId && other.startTime === line.startTime);
                return (
                  <li key={line.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                    <div className="flex gap-4">
                      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl sm:size-24">
                        <Image src={line.imageSrc} alt={line.imageAlt} fill sizes="96px" className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link href={`/pandals/${line.pandalSlug}`} className="font-serif text-lg font-semibold text-stone-950 hover:text-orange-700">
                              {line.pandalName}
                            </Link>
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-500"><MapPin className="size-3.5" aria-hidden="true" />{line.neighbourhood}</p>
                          </div>
                          <button type="button" onClick={() => removeFromTrail(line.id)} aria-label={`Remove ${line.pandalName}`} className="rounded-full p-2 text-stone-400 hover:bg-rose-50 hover:text-rose-600">
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 font-medium text-orange-800"><Clock3 className="size-3.5" aria-hidden="true" />{formatTimeRange(line.startTime, line.endTime)}</span>
                          <span className="rounded-full bg-stone-100 px-2.5 py-1 font-medium text-stone-700">{line.tierName}</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center gap-1 rounded-full border border-stone-200 p-0.5">
                            <button type="button" aria-label="Fewer passes" disabled={line.quantity <= 1} onClick={() => updateTrailQuantity(line.id, line.quantity - 1)} className="flex size-7 items-center justify-center rounded-full hover:bg-stone-100 disabled:opacity-40"><Minus className="size-3.5" /></button>
                            <span className="w-6 text-center text-sm font-semibold">{line.quantity}</span>
                            <button type="button" aria-label="More passes" disabled={line.quantity >= MAX_PASSES_PER_SLOT} onClick={() => updateTrailQuantity(line.id, line.quantity + 1)} className="flex size-7 items-center justify-center rounded-full hover:bg-stone-100 disabled:opacity-40"><Plus className="size-3.5" /></button>
                          </div>
                          <p className="text-sm text-stone-500">{formatINR(line.unitPrice)} × {line.quantity} = <span className="font-semibold text-stone-950">{formatINR(line.lineTotal)}</span></p>
                        </div>
                      </div>
                    </div>
                    {clash && (
                      <p className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                        <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
                        Same time as {clash.pandalName}. Leave time to travel between pandals.
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
        <button type="button" onClick={clearTrail} className="text-sm font-semibold text-stone-500 hover:text-rose-600">Clear trail</button>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-6 lg:h-fit">
        <TrailSummary trail={trail}>
          <Link href="/checkout" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-600 px-5 py-3 text-sm font-bold text-white hover:bg-orange-700">
            Proceed to checkout <ArrowRight className="size-4" />
          </Link>
          <Link href="/pandals" className="mt-2 inline-flex w-full items-center justify-center rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-800 hover:bg-stone-50">
            Add another pandal
          </Link>
        </TrailSummary>
        <p className="flex gap-2 rounded-xl bg-white p-4 text-xs leading-5 text-stone-600">
          <ShieldCheck className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
          Passes are issued only for slots authorised by participating clubs. Free public entry remains available at every pandal.
        </p>
      </aside>
    </div>
  );
}
