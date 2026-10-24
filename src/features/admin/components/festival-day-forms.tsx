"use client";

import { Field, Input } from "@/components/ui/field";
import { removeFestivalDay, saveFestivalDay } from "@/features/admin/actions";
import { ActionForm } from "./action-form";

const dayNames = ["Mahalaya", "Panchami", "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami"];

export function FestivalDayForm() {
  return (
    <ActionForm action={saveFestivalDay} hidden={{}} submitLabel="Save day" className="mt-4">
      <Field label="Date">
        <Input name="date" type="date" required />
      </Field>
      <Field label="Name" hint="e.g. Ashtami">
        <Input name="label" required minLength={2} maxLength={30} list="festival-day-names" />
        <datalist id="festival-day-names">
          {dayNames.map((name) => <option key={name} value={name} />)}
        </datalist>
      </Field>
    </ActionForm>
  );
}

export function RemoveFestivalDay({ date, label }: { date: string; label: string }) {
  return <ActionForm action={removeFestivalDay} hidden={{ date }} variant="danger" submitLabel={`Remove ${label}`} className="sm:items-end" />;
}
