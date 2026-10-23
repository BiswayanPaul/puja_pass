"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Ticket } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";
import { useCurrentUser } from "@/features/auth/use-session";
import { useIsClient } from "@/lib/create-store";
import { formatDate, formatINR, formatPujaDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BookingStatus, BookingSummary } from "@/types";
import { getMyBookings } from "../actions";
import { useDeviceBookings } from "../device-bookings";

const tabs: { label: string; statuses: BookingStatus[] }[] = [
  { label: "Upcoming", statuses: ["confirmed", "pending"] },
  { label: "Past", statuses: ["completed"] },
  { label: "Cancelled", statuses: ["cancelled"] },
];

function BookingCard({ booking }: { booking: BookingSummary }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex -space-x-4">
          {booking.pandals.slice(0, 3).map((pandal) => (
            <div key={pandal.name} className="relative size-16 overflow-hidden rounded-xl border-2 border-white shadow">
              <Image src={pandal.imageSrc} alt="" fill sizes="64px" className="object-cover" />
            </div>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-serif text-xl font-semibold text-stone-950">{booking.pandals.map((pandal) => pandal.name).join(" · ")}</h2>
            <StatusBadge status={booking.status} />
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-500">
            <span className="inline-flex items-center gap-1"><CalendarDays className="size-4" aria-hidden="true" />{booking.dates.map((date) => formatPujaDate(date)).join(", ")}</span>
            <span className="inline-flex items-center gap-1"><Ticket className="size-4" aria-hidden="true" />{booking.passCount} {booking.passCount === 1 ? "pass" : "passes"} · {booking.visitors} visitors</span>
          </p>
        </div>
        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
          <p className="font-serif text-xl font-semibold text-stone-950">{formatINR(booking.total)}</p>
          <Link href={booking.href} className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-600 hover:text-white">
            {booking.status === "confirmed" ? "View passes" : "Details"} <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-stone-100 bg-stone-50 px-5 py-2.5 text-xs text-stone-500">
        <span>Ref <span className="font-mono font-semibold text-stone-700">{booking.reference}</span></span>
        <span>Booked {formatDate(booking.createdAt)}</span>
        {booking.firstStartTime && <span>First entry {formatTime(booking.firstStartTime)}</span>}
      </div>
    </article>
  );
}

export function BookingsList() {
  const isClient = useIsClient();
  const entries = useDeviceBookings();
  const { user, status } = useCurrentUser();
  const [bookings, setBookings] = useState<BookingSummary[] | null>(null);
  const [active, setActive] = useState(tabs[0].label);

  useEffect(() => {
    // Wait for the session so a signed-in visitor's account bookings are included.
    if (!isClient || status === "loading") return;
    let current = true;
    getMyBookings(entries)
      .then((result) => current && setBookings(result))
      .catch(() => current && setBookings([]));
    return () => {
      current = false;
    };
  }, [entries, isClient, status]);

  if (!bookings) return <div className="h-64 animate-pulse rounded-2xl bg-stone-200/60" />;

  const tab = tabs.find((item) => item.label === active) ?? tabs[0];
  const visible = bookings.filter((booking) => tab.statuses.includes(booking.status));

  return (
    <div>
      <div role="tablist" aria-label="Booking status" className="flex gap-2 overflow-x-auto">
        {tabs.map(({ label, statuses }) => {
          const count = bookings.filter((booking) => statuses.includes(booking.status)).length;
          return (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={active === label}
              onClick={() => setActive(label)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                active === label ? "bg-stone-950 text-white" : "bg-white text-stone-700 hover:bg-orange-50 hover:text-orange-700",
              )}
            >
              {label}
              <span className={cn("rounded-full px-1.5 text-xs", active === label ? "bg-white/20" : "bg-stone-100")}>{count}</span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="mt-6 space-y-4">
        {visible.length ? (
          visible.map((booking) => <BookingCard key={booking.reference} booking={booking} />)
        ) : (
          <EmptyState
            icon={Ticket}
            title={tab.label === "Upcoming" ? "No upcoming visits" : `No ${tab.label.toLowerCase()} bookings`}
            description="Plan your Puja trail and your QR passes will appear here."
            action={<Link href="/pandals" className="rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-700">Explore pandals</Link>}
          />
        )}
      </div>
      <p className="mt-8 text-center text-sm text-stone-500">
        {user ? (
          "Showing bookings on your account and any made on this device."
        ) : (
          <>
            Showing bookings made on this device.{" "}
            <Link href="/login?next=/my-bookings" className="font-semibold text-orange-700 hover:text-orange-800">Sign in</Link> to see bookings made with your email anywhere.
          </>
        )}
      </p>
    </div>
  );
}
