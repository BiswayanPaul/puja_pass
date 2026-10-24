"use client";

import { createContext, use, type ReactNode } from "react";
import type { PujaDay } from "@/types";

// Festival days for client components, provided once by the root layout from
// the database (see src/server/festival.ts).

const FestivalContext = createContext<PujaDay[]>([]);

export function FestivalProvider({ days, children }: { days: PujaDay[]; children: ReactNode }) {
  return <FestivalContext value={days}>{children}</FestivalContext>;
}

export function useFestivalDays() {
  return use(FestivalContext);
}
