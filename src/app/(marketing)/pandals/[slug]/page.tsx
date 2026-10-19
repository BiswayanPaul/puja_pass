import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  Clock3,
  Footprints,
  Leaf,
  MapPin,
  Palette,
  Star,
  Train,
  UsersRound,
} from "lucide-react";
import { PandalCard } from "@/features/pandals/components/pandal-card";
import { SlotPicker } from "@/features/pandals/components/slot-picker";
import {
  getNearbyPandals,
  getPandalBySlug,
  getPandalSlugs,
  getReviewsForPandal,
  getSlotsForPandal,
  getTiersForPandal,
} from "@/server/pandals";

export async function generateStaticParams() {
  const slugs = await getPandalSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/pandals/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const pandal = await getPandalBySlug(slug);
  if (!pandal) return {};
  return {
    title: `${pandal.name} — ${pandal.neighbourhood}`,
    description: pandal.description,
    alternates: { canonical: `/pandals/${pandal.slug}` },
    openGraph: { images: [{ url: pandal.imageSrc, alt: pandal.imageAlt }] },
  };
}

export default function PandalDetailPage({ params }: PageProps<"/pandals/[slug]">) {
  // `params` is read inside Suspense so client navigations get an instant shell.
  return (
    <Suspense fallback={<PandalDetailSkeleton />}>
      <PandalDetail params={params} />
    </Suspense>
  );
}

function PandalDetailSkeleton() {
  return (
    <div className="bg-stone-50 pb-20" aria-busy="true">
      <div className="h-96 animate-pulse bg-stone-900" />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 pt-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:px-8">
        <div className="space-y-6">
          <div className="h-24 animate-pulse rounded-xl bg-stone-200/70" />
          <div className="h-64 animate-pulse rounded-2xl bg-stone-200/70" />
        </div>
        <div className="h-120 animate-pulse rounded-2xl bg-stone-200/70" />
      </div>
    </div>
  );
}

