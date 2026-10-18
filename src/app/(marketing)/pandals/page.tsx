import { Suspense } from "react";
import { PandalExplorer } from "@/features/pandals/components/pandal-explorer";

export default function PandalsPage() {
  return <Suspense fallback={<div className="min-h-dvh bg-stone-50" />}><PandalExplorer /></Suspense>;
}
