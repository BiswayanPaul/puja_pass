import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import HeroSearch from "./HeroSearch";

export default function HeroSection() {
  return (
    <section className="relative isolate min-h-175 overflow-hidden bg-stone-950 text-white sm:min-h-190">
      <Image
        src="/images/Hero_section.png"
        alt="Durga Maa idol during Durga Puja"
        fill
        preload
        sizes="100vw"
        className="-z-20 object-cover object-[62%_center]"
      />
      <div className="absolute inset-0 -z-10 bg-linear-to-r from-black/85 via-black/50 to-black/10" />
      <div className="mx-auto flex min-h-175 max-w-7xl flex-col justify-center px-4 pb-36 pt-28 sm:min-h-190 sm:px-6 sm:pt-32 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-bold tracking-[0.15em] text-orange-300">
            YOUR DURGA PUJA, BEAUTIFULLY PLANNED
          </p>
          <h1 className="mt-4 font-serif text-5xl font-semibold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl">
            Celebrate the art, devotion, and{" "}
            <span className="text-orange-300">joy of Durga Puja.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-stone-100 sm:text-lg">
            Discover participating pandals, reserve authorised timed entry, and
            create your own multi-pandal pass—all in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/pandals"
              className={cn(
                buttonVariants({ size: "lg" }),
                "rounded-full bg-orange-600 px-6 text-white hover:bg-orange-700",
              )}
            >
              Explore Pandals
            </Link>
            <Link
              href="/clubs/register"
              className="inline-flex h-9 items-center justify-center rounded-full border border-white/70 px-6 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-stone-950"
            >
              Register Your Puja Club
            </Link>
          </div>
          <p className="mt-5 max-w-md text-xs leading-5 text-stone-200">
            Free public entry details are always visible. Paid passes are
            authorised by participating clubs.
          </p>
        </div>
      </div>
      <HeroSearch />
    </section>
  );
}
