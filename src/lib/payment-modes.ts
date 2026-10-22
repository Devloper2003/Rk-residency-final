/**
 * Payment modes — the ONLY three ways a booking can be settled.
 * Website booking widget, admin panel, emails and PDFs all speak this vocabulary.
 *
 *   PREPAID       — guest pays 100% online now (Razorpay)
 *   PARTIAL_PAID  — guest pays PARTIAL_PERCENT (20%) online now, balance at hotel
 *   PAY_AT_HOTEL  — guest pays 100% at the hotel on arrival
 *
 * Legacy values (RAZORPAY, STRIPE) may still exist on old rows —
 * modeLabel() renders them gracefully and paidAmountOf() treats them as prepaid.
 */

export const PAYMENT_MODES = ["PREPAID", "PARTIAL_PAID", "PAY_AT_HOTEL"] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];

/** Percentage of the booking total collected online under Partial Paid. */
export const PARTIAL_PERCENT = 20;

export const MODE_LABELS: Record<PaymentMode, string> = {
  PREPAID: "Prepaid",
  PARTIAL_PAID: "Partial Paid",
  PAY_AT_HOTEL: "Pay at Hotel",
};

/** Payment status values beyond the mode (PAID / PARTIAL are collection states). */
export type PaymentStatus = "PENDING" | "PARTIAL" | "PAID" | "REFUNDED";

/** Advance (online-now) amount for a given mode, in whole rupees. */
export function payableNow(mode: string, totalAmount: number): number {
  if (mode === "PARTIAL_PAID") return Math.round((totalAmount * PARTIAL_PERCENT) / 100);
  if (mode === "PAY_AT_HOTEL") return 0;
  return totalAmount; // PREPAID + legacy online modes
}

/** Balance still to be collected at the hotel. */
export function dueAtHotel(mode: string, totalAmount: number): number {
  return totalAmount - payableNow(mode, totalAmount);
}

/**
 * Human label for any paymentMethod value, including legacy rows.
 */
export function modeLabel(mode: string | null | undefined): string {
  if (!mode) return "Pay at Hotel";
  if (mode === "RAZORPAY") return "Prepaid (Razorpay)";
  if (mode === "STRIPE") return "Prepaid (Stripe)";
  return MODE_LABELS[mode as PaymentMode] ?? mode.replace(/_/g, " ");
}

/**
 * Money actually collected so far — legacy-safe:
 * old rows have paidAmount = 0 but paymentStatus = PAID.
 */
export function paidAmountOf(booking: { paidAmount?: number | null; paymentStatus: string; totalAmount: number }): number {
  if (booking.paidAmount && booking.paidAmount > 0) return booking.paidAmount;
  if (booking.paymentStatus === "PAID") return booking.totalAmount;
  if (booking.paymentStatus === "PARTIAL") return Math.round((booking.totalAmount * PARTIAL_PERCENT) / 100);
  return 0;
}
