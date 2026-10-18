import { pujaDays } from "@/data/festival";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });

export function formatINR(amount: number) {
  return inr.format(amount);
}

export function formatCompact(value: number) {
  return compact.format(value);
}

/** "18:00" -> "6:00 PM" */
export function formatTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function formatTimeRange(start: string, end: string) {
  return `${formatTime(start)} – ${formatTime(end)}`;
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-09-30" -> "30 Sep 2026" (parsed manually to avoid timezone shifts). */
export function formatDate(date: string, { withYear = true } = {}) {
  const [year, month, day] = date.slice(0, 10).split("-").map(Number);
  return `${day} ${months[month - 1]}${withYear ? ` ${year}` : ""}`;
}

/** "2026-09-30" -> "Ashtami · 30 Sep" */
export function formatPujaDate(date: string) {
  const day = pujaDays.find((item) => item.date === date);
  return day ? `${day.label} · ${formatDate(date, { withYear: false })}` : formatDate(date);
}
