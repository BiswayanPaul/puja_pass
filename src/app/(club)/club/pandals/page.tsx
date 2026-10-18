import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CLUB_PANDAL_ID } from "@/data/club";
import { PandalProfileForm } from "@/features/club/components/pandal-profile-form";
import { getPandalById } from "@/lib/queries";

export const metadata: Metadata = { title: "Pandal profile", robots: { index: false } };

export default function ClubPandalPage() {
  const pandal = getPandalById(CLUB_PANDAL_ID);
  if (!pandal) notFound();
  return <PandalProfileForm pandal={pandal} />;
}
