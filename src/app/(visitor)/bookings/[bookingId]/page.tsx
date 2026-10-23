import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SearchX } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import PageHeader from "@/components/shared/PageHeader";
import { BookingDetail } from "@/features/bookings/components/booking-detail";
import { getCurrentUser } from "@/server/auth/session";
import { bookingKey, bookingUrl } from "@/server/booking-links";
import { getBookingForViewer } from "@/server/bookings";

export const metadata: Metadata = {
  title: "Booking details",
  robots: { index: false },
  // The URL carries the booking key: don't leak it to other sites.
  referrer: "no-referrer",
};

export default function BookingPage({ params, searchParams }: PageProps<"/bookings/[bookingId]">) {
  return (
    <>
      <PageHeader eyebrow="BOOKING DETAILS" title="Your QR passes" description="Show these at the PujaPass entry lane of each pandal." />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-stone-200/60" />}>
          <Booking params={params} searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function Booking({ params, searchParams }: Pick<PageProps<"/bookings/[bookingId]">, "params" | "searchParams">) {
  const [{ bookingId }, query] = await Promise.all([params, searchParams]);
  const key = typeof query.k === "string" ? query.k : undefined;
  const user = await getCurrentUser();
  // The link's key opens the booking; a signed-in owner doesn't need one.
  const result = await getBookingForViewer(bookingId, key, user?.id);

  if (!result) {
    return (
      <EmptyState
        icon={SearchX}
        title="Booking not found"
        description="This link is incomplete or no longer valid. Open the link from your confirmation email, or ask the person who booked to share it again."
        action={<Link href="/my-bookings" className="rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-700">Go to my bookings</Link>}
      />
    );
  }

  return (
    <BookingDetail
      booking={result.booking}
      access={result.access}
      manageKey={result.access === "manage" ? bookingKey(bookingId, "manage") : undefined}
      viewUrl={bookingUrl(bookingId, "view")}
      isNew={query.new === "1"}
    />
  );
}
