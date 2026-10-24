"use client";

import {
  Building2,
  Flame,
  Heart,
  Leaf,
  MapPin,
  Sparkles,
  TicketCheck,
  UsersRound,
} from "lucide-react";
import type { ComponentType } from "react";

type Filter = { label: string; icon: ComponentType<{ className?: string }> };

const filters: Filter[] = [
  { label: "All Pandals", icon: Building2 },
  { label: "Saved", icon: Heart },
  { label: "Most Popular", icon: Flame },
  { label: "Free Entry", icon: TicketCheck },
  { label: "Paid Entry", icon: TicketCheck },
  { label: "Near Me", icon: MapPin },
  { label: "North Kolkata", icon: Building2 },
  { label: "South Kolkata", icon: Building2 },
  { label: "Eco-friendly", icon: Leaf },
  { label: "Theme Based", icon: Sparkles },
  { label: "Family Friendly", icon: UsersRound },
];

export function FilterChips({
  activeFilter,
  onFilterChange,
}: {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}) {
  return (
    <section
      aria-label="Quick filters"
      className="border-b border-stone-200 bg-white"
    >
      <div className="mx-auto flex max-w-7xl gap-3 overflow-x-auto px-4 py-4 sm:px-6 lg:px-8">
        {filters.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            onClick={() => onFilterChange(label)}
            aria-pressed={activeFilter === label}
            className={
              activeFilter === label
                ? "inline-flex shrink-0 items-center gap-2 rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white"
                : "inline-flex shrink-0 items-center gap-2 rounded-full bg-stone-100 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-orange-50 hover:text-orange-700"
            }
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}