async function PandalDetail({ params }: { params: PageProps<"/pandals/[slug]">["params"] }) {
  const { slug } = await params;
  const pandal = await getPandalBySlug(slug);
  if (!pandal) notFound();

  const [tiers, slots, reviews, nearby] = await Promise.all([
    getTiersForPandal(pandal.id),
    getSlotsForPandal(pandal.id),
    getReviewsForPandal(pandal.id),
    getNearbyPandals(pandal.id),
  ]);

  const facts = [
    { label: "Timings", value: pandal.timings, icon: Clock3 },
    { label: "Expected crowd", value: pandal.crowdLevel, icon: UsersRound },
    { label: "Nearest metro", value: pandal.nearestMetro, icon: Train },
    { label: "Since", value: String(pandal.established), icon: CalendarDays },
    { label: "Idol artist", value: pandal.idolArtist, icon: Palette },
  ];

  return (
    <article className="bg-stone-50 pb-20">
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-stone-950 pt-16 text-white">
        <Image src={pandal.imageSrc} alt={pandal.imageAlt} fill preload sizes="100vw" className="-z-20 object-cover" />
        <div className="absolute inset-0 -z-10 bg-linear-to-t from-black/90 via-black/55 to-black/30" />
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-20 sm:px-6 lg:px-8 lg:pt-32">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-stone-300">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="size-3.5" aria-hidden="true" />
            <Link href="/pandals" className="hover:text-white">Pandals</Link>
            <ChevronRight className="size-3.5" aria-hidden="true" />
            <span className="text-white">{pandal.name}</span>
          </nav>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold tracking-wide">
              <BadgeCheck className="size-3.5" aria-hidden="true" /> VERIFIED
            </span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">{pandal.category}</span>
            <span className={pandal.entryType === "Free Entry" ? "rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-200" : "rounded-full bg-rose-500/20 px-3 py-1 text-xs font-medium text-rose-200"}>
              {pandal.entryType}
            </span>
            {pandal.ecoFriendly && (
              <span className="inline-flex items-center gap-1 rounded-full bg-lime-500/20 px-3 py-1 text-xs font-medium text-lime-200">
                <Leaf className="size-3.5" aria-hidden="true" /> Eco-friendly
              </span>
            )}
          </div>
          <h1 className="mt-4 font-serif text-4xl font-semibold tracking-tight sm:text-6xl">{pandal.name}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-stone-200">
            <span className="inline-flex items-center gap-1.5"><MapPin className="size-4 text-orange-400" aria-hidden="true" />{pandal.address}</span>
            <span className="inline-flex items-center gap-1.5"><Star className="size-4 fill-amber-400 text-amber-400" aria-hidden="true" /><strong className="text-white">{pandal.rating}</strong> ({pandal.reviewCount} reviews)</span>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 pt-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:px-8">
        <div className="min-w-0 space-y-8">
          {/* Quick facts */}
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {facts.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-xl border border-stone-200 bg-white p-4">
                <Icon className="size-5 text-orange-600" aria-hidden="true" />
                <dt className="mt-2 text-xs font-medium text-stone-500">{label}</dt>
                <dd className="mt-0.5 text-sm font-semibold text-stone-900">{value}</dd>
              </div>
            ))}
          </dl>

          <section className="rounded-2xl border border-stone-200 bg-white p-6">
            <h2 className="font-serif text-2xl font-semibold text-stone-950">About the pandal</h2>
            <p className="mt-3 leading-7 text-stone-600">{pandal.description}</p>
            <div className="mt-5 rounded-xl bg-orange-50 p-5">
              <p className="text-xs font-bold tracking-[0.14em] text-orange-700">THEME {2026}</p>
              <h3 className="mt-1 font-serif text-xl font-semibold text-stone-950">{pandal.theme.title}</h3>
              <p className="mt-2 text-sm leading-6 text-stone-700">{pandal.theme.description}</p>
            </div>
            <p className="mt-5 text-sm text-stone-500">Organised by <span className="font-semibold text-stone-800">{pandal.clubName}</span></p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-semibold text-stone-950">Gallery</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {pandal.gallery.map((image, index) => (
                <div key={image.src} className={index === 0 ? "relative col-span-2 row-span-2 aspect-square overflow-hidden rounded-xl" : "relative aspect-square overflow-hidden rounded-xl"}>
                  <Image src={image.src} alt={image.alt} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition-transform duration-500 hover:scale-105" />
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-stone-200 bg-white p-6">
              <h2 className="font-serif text-2xl font-semibold text-stone-950">Facilities</h2>
              <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm text-stone-700">
                {pandal.amenities.map((amenity) => (
                  <li key={amenity} className="flex items-center gap-2">
                    <BadgeCheck className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                    {amenity}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-[linear-gradient(135deg,#f2e3ca,#d8ead9)] p-6">
              <div className="absolute inset-0 bg-[linear-gradient(30deg,transparent_48%,#d29c6a_49%,#d29c6a_51%,transparent_52%)] bg-size-[34px_34px] opacity-30" />
              <div className="relative">
                <h2 className="font-serif text-2xl font-semibold text-stone-950">Getting there</h2>
                <p className="mt-3 text-sm leading-6 text-stone-700">{pandal.address}</p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-stone-700"><Train className="size-4" aria-hidden="true" />{pandal.nearestMetro}</p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pandal.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-900 shadow"
                >
                  <MapPin className="size-4 text-orange-600" aria-hidden="true" /> Open in Maps
                </a>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-end justify-between">
              <h2 className="font-serif text-2xl font-semibold text-stone-950">Visitor reviews</h2>
              <p className="text-sm text-stone-500"><Star className="mr-1 inline size-4 fill-amber-400 text-amber-400" aria-hidden="true" />{pandal.rating} · {pandal.reviewCount} reviews</p>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {reviews.map((review) => (
                <figure key={review.id} className="rounded-xl border border-stone-200 bg-white p-5">
                  <div className="flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star key={index} className={index < review.rating ? "size-4 fill-amber-400 text-amber-400" : "size-4 text-stone-300"} aria-hidden="true" />
                    ))}
                  </div>
                  <blockquote className="mt-3 text-sm leading-6 text-stone-700">“{review.comment}”</blockquote>
                  <figcaption className="mt-4 text-xs text-stone-500"><span className="font-semibold text-stone-800">{review.author}</span> · Puja {review.date.slice(0, 4)}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        </div>

        {/* Booking sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:h-fit">
          <section id="book" className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold tracking-[0.14em] text-orange-600">AUTHORISED BY THE CLUB</p>
            <h2 className="mt-1 font-serif text-2xl font-semibold text-stone-950">Reserve a timed pass</h2>
            <p className="mt-1 text-sm text-stone-600">Add slots from several pandals to your trail and check out once.</p>
            <div className="mt-5">
              <SlotPicker pandal={pandal} tiers={tiers} slots={slots} />
            </div>
          </section>
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <h2 className="flex items-center gap-2 font-semibold text-emerald-900">
              <Footprints className="size-4" aria-hidden="true" /> Free public entry
            </h2>
            <p className="mt-2 text-sm leading-6 text-emerald-900/80">{pandal.freeEntryInfo}</p>
          </section>
        </aside>
      </div>

      {nearby.length > 0 && (
        <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <h2 className="font-serif text-3xl font-semibold text-stone-950">Add these to your trail</h2>
            <Link href="/pandals" className="text-sm font-semibold text-orange-700 hover:text-orange-800">View all</Link>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {nearby.map((item) => <PandalCard key={item.id} pandal={item} />)}
          </div>
        </section>
      )}
    </article>
  );
}
