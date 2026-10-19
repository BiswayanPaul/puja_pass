"use client";

import { CheckCircle2, Minus, Plus, Route, TicketCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { MAX_PASSES_PER_SLOT, pujaDays } from "@/data/festival";
import { addToTrail } from "@/features/trail/use-trail";
import { formatDate, formatINR, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Pandal, Slot, TicketTier } from "@/types";

export function availability(slot: Slot) {
  const remaining = slot.capacity - slot.booked;
  if (remaining <= 0) return { remaining: 0, label: "Sold out", tone: "sold" as const };
  if (remaining / slot.capacity < 0.15) return { remaining, label: `${remaining} left`, tone: "low" as const };
  return { remaining, label: "Available", tone: "open" as const };
}

export function SlotPicker({ pandal, tiers, slots }: { pandal: Pandal; tiers: TicketTier[]; slots: Slot[] }) {
  const activeTiers = tiers.filter((tier) => tier.active);
  const [date, setDate] = useState(pujaDays[0].date);
  const [tierId, setTierId] = useState(activeTiers[0]?.id ?? "");
  const [slotId, setSlotId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(2);
  const [added, setAdded] = useState(false);

  const tier = activeTiers.find((item) => item.id === tierId);
  const daySlots = slots.filter((slot) => slot.date === date);
  const selectedSlot = daySlots.find((slot) => slot.id === slotId);

  if (!tier) {
    return <p className="text-sm text-stone-600">This club has not published any passes yet.</p>;
  }

  const handleAdd = () => {
    if (!selectedSlot) return;
    addToTrail({
      pandalId: pandal.id,
      pandalSlug: pandal.slug,
      pandalName: pandal.name,
      neighbourhood: pandal.neighbourhood,
      imageSrc: pandal.imageSrc,
      imageAlt: pandal.imageAlt,
      tierId: tier.id,
      tierName: tier.name,
      unitPrice: tier.price,
      slotId: selectedSlot.id,
      date: selectedSlot.date,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      quantity,
    });
    setAdded(true);
  };

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="text-sm font-semibold text-stone-800">1. Choose a pass</legend>
        <div className="mt-2 space-y-2">
          {activeTiers.map((item) => (
            <label
              key={item.id}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                item.id === tierId ? "border-orange-500 bg-orange-50/70" : "border-stone-200 hover:border-orange-300",
              )}
            >
              <input
                type="radio"
                name="tier"
                checked={item.id === tierId}
                onChange={() => { setTierId(item.id); setAdded(false); }}
                className="mt-1 accent-orange-600"
              />
              <span className="flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-stone-950">{item.name}</span>
                  <span className="font-semibold text-stone-950">{formatINR(item.price)}</span>
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-stone-600">{item.description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-stone-800">2. Pick a day</legend>
        <div className="mt-2 grid grid-cols-5 gap-1.5">
          {pujaDays.map((day) => (
            <button
              key={day.date}
              type="button"
              onClick={() => { setDate(day.date); setSlotId(null); setAdded(false); }}
              aria-pressed={day.date === date}
              className={cn(
                "rounded-lg border px-1 py-2 text-center transition-colors",
                day.date === date ? "border-orange-600 bg-orange-600 text-white" : "border-stone-200 text-stone-700 hover:border-orange-300",
              )}
            >
              <span className="block text-[11px] font-semibold">{day.label}</span>
              <span className="block text-xs opacity-80">{formatDate(day.date, { withYear: false })}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-stone-800">3. Select an entry slot</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {daySlots.map((slot) => {
            const status = availability(slot);
            const selected = slot.id === slotId;
            return (
              <button
                key={slot.id}
                type="button"
                disabled={status.tone === "sold"}
                onClick={() => { setSlotId(slot.id); setAdded(false); }}
                aria-pressed={selected}
                className={cn(
                  "rounded-lg border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:bg-stone-50 disabled:opacity-60",
                  selected ? "border-orange-600 bg-orange-50 ring-2 ring-orange-600/20" : "border-stone-200 hover:border-orange-300",
                )}
              >
                <span className="block text-sm font-semibold text-stone-900">{formatTime(slot.startTime)}</span>
                <span
                  className={cn(
                    "block text-xs",
                    status.tone === "sold" ? "text-stone-500" : status.tone === "low" ? "font-medium text-amber-700" : "text-emerald-700",
                  )}
                >
                  {status.label}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-stone-800">4. Visitors</span>
        <div className="flex items-center gap-1 rounded-full border border-stone-200 p-1">
          <button type="button" aria-label="Fewer visitors" disabled={quantity <= 1} onClick={() => setQuantity((value) => value - 1)} className="flex size-8 items-center justify-center rounded-full text-stone-700 hover:bg-stone-100 disabled:opacity-40">
            <Minus className="size-4" />
          </button>
          <span className="w-8 text-center text-sm font-semibold" aria-live="polite">{quantity}</span>
          <button type="button" aria-label="More visitors" disabled={quantity >= MAX_PASSES_PER_SLOT} onClick={() => setQuantity((value) => value + 1)} className="flex size-8 items-center justify-center rounded-full text-stone-700 hover:bg-stone-100 disabled:opacity-40">
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-stone-200 pt-4">
        <span className="text-sm text-stone-600">Total</span>
        <span className="font-serif text-2xl font-semibold text-stone-950">{formatINR(tier.price * quantity)}</span>
      </div>

      {added ? (
        <div className="rounded-xl bg-emerald-50 p-4" role="status">
          <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <CheckCircle2 className="size-4" /> Added to your Puja trail
          </p>
          <div className="mt-3 flex gap-2">
            <Link href="/trail" className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700">
              <Route className="size-4" /> View trail
            </Link>
            <Link href="/pandals" className="inline-flex flex-1 items-center justify-center rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50">
              Add more pandals
            </Link>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleAdd}
          disabled={!selectedSlot}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          <TicketCheck className="size-4" />
          {selectedSlot ? "Add to Puja trail" : "Select a slot to continue"}
        </button>
      )}
    </div>
  );
}
