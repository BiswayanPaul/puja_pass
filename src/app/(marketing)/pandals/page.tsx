import { Suspense } from "react";
import { PandalExplorer } from "@/features/pandals/components/pandal-explorer";
import { getPandals } from "@/server/pandals";

export default async function PandalsPage() {
  const pandals = await getPandals();
  // The explorer reads search params, so it needs its own Suspense boundary.
  return (
    <Suspense fallback={<div className="min-h-dvh bg-stone-50" />}>
      <PandalExplorer pandals={pandals} />
    </Suspense>
  );
}
