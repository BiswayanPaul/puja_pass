import type { Metadata } from "next";
import { Suspense } from "react";
import { ClubAccessNotice, ClubPageSkeleton } from "@/features/club/components/club-access-notice";
import { EntryScanner } from "@/features/club/components/entry-scanner";
import { requireClubAccess } from "@/server/auth/session";
import { getRecentCheckIns } from "@/server/club-stats";

export const metadata: Metadata = { title: "Entry scanner", robots: { index: false } };

export default function ClubScannerPage() {
  return (
    <Suspense fallback={<ClubPageSkeleton />}>
      <Scanner />
    </Suspense>
  );
}

async function Scanner() {
  const access = await requireClubAccess(["OWNER", "ADMIN", "SCANNER"], "/club/scanner");
  if (!access.ok) return <ClubAccessNotice reason={access.reason} />;
  if (!access.pandalId) return <ClubAccessNotice reason="no-pandal" />;
  return <EntryScanner initialLog={await getRecentCheckIns(access.pandalId, 30)} />;
}
