import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { BadgeCheck, ShieldOff } from "lucide-react";
import { AdminPage, AdminPageHeader, AdminSkeleton, Pill } from "@/features/admin/components/admin-ui";
import { ClubVerificationControl } from "@/features/admin/components/club-verification-control";
import { formatDate } from "@/lib/format";
import { getAdminClubs, requirePlatformAdmin } from "@/server/admin";

export const metadata: Metadata = { title: "Clubs" };

export default function ClubsPage() {
  return (
    <AdminPage>
      <AdminPageHeader
        title="Clubs"
        description="Only verified clubs can have pandals on the public site. Revoking verification hides a club's pandals immediately."
      />
      <Suspense fallback={<AdminSkeleton rows={6} />}>
        <Clubs />
      </Suspense>
    </AdminPage>
  );
}

async function Clubs() {
  await connection();
  await requirePlatformAdmin();
  const clubs = await getAdminClubs();

  return (
    <ul className="space-y-3">
      {clubs.map((club) => (
        <li key={club.id} className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h2 className="font-semibold text-stone-950">{club.name}</h2>
                {club.verified ? (
                  <Pill tone="success" icon={BadgeCheck}>Verified</Pill>
                ) : (
                  <Pill tone="danger" icon={ShieldOff}>Not verified</Pill>
                )}
              </div>
              <p className="text-sm text-stone-600">
                {[
                  club.registrationNumber ? `Reg. ${club.registrationNumber}` : "No registration no. on file",
                  club.established && `Est. ${club.established}`,
                  club.owner ? `Owner: ${club.owner}` : "No owner account",
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {club.verified && club.verifiedAt && <p className="text-xs text-stone-500">Verified on {formatDate(club.verifiedAt)}</p>}
              {!club.verified && club.verificationNote && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{club.verificationNote}</p>
              )}
              <p className="text-xs text-stone-500">
                {club.pandals.length
                  ? club.pandals.map((pandal) => `${pandal.name} (${pandal.published ? "published" : "unpublished"})`).join(", ")
                  : "No pandal yet"}
              </p>
            </div>
            <div className="shrink-0 md:w-80 md:text-right [&_form]:md:items-end [&_details]:md:text-left">
              <ClubVerificationControl clubId={club.id} verified={club.verified} pandalCount={club.pandals.length} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
