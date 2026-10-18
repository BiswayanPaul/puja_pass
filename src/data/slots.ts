import type { Slot } from "@/types";
import { pujaDays, slotTimes } from "./festival";
import { ticketTiers } from "./ticket-tiers";

/** Small deterministic hash so the fake availability is stable between renders. */
function seeded(input: string) {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

const pandalIds = [...new Set(ticketTiers.map((tier) => tier.pandalId))];

export const slots: Slot[] = pandalIds.flatMap((pandalId) => {
  const capacity = ticketTiers
    .filter((tier) => tier.pandalId === pandalId && tier.active)
    .reduce((total, tier) => total + tier.capacityPerSlot, 0);

  return pujaDays.flatMap(({ date }, dayIndex) =>
    slotTimes.map(([startTime, endTime]) => {
      const id = `${pandalId}_${date}_${startTime.replace(":", "")}`;
      // Evenings and Ashtami/Navami fill up faster.
      const pressure = (startTime >= "18:00" ? 0.35 : 0) + (dayIndex === 2 || dayIndex === 3 ? 0.2 : 0);
      const fill = Math.min(1, seeded(id) * 0.7 + pressure);
      return { id, pandalId, date, startTime, endTime, capacity, booked: Math.round(capacity * fill) };
    }),
  );
});
