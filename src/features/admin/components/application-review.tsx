"use client";

import { Check, X } from "lucide-react";
import { Checkbox, Field, Textarea } from "@/components/ui/field";
import { approveApplication, rejectApplication } from "@/features/admin/actions";
import { ActionForm } from "./action-form";

/** Approve / reject panel for a pending application. The server re-checks every rule. */
export function ApplicationReview({
  applicationId,
  missingDocuments,
  duplicateOfClub,
}: {
  applicationId: string;
  missingDocuments: string[];
  duplicateOfClub: string | null;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-stone-950">Approve</h3>
        <p className="mt-1 text-sm text-stone-600">
          Creates a verified club, makes the applicant its owner and adds a draft pandal. Nothing goes public until the pandal is published.
        </p>
        {duplicateOfClub ? (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
            Can&apos;t approve: <span className="font-semibold">{duplicateOfClub}</span> already uses this registration number. Reject this application, or contact the club if it is a re-registration.
          </p>
        ) : (
          <ActionForm action={approveApplication} hidden={{ applicationId }} submitLabel={<><Check className="size-4" aria-hidden="true" /> Approve club</>} variant="success" className="mt-3">
            <Field label="Note (optional)">
              <Textarea name="notes" maxLength={1000} className="min-h-16" placeholder="Anything worth recording about this approval" />
            </Field>
            {missingDocuments.length > 0 && (
              <Checkbox
                name="documentsOverride"
                required
                className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900"
                label={<>Missing: {missingDocuments.join(" and ")}. I have verified {missingDocuments.length > 1 ? "them" : "it"} another way.</>}
              />
            )}
          </ActionForm>
        )}
      </div>

      <div className="border-t border-stone-100 pt-5">
        <h3 className="font-semibold text-stone-950">Reject</h3>
        <p className="mt-1 text-sm text-stone-600">The reason is shared with the club. They can apply again.</p>
        <ActionForm action={rejectApplication} hidden={{ applicationId }} submitLabel={<><X className="size-4" aria-hidden="true" /> Reject application</>} variant="danger" className="mt-3">
          <Field label="Reason">
            <Textarea name="notes" required minLength={10} maxLength={1000} className="min-h-20" placeholder="e.g. The police permission letter is for last year. Please apply with this year's letter." />
          </Field>
        </ActionForm>
      </div>
    </div>
  );
}
