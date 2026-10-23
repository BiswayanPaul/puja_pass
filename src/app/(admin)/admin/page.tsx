import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ArrowRight, BadgeCheck, FileCheck2, ShieldOff, Store } from "lucide-react";
import { AdminPage, AdminPageHeader, AdminSkeleton, Card, CardTitle } from "@/features/admin/components/admin-ui";
import { ApplicationFlags } from "@/features/admin/components/application-flags";
import { getAdminClubs, getAdminOverview, getAdminPandals, getApplications, REVIEW_DUE_DAYS } from "@/server/admin";
import { requirePlatformAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Overview" };

export default function AdminOverviewPage() {
  return (
    <AdminPage>
      <AdminPageHeader title="Platform overview" description="Review club applications, keep verification up to date and decide which pandals visitors can see." />
      <Suspense fallback={<AdminSkeleton rows={5} />}>
        <Overview />
      </Suspense>
    </AdminPage>
  );
}

async function Overview() {
  await connection();
  await requirePlatformAdmin();
  const [overview, pending, clubs, pandals] = await Promise.all([
    getAdminOverview(),
    getApplications("pending"),
    getAdminClubs(),
    getAdminPandals(),
  ]);
  const unverifiedClubs = clubs.filter((club) => !club.verified);
  const readyToPublish = pandals.filter((pandal) => pandal.status === "draft" && !pandal.profileGaps.length);

  const stats = [
    {
      label: "Pending applications",
      value: overview.applications.pending,
      detail: overview.overdueApplications ? `${overview.overdueApplications} waiting over ${REVIEW_DUE_DAYS} days` : "All within the review window",
      warn: overview.overdueApplications > 0,
      href: "/admin/applications",
      icon: FileCheck2,
    },
    {
      label: "Verified clubs",
      value: overview.clubs.verified,
      detail: overview.clubs.unverified ? `${overview.clubs.unverified} not verified` : "No unverified clubs",
      warn: overview.clubs.unverified > 0,
      href: "/admin/clubs",
      icon: BadgeCheck,
    },
    {
      label: "Live pandals",
      value: overview.pandals.live,
      detail: `${overview.pandals.draft} draft · ${overview.pandals.blocked} blocked`,
      warn: false,
      href: "/admin/pandals",
      icon: Store,
    },
    {
      label: "Ready to publish",
      value: overview.readyToPublish,
      detail: "Drafts with a complete profile",
      warn: false,
      href: "/admin/pandals",
      icon: Store,
    },
  ];

  return (
    <>
      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, detail, warn, href, icon: Icon }) => (
          <Link key={label} href={href} className="rounded-2xl border border-stone-200 bg-white p-5 transition-colors hover:border-orange-300">
            <div className="flex items-center justify-between">
              <dt className="text-sm font-medium text-stone-500">{label}</dt>
              <Icon className="size-5 text-orange-600" aria-hidden="true" />
            </div>
            <dd className="mt-3 font-serif text-3xl font-semibold text-stone-950">{value}</dd>
            <dd className={warn ? "mt-1 text-xs font-semibold text-amber-700" : "mt-1 text-xs text-stone-500"}>{detail}</dd>
          </Link>
        ))}
      </dl>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card>
          <CardTitle action={<ViewAll href="/admin/applications" />}>Needs review</CardTitle>
          <p className="text-sm text-stone-500">Oldest first.</p>
          {pending.length ? (
            <ul className="mt-4 divide-y divide-stone-100">
              {pending.slice(0, 5).map((application) => (
                <li key={application.id}>
                  <Link href={`/admin/applications/${application.id}`} className="-mx-2 flex flex-col gap-2 rounded-lg px-2 py-3 hover:bg-stone-50 sm:flex-row sm:items-center sm:justify-between">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-stone-900">{application.clubName}</span>
                      <span className="block text-xs text-stone-500">{application.area} · Est. {application.established}</span>
                    </span>
                    <ApplicationFlags application={application} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-lg bg-stone-50 px-3 py-4 text-sm text-stone-600">No applications are waiting.</p>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardTitle action={<ViewAll href="/admin/pandals" />}>Ready to publish</CardTitle>
            {readyToPublish.length ? (
              <ul className="mt-3 space-y-2 text-sm">
                {readyToPublish.map((pandal) => (
                  <li key={pandal.id} className="flex items-center justify-between gap-3">
                    <span className="truncate font-medium text-stone-900">{pandal.name}</span>
                    <span className="shrink-0 text-xs text-stone-500">{pandal.area}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-stone-600">No complete drafts right now.</p>
            )}
          </Card>
          <Card>
            <CardTitle action={<ViewAll href="/admin/clubs" />}>Unverified clubs</CardTitle>
            {unverifiedClubs.length ? (
              <ul className="mt-3 space-y-3 text-sm">
                {unverifiedClubs.map((club) => (
                  <li key={club.id} className="flex gap-2">
                    <ShieldOff className="mt-0.5 size-4 shrink-0 text-rose-600" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block font-medium text-stone-900">{club.name}</span>
                      {club.verificationNote && <span className="block text-xs text-stone-500">{club.verificationNote}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-stone-600">Every club is verified.</p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function ViewAll({ href }: { href: string }) {
  return (
    <Link href={href} className="-my-1.5 inline-flex items-center gap-1 py-1.5 text-sm font-semibold text-orange-700 hover:text-orange-800">
      View all <ArrowRight className="size-4" aria-hidden="true" />
    </Link>
  );
}
