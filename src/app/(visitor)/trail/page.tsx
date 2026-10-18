import type { Metadata } from "next";
import PageHeader from "@/components/shared/PageHeader";
import { TrailView } from "@/features/trail/components/trail-view";

export const metadata: Metadata = {
  title: "My Puja Trail",
  description: "Plan your multi-pandal Durga Puja trail and check out all your passes at once.",
};

export default function TrailPage() {
  return (
    <>
      <PageHeader
        eyebrow="YOUR PUJA TRAIL"
        title="Plan your pandal hopping"
        description="Every slot you add lands here, ordered by day and time. Review your plan, then check out once for all your QR passes."
      />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <TrailView />
      </div>
    </>
  );
}
