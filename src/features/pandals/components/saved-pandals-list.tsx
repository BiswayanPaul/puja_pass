"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import type { Pandal } from "@/types";
import { useSavedPandals } from "../use-saved-pandals";
import { PandalCard } from "./pandal-card";

export function SavedPandalsList({ pandals }: { pandals: Pandal[] }) {
  const { savedIds, signedIn, ready } = useSavedPandals();
  if (!ready) return <div className="h-72 animate-pulse rounded-2xl bg-stone-200/60" />;

  // Most recently saved first; pandals that are no longer listed drop out.
  const saved = savedIds.map((id) => pandals.find((pandal) => pandal.id === id)).filter((pandal) => pandal !== undefined);

  return (
    <div className="space-y-6">
      {!signedIn && (
        <p className="rounded-xl bg-orange-50 px-4 py-3 text-sm text-orange-900">
          These are saved on this device only.{" "}
          <Link href="/login?next=/saved" className="font-semibold text-orange-700 hover:text-orange-800">Sign in</Link> to keep them on all your devices.
        </p>
      )}
      {saved.length ? (
        <>
          <p className="text-sm text-stone-600">
            <span className="font-semibold text-stone-950">{saved.length}</span> saved {saved.length === 1 ? "pandal" : "pandals"}
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((pandal) => <PandalCard key={pandal.id} pandal={pandal} />)}
          </div>
        </>
      ) : (
        <EmptyState
          icon={Heart}
          title="No saved pandals yet"
          description="Tap the heart on any pandal to keep it here while you plan your Puja trail."
          action={<Link href="/pandals" className="rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-700">Explore pandals</Link>}
        />
      )}
    </div>
  );
}
