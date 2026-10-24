"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSavedPandals } from "../use-saved-pandals";

/** The heart on pandal cards ("overlay") and pandal pages ("pill"). */
export function SavePandalButton({ pandalId, pandalName, variant = "overlay", className }: { pandalId: string; pandalName: string; variant?: "overlay" | "pill"; className?: string }) {
  const { savedIds, toggleSaved, ready } = useSavedPandals();
  const saved = savedIds.includes(pandalId);
  const label = `${saved ? "Remove" : "Save"} ${pandalName}${saved ? " from saved pandals" : ""}`;

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={() => toggleSaved(pandalId)}
        disabled={!ready}
        aria-pressed={saved}
        aria-label={label}
        className={cn(
          "inline-flex min-h-10 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold backdrop-blur transition-colors disabled:opacity-60",
          saved ? "bg-white text-orange-700" : "border border-white/60 bg-white/10 text-white hover:bg-white hover:text-orange-700",
          className,
        )}
      >
        <Heart className={cn("size-4", saved && "fill-current")} aria-hidden="true" />
        {saved ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggleSaved(pandalId)}
      disabled={!ready}
      aria-pressed={saved}
      aria-label={label}
      className={cn(
        "flex size-9 items-center justify-center rounded-full shadow backdrop-blur transition-colors",
        saved ? "bg-white text-orange-600" : "bg-black/25 text-white hover:bg-white hover:text-orange-600",
        className,
      )}
    >
      <Heart className={cn("size-4", saved && "fill-current")} aria-hidden="true" />
    </button>
  );
}
