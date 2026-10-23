import type { Metadata } from "next";
import { Suspense } from "react";
import { ClubAccessNotice, ClubPageSkeleton } from "@/features/club/components/club-access-notice";
import { PandalProfileForm } from "@/features/club/components/pandal-profile-form";
import { requireClubAccess } from "@/server/auth/session";
import { getClubPandal } from "@/server/club";

export const metadata: Metadata = { title: "Pandal profile", robots: { index: false } };

export default function ClubPandalPage() {
  return (
    <Suspense fallback={<ClubPageSkeleton />}>
      <PandalProfile />
    </Suspense>
  );
}

async function PandalProfile() {
  const access = await requireClubAccess(["OWNER", "ADMIN"], "/club/pandals");
  if (!access.ok) return <ClubAccessNotice reason={access.reason} />;
  const pandal = access.pandalId ? await getClubPandal(access.pandalId) : null;
  if (!pandal) return <ClubAccessNotice reason="no-pandal" />;
  return <PandalProfileForm pandal={pandal} />;
}
