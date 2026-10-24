"use client";

import { useEffect, useState } from "react";
import { Ticket } from "lucide-react";
import { formatINR } from "@/lib/format";

/**
 * Below the lg breakpoint the booking panel sits after the whole pandal page,
 * so this bar keeps it one tap away. It hides while the panel is on screen.
 */
export function MobileBookBar({ fromPrice, targetId }: { fromPrice: number; targetId: string }) {
  const [panelVisible, setPanelVisible] = useState(false);

  useEffect(() => {
    const panel = document.getElementById(targetId);
    if (!panel) return;
    const observer = new IntersectionObserver(([entry]) => setPanelVisible(entry.isIntersecting), { rootMargin: "0px 0px -20% 0px" });
    observer.observe(panel);
    return () => observer.disconnect();
  }, [targetId]);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur transition-transform lg:hidden ${panelVisible ? "translate-y-full" : "translate-y-0"}`}
      aria-hidden={panelVisible}
    >
      <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
        <p className="text-sm text-stone-600">
          Timed passes from <span className="font-serif text-lg font-semibold text-stone-950">{formatINR(fromPrice)}</span>
        </p>
        <a href={`#${targetId}`} tabIndex={panelVisible ? -1 : undefined} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-orange-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-700">
          <Ticket className="size-4" aria-hidden="true" /> Book passes
        </a>
      </div>
    </div>
  );
}
