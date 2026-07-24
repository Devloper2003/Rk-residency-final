"use client";

import { useEffect, useState } from "react";
import {
  X, Loader2, User, Mail, Phone, MapPin, Calendar, BedDouble, Users, Maximize,
  Eye, IndianRupee, FileText, Receipt, Download, CreditCard, Clock, CheckCircle2, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminFetch, getAdminToken } from "@/lib/admin-client";
import { toast } from "sonner";

type Props = {
  bookingId: string | null;
  onClose: () => void;
  onStatusChange?: () => void;
};

type Room = {
  name: string; slug: string; view?: string | null; bedType?: string | null;
  maxGuests?: number | null; sizeSqft?: number | null; basePrice?: number | null;
};
type Guest = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  country?: string | null;
  city?: string | null;
};
type Booking = {
  id: string;
  referenceCode: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests: string | null;
  pricePerNight: number;
  subtotal: number;
  taxesGst: number;
  serviceFee: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  paymentRef: string | null;
  createdAt: string;
  room: Room | null;
  guest: Guest | null;
};

const STATUS_BADGE: Record<string, string> = {
  CONFIRMED: "bg-teal/10 text-teal border-teal/30",
  CHECKED_IN: "bg-gold/15 text-gold-deep border-gold/40",
  CHECKED_OUT: "bg-charcoal/10 text-charcoal-soft border-charcoal/20",
  CANCELLED: "bg-marsala/10 text-marsala border-marsala/30",
  NO_SHOW: "bg-marsala/10 text-marsala border-marsala/30",
};
const PAY_BADGE: Record<string, string> = {
  PAID: "bg-teal/10 text-teal border-teal/30",
  PENDING: "bg-gold/15 text-gold-deep border-gold/40",
  REFUNDED: "bg-marsala/10 text-marsala border-marsala/30",
};

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtDateTime(s: string) {
  return new Date(s).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function inr(n: number) {
  return "\u20B9 " + n.toLocaleString("en-IN");
}

export function BookingDetailModal({ bookingId, onClose, onStatusChange }: Props) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) return;
    setLoading(true);
    setBooking(null);
    adminFetch(`/api/admin/all?action=booking_detail&id=${encodeURIComponent(bookingId)}`)
      .then((data: any) => {
        if (data?.booking) setBooking(data.booking);
        else toast.error("Booking not found");
      })
      .catch(() => toast.error("Failed to load booking"))
      .finally(() => setLoading(false));
  }, [bookingId]);

  // Close on ESC
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (bookingId) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [bookingId, onClose]);

  if (!bookingId) return null;

  const downloadPdf = async (type: "voucher" | "invoice") => {
    setDownloading(type);
    try {
      const token = getAdminToken();
      const res = await fetch(`/api/booking-pdf/${encodeURIComponent(bookingId)}?type=${type}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${booking?.referenceCode || bookingId}-${type}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`${type === "invoice" ? "Tax Invoice" : "Booking Voucher"} PDF downloaded`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] grid place-items-center bg-charcoal/70 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-ivory shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-charcoal/10 bg-teal px-5 py-4 text-ivory">
          <div>
            <p className="font-display text-[10px] uppercase tracking-[0.25em] text-gold-soft">Booking Detail</p>
            <h2 className="font-serif text-lg font-semibold sm:text-xl">
              {booking ? booking.referenceCode : "Loading…"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-ivory/10 text-ivory transition-colors hover:bg-ivory/20"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="grid h-64 place-items-center">
              <Loader2 className="h-7 w-7 animate-spin text-teal" />
            </div>
          ) : !booking ? (
            <div className="grid h-64 place-items-center text-center">
              <AlertCircle className="h-10 w-10 text-marsala/60" />
              <p className="mt-2 font-serif text-base text-charcoal">Booking not found</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Status row */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_BADGE[booking.status]}`}>
                  {booking.status.replace(/_/g, " ")}
                </span>
                <span className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${PAY_BADGE[booking.paymentStatus]}`}>
                  {booking.paymentStatus}
                </span>
                {booking.paymentMethod && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-charcoal/15 bg-white px-3 py-1 text-xs text-charcoal-soft">
                    <CreditCard className="h-3 w-3" /> {booking.paymentMethod.replace(/_/g, " ")}
                  </span>
                )}
                <span className="ml-auto font-display text-xs text-charcoal-soft">
                  Booked on {fmtDateTime(booking.createdAt)}
                </span>
              </div>

              {/* Two-column: Guest + Stay */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Guest details */}
                <div className="rounded-2xl border border-charcoal/10 bg-white p-4">
                  <div className="mb-3 flex items-center gap-2 text-teal">
                    <User className="h-4 w-4" />
                    <h3 className="font-serif text-sm font-semibold">Guest Details</h3>
                  </div>
                  <dl className="space-y-2 font-display text-xs">
                    <DetailRow icon={User} label="Name" value={booking.guestName} />
                    <DetailRow icon={Mail} label="Email" value={booking.guestEmail} />
                    <DetailRow icon={Phone} label="Phone" value={booking.guestPhone} />
                    {(booking.guest?.city || booking.guest?.country) && (
                      <DetailRow icon={MapPin} label="Location" value={[
                        booking.guest?.city,
                        booking.guest?.country,
                      ].filter(Boolean).join(", ")} />
                    )}
                  </dl>
                </div>

                {/* Stay details */}
                <div className="rounded-2xl border border-charcoal/10 bg-white p-4">
                  <div className="mb-3 flex items-center gap-2 text-teal">
                    <Calendar className="h-4 w-4" />
                    <h3 className="font-serif text-sm font-semibold">Stay Details</h3>
                  </div>
                  <dl className="space-y-2 font-display text-xs">
                    <DetailRow icon={BedDouble} label="Room" value={booking.room?.name || "—"} />
                    {booking.room?.view && <DetailRow icon={Eye} label="View" value={booking.room.view} />}
                    <DetailRow icon={Calendar} label="Check-in" value={`${fmtDate(booking.checkIn)} (after 2 PM)`} />
                    <DetailRow icon={Calendar} label="Check-out" value={`${fmtDate(booking.checkOut)} (before 11 AM)`} />
                    <DetailRow icon={Clock} label="Duration" value={`${booking.nights} night(s) · ${booking.adults} adult(s)${booking.children > 0 ? ` · ${booking.children} child(ren)` : ""}`} />
                    {booking.room?.bedType && <DetailRow icon={BedDouble} label="Bed" value={booking.room.bedType} />}
                    {booking.room?.sizeSqft && <DetailRow icon={Maximize} label="Size" value={`${booking.room.sizeSqft} sq.ft`} />}
                    {booking.room?.maxGuests && <DetailRow icon={Users} label="Max guests" value={String(booking.room.maxGuests)} />}
                  </dl>
                </div>
              </div>

              {/* Charges breakdown */}
              <div className="rounded-2xl border border-charcoal/10 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-teal">
                  <IndianRupee className="h-4 w-4" />
                  <h3 className="font-serif text-sm font-semibold">Charges Breakdown</h3>
                </div>
                <div className="space-y-1.5 font-display text-xs">
                  <ChargeRow label={`Room tariff (${booking.nights} × ${inr(booking.pricePerNight)})`} value={inr(booking.subtotal)} />
                  <ChargeRow label="GST (12% on room tariff)" value={inr(booking.taxesGst)} />
                  {booking.serviceFee > 0 && <ChargeRow label="Service fee" value={inr(booking.serviceFee)} />}
                  <div className="my-2 border-t border-charcoal/10" />
                  <div className="flex items-center justify-between pt-1">
                    <span className="font-serif text-sm font-bold text-charcoal">Grand Total</span>
                    <span className="font-serif text-lg font-bold text-teal">{inr(booking.totalAmount)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-ivory-deep px-3 py-2">
                    <span className="font-display text-[10px] uppercase tracking-wider text-charcoal-soft">
                      Payment {booking.paymentStatus}
                    </span>
                    {booking.paymentStatus === "PAID" ? (
                      <span className="inline-flex items-center gap-1 font-serif text-sm font-semibold text-teal">
                        <CheckCircle2 className="h-3.5 w-3.5" /> {inr(booking.totalAmount)} received
                      </span>
                    ) : booking.paymentStatus === "REFUNDED" ? (
                      <span className="font-serif text-sm font-semibold text-marsala">Refunded</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-serif text-sm font-semibold text-gold-deep">
                        <AlertCircle className="h-3.5 w-3.5" /> {inr(booking.totalAmount)} pending
                      </span>
                    )}
                  </div>
                  {booking.paymentRef && (
                    <p className="mt-1 font-display text-[10px] text-charcoal-soft">
                      Payment reference: <span className="font-mono">{booking.paymentRef}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Special requests */}
              {booking.specialRequests && (
                <div className="rounded-2xl border border-gold/30 bg-gold/5 p-4">
                  <h3 className="mb-2 flex items-center gap-2 font-serif text-sm font-semibold text-gold-deep">
                    <FileText className="h-4 w-4" /> Special Requests
                  </h3>
                  <p className="font-display text-xs leading-relaxed text-charcoal">{booking.specialRequests}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with download buttons */}
        {booking && (
          <div className="flex flex-col gap-2 border-t border-charcoal/10 bg-ivory-deep px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-display text-[10px] text-charcoal-soft">
              Download branded PDFs for guest email, printing, or records.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => downloadPdf("voucher")}
                disabled={downloading !== null}
                className="rounded-full bg-teal px-4 py-2 text-xs font-semibold text-ivory hover:bg-teal-deep"
              >
                {downloading === "voucher" ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-1.5 h-3.5 w-3.5" />}
                Voucher PDF
              </Button>
              <Button
                onClick={() => downloadPdf("invoice")}
                disabled={downloading !== null}
                className="rounded-full bg-gold px-4 py-2 text-xs font-semibold text-charcoal hover:bg-gold-deep hover:text-ivory"
              >
                {downloading === "invoice" ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Receipt className="mr-1.5 h-3.5 w-3.5" />}
                Invoice PDF
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-charcoal-soft" />
      <div className="min-w-0 flex-1">
        <dt className="font-display text-[10px] uppercase tracking-wider text-charcoal-soft">{label}</dt>
        <dd className="font-display text-xs font-semibold text-charcoal break-words">{value}</dd>
      </div>
    </div>
  );
}

function ChargeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-charcoal-soft">{label}</span>
      <span className="font-semibold text-charcoal">{value}</span>
    </div>
  );
}
