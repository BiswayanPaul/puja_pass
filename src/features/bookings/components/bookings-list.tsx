"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CalendarDays, Ticket } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";
import { getPandalById } from "@/lib/queries";
import { formatDate, formatINR, formatPujaDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Booking, BookingStatus } from "@/types";
import { useBookings } from "../use-bookings";

const tabs: { label: string; status: BookingStatus }[] = [
  { label: "Upcoming", status: "confirmed" },
  { label: "Past", status: "completed" },
  { label: "Cancelled", status: "cancelled" },
];

function BookingCard({ booking }: { booking: Booking }) {
  const pandals = booking.passes.map((pass) => getPandalById(pass.pandalId)).filter((pandal) => pandal !== undefined);
  const dates = [...new Set(booking.passes.map((pass) => pass.date))];
  const visitors = booking.passes.reduce((total, pass) => total + pass.quantity, 0);

  return (
    <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="flex -space-x-4">
          {pandals.slice(0, 3).map((pandal) => (
            <div key={pandal.id} className="relative size-16 overflow-hidden rounded-xl border-2 border-white shadow">
              <Image src={pandal.imageSrc} alt="" fill sizes="64px" className="object-cover" />
            </div>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-serif text-xl font-semibold text-stone-950">{pandals.map((pandal) => pandal.name).join(" · ")}</h2>
            <StatusBadge status={booking.status} />
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-500">
            <span className="inline-flex items-center gap-1"><CalendarDays className="size-4" aria-hidden="true" />{dates.map((date) => formatPujaDate(date)).join(", ")}</span>
            <span className="inline-flex items-center gap-1"><Ticket className="size-4" aria-hidden="true" />{booking.passes.length} {booking.passes.length === 1 ? "pass" : "passes"} · {visitors} visitors</span>
          </p>
        </div>
        <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
          <p className="font-serif text-xl font-semibold text-stone-950">{formatINR(booking.total)}</p>
          <Link href={`/bookings/${booking.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-600 hover:text-white">
            {booking.status === "confirmed" ? "View passes" : "Details"} <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-stone-100 bg-stone-50 px-5 py-2.5 text-xs text-stone-500">
        <span>Ref <span className="font-mono font-semibold text-stone-700">{booking.id}</span></span>
        <span>Booked {formatDate(booking.createdAt)}</span>
        <span>First entry {formatTime(booking.passes[0].startTime)}</span>
      </div>
    </article>
  );
}

export function BookingsList() {
  const bookings = useBookings();
  const [active, setActive] = useState<BookingStatus>("confirmed");
  const visible = bookings.filter((booking) => booking.status === active);

  return (
    <div>
      <div role="tablist" aria-label="Booking status" className="flex gap-2 overflow-x-auto">
        {tabs.map(({ label, status }) => {
          const count = bookings.filter((booking) => booking.status === status).length;
          return (
            <button
              key={status}
              type="button"
              role="tab"
              aria-selected={active === status}
              onClick={() => setActive(status)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                active === status ? "bg-stone-950 text-white" : "bg-white text-stone-700 hover:bg-orange-50 hover:text-orange-700",
              )}
            >
              {label}
              <span className={cn("rounded-full px-1.5 text-xs", active === status ? "bg-white/20" : "bg-stone-100")}>{count}</span>
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="mt-6 space-y-4">
        {visible.length ? (
          visible.map((booking) => <BookingCard key={booking.id} booking={booking} />)
        ) : (
          <EmptyState
            icon={Ticket}
            title={active === "confirmed" ? "No upcoming visits" : `No ${tabs.find((tab) => tab.status === active)?.label.toLowerCase()} bookings`}
            description="Plan your Puja trail and your QR passes will appear here."
            action={<Link href="/pandals" className="rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-700">Explore pandals</Link>}
          />
        )}
      </div>
    </div>
  );
}
