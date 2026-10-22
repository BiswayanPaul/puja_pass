"use client";

import { BadgeCheck, ShieldOff } from "lucide-react";
import { Field, Textarea } from "@/components/ui/field";
import { restoreClubVerification, revokeClubVerification } from "@/features/admin/actions";
import { ActionForm } from "./action-form";

export function ClubVerificationControl({ clubId, verified, pandalCount }: { clubId: string; verified: boolean; pandalCount: number }) {
  if (!verified) {
    return (
      <ActionForm action={restoreClubVerification} hidden={{ clubId }} variant="success" submitLabel={<><BadgeCheck className="size-4" aria-hidden="true" /> Verify again</>} />
    );
  }

  return (
    <details className="group">
      <summary className="inline-flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 [&::-webkit-details-marker]:hidden">
        <ShieldOff className="size-4" aria-hidden="true" /> Revoke verification
      </summary>
      <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50/50 p-4">
        <p className="text-sm text-rose-900">
          {pandalCount > 0
            ? `${pandalCount === 1 ? "Its pandal is" : `All ${pandalCount} pandals are`} hidden from visitors straight away. Existing bookings are not cancelled.`
            : "The club can't publish a pandal until it is verified again."}
        </p>
        <ActionForm action={revokeClubVerification} hidden={{ clubId }} variant="danger" submitLabel="Confirm revoke" className="mt-3">
          <Field label="Reason (visible to admins)">
            <Textarea name="note" required minLength={10} maxLength={1000} className="min-h-16 bg-white" placeholder="e.g. Fire-safety NOC expired on 15 Oct." />
          </Field>
        </ActionForm>
      </div>
    </details>
  );
}
