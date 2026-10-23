import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3, IndianRupee, ScanLine, Ticket, UsersRound, XCircle } from "lucide-react";
import { ClubPageHeader } from "@/features/club/components/club-shell";
import { SalesChart } from "@/features/club/components/sales-chart";
import { Suspense } from "react";
import { CLUB_TODAY, dailySales, recentCheckIns, tierSales, todayStats } from "@/data/club";
import { ClubAccessNotice, ClubPageSkeleton } from "@/features/club/components/club-access-notice";
import { formatINR, formatPujaDate, formatTimeRange } from "@/lib/format";
import { displayName } from "@/lib/users";
import { requireClubAccess } from "@/server/auth/session";
import { getClubPandal } from "@/server/club";
import { getSlotsForPandal, getTiersForPandal } from "@/server/pandals";

export const metadata: Metadata = { title: "Club dashboard", robots: { index: false } };

const checkInStyles = {
  admitted: { label: "Admitted", icon: CheckCircle2, className: "bg-emerald-50 text-emerald-700" },
  duplicate: { label: "Already used", icon: AlertTriangle, className: "bg-amber-50 text-amber-800" },
  invalid: { label: "Invalid", icon: XCircle, className: "bg-rose-50 text-rose-700" },
};

export default function ClubDashboardPage() {
  return (
    <Suspense fallback={<ClubPageSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  const access = await requireClubAccess(["OWNER", "ADMIN"], "/club/dashboard");
  if (!access.ok) return <ClubAccessNotice reason={access.reason} />;
  const pandal = access.pandalId ? await getClubPandal(access.pandalId) : null;
  if (!pandal) return <ClubAccessNotice reason="no-pandal" />;
  // TODO: KPIs, the sales chart and check-ins below are still sample data (src/data/club.ts).
  const [todaySlots, tiers] = await Promise.all([getSlotsForPandal(pandal.id, CLUB_TODAY), getTiersForPandal(pandal.id)]);
  const totalTickets = dailySales.reduce((total, day) => total + day.tickets, 0);
  const totalRevenue = dailySales.reduce((total, day) => total + day.revenue, 0);
  const occupancy = Math.round((todaySlots.reduce((total, slot) => total + slot.booked, 0) / todaySlots.reduce((total, slot) => total + slot.capacity, 0)) * 100);
  const maxTierTickets = Math.max(...tierSales.map((tier) => tier.tickets));

  const kpis = [
    { label: "Tickets sold", value: totalTickets.toLocaleString("en-IN"), detail: "Across all 5 days", icon: Ticket },
    { label: "Gross revenue", value: formatINR(totalRevenue), detail: "Before platform fees", icon: IndianRupee },
    { label: "Checked in today", value: todayStats.checkedIn.toLocaleString("en-IN"), detail: `of ${todayStats.expected.toLocaleString("en-IN")} expected`, icon: UsersRound },
    { label: "Slot occupancy today", value: `${occupancy}%`, detail: `Avg gate wait ${todayStats.gateWaitMinutes} min`, icon: Clock3 },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <ClubPageHeader
        title={`Namaskar, ${displayName(access.user).split(" ")[0]}`}
        description={`Here's how your Puja is doing · ${formatPujaDate(CLUB_TODAY)}`}
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
          <p className="text-sm text-stone-500">Today is highlighted. Hover a bar for revenue.</p>
          <div className="mt-6">
            <SalesChart data={dailySales} highlightDate={CLUB_TODAY} />
          </div>
        </section>

        <section className="min-w-0 rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="font-serif text-xl font-semibold text-stone-950">Sales by pass type</h2>
          <ul className="mt-5 space-y-5">
            {tierSales.map((sale) => {
              const tier = tiers.find((item) => item.id === sale.tierId);
              return (
                <li key={sale.tierId}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-semibold text-stone-900">{tier?.name}</span>
                    <span className="text-stone-500">{sale.tickets.toLocaleString("en-IN")} · {formatINR(sale.revenue)}</span>
                  </div>
                  <div className="mt-2 h-2.5 rounded-full bg-stone-100">
                    <div className="h-full rounded-full bg-orange-600" style={{ width: `${(sale.tickets / maxTierTickets) * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-stone-100 pt-5 text-sm">
            <div className="rounded-xl bg-stone-50 p-3">
              <p className="text-stone-500">Scanners online</p>
              <p className="mt-1 text-xl font-semibold text-stone-950">{todayStats.scannersOnline}</p>
            </div>
            <div className="rounded-xl bg-stone-50 p-3">
              <p className="text-stone-500">Avg gate wait</p>
              <p className="mt-1 text-xl font-semibold text-stone-950">{todayStats.gateWaitMinutes} min</p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="min-w-0 rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-stone-950">Today&apos;s slots</h2>
            <Link href="/club/tickets" className="-my-1.5 py-1.5 text-sm font-semibold text-orange-700">Edit</Link>
          </div>
          <ul className="mt-4 space-y-3">
            {todaySlots.map((slot) => {
              const percent = Math.round((slot.booked / slot.capacity) * 100);
              return (
                <li key={slot.id} className="grid grid-cols-[8.5rem_1fr_3rem] items-center gap-3 text-sm">
                  <span className="font-medium text-stone-800">{formatTimeRange(slot.startTime, slot.endTime)}</span>
                  <span className="h-2 rounded-full bg-stone-100">
                    <span className="block h-full rounded-full bg-orange-600" style={{ width: `${percent}%` }} />
                  </span>
                  <span className="text-right text-stone-600">{percent >= 100 ? "Full" : `${percent}%`}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="min-w-0 rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-stone-950">Recent check-ins</h2>
            <Link href="/club/scanner" className="-my-1.5 py-1.5 text-sm font-semibold text-orange-700">Scanner</Link>
          </div>
          <ul className="mt-3 divide-y divide-stone-100">
            {recentCheckIns.map((checkIn) => {
              const style = checkInStyles[checkIn.result];
              return (
                <li key={checkIn.id} className="flex items-center gap-3 py-3 text-sm">
                  <span className="w-12 shrink-0 text-stone-500">{checkIn.time}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-stone-900">{checkIn.holderName}</span>
                    <span className="block font-mono text-xs text-stone-500">{checkIn.passCode} · {checkIn.tierName}{checkIn.quantity ? ` · ${checkIn.quantity} pax` : ""}</span>
                  </span>
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${style.className}`}>
                    <style.icon className="size-3.5" aria-hidden="true" /> {style.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
