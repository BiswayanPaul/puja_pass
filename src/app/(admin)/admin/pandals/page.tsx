import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { CircleDashed, Eye, ShieldOff, Star, TriangleAlert } from "lucide-react";
import { AdminPage, AdminPageHeader, AdminSkeleton, Pill } from "@/features/admin/components/admin-ui";
import { PandalControls } from "@/features/admin/components/pandal-controls";
import { getAdminPandals } from "@/server/admin";
import { requirePlatformAdmin } from "@/server/auth/session";
import type { AdminPandalStatus } from "@/types";

export const metadata: Metadata = { title: "Pandals" };

const statusPill: Record<AdminPandalStatus, { label: string; tone: "success" | "neutral" | "danger"; icon: typeof Eye }> = {
  live: { label: "Live", tone: "success", icon: Eye },
  draft: { label: "Draft", tone: "neutral", icon: CircleDashed },
  blocked: { label: "Club not verified", tone: "danger", icon: ShieldOff },
};

export default function PandalsPage() {
  return (
    <AdminPage>
      <AdminPageHeader
        title="Pandals"
        description="Publish drafts once their profile is complete, and choose which live pandals are featured on the home page."
      />
      <Suspense fallback={<AdminSkeleton rows={6} />}>
        <Pandals />
      </Suspense>
    </AdminPage>
  );
}

async function Pandals() {
  await connection();
  await requirePlatformAdmin();
  const pandals = await getAdminPandals();

  return (
    <ul className="space-y-3">
      {pandals.map((pandal) => {
        const status = statusPill[pandal.status];
        return (
          <li key={pandal.id} className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              <div className="flex min-w-0 flex-1 gap-4">
                <Image src={pandal.imageSrc} alt={pandal.imageAlt} width={96} height={72} className="hidden h-18 w-24 shrink-0 rounded-lg object-cover sm:block" />
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    {pandal.status === "live" ? (
                      <Link href={`/pandals/${pandal.slug}`} className="font-semibold text-stone-950 hover:text-orange-700">{pandal.name}</Link>
                    ) : (
                      <h2 className="font-semibold text-stone-950">{pandal.name}</h2>
                    )}
                    <Pill tone={status.tone} icon={status.icon}>{status.label}</Pill>
                    {pandal.featured && <Pill tone="accent" icon={Star}>Featured</Pill>}
                  </div>
                  <p className="text-sm text-stone-600">
                    {pandal.clubName} · {pandal.area}
                  </p>
                  <p className="text-xs text-stone-500">
                    {pandal.activeTierCount} active pass {pandal.activeTierCount === 1 ? "type" : "types"} · {pandal.slotCount} slots
                    {pandal.activeTierCount === 0 && " · free entry only"}
                  </p>
                  {pandal.profileGaps.length > 0 && pandal.status !== "live" && (
                    <p className="flex items-start gap-1.5 text-sm text-amber-800">
                      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      Missing before publishing: {pandal.profileGaps.join(", ").toLowerCase()}
                    </p>
                  )}
                </div>
              </div>
              <div className="shrink-0 md:max-w-72">
                <PandalControls pandalId={pandal.id} status={pandal.status} featured={pandal.featured} hasProfileGaps={pandal.profileGaps.length > 0} />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
