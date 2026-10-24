import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { AdminPage, AdminPageHeader, AdminSkeleton, Card, CardTitle } from "@/features/admin/components/admin-ui";
import { FestivalDayForm, RemoveFestivalDay } from "@/features/admin/components/festival-day-forms";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requirePlatformAdmin } from "@/server/auth/session";

export const metadata: Metadata = { title: "Festival days" };

export default function FestivalPage() {
  return (
    <AdminPage>
      <AdminPageHeader
        title="Festival days"
        description="The days of this year's Puja. Clubs can only add entry windows on these days, and visitors only see these days when booking."
      />
      <Suspense fallback={<AdminSkeleton rows={3} />}>
        <FestivalDays />
      </Suspense>
    </AdminPage>
  );
}

async function FestivalDays() {
  await connection();
  await requirePlatformAdmin();
  // Uncached here, so a change shows straight away.
  const [days, windows] = await Promise.all([
    prisma.festivalDay.findMany({ orderBy: { date: "asc" } }),
    prisma.slot.groupBy({ by: ["date"], _count: true }),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
      <Card>
        <CardTitle>This season</CardTitle>
        {days.length ? (
          <ul className="mt-4 divide-y divide-stone-100">
            {days.map((day) => {
              const date = day.date.toISOString().slice(0, 10);
              const count = windows.find((group) => group.date.getTime() === day.date.getTime())?._count ?? 0;
              return (
                <li key={date} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-stone-900">{day.label}</p>
                    <p className="text-sm text-stone-500">
                      {formatDate(date)} · {count} entry {count === 1 ? "window" : "windows"} across all pandals
                    </p>
                  </div>
                  <RemoveFestivalDay date={date} label={day.label} />
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-stone-600">No festival days yet. Visitors can&apos;t book until you add them.</p>
        )}
      </Card>
      <Card className="h-fit">
        <CardTitle>Add or rename a day</CardTitle>
        <p className="mt-1 text-sm text-stone-600">Saving an existing date renames it.</p>
        <FestivalDayForm />
      </Card>
    </div>
  );
}
