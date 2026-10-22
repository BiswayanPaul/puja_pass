import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ArrowLeft, ArrowRight, FileCheck, FileX } from "lucide-react";
import { AdminPage, AdminSkeleton, Card, CardTitle } from "@/features/admin/components/admin-ui";
import { ApplicationFlags, ApplicationStatusPill } from "@/features/admin/components/application-flags";
import { ApplicationReview } from "@/features/admin/components/application-review";
import { formatDate } from "@/lib/format";
import { getApplication, requirePlatformAdmin } from "@/server/admin";
import type { ClubApplicationDetail } from "@/types";

export const metadata: Metadata = { title: "Application" };

export default function ApplicationPage({ params }: PageProps<"/admin/applications/[id]">) {
  return (
    <AdminPage>
      <Link href="/admin/applications" className="-my-1.5 inline-flex items-center gap-1.5 py-1.5 text-sm font-semibold text-orange-700">
        <ArrowLeft className="size-4" aria-hidden="true" /> All applications
      </Link>
      <Suspense fallback={<AdminSkeleton rows={3} />}>
        <Application params={params} />
      </Suspense>
    </AdminPage>
  );
}

async function Application({ params }: { params: PageProps<"/admin/applications/[id]">["params"] }) {
  await connection();
  await requirePlatformAdmin();
  const { id } = await params;
  const application = await getApplication(id);
  if (!application) notFound();

  const missingDocuments = [
    !application.certificate && "society registration certificate",
    !application.permission && "police / municipal permission",
  ].filter((item): item is string => Boolean(item));

  return (
    <>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">{application.clubName}</h1>
          <ApplicationStatusPill status={application.status} />
        </div>
        <p className="text-sm text-stone-600">
          Submitted {formatDate(application.submittedAt)}
          {application.submittedBy ? ` by ${application.submittedBy.name}` : " without an account"}
        </p>
        <ApplicationFlags application={application} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
        <div className="space-y-6">
          <Card>
            <CardTitle>Club</CardTitle>
            <Details
              rows={[
                ["Registration no.", application.registrationNumber],
                ["Established", String(application.established)],
                ["Area", application.area],
                ["Pandal address", application.address],
              ]}
            />
            {application.duplicateOfClub && (
              <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
                <span className="font-semibold">{application.duplicateOfClub}</span> is already registered with this number.
              </p>
            )}
            {application.relatedApplications.length > 0 && (
              <div className="mt-4 text-sm">
                <p className="font-semibold text-stone-800">Other applications with this number</p>
                <ul className="mt-2 space-y-1.5">
                  {application.relatedApplications.map((item) => (
                    <li key={item.id} className="flex items-center gap-2">
                      <Link href={`/admin/applications/${item.id}`} className="font-medium text-orange-700 hover:text-orange-800">{item.clubName}</Link>
                      <ApplicationStatusPill status={item.status} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <Card>
            <CardTitle>Puja plans</CardTitle>
            <Details
              rows={[
                ["Theme", application.theme || "Not decided yet"],
                ["Description", application.description],
                ["Expected daily footfall", application.expectedFootfall],
                ["Wants to offer", application.offerings.join(", ") || "Nothing selected"],
              ]}
            />
          </Card>

          <Card>
            <CardTitle>Contact & documents</CardTitle>
            <Details
              rows={[
                ["Contact", `${application.contactName} (${application.contactRole})`],
                ["Email", application.email],
                ["Phone", application.phone],
              ]}
            />
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              <DocumentItem label="Society registration" file={application.certificate} />
              <DocumentItem label="Police / municipal permission" file={application.permission} />
            </ul>
            <p className="mt-2 text-xs text-stone-500">Files aren&apos;t stored yet; only the uploaded file names are kept.</p>
          </Card>
        </div>

        <Card className="h-fit lg:sticky lg:top-6">
          <CardTitle>Decision</CardTitle>
          <div className="mt-4">
            {application.status === "pending" ? (
              <ApplicationReview applicationId={application.id} missingDocuments={missingDocuments} duplicateOfClub={application.duplicateOfClub} />
            ) : (
              <ReviewOutcome application={application} />
            )}
          </div>
        </Card>
      </div>
    </>
  );
}

function Details({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="mt-4 divide-y divide-stone-100 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="grid gap-1 py-2.5 sm:grid-cols-[180px_1fr] sm:gap-3">
          <dt className="text-stone-500">{label}</dt>
          <dd className="font-medium break-words text-stone-900">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function DocumentItem({ label, file }: { label: string; file: string | null }) {
  const Icon = file ? FileCheck : FileX;
  return (
    <li className={file ? "flex gap-3 rounded-xl border border-stone-200 p-3" : "flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3"}>
      <Icon className={file ? "size-5 shrink-0 text-emerald-600" : "size-5 shrink-0 text-amber-700"} aria-hidden="true" />
      <span className="min-w-0 text-sm">
        <span className="block font-semibold text-stone-900">{label}</span>
        <span className={file ? "block truncate text-stone-600" : "block font-medium text-amber-800"}>{file ?? "Not uploaded"}</span>
      </span>
    </li>
  );
}

function ReviewOutcome({ application }: { application: ClubApplicationDetail }) {
  return (
    <div className="space-y-4 text-sm">
      <p className="text-stone-700">
        {application.status === "approved" ? "Approved" : "Rejected"}
        {application.reviewedAt && ` on ${formatDate(application.reviewedAt)}`}
        {application.reviewedBy && ` by ${application.reviewedBy}`}.
      </p>
      {application.reviewNotes && (
        <blockquote className="rounded-lg border-l-4 border-stone-300 bg-stone-50 px-3 py-2 text-stone-700">{application.reviewNotes}</blockquote>
      )}
      {application.club && (
        <Link href="/admin/clubs" className="inline-flex items-center gap-1.5 font-semibold text-orange-700 hover:text-orange-800">
          {application.club.name} {application.club.verified ? "is verified" : "is not verified"} <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
