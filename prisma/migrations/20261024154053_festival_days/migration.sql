-- CreateTable
CREATE TABLE "FestivalDay" (
    "date" DATE NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "FestivalDay_pkey" PRIMARY KEY ("date")
);

-- Match the other tables: no access through Supabase's public API roles.
ALTER TABLE "FestivalDay" ENABLE ROW LEVEL SECURITY;

-- The 2026 season, which existing slots and bookings use. Admins update the
-- days for the next season in /admin/festival.
INSERT INTO "FestivalDay" ("date", "label") VALUES
  ('2026-09-28', 'Shashthi'),
  ('2026-09-29', 'Saptami'),
  ('2026-09-30', 'Ashtami'),
  ('2026-10-01', 'Navami'),
  ('2026-10-02', 'Dashami');
