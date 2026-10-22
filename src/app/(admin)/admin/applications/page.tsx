import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ChevronRight, FileCheck2 } from "lucide-react";
import EmptyState from "@/components/shared/EmptyState";
import { AdminPage, AdminPageHeader, AdminSkeleton } from "@/features/admin/components/admin-ui";
import { ApplicationFlags, ApplicationStatusPill } from "@/features/admin/components/application-flags";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getApplicationCounts, getApplications, requirePlatformAdmin } from "@/server/admin";
import type { ApplicationStatus } from "@/types";

export const metadata: Metadata = { title: "Applications" };

const tabs: { status: ApplicationStatus; label: string }[] = [
  { status: "pending", label: "Pending" },
  { status: "approved", label: "Approved" },
  { status: "rejected", label: "Rejected" },
];

export default function ApplicationsPage({ searchParams }: PageProps<"/admin/applications">) {
  return (
    <AdminPage>
      <AdminPageHeader title="Club applications" description="Clubs that registered through /clubs/register. The form promises a decision within 2–3 working days." />
      <Suspense fallback={<AdminSkeleton />}>
        <Applications searchParams={searchParams} />
      </Suspense>
    </AdminPage>
  );
}

async function Applications({ searchParams }: { searchParams: PageProps<"/admin/applications">["searchParams"] }) {
  await connection();
  await requirePlatformAdmin();
  const { status: rawStatus } = await searchParams;
  const status = tabs.some((tab) => tab.status === rawStatus) ? (rawStatus as ApplicationStatus) : "pending";
  const [applications, counts] = await Promise.all([getApplications(status), getApplicationCounts()]);

  return (
    <>
      <nav aria-label="Application status" className="flex gap-1 overflow-x-auto rounded-full bg-stone-200/60 p-1 sm:w-fit">
        {tabs.map((tab) => (
          <Link
            key={tab.status}
            href={tab.status === "pending" ? "/admin/applications" : `/admin/applications?status=${tab.status}`}
            aria-current={tab.status === status ? "page" : undefined}
            className={cn(
              "flex-1 rounded-full px-4 py-2 text-center text-sm font-semibold whitespace-nowrap text-stone-600 transition-colors hover:text-stone-950 sm:flex-none",
              tab.status === status && "bg-white text-stone-950 shadow-sm",
            )}
          >
            {tab.label} <span className="font-normal text-stone-500">{counts[tab.status]}</span>
          </Link>
        ))}
      </nav>

      {applications.length ? (
        <ul className="space-y-3">
          {applications.map((application) => (
            <li key={application.id}>
              <Link
                href={`/admin/applications/${application.id}`}
                className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4 transition-colors hover:border-orange-300 sm:p-5"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h2 className="font-semibold text-stone-950">{application.clubName}</h2>
                    {status !== "pending" && <ApplicationStatusPill status={application.status} />}
                  </div>
                  <p className="text-sm text-stone-600">
                    {application.area} · Est. {application.established} · Reg. {application.registrationNumber}
                  </p>
                  <p className="text-xs text-stone-500">
                    {application.contactName} · submitted {formatDate(application.submittedAt)}
                    {application.reviewedAt && ` · reviewed ${formatDate(application.reviewedAt)}`}
                  </p>
                  <ApplicationFlags application={application} />
                </div>
                <ChevronRight className="size-5 shrink-0 text-stone-400" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={FileCheck2} title={`No ${status} applications`} description={status === "pending" ? "New club registrations will show up here." : "Reviewed applications will show up here."} />
      )}
    </>
  );
}
