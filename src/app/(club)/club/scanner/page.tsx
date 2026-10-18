import type { Metadata } from "next";
import { EntryScanner } from "@/features/club/components/entry-scanner";

export const metadata: Metadata = { title: "Entry scanner", robots: { index: false } };

export default function ClubScannerPage() {
  return <EntryScanner />;
}
