"use client";

import { CalendarDays, MapPin, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { FESTIVAL_END, FESTIVAL_START } from "@/data/festival";

export default function HeroSearch() {
  const router = useRouter();
  const [area, setArea] = useState("");
  const [date, setDate] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (area.trim()) params.set("q", area.trim());
    if (date) params.set("date", date);
    router.push(`/pandals${params.size ? `?${params.toString()}` : ""}`);
  }

  return (
    <form onSubmit={handleSubmit} className="absolute inset-x-4 bottom-6 mx-auto grid max-w-4xl overflow-hidden rounded-2xl border border-white/20 bg-stone-950/85 shadow-2xl backdrop-blur sm:grid-cols-[1fr_1fr_auto] sm:inset-x-6 lg:inset-x-8" aria-label="Find pandals">
      <label className="flex items-center gap-3 border-b border-white/15 p-4 sm:border-b-0 sm:border-r"><MapPin className="size-5 shrink-0 text-orange-400" aria-hidden="true" /><span className="flex min-w-0 flex-1 flex-col text-left"><span className="text-xs font-semibold">Area or neighbourhood</span><input value={area} onChange={(event) => setArea(event.target.value)} className="mt-1 w-full bg-transparent text-sm text-white outline-none placeholder:text-stone-300" placeholder="e.g. Salt Lake, North Kolkata" /></span></label>
      <label className="flex items-center gap-3 border-b border-white/15 p-4 sm:border-b-0 sm:border-r"><CalendarDays className="size-5 shrink-0 text-orange-400" aria-hidden="true" /><span className="flex min-w-0 flex-1 flex-col text-left"><span className="text-xs font-semibold">Date</span><input type="date" min={FESTIVAL_START} max={FESTIVAL_END} value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 w-full bg-transparent text-sm text-stone-100 [color-scheme:dark] outline-none" /></span></label>
      <button type="submit" className="m-2 inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-700"><Search className="size-4" aria-hidden="true" />Find Pandals</button>
    </form>
  );
}
