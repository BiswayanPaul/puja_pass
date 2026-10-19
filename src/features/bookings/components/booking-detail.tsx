"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Navigation,
  Printer,
  SearchX,
  ShieldCheck,
  UsersRound,
  XCircle,
} from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import FakeQr from "@/components/shared/FakeQr";
import StatusBadge from "@/components/shared/StatusBadge";
import { useIsClient } from "@/lib/create-store";
import { formatDate, formatINR, formatPujaDate, formatTime, formatTimeRange } from "@/lib/format";
import { getPandalById, getTierById } from "@/lib/queries";
import { cn } from "@/lib/utils";
import type { Pass } from "@/types";
import { cancelBooking, useBooking } from "../use-bookings";

const instructions = [
  "Arrive at the dedicated PujaPass lane up to 15 minutes before your slot.",
  "Show the QR code on your phone or a printout. One scan admits everyone on the pass.",
  "Passes are valid only for the selected date and time window.",
  "Free public entry is always available through the general gates.",
];

function PassTicket({ pass }: { pass: Pass }) {
  const pandal = getPandalById(pass.pandalId);
  const tier = getTierById(pass.tierId);
  if (!pandal) return null;
  const inactive = pass.status !== "valid";

  return (
    <article className={cn("relative flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm sm:flex-row print:break-inside-avoid", inactive && "opacity-70")}>
      <div className="flex flex-col items-center justify-center gap-2 border-b border-dashed border-stone-300 bg-orange-50/60 p-5 sm:w-52 sm:border-b-0 sm:border-r">
        <div className={cn("rounded-xl bg-white p-2 shadow-sm", inactive && "grayscale")}>
          <FakeQr value={pass.code} className="size-36" />
        </div>
        <p className="font-mono text-sm font-semibold tracking-wider text-stone-800">{pass.code}</p>
      </div>
      <div className="flex-1 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs font-bold tracking-[0.14em] text-orange-600">{tier?.name.toUpperCase()}</p>
            <h3 className="mt-1 font-serif text-2xl font-semibold text-stone-950">{pandal.name}</h3>
          </div>
          <StatusBadge status={pass.status} />
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="flex items-center gap-1 text-xs text-stone-500"><CalendarDays className="size-3.5" aria-hidden="true" />Date</dt>
            <dd className="mt-0.5 font-semibold text-stone-900">{formatPujaDate(pass.date)}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-xs text-stone-500"><Clock3 className="size-3.5" aria-hidden="true" />Entry window</dt>
            <dd className="mt-0.5 font-semibold text-stone-900">{formatTimeRange(pass.startTime, pass.endTime)}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-xs text-stone-500"><UsersRound className="size-3.5" aria-hidden="true" />Admits</dt>
            <dd className="mt-0.5 font-semibold text-stone-900">{pass.quantity} {pass.quantity === 1 ? "person" : "people"}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-xs text-stone-500"><MapPin className="size-3.5" aria-hidden="true" />Location</dt>
            <dd className="mt-0.5 font-semibold text-stone-900">{pandal.neighbourhood}</dd>
          </div>
        </dl>
        {pass.checkedInAt && <p className="mt-4 text-xs text-stone-500">Checked in at {formatTime(pass.checkedInAt.slice(11, 16))}</p>}
        <div className="mt-4 flex flex-wrap gap-2 print:hidden">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pandal.address)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:border-orange-300 hover:text-orange-700"
          >
            <Navigation className="size-3.5" /> Directions
          </a>
          <Link href={`/pandals/${pandal.slug}`} className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:border-orange-300 hover:text-orange-700">
            Pandal details
          </Link>
        </div>
      </div>
    </article>
  );
}

