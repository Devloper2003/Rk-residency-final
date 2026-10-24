import crypto from "crypto";
import { db } from "@/lib/db";

/**
 * internal-secret.ts — shared secret for SERVER-INTERNAL endpoints.
 *
 * /api/booking-confirmation is called server-to-server (bookings route →
 * booking-sync → confirmation route). Those calls must be authenticated so an
 * outside attacker cannot re-fire guest emails or re-mint coupons by POSTing
 * a bookingId. Both lambdas can't share process memory, so the secret lives
 * in the SiteSetting table (key `internal_api_secret`) and is auto-provisioned
 * once — no owner action needed. Cached per process after first read.
 */
const g = globalThis as any;
const KEY = "internal_api_secret";

export async function internalApiSecret(): Promise<string> {
  if (g.__RK_INTERNAL_SECRET__) return g.__RK_INTERNAL_SECRET__ as string;

  const existing = await db.siteSetting.findUnique({ where: { key: KEY } });
  if (existing?.value) {
    g.__RK_INTERNAL_SECRET__ = existing.value;
    return existing.value;
  }

  const value = crypto.randomUUID();
  try {
    await db.siteSetting.create({
      data: { key: KEY, value, category: "general" },
    });
  } catch {
    // Lost a create race against the other lambda — re-read its value.
    const again = await db.siteSetting.findUnique({ where: { key: KEY } });
    const v = again?.value || value;
    g.__RK_INTERNAL_SECRET__ = v;
    return v;
  }
  g.__RK_INTERNAL_SECRET__ = value;
  return value;
}

/** Constant-time equality that tolerates different-length inputs. */
export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}
