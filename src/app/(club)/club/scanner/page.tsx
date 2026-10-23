import type { Metadata } from "next";
import { Suspense } from "react";
import { ClubAccessNotice, ClubPageSkeleton } from "@/features/club/components/club-access-notice";
import { EntryScanner } from "@/features/club/components/entry-scanner";
import { requireClubAccess } from "@/server/auth/session";

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
  // TODO: the scanner still checks sample passes (src/data/club.ts); wire it to verifyPassToken and check-in.
  return <EntryScanner />;
}
