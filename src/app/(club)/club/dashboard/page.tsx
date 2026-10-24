import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AlertTriangle, CheckCircle2, Clock3, IndianRupee, ScanLine, Ticket, UsersRound, XCircle } from "lucide-react";
import { ClubAccessNotice, ClubPageSkeleton } from "@/features/club/components/club-access-notice";
import { ClubPageHeader } from "@/features/club/components/club-shell";
import { SalesChart } from "@/features/club/components/sales-chart";
import { formatDate, formatINR, formatPujaDate, formatTimeRange } from "@/lib/format";
import { displayName } from "@/lib/users";
import { cn } from "@/lib/utils";
import { requireClubAccess } from "@/server/auth/session";
import { getClubDashboard } from "@/server/club-stats";

export const metadata: Metadata = { title: "Club dashboard", robots: { index: false } };

const checkInStyles = {
  admitted: { label: "Admitted", icon: CheckCircle2, className: "bg-emerald-50 text-emerald-700" },
  duplicate: { label: "Already used", icon: AlertTriangle, className: "bg-amber-50 text-amber-800" },
  invalid: { label: "Invalid", icon: XCircle, className: "bg-rose-50 text-rose-700" },
};

export default function ClubDashboardPage({ searchParams }: PageProps<"/club/dashboard">) {
  return (
    <Suspense fallback={<ClubPageSkeleton />}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

async function Dashboard({ searchParams }: { searchParams: PageProps<"/club/dashboard">["searchParams"] }) {
  const access = await requireClubAccess(["OWNER", "ADMIN"], "/club/dashboard");
  if (!access.ok) return <ClubAccessNotice reason={access.reason} />;
  if (!access.pandalId) return <ClubAccessNotice reason="no-pandal" />;

  const { day: requestedDay } = await searchParams;
  const data = await getClubDashboard(access.pandalId, typeof requestedDay === "string" ? requestedDay : undefined);
  const { totals, day } = data;
  const dayLabel = formatPujaDate(day.date, data.days);
  const occupancy = day.capacity ? Math.round((day.booked / day.capacity) * 100) : 0;
  const maxTierVisitors = Math.max(1, ...data.byTier.map((tier) => tier.visitors));

  const kpis = [
    { label: "Tickets sold", value: totals.visitors.toLocaleString("en-IN"), detail: `${totals.bookings.toLocaleString("en-IN")} bookings, all days`, icon: Ticket },
    { label: "Gross revenue", value: formatINR(totals.revenue), detail: "Pass sales, before platform fees", icon: IndianRupee },
    { label: "Checked in", value: day.checkedIn.toLocaleString("en-IN"), detail: `of ${day.expected.toLocaleString("en-IN")} expected on ${dayLabel}`, icon: UsersRound },
    { label: "Slot occupancy", value: `${occupancy}%`, detail: `${day.booked.toLocaleString("en-IN")} of ${day.capacity.toLocaleString("en-IN")} places on ${dayLabel}`, icon: Clock3 },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <ClubPageHeader
        title={`Namaskar, ${displayName(access.user).split(" ")[0]}`}
        description={`Here's how your Puja is doing · ${dayLabel}`}
        actions={
          <>
            <Link href="/club/tickets" className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-50">
              <Ticket className="size-4" /> Manage slots
            </Link>
            <Link href="/club/scanner" className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700">
              <ScanLine className="size-4" /> Open scanner
            </Link>
          </>
        }
      />

      {data.days.length > 0 && (
        <nav aria-label="Festival day" className="flex gap-1 overflow-x-auto rounded-xl bg-stone-200/60 p-1 sm:w-fit">
          {data.days.map((item) => (
            <Link
              key={item.date}
              href={`/club/dashboard?day=${item.date}`}
              aria-current={item.date === day.date ? "page" : undefined}
              className={cn("shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900", item.date === day.date && "bg-white text-stone-950 shadow-sm")}
            >
              {item.label} <span className="font-normal text-stone-500">{formatDate(item.date, { withYear: false })}</span>
            </Link>
          ))}
        </nav>
      )}

      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, detail, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-stone-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <dt className="text-sm font-medium text-stone-500">{label}</dt>
              <Icon className="size-5 text-orange-600" aria-hidden="true" />
            </div>
            <dd className="mt-3 font-serif text-3xl font-semibold text-stone-950">{value}</dd>
            <dd className="mt-1 text-xs text-stone-500">{detail}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section className="min-w-0 rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="font-serif text-xl font-semibold text-stone-950">Tickets sold per day</h2>
          <p className="text-sm text-stone-500">The selected day is highlighted. Hover a bar for revenue.</p>
          <div className="mt-6">
            {data.sales.length ? <SalesChart data={data.sales} highlightDate={day.date} /> : <p className="py-10 text-center text-sm text-stone-500">No festival days or entry windows yet.</p>}
          </div>
        </section>

        <section className="min-w-0 rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="font-serif text-xl font-semibold text-stone-950">Sales by pass type</h2>
          {data.byTier.length ? (
            <ul className="mt-5 space-y-5">
              {data.byTier.map((tier) => (
                <li key={tier.tierId}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-semibold text-stone-900">{tier.name}</span>
                    <span className="text-stone-500">{tier.visitors.toLocaleString("en-IN")} · {formatINR(tier.revenue)}</span>
                  </div>
                  <div className="mt-2 h-2.5 rounded-full bg-stone-100">
                    <div className="h-full rounded-full bg-orange-600" style={{ width: `${(tier.visitors / maxTierVisitors) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-stone-600">
              No pass types yet. <Link href="/club/tickets" className="font-semibold text-orange-700">Create one</Link> so visitors can book.
            </p>
          )}
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-stone-100 pt-5 text-sm">
            <div className="rounded-xl bg-stone-50 p-3">
              <p className="text-stone-500">Bookings</p>
              <p className="mt-1 text-xl font-semibold text-stone-950">{totals.bookings.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-xl bg-stone-50 p-3">
              <p className="text-stone-500">Cancelled</p>
              <p className="mt-1 text-xl font-semibold text-stone-950">{totals.cancelledBookings.toLocaleString("en-IN")}</p>
            </div>
            <div className="col-span-2 rounded-xl bg-orange-50 p-3">
              <p className="text-orange-900">Saved by visitors</p>
              <p className="mt-1 text-xl font-semibold text-stone-950">
                {totals.savedBy.toLocaleString("en-IN")} <span className="text-sm font-normal text-stone-600">{totals.savedBy === 1 ? "visitor has" : "visitors have"} hearted your pandal</span>
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="min-w-0 rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-stone-950">Slots on {dayLabel}</h2>
            <Link href="/club/tickets" className="-my-1.5 py-1.5 text-sm font-semibold text-orange-700">Edit</Link>
          </div>
          {day.slots.length ? (
            <ul className="mt-4 space-y-3">
              {day.slots.map((slot) => {
                const percent = slot.capacity ? Math.min(100, Math.round((slot.booked / slot.capacity) * 100)) : 0;
                return (
                  <li key={slot.id} className="grid grid-cols-[8.5rem_1fr_3.5rem] items-center gap-3 text-sm">
                    <span className="font-medium text-stone-800">{formatTimeRange(slot.startTime, slot.endTime)}</span>
                    <span className="h-2 rounded-full bg-stone-100">
                      <span className="block h-full rounded-full bg-orange-600" style={{ width: `${percent}%` }} />
                    </span>
                    <span className="text-right text-stone-600">{slot.salesPaused ? "Paused" : percent >= 100 ? "Full" : `${percent}%`}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-stone-600">
              No entry windows on this day. <Link href="/club/tickets" className="font-semibold text-orange-700">Add some</Link>.
            </p>
          )}
        </section>

        <section className="min-w-0 rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-stone-950">Recent check-ins</h2>
            <Link href="/club/scanner" className="-my-1.5 py-1.5 text-sm font-semibold text-orange-700">Scanner</Link>
          </div>
          {data.recentCheckIns.length ? (
            <ul className="mt-3 divide-y divide-stone-100">
              {data.recentCheckIns.map((checkIn) => {
                const style = checkInStyles[checkIn.result];
                return (
                  <li key={checkIn.id} className="flex items-center gap-3 py-3 text-sm">
                    <span className="w-24 shrink-0 text-stone-500">{checkIn.time}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-stone-900">{checkIn.holderName}</span>
                      <span className="block truncate font-mono text-xs text-stone-500">{checkIn.passCode} · {checkIn.tierName}{checkIn.quantity ? ` · ${checkIn.quantity} pax` : ""}</span>
                    </span>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${style.className}`}>
                      <style.icon className="size-3.5" aria-hidden="true" /> {style.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-stone-600">No scans yet. Open the scanner at the gate to check visitors in.</p>
          )}
        </section>
      </div>
    </div>
  );
}
