"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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
          <main className="min-w-0 space-y-6">
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
