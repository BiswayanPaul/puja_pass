import type { Metadata } from "next";
import { Suspense } from "react";
import { PandalExplorer } from "@/features/pandals/components/pandal-explorer";
import { getPandals } from "@/server/pandals";

export const metadata: Metadata = {
  title: "Explore Durga Puja pandals in Kolkata",
  description: "Browse verified Durga Puja pandals across North, South and Central Kolkata, Salt Lake and New Town, with free and paid timed entry.",
  alternates: { canonical: "/pandals" },
};

export default async function PandalsPage() {
  const pandals = await getPandals();
  // The explorer reads search params, so it needs its own Suspense boundary.
  return (
    <Suspense fallback={<div className="min-h-dvh bg-stone-50" />}>
      <PandalExplorer pandals={pandals} />
    </Suspense>
  );
}
