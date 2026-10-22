"use client";

import { useActionState, type ReactNode } from "react";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import type { ActionResult } from "@/features/admin/actions";
import { cn } from "@/lib/utils";

const variants = {
  primary: "bg-orange-600 text-white hover:bg-orange-700",
  success: "bg-emerald-600 text-white hover:bg-emerald-700",
  danger: "border border-rose-200 bg-white text-rose-700 hover:bg-rose-50",
  neutral: "border border-stone-300 bg-white text-stone-800 hover:bg-stone-50",
};

type Action = (state: ActionResult | null, formData: FormData) => Promise<ActionResult>;

/** A form bound to an admin Server Action, with pending state and the result message. */
export function ActionForm({
  action,
  hidden,
  submitLabel,
  variant = "primary",
  disabled,
  className,
  children,
}: {
  action: Action;
  hidden: Record<string, string>;
  submitLabel: ReactNode;
  variant?: keyof typeof variants;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form action={formAction} className={cn("space-y-3", className)}>
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {children}
      <button
        type="submit"
        disabled={pending || disabled}
        className={cn(
          "inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
          variants[variant],
        )}
      >
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {submitLabel}
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

export function ActionMessage({ state }: { state: ActionResult | null }) {
  if (!state) return null;
  return state.ok ? (
    <p role="status" className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
      <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {state.message}
    </p>
  ) : (
    <p role="alert" className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {state.error}
    </p>
  );
}
