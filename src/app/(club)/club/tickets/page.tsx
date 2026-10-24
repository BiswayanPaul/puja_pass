import type { Metadata } from "next";
import { Suspense } from "react";
import { ClubAccessNotice, ClubPageSkeleton } from "@/features/club/components/club-access-notice";
import { TicketsManager } from "@/features/club/components/tickets-manager";
import { requireClubAccess } from "@/server/auth/session";
import { getClubSlots, getClubTiers } from "@/server/club";

export const metadata: Metadata = { title: "Tickets & slots", robots: { index: false } };

export default function ClubTicketsPage() {
  return (
    <Suspense fallback={<ClubPageSkeleton />}>
      <Tickets />
    </Suspense>
  );
}

async function Tickets() {
  const access = await requireClubAccess(["OWNER", "ADMIN"], "/club/tickets");
  if (!access.ok) return <ClubAccessNotice reason={access.reason} />;
  if (!access.pandalId) return <ClubAccessNotice reason="no-pandal" />;
  const [tiers, slots] = await Promise.all([getClubTiers(access.pandalId), getClubSlots(access.pandalId)]);
  return <TicketsManager pandalId={access.pandalId} tiers={tiers} slots={slots} />;
}
