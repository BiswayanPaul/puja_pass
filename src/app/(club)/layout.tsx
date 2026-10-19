import { CLUB_PANDAL_ID } from "@/data/club";
import { ClubShell } from "@/features/club/components/club-shell";
import { getPandalBySlug } from "@/server/pandals";

export default async function ClubLayout({ children }: { children: React.ReactNode }) {
  // TODO: resolve the signed-in admin's pandal once real auth exists.
  const pandal = await getPandalBySlug(CLUB_PANDAL_ID);
  return (
    <ClubShell pandal={pandal && { name: pandal.name, clubName: pandal.clubName, slug: pandal.slug }}>
      {children}
    </ClubShell>
  );
}
