import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BookingStatus, PassStatus } from "@/types";

const styles = {
  confirmed: { label: "Confirmed", icon: CheckCircle2, className: "bg-emerald-50 text-emerald-700" },
  valid: { label: "Valid", icon: CheckCircle2, className: "bg-emerald-50 text-emerald-700" },
  completed: { label: "Completed", icon: Clock3, className: "bg-stone-100 text-stone-700" },
  used: { label: "Checked in", icon: Clock3, className: "bg-stone-100 text-stone-700" },
  cancelled: { label: "Cancelled", icon: XCircle, className: "bg-rose-50 text-rose-700" },
} satisfies Record<BookingStatus | PassStatus, unknown>;

export default function StatusBadge({ status, className }: { status: BookingStatus | PassStatus; className?: string }) {
  const { label, icon: Icon, className: tone } = styles[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-sans text-xs font-semibold", tone, className)}>
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
