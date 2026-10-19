import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CLUB_PANDAL_ID } from "@/data/club";
import { PandalProfileForm } from "@/features/club/components/pandal-profile-form";
import { getPandalBySlug } from "@/server/pandals";

export const metadata: Metadata = { title: "Pandal profile", robots: { index: false } };

export default async function ClubPandalPage() {
  const pandal = await getPandalBySlug(CLUB_PANDAL_ID);
  if (!pandal) notFound();
  return <PandalProfileForm pandal={pandal} />;
}
