import { formatCompact, formatDate, formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DailySales } from "@/types";

/** Single-series column chart of tickets sold per festival day, with hover tooltips and a table for screen readers. */
export function SalesChart({
  data,
  highlightDate,
}: {
  data: DailySales[];
  highlightDate?: string;
}) {
  const max = Math.max(...data.map((day) => day.tickets));
  const ceiling = Math.ceil(max / 2000) * 2000;
  const ticks = [ceiling, ceiling / 2, 0];

  return (
    <figure>
      <div
        className="relative grid h-56 grid-cols-[2.5rem_1fr] gap-2"
        aria-hidden="true"
      >
        <div className="flex flex-col justify-between text-right text-[11px] text-stone-400">
          {ticks.map((tick) => (
            <span
              key={tick}
              className="-translate-y-1/2 first:translate-y-0 last:translate-y-0"
            >
              {formatCompact(tick)}
            </span>
          ))}
        </div>
        <div className="relative">
          {ticks.map((tick, index) => (
            <span
              key={tick}
              className="absolute inset-x-0 border-t border-stone-200"
              style={{ top: `${(index / (ticks.length - 1)) * 100}%` }}
            />
          ))}
          <div className="absolute inset-0 flex items-end justify-around gap-3 px-2">
            {data.map((day, index) => (
              <div
                key={day.date}
                className="group relative flex h-full w-full max-w-14 items-end justify-center"
              >
                <div
                  className={
                    day.date === highlightDate
                      ? "w-full rounded-t-lg bg-orange-600"
                      : "w-full rounded-t-lg bg-orange-300 transition-colors group-hover:bg-orange-500"
                  }
                  style={{ height: `${(day.tickets / ceiling) * 100}%` }}
                />
                {/* The last tooltip opens leftwards so it never pokes past the card on narrow screens. */}
                <div
                  className={cn(
                    "pointer-events-none absolute bottom-full z-10 mb-2 w-36 rounded-lg bg-stone-950 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100",
                    index === data.length - 1
                      ? "right-0"
                      : "left-1/2 -translate-x-1/2",
                  )}
                >
                  <p className="font-semibold">
                    {day.label} · {formatDate(day.date, { withYear: false })}
                  </p>
                  <p className="mt-1 text-stone-300">
                    {day.tickets.toLocaleString("en-IN")} tickets
                  </p>
                  <p className="text-stone-300">{formatINR(day.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div
        className="ml-12 mt-2 flex justify-around gap-3 px-2 text-center text-xs text-stone-500"
        aria-hidden="true"
      >
        {/* Full day names don't fit five across on phones, so show "Sha", "Sap"… there. */}
        {data.map((day) => (
          <span key={day.date} className="w-full min-w-0 max-w-14">
            <span className="sm:hidden">{day.label.slice(0, 3)}</span>
            <span className="hidden sm:inline">{day.label}</span>
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Tickets sold per festival day</caption>
        <thead>
          <tr>
            <th>Day</th>
            <th>Tickets</th>
            <th>Revenue</th>
          </tr>
        </thead>
        <tbody>
          {data.map((day) => (
            <tr key={day.date}>
              <td>{day.label}</td>
              <td>{day.tickets}</td>
              <td>{formatINR(day.revenue)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
