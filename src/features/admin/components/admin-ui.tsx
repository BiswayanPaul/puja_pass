import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Presentational pieces shared by the admin pages.

export function AdminPage({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</div>;
}

export function AdminPageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">{title}</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-stone-600">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const tones = {
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-800",
  danger: "bg-rose-50 text-rose-700",
  neutral: "bg-stone-100 text-stone-700",
  accent: "bg-orange-50 text-orange-700",
};

export type Tone = keyof typeof tones;

/** Status pill: always an icon plus a label, never colour alone. */
export function Pill({ tone, icon: Icon, children, className }: { tone: Tone; icon: LucideIcon; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap", tones[tone], className)}>
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      {children}
    </span>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn("min-w-0 rounded-2xl border border-stone-200 bg-white p-5", className)}>{children}</section>;
}

export function CardTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-serif text-xl font-semibold text-stone-950">{children}</h2>
      {action}
    </div>
  );
}

/** Loading placeholder for the streamed part of an admin page. */
export function AdminSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-20 animate-pulse rounded-2xl bg-stone-200/70" />
      ))}
    </div>
  );
}
