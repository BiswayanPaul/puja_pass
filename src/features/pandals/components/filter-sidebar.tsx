"use client";

import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  MapPin,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { FESTIVAL_END, FESTIVAL_START } from "@/data/festival";
import { areas } from "@/data/pandals";
import { getPandals } from "@/lib/queries";
import type { Pandal } from "@/types";

const allPandals = getPandals();

type FilterSidebarProps = {
  pandals: Pandal[];
  selectedAreas: string[];
  selectedEntryTypes: string[];
  date: string;
  onAreasChange: (areas: string[]) => void;
  onEntryTypesChange: (types: string[]) => void;
  onDateChange: (date: string) => void;
  onClear: () => void;
};

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section className="border-b border-stone-200 py-5">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between font-serif text-lg font-semibold text-stone-950"
      >
        {title}
        {open ? (
          <ChevronUp className="size-4" aria-hidden="true" />
        ) : (
          <ChevronDown className="size-4" aria-hidden="true" />
        )}
      </button>
      {open && children}
    </section>
  );
}

function toggleItem(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

export function FilterSidebar({
  pandals,
  selectedAreas,
  selectedEntryTypes,
  date,
  onAreasChange,
  onEntryTypesChange,
  onDateChange,
  onClear,
}: FilterSidebarProps) {
  const [areaSearch, setAreaSearch] = useState("");
  const [mapOpen, setMapOpen] = useState(false);
  const visibleAreas = areas.filter((area) =>
    area.toLowerCase().includes(areaSearch.toLowerCase()),
  );
  return (
    <aside className="h-fit rounded-2xl border border-stone-200 bg-white p-4 shadow-sm lg:sticky lg:top-5">
      <div
        className={
          mapOpen
            ? "relative h-58 overflow-hidden rounded-xl bg-[linear-gradient(135deg,#f2e3ca,#d8ead9)] transition-all"
            : "relative h-34 overflow-hidden rounded-xl bg-[linear-gradient(135deg,#f2e3ca,#d8ead9)] transition-all"
        }
      >
        <div className="absolute inset-0 opacity-30 bg-[linear-gradient(30deg,transparent_48%,#d29c6a_49%,#d29c6a_51%,transparent_52%)] bg-size-[34px_34px]" />
        {mapOpen ? (
          pandals.map((pandal) => (
            <Link
              key={pandal.id}
              href={`/pandals/${pandal.id}`}
              title={pandal.name}
              aria-label={pandal.name}
              style={{ left: `${pandal.mapPosition.x}%`, top: `${pandal.mapPosition.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-full transition-transform hover:scale-125"
            >
              <MapPin className="size-6 fill-rose-500 text-rose-700" aria-hidden="true" />
            </Link>
          ))
        ) : (
          <MapPin className="absolute left-[68%] top-[30%] size-8 fill-rose-500 text-rose-700" />
        )}
        <button
          type="button"
          onClick={() => setMapOpen((value) => !value)}
          className={mapOpen ? "absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-900 shadow" : "absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-900 shadow"}
        >
          <MapPin className="size-4 text-orange-600" />
          {mapOpen ? "Hide map" : "View on map"}
        </button>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <h2 className="font-serif text-2xl font-semibold text-stone-950">
          Filters
        </h2>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-semibold text-orange-600"
        >
          Clear all
        </button>
      </div>
      <FilterGroup title="Area / Location">
        <label className="mt-3 flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm text-stone-500">
          <Search className="size-4" />
          <input
            value={areaSearch}
            onChange={(event) => setAreaSearch(event.target.value)}
            className="min-w-0 flex-1 outline-none"
            placeholder="Search area..."
          />
        </label>
        <div className="mt-3 space-y-2">
          {visibleAreas.map((area) => (
            <label
              key={area}
              className="flex items-center gap-2 text-sm text-stone-600"
            >
              <input
                type="checkbox"
                checked={selectedAreas.includes(area)}
                onChange={() => onAreasChange(toggleItem(selectedAreas, area))}
                className="size-4 rounded border-stone-300 accent-orange-600"
              />
              {area} <span className="text-stone-400">({allPandals.filter((pandal) => pandal.area === area).length})</span>
            </label>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Entry Type">
        <div className="mt-3 space-y-2">
          {["Free Entry", "Paid Entry"].map((type) => (
            <label
              key={type}
              className="flex items-center gap-2 text-sm text-stone-600"
            >
              <input
                type="checkbox"
                checked={selectedEntryTypes.includes(type)}
                onChange={() =>
                  onEntryTypesChange(toggleItem(selectedEntryTypes, type))
                }
                className="size-4 rounded border-stone-300 accent-orange-600"
              />
              {type} <span className="text-stone-400">({allPandals.filter((pandal) => pandal.entryType === type).length})</span>
            </label>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Visit date">
        <label className="mt-3 flex w-full items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-left text-sm text-stone-700">
          <CalendarDays className="size-4" />
          <input
            type="date"
            min={FESTIVAL_START}
            max={FESTIVAL_END}
            value={date}
            onChange={(event) => onDateChange(event.target.value)}
            className="min-w-0 flex-1 bg-transparent outline-none"
          />
        </label>
      </FilterGroup>
    </aside>
  );
}
