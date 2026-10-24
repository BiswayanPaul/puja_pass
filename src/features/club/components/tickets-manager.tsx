"use client";

import { useState, useTransition, type FormEvent } from "react";
import { CalendarPlus, CheckCircle2, Loader2, Pencil, Plus, Ticket, Trash2, TriangleAlert, X } from "lucide-react";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/field";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { pujaDays, slotTimes } from "@/data/festival";
import { formatDate, formatINR, formatPujaDate, formatTimeRange } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ClubSlot, TicketTier } from "@/types";
import { addSlots, deleteSlot, saveTicketTier, setTierActive, updateSlot, type ClubActionResult } from "../actions";
import { ClubPageHeader } from "./club-shell";

// Everything here is saved by Server Actions, which refresh the page with the
// database's state; the component only keeps form and pending state.

function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (value: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn("relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60", checked ? "bg-emerald-600" : "bg-stone-300")}
    >
      <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-5.5" : "translate-x-0.5")} />
    </button>
  );
}

function ResultMessage({ result }: { result: ClubActionResult | null }) {
  if (!result) return null;
  return result.ok ? (
    <p role="status" className="flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
      <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {result.message}
    </p>
  ) : (
    <p role="alert" className="flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {result.error}
    </p>
  );
}

/** Runs a Server Action with a pending flag and keeps its result for display. */
function useClubAction() {
  const [result, setResult] = useState<ClubActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const run = (action: () => Promise<ClubActionResult>, onSuccess?: (outcome: ClubActionResult) => void) =>
    startTransition(async () => {
      try {
        const outcome = await action();
        setResult(outcome);
        if (outcome.ok) onSuccess?.(outcome);
      } catch {
        setResult({ ok: false, error: "Something went wrong. Check your connection and try again." });
      }
    });
  return { result, setResult, pending, run };
}

