import type { Booking, PassStatus } from "@/types";

// Bookings belonging to the demo visitor (see `users.ts`). Only the seed
// reads this file; the app reads bookings from the database.

type SeedPass = {
  id: string;
  code: string;
  pandalId: string;
  tierId: string;
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  holderName: string;
  quantity: number;
  unitPrice: number;
  status: PassStatus;
  checkedInAt?: string;
};

type SeedBooking = Omit<Booking, "passes" | "status"> & { status: "confirmed" | "completed" | "cancelled"; passes: SeedPass[] };

export const bookings: SeedBooking[] = [
  {
    id: "PP26-4K7Q2M",
    createdAt: "2026-09-20T11:24:00+05:30",
    status: "confirmed",
    contact: { name: "Riya Banerjee", email: "riya@example.com", phone: "+91 98300 12345" },
    paymentMethod: "UPI",
    passes: [
      { id: "pass-1", code: "SRB-2930-8841", pandalId: "sreebhumi-sporting-club", tierId: "sreebhumi-general", slotId: "sreebhumi-sporting-club_2026-09-30_1800", date: "2026-09-30", startTime: "18:00", endTime: "19:00", holderName: "Riya Banerjee", quantity: 3, unitPrice: 99, status: "valid" },
      { id: "pass-2", code: "BDT-2930-1207", pandalId: "badamtala-ashar-sangha", tierId: "badamtala-artist", slotId: "badamtala-ashar-sangha_2026-09-30_2000", date: "2026-09-30", startTime: "20:00", endTime: "21:00", holderName: "Riya Banerjee", quantity: 2, unitPrice: 249, status: "valid" },
    ],
    subtotal: 795,
    fees: 75,
    total: 870,
  },
  {
    id: "PP26-9B3X1L",
    createdAt: "2026-09-22T19:02:00+05:30",
    status: "confirmed",
    contact: { name: "Riya Banerjee", email: "riya@example.com", phone: "+91 98300 12345" },
    paymentMethod: "Card",
    passes: [
      { id: "pass-3", code: "SRC-0110-5532", pandalId: "suruchi-sangha", tierId: "suruchi-craft", slotId: "suruchi-sangha_2026-10-01_1600", date: "2026-10-01", startTime: "16:00", endTime: "17:00", holderName: "Riya Banerjee", quantity: 2, unitPrice: 229, status: "valid" },
    ],
    subtotal: 458,
    fees: 30,
    total: 488,
  },
  {
    id: "PP26-2H8D5P",
    createdAt: "2026-09-15T09:40:00+05:30",
    status: "completed",
    contact: { name: "Riya Banerjee", email: "riya@example.com", phone: "+91 98300 12345" },
    paymentMethod: "UPI",
    passes: [
      { id: "pass-4", code: "DSP-2809-3310", pandalId: "deshapriya-park", tierId: "deshapriya-family", slotId: "deshapriya-park_2026-09-28_1800", date: "2026-09-28", startTime: "18:00", endTime: "19:00", holderName: "Riya Banerjee", quantity: 1, unitPrice: 349, status: "used", checkedInAt: "2026-09-28T18:12:00+05:30" },
      { id: "pass-5", code: "SNT-2809-7741", pandalId: "santosh-mitra-square", tierId: "santosh-gallery", slotId: "santosh-mitra-square_2026-09-28_2000", date: "2026-09-28", startTime: "20:00", endTime: "21:00", holderName: "Riya Banerjee", quantity: 4, unitPrice: 149, status: "used", checkedInAt: "2026-09-28T20:05:00+05:30" },
    ],
    subtotal: 945,
    fees: 75,
    total: 1020,
  },
  {
    id: "PP26-7C1N4R",
    createdAt: "2026-09-10T14:15:00+05:30",
    status: "cancelled",
    contact: { name: "Riya Banerjee", email: "riya@example.com", phone: "+91 98300 12345" },
    paymentMethod: "Net Banking",
    passes: [
      { id: "pass-6", code: "TRD-2909-6620", pandalId: "tridhara-sammilani", tierId: "tridhara-general", slotId: "tridhara-sammilani_2026-09-29_1200", date: "2026-09-29", startTime: "12:00", endTime: "13:00", holderName: "Riya Banerjee", quantity: 2, unitPrice: 69, status: "cancelled" },
    ],
    subtotal: 138,
    fees: 30,
    total: 168,
  },
];
