import type { Metadata } from "next";
import Link from "next/link";
import { Route } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import { BookingsList } from "@/features/bookings/components/bookings-list";

export const metadata: Metadata = {
  title: "My Bookings",
  robots: { index: false },
};

export default function MyBookingsPage() {
  return (
    <>
      <PageHeader eyebrow="MY BOOKINGS" title="Your Puja passes" description="All your timed entry passes and booking history in one place.">
        <Link href="/trail" className="inline-flex items-center gap-2 self-start rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 md:self-auto">
          <Route className="size-4" /> Plan a new trail
        </Link>
      </PageHeader>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <BookingsList />
      </div>
    </>
  );
}
