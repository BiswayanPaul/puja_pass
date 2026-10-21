import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { PandalCard } from "@/features/pandals/components/pandal-card";
import { getFeaturedPandals } from "@/server/pandals";

export default async function FeaturedPandals() {
  const pandals = await getFeaturedPandals();
  if (pandals.length === 0) return null;

  return (
    <section id="explore" className="bg-white py-18 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold tracking-[0.18em] text-orange-600">CURATED FOR PUJA 2026</p>
            <h2 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
              Featured pandals
            </h2>
            <p className="mt-3 text-stone-600">Explore some of the city&apos;s most memorable Puja experiences.</p>
          </div>
          <Link href="/pandals" className="inline-flex items-center gap-2 text-sm font-semibold text-orange-700 hover:text-orange-800">
            View all pandals <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {pandals.map((pandal) => <PandalCard key={pandal.id} pandal={pandal} />)}
        </div>
      </div>
    </section>
  );
}
