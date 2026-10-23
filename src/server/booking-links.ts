import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { siteUrl } from "@/lib/site";
import type { BookingAccess } from "@/types";

// Bookings are opened with a link instead of a login: /bookings/<ref>?k=<key>.
// Two keys exist per booking, both HMACs of the reference:
// - "manage" is emailed to the booker and can cancel;
// - "view" is what the Share button sends, so family can see but not cancel.
// Pass QR codes hold a signed link, /p/<code>.<signature>: a phone camera opens
// the pass check page, and the gate scanner verifies the same signature.

function secret() {
  const value = process.env.BOOKING_SECRET;
  if (!value || value.length < 32) throw new Error("BOOKING_SECRET must be set (at least 32 characters).");
  return value;
}

function sign(purpose: string, value: string, length: number) {
  return createHmac("sha256", secret()).update(`${purpose}:${value}`).digest("base64url").slice(0, length);
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function bookingKey(reference: string, access: BookingAccess) {
  return sign(`booking-${access}`, reference, 22);
}

/** Which access a key grants for this booking, or null if it is not valid. */
export function verifyBookingKey(reference: string, key: string | undefined): BookingAccess | null {
  if (!key) return null;
  if (safeEqual(key, bookingKey(reference, "manage"))) return "manage";
  if (safeEqual(key, bookingKey(reference, "view"))) return "view";
  return null;
}

export function bookingPath(reference: string, access: BookingAccess) {
  return `/bookings/${reference}?k=${bookingKey(reference, access)}`;
}

export function bookingUrl(reference: string, access: BookingAccess) {
  return `${siteUrl}${bookingPath(reference, access)}`;
}

/** Hex, so the token still verifies if a scanner app changes its letter case. */
function passSignature(code: string) {
  return createHmac("sha256", secret()).update(`pass:${code}`).digest("hex").slice(0, 16);
}

/** What a pass QR code encodes: the URL of its pass check page. */
export function passQrUrl(code: string) {
  return `${siteUrl}/p/${code}.${passSignature(code)}`;
}

/** The pass code in a `/p/<token>` link, or null if the signature doesn't match. */
export function verifyPassToken(token: string) {
  let value: string;
  try {
    value = decodeURIComponent(token);
  } catch {
    return null;
  }
  const dot = value.lastIndexOf(".");
  if (dot < 1) return null;
  // Pass codes are upper case and signatures lower case hex.
  const code = value.slice(0, dot).toUpperCase();
  return safeEqual(value.slice(dot + 1).toLowerCase(), passSignature(code)) ? code : null;
}
