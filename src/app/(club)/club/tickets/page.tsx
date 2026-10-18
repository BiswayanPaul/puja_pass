import type { Metadata } from "next";
import { CLUB_PANDAL_ID } from "@/data/club";
import { TicketsManager } from "@/features/club/components/tickets-manager";
import { getSlotsForPandal, getTiersForPandal } from "@/lib/queries";

export const metadata: Metadata = { title: "Tickets & slots", robots: { index: false } };

export default function ClubTicketsPage() {
  return <TicketsManager initialTiers={getTiersForPandal(CLUB_PANDAL_ID)} initialSlots={getSlotsForPandal(CLUB_PANDAL_ID)} />;
}
