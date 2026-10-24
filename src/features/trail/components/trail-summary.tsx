import type { ReactNode } from "react";
import { CONVENIENCE_FEE_PER_PASS } from "@/data/festival";
import { formatINR, formatPujaDate, formatTime } from "@/lib/format";
import { useFestivalDays } from "@/features/festival/festival-context";
import type { useTrail } from "../use-trail";

export function TrailSummary({ trail, children }: { trail: ReturnType<typeof useTrail>; children?: ReactNode }) {
  const days = useFestivalDays();
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="font-serif text-2xl font-semibold text-stone-950">Trail summary</h2>
      <ul className="mt-4 space-y-3 border-b border-stone-200 pb-4 text-sm">
        {trail.lines.map((line) => (
          <li key={line.id} className="flex justify-between gap-3">
            <span className="min-w-0">
              <span className="block truncate font-medium text-stone-900">{line.pandalName}</span>
              <span className="block text-xs text-stone-500">
                {formatPujaDate(line.date, days)} · {formatTime(line.startTime)} · {line.quantity} × {line.tierName}
              </span>
            </span>
            <span className="shrink-0 font-medium text-stone-900">{formatINR(line.lineTotal)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between text-stone-600">
          <dt>Subtotal ({trail.passCount} {trail.passCount === 1 ? "pass" : "passes"})</dt>
          <dd>{formatINR(trail.subtotal)}</dd>
        </div>
        <div className="flex justify-between text-stone-600">
          <dt>Convenience fee ({formatINR(CONVENIENCE_FEE_PER_PASS)}/pass)</dt>
          <dd>{formatINR(trail.fees)}</dd>
        </div>
        <div className="flex justify-between border-t border-stone-200 pt-3 text-base font-semibold text-stone-950">
          <dt>Total</dt>
          <dd>{formatINR(trail.total)}</dd>
        </div>
      </dl>
      {children}
    </section>
  );
}
