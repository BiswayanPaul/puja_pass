import type { Metadata } from "next";
import { Suspense } from "react";
import PageHeader from "@/components/shared/PageHeader";
import { BookingDetail } from "@/features/bookings/components/booking-detail";
import { getSeedBookings } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Booking details",
  robots: { index: false },
};

// Bookings live in the browser for now, so the page shell is static and the
// client component resolves the booking id itself.
export function generateStaticParams() {
  return getSeedBookings().map(({ id }) => ({ bookingId: id }));
}

export default function BookingPage() {
  return (
    <>
      <PageHeader eyebrow="BOOKING DETAILS" title="Your QR passes" description="Show these at the PujaPass entry lane of each pandal." />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-stone-200/60" />}>
          <BookingDetail />
        </Suspense>
      </div>
    </>
  );
}