function TierSheet({
  pandalId,
  tier,
  open,
  onOpenChange,
  onSaved,
}: {
  pandalId: string;
  tier: TicketTier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (result: ClubActionResult) => void;
}) {
  const { result, setResult, pending, run } = useClubAction();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    run(
      () =>
        saveTicketTier({
          pandalId,
          tierId: tier?.id,
          name: String(form.get("name")),
          description: String(form.get("description")),
          price: Number(form.get("price")),
          capacityPerSlot: Number(form.get("capacity")),
          perks: String(form.get("perks")).split(",").map((perk) => perk.trim()).filter(Boolean),
        }),
      (outcome) => {
        onSaved(outcome);
        onOpenChange(false);
        setResult(null);
      },
    );
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setResult(null);
      }}
    >
      <SheetContent side="right" className="w-full overflow-y-auto p-6 sm:max-w-md">
        <SheetTitle className="font-serif text-2xl font-semibold">{tier ? "Edit pass type" : "New pass type"}</SheetTitle>
        <SheetDescription>Pass types are shown to visitors on your pandal page. Price changes apply to new bookings only.</SheetDescription>
        <form key={tier?.id ?? "new"} onSubmit={handleSubmit} className="mt-2 space-y-4">
          <Field label="Name"><Input name="name" required minLength={2} maxLength={60} defaultValue={tier?.name} placeholder="e.g. Priority Darshan" /></Field>
          <Field label="Description"><Textarea name="description" required minLength={5} maxLength={300} defaultValue={tier?.description} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price (₹)"><Input name="price" type="number" min={0} step={1} required defaultValue={tier?.price} /></Field>
            <Field label="Visitors per slot"><Input name="capacity" type="number" min={1} step={1} required defaultValue={tier?.capacityPerSlot} /></Field>
          </div>
          <Field label="Perks" hint="Separate with commas."><Input name="perks" defaultValue={tier?.perks.join(", ")} placeholder="Front viewing gallery, Prasad pack" /></Field>
          {result && !result.ok && <ResultMessage result={result} />}
          <button type="submit" disabled={pending} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-600 px-5 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-70">
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {tier ? "Save pass type" : "Create pass type"}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function AddSlotsSheet({
  pandalId,
  defaultDate,
  defaultCapacity,
  open,
  onOpenChange,
  onAdded,
}: {
  pandalId: string;
  defaultDate: string;
  defaultCapacity: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: (result: ClubActionResult) => void;
}) {
  const { result, setResult, pending, run } = useClubAction();
  const [custom, setCustom] = useState<{ start: string; end: string }[]>([]);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const addCustom = () => {
    if (!customStart || !customEnd) return;
    setCustom((current) => [...current.filter((item) => item.start !== customStart), { start: customStart, end: customEnd }]);
    setCustomStart("");
    setCustomEnd("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const standard = form.getAll("window").map((value) => {
      const [start, end] = String(value).split("-");
      return { start, end };
    });
    run(
      () =>
        addSlots({
          pandalId,
          dates: form.getAll("date").map(String),
          windows: [...standard, ...custom],
          capacity: Number(form.get("capacity")),
        }),
      (outcome) => {
        onAdded(outcome);
        setCustom([]);
        onOpenChange(false);
        setResult(null);
      },
    );
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setResult(null);
      }}
    >
      <SheetContent side="right" className="w-full overflow-y-auto p-6 sm:max-w-md">
        <SheetTitle className="font-serif text-2xl font-semibold">Add entry windows</SheetTitle>
        <SheetDescription>Visitors book a pass for one window. Every chosen window is added on every chosen day.</SheetDescription>
        <form key={defaultDate} onSubmit={handleSubmit} className="mt-2 space-y-5">
          <fieldset>
            <legend className="text-sm font-semibold text-stone-800">Days</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {pujaDays.map((day) => (
                <Checkbox key={day.date} name="date" value={day.date} defaultChecked={day.date === defaultDate} label={formatPujaDate(day.date)} className="rounded-lg border border-stone-200 p-2.5" />
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-semibold text-stone-800">Entry windows</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {slotTimes.map(([start, end]) => (
                <Checkbox key={start} name="window" value={`${start}-${end}`} defaultChecked label={formatTimeRange(start, end)} className="rounded-lg border border-stone-200 p-2.5" />
              ))}
            </div>
            <p className="mt-4 text-sm font-semibold text-stone-800">Your own window</p>
            <div className="mt-2 flex items-end gap-2">
              <Field label="Starts" className="flex-1"><Input type="time" value={customStart} onChange={(event) => setCustomStart(event.target.value)} /></Field>
              <Field label="Ends" className="flex-1"><Input type="time" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} /></Field>
              <button type="button" onClick={addCustom} disabled={!customStart || !customEnd} className="mb-0.5 rounded-full border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50 disabled:opacity-50">Add</button>
            </div>
            {custom.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {custom.map((window) => (
                  <li key={window.start} className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 py-1 pl-3 pr-1.5 text-sm text-orange-800">
                    {formatTimeRange(window.start, window.end)}
                    <button type="button" aria-label={`Remove ${formatTimeRange(window.start, window.end)}`} onClick={() => setCustom((current) => current.filter((item) => item !== window))} className="rounded-full p-0.5 hover:bg-orange-100">
                      <X className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>

          <Field label="Visitors per window" hint="The total across all pass types. You can change each window later.">
            <Input name="capacity" type="number" min={1} step={1} required defaultValue={defaultCapacity} />
          </Field>

          {result && !result.ok && <ResultMessage result={result} />}
          <button type="submit" disabled={pending} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-orange-600 px-5 py-3 text-sm font-bold text-white hover:bg-orange-700 disabled:opacity-70">
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />} Add entry windows
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function SlotRow({ slot, onResult }: { slot: ClubSlot; onResult: (result: ClubActionResult) => void }) {
  const [capacity, setCapacity] = useState(String(slot.capacity));
  const [pending, startTransition] = useTransition();
  const label = formatTimeRange(slot.startTime, slot.endTime);
  const percent = Math.min(100, Math.round((slot.booked / slot.capacity) * 100));
  const changed = Number(capacity) !== slot.capacity;

  const run = (action: () => Promise<ClubActionResult>) =>
    startTransition(async () => {
      try {
        onResult(await action());
      } catch {
        onResult({ ok: false, error: "Something went wrong. Check your connection and try again." });
      }
    });

  return (
    <tr className={slot.salesPaused ? "bg-stone-50 text-stone-500" : undefined}>
      <td className="px-5 py-3 font-medium text-stone-900">{label}</td>
      <td className="px-5 py-3">
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            run(() => updateSlot({ slotId: slot.id, capacity: Number(capacity) }));
          }}
        >
          <Input type="number" min={Math.max(1, slot.booked)} step={1} required value={capacity} aria-label={`Capacity for ${label}`} onChange={(event) => setCapacity(event.target.value)} className="w-24 py-1.5" />
          {changed && (
            <button type="submit" disabled={pending} className="rounded-full bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-stone-700 disabled:opacity-60">Save</button>
          )}
        </form>
      </td>
      <td className="px-5 py-3">{slot.booked.toLocaleString("en-IN")}</td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-28 rounded-full bg-stone-100"><span className="block h-full rounded-full bg-orange-600" style={{ width: `${percent}%` }} /></span>
          <span className="w-10 text-xs text-stone-600">{percent >= 100 ? "Full" : `${percent}%`}</span>
        </div>
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center justify-end gap-3">
          {pending && <Loader2 className="size-4 animate-spin text-stone-400" aria-hidden="true" />}
          <span className="text-xs text-stone-500">{slot.salesPaused ? "Paused" : "Open"}</span>
          <Switch checked={!slot.salesPaused} disabled={pending} label={`Sales for ${label}`} onChange={(open) => run(() => updateSlot({ slotId: slot.id, salesPaused: !open }))} />
          {slot.booked === 0 && (
            <button
              type="button"
              disabled={pending}
              aria-label={`Remove ${label}`}
              onClick={() => {
                if (confirm(`Remove the ${label} window?`)) run(() => deleteSlot(slot.id));
              }}
              className="rounded-md p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export function TicketsManager({ pandalId, tiers, slots }: { pandalId: string; tiers: TicketTier[]; slots: ClubSlot[] }) {
  const [date, setDate] = useState(pujaDays[0].date);
  const [editing, setEditing] = useState<TicketTier | null>(null);
  const [tierSheetOpen, setTierSheetOpen] = useState(false);
  const [slotSheetOpen, setSlotSheetOpen] = useState(false);
  const tierAction = useClubAction();
  const [slotResult, setSlotResult] = useState<ClubActionResult | null>(null);

  const openTierSheet = (tier: TicketTier | null) => {
    setEditing(tier);
    setTierSheetOpen(true);
  };

  const daySlots = slots.filter((slot) => slot.date === date);
  const dayBooked = daySlots.reduce((total, slot) => total + slot.booked, 0);
  const dayCapacity = daySlots.reduce((total, slot) => total + slot.capacity, 0);
  const dayLabel = pujaDays.find((day) => day.date === date)?.label ?? formatDate(date);
  // New windows default to what the active pass types can hold together.
  const defaultCapacity = tiers.filter((tier) => tier.active).reduce((total, tier) => total + tier.capacityPerSlot, 0) || 100;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <ClubPageHeader
        title="Tickets & slots"
        description="Set up pass types, prices and how many visitors each entry window can take."
        actions={
          <button type="button" onClick={() => openTierSheet(null)} className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700">
            <Plus className="size-4" /> New pass type
          </button>
        }
      />

      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold text-stone-950">Pass types</h2>
        <ResultMessage result={tierAction.result} />
        {tiers.length ? (
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
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
                  <Switch checked={tier.active} disabled={tierAction.pending} label={`${tier.name} on sale`} onChange={(active) => tierAction.run(() => setTierActive(tier.id, active))} />
                </div>
                <p className="mt-3 text-sm leading-6 text-stone-600">{tier.description}</p>
                {tier.perks.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {tier.perks.map((perk) => <li key={perk} className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-700">{perk}</li>)}
                  </ul>
                )}
                <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
                  <span className={cn("text-xs font-semibold", tier.active ? "text-emerald-700" : "text-stone-500")}>{tier.active ? "On sale" : "Off sale"}</span>
                  <button type="button" onClick={() => openTierSheet(tier)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-700 hover:text-orange-800">
                    <Pencil className="size-3.5" /> Edit
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-sm text-stone-600">
            No pass types yet. Visitors can only book once you create one, e.g. &ldquo;Timed Entry&rdquo; at ₹99.
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white">
        <div className="flex flex-col gap-4 border-b border-stone-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-serif text-xl font-semibold text-stone-950">Slot schedule</h2>
            <p className="text-sm text-stone-500">{dayBooked.toLocaleString("en-IN")} of {dayCapacity.toLocaleString("en-IN")} places booked on this day</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
            <button type="button" onClick={() => setSlotSheetOpen(true)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-50">
              <CalendarPlus className="size-4" aria-hidden="true" /> Add entry windows
            </button>
          </div>
        </div>
        {slotResult && (
          <div className="border-b border-stone-100 p-4">
            <ResultMessage result={slotResult} />
          </div>
        )}
        {daySlots.length ? (
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
                {/* Keyed by capacity too, so the input resets to the saved value after a refresh. */}
                {daySlots.map((slot) => <SlotRow key={`${slot.id}:${slot.capacity}`} slot={slot} onResult={setSlotResult} />)}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="font-semibold text-stone-900">No entry windows on {dayLabel}</p>
            <p className="mt-1 text-sm text-stone-500">Visitors can book once a day has entry windows and at least one pass type is on sale.</p>
            <button type="button" onClick={() => setSlotSheetOpen(true)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700">
              <CalendarPlus className="size-4" aria-hidden="true" /> Add entry windows
            </button>
          </div>
        )}
      </section>

      <TierSheet pandalId={pandalId} tier={editing} open={tierSheetOpen} onOpenChange={setTierSheetOpen} onSaved={tierAction.setResult} />
      <AddSlotsSheet pandalId={pandalId} defaultDate={date} defaultCapacity={defaultCapacity} open={slotSheetOpen} onOpenChange={setSlotSheetOpen} onAdded={setSlotResult} />
    </div>
  );
}
