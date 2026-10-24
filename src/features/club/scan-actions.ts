"use server";

import type { CheckInResult } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { displayName } from "@/lib/users";
import { requireClubAccess } from "@/server/auth/session";
import { verifyPassToken } from "@/server/booking-links";
import { getRecentCheckIns } from "@/server/club-stats";
import type { CheckIn } from "@/types";

// Gate check-in. verifyScan() reads a QR code (or a typed pass code) and says
// whether the pass may enter; admitPass() then marks it used. Every scan that
// doesn't end in admission, and every admission, is logged in CheckIn.

/** How the pass's entry window relates to now (India time). */
export type PassTiming = "on-time" | "early" | "late" | "other-day";

export type ScannedPass = {
  id: string;
  code: string;
  holderName: string;
  quantity: number;
  tierName: string;
  date: string;
  startTime: string;
  endTime: string;
};

export type ScanResult =
  | { kind: "valid"; pass: ScannedPass; timing: PassTiming }
  | { kind: "duplicate"; pass: ScannedPass; checkedInAt: string; log: CheckIn | null }
  | { kind: "invalid"; reason: string; code: string; log: CheckIn | null };

export type AdmitResult =
  | { kind: "admitted"; pass: ScannedPass; log: CheckIn | null }
  | { kind: "duplicate"; pass: ScannedPass; checkedInAt: string; log: CheckIn | null }
  | { kind: "error"; reason: string };

/** Visitors may enter this many minutes before their window starts. */
const EARLY_ENTRY_MINUTES = 15;

const istDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" });
const istTime = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false });

const passInclude = {
  tier: { select: { name: true } },
  booking: { select: { status: true } },
  slot: { select: { pandalId: true, date: true, startTime: true, endTime: true, pandal: { select: { name: true } } } },
} as const;

async function scannerAccess() {
  const access = await requireClubAccess(["OWNER", "ADMIN", "SCANNER"], "/club/scanner");
  return access.ok && access.pandalId ? { pandalId: access.pandalId, userId: access.user.id } : null;
}

/** The pass code in a scanned QR link or a typed code; null if it isn't a genuine PujaPass code. */
function readScan(raw: string): { code: string } | { error: string } {
  const value = raw.trim();
  const link = value.match(/\/p\/([^/?#\s]+)/);
  if (link) {
    const code = verifyPassToken(link[1]);
    return code ? { code } : { error: "This QR code isn't a genuine PujaPass pass." };
  }
  // Typed by staff from the code printed under the QR (when the camera can't read it).
  if (/^[A-Z]{3}-\d{4}-[A-Z0-9]{4}$/i.test(value)) return { code: value.toUpperCase() };
  return { error: "This isn't a PujaPass QR code." };
}

function minutes(time: string) {
  const [hours, mins] = time.split(":").map(Number);
  return hours * 60 + mins;
}

function timingOf(date: string, startTime: string, endTime: string): PassTiming {
  const now = new Date();
  if (istDate.format(now) !== date) return "other-day";
  const current = minutes(istTime.format(now));
  if (current < minutes(startTime) - EARLY_ENTRY_MINUTES) return "early";
  if (current > minutes(endTime)) return "late";
  return "on-time";
}

function toScannedPass(pass: { id: string; code: string; holderName: string; quantity: number; tier: { name: string }; slot: { date: Date; startTime: string; endTime: string } }): ScannedPass {
  return {
    id: pass.id,
    code: pass.code,
    holderName: displayName({ name: pass.holderName }),
    quantity: pass.quantity,
    tierName: pass.tier.name,
    date: pass.slot.date.toISOString().slice(0, 10),
    startTime: pass.slot.startTime,
    endTime: pass.slot.endTime,
  };
}

async function logScan(pandalId: string, scannedById: string, scannedCode: string, result: CheckInResult, passId?: string) {
  await prisma.checkIn.create({ data: { pandalId, scannedById, scannedCode: scannedCode.slice(0, 200), result, passId } });
  // The new row is the latest scan at this pandal.
  return (await getRecentCheckIns(pandalId, 1))[0] ?? null;
}

export async function verifyScan(raw: string): Promise<ScanResult> {
  const access = await scannerAccess();
  if (!access) return { kind: "invalid", reason: "You don't have access to this pandal's scanner.", code: "", log: null };
  const { pandalId, userId } = access;

  const read = readScan(raw);
  if ("error" in read) return { kind: "invalid", reason: read.error, code: "", log: await logScan(pandalId, userId, raw, "INVALID") };

  const pass = await prisma.pass.findUnique({ where: { code: read.code }, include: passInclude });
  const invalid = async (reason: string) => ({ kind: "invalid" as const, reason, code: read.code, log: await logScan(pandalId, userId, read.code, "INVALID", pass?.id) });
  if (!pass) return invalid("No pass has this code.");
  if (pass.slot.pandalId !== pandalId) return invalid(`This pass is for ${pass.slot.pandal.name}.`);
  if (pass.booking.status === "PENDING") return invalid("This booking hasn't been paid for.");
  if (pass.status === "CANCELLED" || pass.booking.status === "CANCELLED" || pass.booking.status === "EXPIRED") return invalid("This booking was cancelled.");

  const scanned = toScannedPass(pass);
  if (pass.status === "USED") {
    return {
      kind: "duplicate",
      pass: scanned,
      checkedInAt: pass.checkedInAt ? istTime.format(pass.checkedInAt) : "",
      log: await logScan(pandalId, userId, pass.code, "DUPLICATE", pass.id),
    };
  }
  return { kind: "valid", pass: scanned, timing: timingOf(scanned.date, scanned.startTime, scanned.endTime) };
}

/**
 * Lets everyone on the pass in. Outside its day or window this needs
 * `override` (staff tapped "Admit anyway"). Atomic, so a pass can't be
 * admitted twice even from two phones at once.
 */
export async function admitPass(passId: string, override: boolean): Promise<AdmitResult> {
  const access = await scannerAccess();
  if (!access) return { kind: "error", reason: "You don't have access to this pandal's scanner." };
  const { pandalId, userId } = access;

  const pass = await prisma.pass.findUnique({ where: { id: passId }, include: passInclude });
  if (!pass || pass.slot.pandalId !== pandalId) return { kind: "error", reason: "This pass isn't for your pandal." };
  const scanned = toScannedPass(pass);
  if (!override && timingOf(scanned.date, scanned.startTime, scanned.endTime) !== "on-time") {
    return { kind: "error", reason: "This pass is outside its entry window. Use “Admit anyway” to let them in." };
  }

  const admitted = await prisma.pass.updateMany({
    where: { id: passId, status: "VALID", booking: { status: { in: ["CONFIRMED", "COMPLETED"] } } },
    data: { status: "USED", checkedInAt: new Date() },
  });
  if (!admitted.count) {
    const current = await prisma.pass.findUnique({ where: { id: passId }, select: { status: true, checkedInAt: true } });
    if (current?.status !== "USED") return { kind: "error", reason: "This booking was cancelled." };
    return {
      kind: "duplicate",
      pass: scanned,
      checkedInAt: current.checkedInAt ? istTime.format(current.checkedInAt) : "",
      log: await logScan(pandalId, userId, pass.code, "DUPLICATE", pass.id),
    };
  }
  return { kind: "admitted", pass: scanned, log: await logScan(pandalId, userId, pass.code, "ADMITTED", pass.id) };
}
