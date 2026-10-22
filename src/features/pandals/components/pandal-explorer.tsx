"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { FilterChips } from "./filter-chips";
import { FilterSidebar } from "./filter-sidebar";
import { PandalBenefits } from "./pandal-benefits";
import { PandalCollection } from "./pandal-collection";
import { PandalExplorerHero } from "./pandal-explorer-hero";
import { formatPujaDate } from "@/lib/format";
import type { Pandal } from "@/types";

const quickFilters: Record<string, (pandal: Pandal) => boolean> = {
  "Most Popular": (pandal) => pandal.tags.includes("Most Popular"),
  "Free Entry": (pandal) => pandal.entryType === "Free Entry",
  "Paid Entry": (pandal) => pandal.entryType === "Paid Entry",
  "Near Me": (pandal) => pandal.distanceKm <= 5,
  "North Kolkata": (pandal) => pandal.area === "North Kolkata",
  "South Kolkata": (pandal) => pandal.area === "South Kolkata",
  "Eco-friendly": (pandal) => pandal.ecoFriendly,
  "Theme Based": (pandal) =>
    pandal.tags.includes("Theme Based") || pandal.category === "Theme Based",
  "Family Friendly": (pandal) =>
    pandal.tags.includes("Family Friendly") ||
    pandal.category === "Family Friendly",
};

export function PandalExplorer({ pandals }: { pandals: Pandal[] }) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [activeFilter, setActiveFilter] = useState("All Pandals");
  const [areas, setAreas] = useState<string[]>([]);
  const [entryTypes, setEntryTypes] = useState<string[]>([]);
  const [date, setDate] = useState(() => searchParams.get("date") ?? "");
  const [sortBy, setSortBy] = useState("Most Popular");

  const matchingPandals = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = pandals.filter((pandal) => {
      const searchable =
        `${pandal.name} ${pandal.neighbourhood} ${pandal.area} ${pandal.category} ${pandal.highlight}`.toLowerCase();
      const matchesQuery =
        !normalizedQuery || searchable.includes(normalizedQuery);
      const matchesArea = !areas.length || areas.includes(pandal.area);
      const matchesEntry =
        !entryTypes.length || entryTypes.includes(pandal.entryType);
      const matchesQuickFilter = quickFilters[activeFilter]?.(pandal) ?? true;
      return matchesQuery && matchesArea && matchesEntry && matchesQuickFilter;
    });
    return [...filtered].sort((a, b) =>
      sortBy === "Nearest"
        ? a.distanceKm - b.distanceKm
        : sortBy === "Highest Rated"
          ? b.rating - a.rating
          : Number(b.featured) - Number(a.featured) || b.rating - a.rating,
    );
  }, [activeFilter, areas, entryTypes, pandals, query, sortBy]);

  const matchingFeatured = matchingPandals.filter((pandal) => pandal.featured);
  const clearFilters = () => {
    setQuery("");
    setActiveFilter("All Pandals");
    setAreas([]);
    setEntryTypes([]);
    setDate("");
    setSortBy("Most Popular");
  };
  const activeFilterCount = areas.length + entryTypes.length + (date ? 1 : 0);
  const filterSidebar = (
    <FilterSidebar
      allPandals={pandals}
      pandals={matchingPandals}
      selectedAreas={areas}
      selectedEntryTypes={entryTypes}
      date={date}
      onAreasChange={setAreas}
      onEntryTypesChange={setEntryTypes}
      onDateChange={setDate}
      onClear={clearFilters}
    />
  );

  return (
    <>
      <PandalExplorerHero
        query={query}
        onQueryChange={setQuery}
        onSearch={() =>
          document
            .getElementById("all-pandals")
            ?.scrollIntoView({ behavior: "smooth" })
        }
      />
      <FilterChips
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />
      <section className="bg-[radial-gradient(circle_at_top_right,#fff7ed,transparent_35%),#fafaf9] py-8 sm:py-10">
        <div className="mx-auto grid max-w-360 gap-6 px-4 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8">
          <div className="hidden lg:block">{filterSidebar}</div>
          <main className="min-w-0 space-y-6">
            {/* Below lg the filters live in a bottom sheet so results come first. */}
            <div className="flex items-center justify-between gap-3 lg:hidden">
              <p className="text-sm text-stone-600" aria-live="polite">
                <span className="font-semibold text-stone-950">{matchingPandals.length}</span>{" "}
                {matchingPandals.length === 1 ? "pandal" : "pandals"} found
              </p>
              <Sheet>
                <SheetTrigger
                  render={
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-900 shadow-sm transition-colors hover:border-orange-300"
                    />
                  }
                >
                  <SlidersHorizontal className="size-4 text-orange-600" aria-hidden="true" />
                  Filters & map
                  {activeFilterCount > 0 && (
                    <span className="flex min-w-5 items-center justify-center rounded-full bg-orange-600 px-1.5 text-xs text-white">
                      {activeFilterCount}
                      <span className="sr-only"> active</span>
                    </span>
                  )}
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[85dvh] gap-0 overflow-y-auto rounded-t-2xl bg-stone-50 px-4 pt-14 pb-0">
                  <SheetTitle className="sr-only">Filters</SheetTitle>
                  {filterSidebar}
                  <div className="sticky bottom-0 -mx-4 mt-4 border-t border-stone-200 bg-stone-50/95 px-4 py-3 backdrop-blur">
                    <SheetClose
                      render={
                        <button
                          type="button"
                          className="w-full rounded-full bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
                        />
                      }
                    >
                      Show {matchingPandals.length} {matchingPandals.length === 1 ? "pandal" : "pandals"}
                    </SheetClose>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            <PandalBenefits />
            {matchingFeatured.length > 0 && (
              <PandalCollection
                title="Featured Pandals"
                description="Handpicked pandals with unique themes, larger crowds and special experiences."
                pandals={matchingFeatured.slice(0, 3)}
                featured
              />
            )}
            <div id="all-pandals" className="scroll-mt-6">
              <PandalCollection
                title="All Pandals"
                description={
                  date
                    ? `Showing pandals open on ${formatPujaDate(date)}.`
                    : "Explore the complete list of pandals across Kolkata."
                }
                pandals={matchingPandals}
                resultCount={matchingPandals.length}
                sortBy={sortBy}
                onSortChange={setSortBy}
              />
            </div>
          </main>
        </div>
      </section>
    </>
  );
}
