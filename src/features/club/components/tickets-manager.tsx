"use client";

import { useState, type FormEvent } from "react";
import { Pencil, Plus, Ticket } from "lucide-react";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { pujaDays } from "@/data/festival";
import { formatDate, formatINR, formatTimeRange } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Slot, TicketTier } from "@/types";
import { ClubPageHeader } from "./club-shell";

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors", checked ? "bg-emerald-600" : "bg-stone-300")}
    >
      <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-5.5" : "translate-x-0.5")} />
    </button>
  );
}

function TierSheet({
  tier,
  open,
  onOpenChange,
  onSave,
}: {
  tier: TicketTier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (values: Pick<TicketTier, "name" | "description" | "price" | "capacityPerSlot" | "perks">) => void;
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSave({
      name: String(form.get("name")),
      description: String(form.get("description")),
      price: Number(form.get("price")),
      capacityPerSlot: Number(form.get("capacity")),
      perks: String(form.get("perks")).split(",").map((perk) => perk.trim()).filter(Boolean),
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto p-6 sm:max-w-md">
        <SheetTitle className="font-serif text-2xl font-semibold">{tier ? "Edit pass type" : "New pass type"}</SheetTitle>
        <SheetDescription>Pass types are shown to visitors on your pandal page.</SheetDescription>
        <form key={tier?.id ?? "new"} onSubmit={handleSubmit} className="mt-2 space-y-4">
          <Field label="Name"><Input name="name" required defaultValue={tier?.name} placeholder="e.g. Priority Darshan" /></Field>
          <Field label="Description"><Textarea name="description" required defaultValue={tier?.description} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price (₹)"><Input name="price" type="number" min={0} required defaultValue={tier?.price} /></Field>
            <Field label="Capacity per slot"><Input name="capacity" type="number" min={1} required defaultValue={tier?.capacityPerSlot} /></Field>
          </div>
          <Field label="Perks" hint="Separate with commas."><Input name="perks" defaultValue={tier?.perks.join(", ")} placeholder="Front viewing gallery, Prasad pack" /></Field>
          <button type="submit" className="w-full rounded-full bg-orange-600 px-5 py-3 text-sm font-bold text-white hover:bg-orange-700">
            {tier ? "Save pass type" : "Create pass type"}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function TicketsManager({ initialTiers, initialSlots }: { initialTiers: TicketTier[]; initialSlots: Slot[] }) {
  const [tiers, setTiers] = useState(initialTiers);
  const [slots, setSlots] = useState(initialSlots);
  const [pausedSlotIds, setPausedSlotIds] = useState<string[]>([]);
  const [date, setDate] = useState(pujaDays[0].date);
  const [editing, setEditing] = useState<TicketTier | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const openSheet = (tier: TicketTier | null) => {
    setEditing(tier);
    setSheetOpen(true);
  };

  const saveTier = (values: Pick<TicketTier, "name" | "description" | "price" | "capacityPerSlot" | "perks">) => {
    setTiers((current) =>
      editing
        ? current.map((tier) => (tier.id === editing.id ? { ...tier, ...values } : tier))
        : [...current, { ...values, id: `tier-${current.length + 1}`, pandalId: current[0]?.pandalId ?? "", active: true }],
    );
    setSheetOpen(false);
  };

  const daySlots = slots.filter((slot) => slot.date === date);
  const dayBooked = daySlots.reduce((total, slot) => total + slot.booked, 0);
  const dayCapacity = daySlots.reduce((total, slot) => total + slot.capacity, 0);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <ClubPageHeader
        title="Tickets & slots"
        description="Set up pass types, prices and how many visitors each entry window can take."
        actions={
          <button type="button" onClick={() => openSheet(null)} className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700">
            <Plus className="size-4" /> New pass type
          </button>
        }
      />

      <section>
        <h2 className="font-serif text-xl font-semibold text-stone-950">Pass types</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {tiers.map((tier) => (
            <article key={tier.id} className={cn("rounded-2xl border bg-white p-5 transition-opacity", tier.active ? "border-stone-200" : "border-dashed border-stone-300 opacity-70")}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><Ticket className="size-5" aria-hidden="true" /></span>
                  <div>
                    <h3 className="font-semibold text-stone-950">{tier.name}</h3>
                    <p className="text-sm text-stone-500">{formatINR(tier.price)} · {tier.capacityPerSlot} per slot</p>
                  </div>
                </div>
                <Switch checked={tier.active} label={`${tier.name} on sale`} onChange={(active) => setTiers((current) => current.map((item) => (item.id === tier.id ? { ...item, active } : item)))} />
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-600">{tier.description}</p>
              {tier.perks.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {tier.perks.map((perk) => <li key={perk} className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-700">{perk}</li>)}
                </ul>
              )}
              <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
                <span className={cn("text-xs font-semibold", tier.active ? "text-emerald-700" : "text-stone-500")}>{tier.active ? "On sale" : "Paused"}</span>
                <button type="button" onClick={() => openSheet(tier)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-700 hover:text-orange-800">
                  <Pencil className="size-3.5" /> Edit
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-stone-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-xl font-semibold text-stone-950">Slot schedule</h2>
            <p className="text-sm text-stone-500">{dayBooked.toLocaleString("en-IN")} of {dayCapacity.toLocaleString("en-IN")} places booked on this day</p>
          </div>
          <div className="flex gap-1 overflow-x-auto rounded-xl bg-stone-100 p-1">
            {pujaDays.map((day) => (
              <button
                key={day.date}
                type="button"
                aria-pressed={day.date === date}
                onClick={() => setDate(day.date)}
                className={cn("shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold", day.date === date ? "bg-white text-stone-950 shadow-sm" : "text-stone-600 hover:text-stone-900")}
              >
                {day.label} <span className="font-normal text-stone-500">{formatDate(day.date, { withYear: false })}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 text-left text-sm">
            <thead className="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-stone-500">
              <tr>
                <th scope="col" className="px-5 py-3">Entry window</th>
                <th scope="col" className="px-5 py-3">Capacity</th>
                <th scope="col" className="px-5 py-3">Booked</th>
                <th scope="col" className="px-5 py-3">Fill</th>
                <th scope="col" className="px-5 py-3 text-right">Sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {daySlots.map((slot) => {
                const percent = Math.min(100, Math.round((slot.booked / slot.capacity) * 100));
                const paused = pausedSlotIds.includes(slot.id);
                return (
                  <tr key={slot.id} className={paused ? "bg-stone-50 text-stone-500" : undefined}>
                    <td className="px-5 py-3 font-medium text-stone-900">{formatTimeRange(slot.startTime, slot.endTime)}</td>
                    <td className="px-5 py-3">
                      <Input
                        type="number"
                        min={slot.booked}
                        value={slot.capacity}
                        aria-label={`Capacity for ${formatTimeRange(slot.startTime, slot.endTime)}`}
                        onChange={(event) => setSlots((current) => current.map((item) => (item.id === slot.id ? { ...item, capacity: Number(event.target.value) } : item)))}
                        className="w-24 py-1.5"
                      />
                    </td>
                    <td className="px-5 py-3">{slot.booked.toLocaleString("en-IN")}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-28 rounded-full bg-stone-100"><span className="block h-full rounded-full bg-orange-600" style={{ width: `${percent}%` }} /></span>
                        <span className="w-10 text-xs text-stone-600">{percent >= 100 ? "Full" : `${percent}%`}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-stone-500">{paused ? "Paused" : "Open"}</span>
                        <Switch
                          checked={!paused}
                          label={`Sales for ${formatTimeRange(slot.startTime, slot.endTime)}`}
                          onChange={(open) => setPausedSlotIds((ids) => (open ? ids.filter((id) => id !== slot.id) : [...ids, slot.id]))}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <TierSheet tier={editing} open={sheetOpen} onOpenChange={setSheetOpen} onSave={saveTier} />
    </div>
  );
}
