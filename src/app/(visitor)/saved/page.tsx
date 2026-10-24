import type { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import { SavedPandalsList } from "@/features/pandals/components/saved-pandals-list";
import { getPandals } from "@/server/pandals";

export const metadata: Metadata = { title: "Saved pandals", robots: { index: false } };

// The list of pandals is public and cached; which ones are saved is decided in
// the browser (account saves for signed-in visitors, this device's otherwise).
export default async function SavedPandalsPage() {
  const pandals = await getPandals();
  return (
    <>
      <PageHeader eyebrow="SAVED PANDALS" title="Your shortlist" description="Pandals you've hearted, ready to add to your Puja trail." />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <SavedPandalsList pandals={pandals} />
      </div>
    </>
  );
}
