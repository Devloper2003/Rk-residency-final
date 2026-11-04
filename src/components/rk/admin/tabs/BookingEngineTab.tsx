"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarRange, Loader2, Search, BedDouble, Users, IndianRupee,
  CheckCircle2, AlertTriangle, ExternalLink, Phone, Mail, User,
  MessageSquare, Wallet, RefreshCw, ArrowRight, Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminFetch, LoadingSpinner, ErrorState } from "./_shared";

type EngineRoom = {
  roomId: string;
  name: string;
  basePrice: number;
  maxGuests: number;
  totalCount: number;
  view: string;
  sizeSqft: number;
  bedType: string;
  roomsLeft: number;
  closed: boolean;
  closedDates: string[];
  nights: number;
  subtotal: number;
  taxesGst: number;
  total: number;
};

type CreatedBooking = { referenceCode: string; id: string };

const PAYMENT_MODES = [
  { value: "PAY_AT_HOTEL", label: "Pay at Hotel", hint: "Nothing collected now" },
  { value: "PARTIAL_PAID", label: "Partial Paid (20%)", hint: "Advance now, rest at hotel" },
  { value: "PREPAID", label: "Prepaid (Full)", hint: "Full amount received" },
];

function inr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function todayIso(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/**
 * Booking Engine — front-desk availability search + instant booking.
 * Linked to the SAME inventory engine as the public website booking widget,
 * so a front-desk booking and a website booking can never double-sell.
 */
export function BookingEngineTab() {
  const [checkIn, setCheckIn] = useState(todayIso());
  const [checkOut, setCheckOut] = useState(todayIso(1));
  const [rooms, setRooms] = useState<EngineRoom[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<EngineRoom | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedBooking | null>(null);
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    guestName: "", guestEmail: "", guestPhone: "",
    adults: 2, children: 0, specialRequests: "", paymentMethod: "PAY_AT_HOTEL",
  });

  const search = useCallback(async () => {
    setSearching(true);
    setError(null);
    setSelectedRoom(null);
    setCreated(null);
    try {
      const data = await adminFetch(`/api/admin/booking-engine?checkIn=${checkIn}&checkOut=${checkOut}`);
      if (data?.error) throw new Error(data.error);
      setRooms(data.rooms || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Availability check failed");
    } finally {
      setSearching(false);
    }
  }, [checkIn, checkOut]);

  useEffect(() => { search(); }, []); // initial: today → tomorrow

  const advance = !selectedRoom ? 0
    : form.paymentMethod === "PARTIAL_PAID" ? Math.round(selectedRoom.total * 0.2)
    : form.paymentMethod === "PREPAID" ? selectedRoom.total : 0;

  const createBooking = async () => {
    if (!selectedRoom) return;
    if (!form.guestName.trim() || !form.guestEmail.trim() || !form.guestPhone.trim()) {
      setCreateError("Guest name, email and phone are required");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const payload = {
        roomId: selectedRoom.roomId,
        guestName: form.guestName.trim(),
        guestEmail: form.guestEmail.trim(),
        guestPhone: form.guestPhone.trim(),
        checkIn, checkOut,
        adults: Number(form.adults) || 1,
        children: Number(form.children) || 0,
        nights: selectedRoom.nights,
        pricePerNight: selectedRoom.basePrice,
        subtotal: selectedRoom.subtotal,
        taxesGst: selectedRoom.taxesGst,
        serviceFee: 0,
        totalAmount: selectedRoom.total,
        specialRequests: form.specialRequests.trim() || undefined,
        paymentMethod: form.paymentMethod,
      };
      const data = await adminFetch("/api/admin/booking/create", { method: "POST", body: JSON.stringify(payload) });
      if (data?.error) throw new Error(typeof data.error === "string" ? data.error : "Booking failed — check the details");
      setCreated({ referenceCode: data.referenceCode, id: data.booking?.id || "" });
      setSelectedRoom(null);
      setForm({ guestName: "", guestEmail: "", guestPhone: "", adults: 2, children: 0, specialRequests: "", paymentMethod: "PAY_AT_HOTEL" });
      search(); // refresh availability after booking
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Booking failed");
    } finally {
      setCreating(false);
    }
  };

  if (searching && rooms.length === 0 && !error) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="rounded-2xl border border-teal/20 bg-teal/5 p-4">
        <p className="font-display text-sm text-charcoal-soft">
          <strong className="text-teal">Booking Engine.</strong> Front-desk availability & instant booking — linked to the same live inventory as the website booking widget, so website aur front desk kabhi double-sell nahi kar sakte. Bookings yahin se bhi real reference code ke saath confirm hoti hain.
        </p>
      </div>

      {/* Search bar */}
      <div className="rounded-2xl border border-charcoal/10 bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-40 flex-1">
            <label className="mb-1 flex items-center gap-1 font-display text-[10px] uppercase tracking-wider text-charcoal-soft"><CalendarRange className="h-3 w-3" /> Check-in *</label>
            <input type="date" value={checkIn} min={todayIso()} onChange={(e) => setCheckIn(e.target.value)} className="w-full rounded-lg border border-charcoal/15 bg-ivory-deep/30 px-3 py-2 font-display text-sm text-charcoal focus:border-teal focus:outline-none" />
          </div>
          <div className="min-w-40 flex-1">
            <label className="mb-1 flex items-center gap-1 font-display text-[10px] uppercase tracking-wider text-charcoal-soft"><CalendarRange className="h-3 w-3" /> Check-out *</label>
            <input type="date" value={checkOut} min={checkIn} onChange={(e) => setCheckOut(e.target.value)} className="w-full rounded-lg border border-charcoal/15 bg-ivory-deep/30 px-3 py-2 font-display text-sm text-charcoal focus:border-teal focus:outline-none" />
          </div>
          <Button onClick={search} disabled={searching || !checkIn || !checkOut || checkOut <= checkIn} className="rounded-full bg-teal px-5 text-ivory hover:bg-teal-deep">
            {searching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            {searching ? "Checking…" : "Check Availability"}
          </Button>
        </div>
        {checkOut <= checkIn && <p className="mt-2 flex items-center gap-1 font-display text-xs text-marsala"><AlertTriangle className="h-3 w-3" /> Check-out must be after check-in</p>}
      </div>

      {error && <ErrorState title="Availability check failed" message={error} onRetry={search} />}

      {/* Success card */}
      {created && (
        <div className="rounded-2xl border border-teal/40 bg-teal/10 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-teal" />
            <div className="flex-1">
              <p className="font-serif text-lg font-semibold text-charcoal">Booking confirmed — {created.referenceCode}</p>
              <p className="mt-1 font-display text-xs text-charcoal-soft">Guest ko confirmation email ja chuka hoga. Booking Bookings tab mein bhi dikh rahi hogi.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => { navigator.clipboard.writeText(created.referenceCode); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
                  {copied ? <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-teal" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />} {copied ? "Copied" : "Copy reference"}
                </Button>
                <a href={`https://www.rkresidencyvrindavan.in/rooms`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-teal/30 px-3 py-1.5 font-display text-xs font-semibold text-teal hover:bg-teal hover:text-ivory">
                  <ExternalLink className="h-3 w-3" /> Website booking page
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Availability results */}
      {rooms.length > 0 && !selectedRoom && (
        <div className="space-y-3">
          <p className="font-display text-xs uppercase tracking-wider text-charcoal-soft">
            {checkIn} → {checkOut} · {rooms[0]?.nights ?? "—"} night(s) · {rooms.length} room types
          </p>
          {rooms.map((r) => {
            const soldOut = r.roomsLeft <= 0 || r.closed;
            return (
              <div key={r.roomId} className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4 ${soldOut ? "border-charcoal/10 opacity-60" : "border-charcoal/10 hover:border-teal/40"}`}>
                <div className="min-w-48 flex-1">
                  <div className="flex items-center gap-2">
                    <BedDouble className="h-4 w-4 text-teal" />
                    <p className="font-serif text-base font-semibold text-charcoal">{r.name}</p>
                  </div>
                  <p className="mt-0.5 font-display text-[11px] text-charcoal-soft">
                    {r.view} view · {r.bedType} · {r.sizeSqft} sqft · max {r.maxGuests} guests
                  </p>
                </div>
                <div className="text-center">
                  {r.closed ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-marsala/10 px-2.5 py-1 font-display text-[11px] font-semibold text-marsala"><AlertTriangle className="h-3 w-3" /> Closed on {r.closedDates.join(", ")}</span>
                  ) : (
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-display text-[11px] font-semibold ${r.roomsLeft <= 1 ? "bg-marsala/10 text-marsala" : "bg-teal/10 text-teal"}`}>
                      {r.roomsLeft} room{r.roomsLeft === 1 ? "" : "s"} left
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-serif text-lg font-bold text-charcoal">{inr(r.total)}</p>
                  <p className="font-display text-[10px] text-charcoal-soft">{inr(r.basePrice)}/night × {r.nights} + 5% GST</p>
                </div>
                <Button
                  disabled={soldOut}
                  onClick={() => { setSelectedRoom(r); setCreateError(null); setForm((f) => ({ ...f, adults: Math.min(f.adults, r.maxGuests) })); }}
                  className="rounded-full bg-teal text-ivory hover:bg-teal-deep"
                >
                  {soldOut ? "Sold out" : "Book this"} {!soldOut && <ArrowRight className="ml-1.5 h-3.5 w-3.5" />}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking form */}
      {selectedRoom && (
        <div className="rounded-2xl border-2 border-teal/30 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-semibold text-charcoal">New booking — {selectedRoom.name}</h3>
              <p className="font-display text-xs text-charcoal-soft">{checkIn} → {checkOut} · {selectedRoom.nights} night(s) · {selectedRoom.roomsLeft} left at search time</p>
            </div>
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => { setSelectedRoom(null); setCreateError(null); }}>Change room</Button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 flex items-center gap-1 font-display text-[10px] uppercase tracking-wider text-charcoal-soft"><User className="h-3 w-3" /> Guest name *</label>
              <input type="text" value={form.guestName} onChange={(e) => setForm((f) => ({ ...f, guestName: e.target.value }))} placeholder="Full name" className="w-full rounded-lg border border-charcoal/15 bg-ivory-deep/30 px-3 py-2 font-display text-sm text-charcoal focus:border-teal focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 font-display text-[10px] uppercase tracking-wider text-charcoal-soft"><Phone className="h-3 w-3" /> Phone *</label>
              <input type="tel" value={form.guestPhone} onChange={(e) => setForm((f) => ({ ...f, guestPhone: e.target.value }))} placeholder="+91 98765 43210" className="w-full rounded-lg border border-charcoal/15 bg-ivory-deep/30 px-3 py-2 font-display text-sm text-charcoal focus:border-teal focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 font-display text-[10px] uppercase tracking-wider text-charcoal-soft"><Mail className="h-3 w-3" /> Email *</label>
              <input type="email" value={form.guestEmail} onChange={(e) => setForm((f) => ({ ...f, guestEmail: e.target.value }))} placeholder="guest@email.com" className="w-full rounded-lg border border-charcoal/15 bg-ivory-deep/30 px-3 py-2 font-display text-sm text-charcoal focus:border-teal focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 font-display text-[10px] uppercase tracking-wider text-charcoal-soft"><Wallet className="h-3 w-3" /> Payment mode</label>
              <select value={form.paymentMethod} onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))} className="w-full rounded-lg border border-charcoal/15 bg-ivory-deep/30 px-3 py-2 font-display text-sm text-charcoal focus:border-teal focus:outline-none">
                {PAYMENT_MODES.map((m) => <option key={m.value} value={m.value}>{m.label} — {m.hint}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 font-display text-[10px] uppercase tracking-wider text-charcoal-soft"><Users className="h-3 w-3" /> Adults</label>
              <input type="number" min={1} max={selectedRoom.maxGuests} value={form.adults} onChange={(e) => setForm((f) => ({ ...f, adults: Number(e.target.value) }))} className="w-full rounded-lg border border-charcoal/15 bg-ivory-deep/30 px-3 py-2 font-display text-sm text-charcoal focus:border-teal focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Children</label>
              <input type="number" min={0} max={4} value={form.children} onChange={(e) => setForm((f) => ({ ...f, children: Number(e.target.value) }))} className="w-full rounded-lg border border-charcoal/15 bg-ivory-deep/30 px-3 py-2 font-display text-sm text-charcoal focus:border-teal focus:outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 flex items-center gap-1 font-display text-[10px] uppercase tracking-wider text-charcoal-soft"><MessageSquare className="h-3 w-3" /> Special requests</label>
              <textarea rows={2} value={form.specialRequests} onChange={(e) => setForm((f) => ({ ...f, specialRequests: e.target.value }))} placeholder="Early check-in, extra bedding…" className="w-full rounded-lg border border-charcoal/15 bg-ivory-deep/30 px-3 py-2 font-display text-sm text-charcoal focus:border-teal focus:outline-none" />
            </div>
          </div>

          {/* Price summary */}
          <div className="mt-4 rounded-xl border border-teal/20 bg-teal/5 p-4">
            <div className="space-y-1 font-display text-xs text-charcoal-soft">
              <div className="flex justify-between"><span>{selectedRoom.name} × {selectedRoom.nights} night(s)</span><span className="text-charcoal">{inr(selectedRoom.subtotal)}</span></div>
              <div className="flex justify-between"><span>GST (5%)</span><span className="text-charcoal">{inr(selectedRoom.taxesGst)}</span></div>
              <div className="flex justify-between border-t border-charcoal/10 pt-2 font-serif text-base font-bold text-charcoal"><span>Total</span><span>{inr(selectedRoom.total)}</span></div>
              {advance > 0 && advance < selectedRoom.total && (
                <div className="flex justify-between"><span>Advance now</span><span className="font-semibold text-teal">{inr(advance)}</span></div>
              )}
              {advance > 0 && advance < selectedRoom.total && (
                <div className="flex justify-between"><span>Due at hotel</span><span className="font-semibold text-marsala">{inr(selectedRoom.total - advance)}</span></div>
              )}
            </div>
          </div>

          {createError && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-marsala/10 px-3 py-2 font-display text-xs text-marsala"><AlertTriangle className="h-3.5 w-3.5" /> {createError}</div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => { setSelectedRoom(null); setCreateError(null); }}>Cancel</Button>
            <Button onClick={createBooking} disabled={creating} className="rounded-full bg-teal px-6 text-ivory hover:bg-teal-deep">
              {creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</> : <><IndianRupee className="mr-2 h-4 w-4" /> Confirm booking — {inr(selectedRoom.total)}</>}
            </Button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {rooms.length === 0 && !searching && !error && (
        <div className="rounded-2xl border border-dashed border-charcoal/15 bg-white p-10 text-center">
          <CalendarRange className="mx-auto h-10 w-10 text-charcoal-soft/40" />
          <p className="mt-2 font-serif text-base font-semibold text-charcoal">No room types found</p>
          <p className="mt-1 font-display text-xs text-charcoal-soft">Add rooms in Rooms &amp; Rates first — the engine reads live room data.</p>
        </div>
      )}

      {/* Linked shortcuts */}
      <div className="flex flex-wrap gap-2 pt-1">
        <a href="https://www.rkresidencyvrindavan.in/rooms" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-charcoal/15 px-3 py-1.5 font-display text-xs font-semibold text-charcoal-soft hover:border-teal/40 hover:text-teal">
          <ExternalLink className="h-3 w-3" /> Public booking page (website)
        </a>
        <a href="https://www.rkresidencyvrindavan.in/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-charcoal/15 px-3 py-1.5 font-display text-xs font-semibold text-charcoal-soft hover:border-teal/40 hover:text-teal">
          <RefreshCw className="h-3 w-3" /> Same live inventory as website
        </a>
      </div>
    </div>
  );
}
