import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CLUB_PANDAL_ID } from "@/data/club";
import { TicketsManager } from "@/features/club/components/tickets-manager";
import { getPandalBySlug, getSlotsForPandal, getTiersForPandal } from "@/server/pandals";

export const metadata: Metadata = { title: "Tickets & slots", robots: { index: false } };

export default async function ClubTicketsPage() {
  const pandal = await getPandalBySlug(CLUB_PANDAL_ID);
  if (!pandal) notFound();
  const [tiers, slots] = await Promise.all([getTiersForPandal(pandal.id), getSlotsForPandal(pandal.id)]);
  return <TicketsManager initialTiers={tiers} initialSlots={slots} />;
}