export function BookingDetail() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const isNew = useSearchParams().get("new") === "1";
  const isClient = useIsClient();
  const booking = useBooking(bookingId);
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!booking) {
    if (!isClient) return <div className="h-96 animate-pulse rounded-2xl bg-stone-200/60" />;
    return (
      <EmptyState
        icon={SearchX}
        title="Booking not found"
        description={`We couldn't find a booking with reference ${bookingId}. It may have been made on another device.`}
        action={<Link href="/my-bookings" className="rounded-full bg-orange-600 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-700">Go to my bookings</Link>}
      />
    );
  }

  const visitors = booking.passes.reduce((total, pass) => total + pass.quantity, 0);

  return (
    <div className="space-y-6">
      <Link href="/my-bookings" className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-700 hover:text-orange-800 print:hidden">
        <ArrowLeft className="size-4" /> All bookings
      </Link>

      {isNew && booking.status === "confirmed" && (
        <div className="flex gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5" role="status">
          <CheckCircle2 className="size-7 shrink-0 text-emerald-600" aria-hidden="true" />
          <div>
            <h2 className="font-serif text-2xl font-semibold text-emerald-950">Booking confirmed!</h2>
            <p className="mt-1 text-sm text-emerald-900/80">
              Your passes have been sent to <span className="font-semibold">{booking.contact.email}</span>. You can also find them anytime under My Bookings.
            </p>
          </div>
        </div>
      )}

      <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-stone-500">Booking reference</p>
            <p className="mt-1 flex items-center gap-3 font-mono text-2xl font-semibold tracking-wider text-stone-950">
              {booking.id} <StatusBadge status={booking.status} />
            </p>
          </div>
          <div className="flex gap-2 print:hidden">
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-50">
              <Printer className="size-4" /> Print / Save PDF
            </button>
            {booking.status === "confirmed" && (
              <button type="button" onClick={() => setConfirmCancel(true)} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50">
                <XCircle className="size-4" /> Cancel
              </button>
            )}
          </div>
        </div>

        {confirmCancel && booking.status === "confirmed" && (
          <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-sm font-semibold text-rose-900">Cancel this booking?</p>
            <p className="mt-1 text-sm text-rose-900/80">All {booking.passes.length} passes will be invalidated. A refund of {formatINR(booking.subtotal)} (excluding fees) will be processed within 5–7 days.</p>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => { cancelBooking(booking); setConfirmCancel(false); }} className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700">Yes, cancel booking</button>
              <button type="button" onClick={() => setConfirmCancel(false)} className="rounded-full px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-white">Keep it</button>
            </div>
          </div>
        )}

        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-stone-100 pt-5 text-sm sm:grid-cols-4">
          <div><dt className="text-stone-500">Lead visitor</dt><dd className="mt-0.5 font-semibold text-stone-900">{booking.contact.name}</dd></div>
          <div><dt className="text-stone-500">Booked on</dt><dd className="mt-0.5 font-semibold text-stone-900">{formatDate(booking.createdAt)}</dd></div>
          <div><dt className="text-stone-500">Visitors</dt><dd className="mt-0.5 font-semibold text-stone-900">{visitors} across {booking.passes.length} {booking.passes.length === 1 ? "pandal" : "pandals"}</dd></div>
          <div><dt className="text-stone-500">Paid via {booking.paymentMethod}</dt><dd className="mt-0.5 font-semibold text-stone-900">{formatINR(booking.total)}</dd></div>
        </dl>
      </section>

      <section>
        <h2 className="font-serif text-2xl font-semibold text-stone-950">Your passes</h2>
        <div className="mt-4 space-y-4">
          {booking.passes.map((pass) => <PassTicket key={pass.id} pass={pass} />)}
        </div>
      </section>

      <section className="rounded-2xl bg-stone-950 p-6 text-stone-300 print:hidden">
        <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-white">
          <ShieldCheck className="size-5 text-orange-400" aria-hidden="true" /> Before you go
        </h2>
        <ul className="mt-4 space-y-2 text-sm leading-6">
          {instructions.map((item) => (
            <li key={item} className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-orange-500" aria-hidden="true" />{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
