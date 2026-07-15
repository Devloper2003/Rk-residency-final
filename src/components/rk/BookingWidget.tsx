"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Calendar, Users, Check, Loader2, ChevronRight, ChevronLeft,
  ShieldCheck, Sparkles, Mail, Phone, User, MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Diya, Lotus } from "./Motifs";
import type { Room } from "./Rooms";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  preselectRoom?: Room | null;
};

const STEPS = ["Dates & Room", "Guests", "Payment", "Confirmation"] as const;
type Step = (typeof STEPS)[number];

const GST_RATE = 0.12; // 12% GST on hotels < ₹7,500
const SERVICE_FEE_FLAT = 250;

export function BookingWidget({ open, onOpenChange, preselectRoom }: Props) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [selectedRoomId, setSelectedRoomId] = useState<string>("");
  const [guests, setGuests] = useState({ adults: 2, children: 0 });
  const [contact, setContact] = useState({ name: "", email: "", phone: "", requests: "" });
  const [paymentMethod, setPaymentMethod] = useState<"RAZORPAY" | "STRIPE" | "PAY_AT_HOTEL">("RAZORPAY");
  const [submitting, setSubmitting] = useState(false);
  const [confirmedRef, setConfirmedRef] = useState<string | null>(null);

  // Load rooms
  useEffect(() => {
    if (!open) return;
    fetch("/api/rooms")
      .then((r) => r.json())
      .then((data) => setRooms(data.rooms || []))
      .catch(() => {});
  }, [open]);

  // Preselect room when opening with one
  useEffect(() => {
    if (preselectRoom) {
      setSelectedRoomId(preselectRoom.id);
    }
  }, [preselectRoom]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setStep(0);
        setDateRange({});
        setSelectedRoomId("");
        setGuests({ adults: 2, children: 0 });
        setContact({ name: "", email: "", phone: "", requests: "" });
        setConfirmedRef(null);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  const selectedRoom = useMemo(
    () => rooms.find((r) => r.id === selectedRoomId),
    [rooms, selectedRoomId]
  );

  const nights = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return 0;
    return Math.max(
      0,
      Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
    );
  }, [dateRange]);

  const pricing = useMemo(() => {
    if (!selectedRoom || nights === 0) return null;
    const subtotal = selectedRoom.basePrice * nights;
    const taxes = Math.round(subtotal * GST_RATE);
    const serviceFee = SERVICE_FEE_FLAT * nights;
    const total = subtotal + taxes + serviceFee;
    return { subtotal, taxes, serviceFee, total, perNight: selectedRoom.basePrice };
  }, [selectedRoom, nights]);

  const canProceedDates = !!dateRange.from && !!dateRange.to && !!selectedRoomId && nights > 0;
  const canProceedGuests =
    contact.name.length > 1 &&
    /^\S+@\S+\.\S+$/.test(contact.email) &&
    contact.phone.length >= 8;

  const handleConfirm = async () => {
    if (!selectedRoom || !dateRange.from || !dateRange.to) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: selectedRoom.id,
          checkIn: dateRange.from.toISOString(),
          checkOut: dateRange.to.toISOString(),
          nights,
          adults: guests.adults,
          children: guests.children,
          guestName: contact.name,
          guestEmail: contact.email,
          guestPhone: contact.phone,
          specialRequests: contact.requests,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Booking failed");
      setConfirmedRef(data.referenceCode);
      setStep(3);
      toast.success("Booking confirmed!", {
        description: `Reference ${data.referenceCode}`,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Please try again";
      toast.error("Booking failed", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Booking widget"
        >
          <div
            className="absolute inset-0 bg-charcoal/70 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ y: "100%", opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0.6 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-ivory shadow-2xl sm:rounded-3xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-charcoal/10 bg-teal px-5 py-4 text-ivory sm:px-6">
              <div className="flex items-center gap-3">
                <Lotus size={20} className="text-gold-soft" />
                <div>
                  <h3 className="font-serif text-lg font-semibold">
                    Reserve your stay
                  </h3>
                  <p className="font-display text-xs uppercase tracking-wider text-ivory/70">
                    Direct booking · Best price · Free cancellation
                  </p>
                </div>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="grid h-9 w-9 place-items-center rounded-full border border-ivory/25 text-ivory transition-colors hover:bg-ivory/10 focus-ring"
                aria-label="Close booking widget"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Stepper */}
            <div className="flex items-center justify-between gap-2 border-b border-charcoal/10 bg-ivory px-5 py-3 sm:px-6">
              {STEPS.map((label, i) => (
                <div key={label} className="flex flex-1 items-center gap-2">
                  <div
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-bold transition-all ${
                      i < step
                        ? "border-teal bg-teal text-ivory"
                        : i === step
                        ? "border-gold bg-gold text-charcoal"
                        : "border-charcoal/20 bg-white text-charcoal/40"
                    }`}
                  >
                    {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  <span
                    className={`hidden font-display text-xs uppercase tracking-wider sm:block ${
                      i <= step ? "text-charcoal" : "text-charcoal/40"
                    }`}
                  >
                    {label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`h-px flex-1 ${i < step ? "bg-teal" : "bg-charcoal/15"}`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Body */}
            <div className="scrollbar-thin flex-1 overflow-y-auto bg-ivory-deep/30 px-5 py-5 sm:px-6">
              {/* STEP 0 — dates + room */}
              {step === 0 && (
                <div className="space-y-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    {/* Calendar */}
                    <div>
                      <Label className="mb-2 flex items-center gap-1.5 font-display text-xs uppercase tracking-wider text-charcoal-soft">
                        <Calendar className="h-3.5 w-3.5" /> Select check-in &amp; check-out
                      </Label>
                      <div className="rounded-2xl border border-charcoal/10 bg-white p-3">
                        <CalendarPicker
                          mode="range"
                          numberOfMonths={1}
                          disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                          selected={{
                            from: dateRange.from,
                            to: dateRange.to,
                          }}
                          onSelect={(range) =>
                            setDateRange({ from: range?.from, to: range?.to })
                          }
                          className="rk-calendar"
                        />
                      </div>
                    </div>

                    {/* Room selection */}
                    <div>
                      <Label className="mb-2 flex items-center gap-1.5 font-display text-xs uppercase tracking-wider text-charcoal-soft">
                        <Sparkles className="h-3.5 w-3.5" /> Choose your room
                      </Label>
                      <div className="scrollbar-thin max-h-[336px] space-y-2 overflow-y-auto pr-1">
                        {rooms.length === 0 ? (
                          <div className="flex h-32 items-center justify-center">
                            <Loader2 className="h-5 w-5 animate-spin text-teal" />
                          </div>
                        ) : (
                          rooms.map((r) => {
                            const sel = r.id === selectedRoomId;
                            return (
                              <button
                                key={r.id}
                                onClick={() => setSelectedRoomId(r.id)}
                                className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-all focus-ring ${
                                  sel
                                    ? "border-gold bg-gold/10 shadow-sm"
                                    : "border-charcoal/10 bg-white hover:border-teal/30"
                                }`}
                                aria-pressed={sel}
                              >
                                <div
                                  className="h-14 w-14 shrink-0 rounded-lg bg-cover bg-center"
                                  style={{
                                    backgroundImage: `url(${JSON.parse(r.imageUrls || "[]")[0] || "/images/heritage-room.jpg"})`,
                                  }}
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="font-serif text-sm font-semibold text-charcoal">
                                    {r.name}
                                  </div>
                                  <div className="font-display text-xs text-charcoal-soft">
                                    {r.maxGuests} guests · {r.sizeSqft} sq.ft · {r.bedType}
                                  </div>
                                  <div className="mt-0.5 font-serif text-sm font-bold text-teal">
                                    ₹{r.basePrice.toLocaleString("en-IN")}
                                    <span className="font-sans text-[10px] font-normal text-charcoal-soft">
                                      {" "}/ night
                                    </span>
                                  </div>
                                </div>
                                <div
                                  className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                                    sel ? "border-gold bg-gold" : "border-charcoal/20"
                                  }`}
                                >
                                  {sel && <Check className="h-3 w-3 text-charcoal" />}
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Live price preview */}
                  {pricing && (
                    <div className="rounded-2xl border border-gold/30 bg-white p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-serif text-sm font-semibold text-charcoal">
                          Live price estimate
                        </span>
                        <span className="rounded-full bg-teal/8 px-2 py-0.5 font-display text-[10px] uppercase tracking-wider text-teal">
                          {nights} {nights === 1 ? "night" : "nights"}
                        </span>
                      </div>
                      <div className="space-y-1.5 font-display text-sm text-charcoal-soft">
                        <Row label={`₹${pricing.perNight.toLocaleString("en-IN")} × ${nights}`} value={`₹${pricing.subtotal.toLocaleString("en-IN")}`} />
                        <Row label="GST (12%)" value={`₹${pricing.taxes.toLocaleString("en-IN")}`} />
                        <Row label="Service fee" value={`₹${pricing.serviceFee.toLocaleString("en-IN")}`} />
                        <div className="mt-2 flex items-center justify-between border-t border-charcoal/10 pt-2">
                          <span className="font-serif text-base font-semibold text-charcoal">Total</span>
                          <span className="font-serif text-xl font-bold text-teal">
                            ₹{pricing.total.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 1 — guests + contact */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <Label className="mb-2 flex items-center gap-1.5 font-display text-xs uppercase tracking-wider text-charcoal-soft">
                      <Users className="h-3.5 w-3.5" /> Number of guests
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <GuestCounter label="Adults" value={guests.adults} min={1} max={selectedRoom?.maxGuests || 6} onChange={(v) => setGuests((g) => ({ ...g, adults: v }))} />
                      <GuestCounter label="Children" value={guests.children} min={0} max={4} onChange={(v) => setGuests((g) => ({ ...g, children: v }))} />
                    </div>
                    {selectedRoom && (
                      <p className="mt-2 font-display text-xs text-charcoal-soft">
                        Max {selectedRoom.maxGuests} guests for {selectedRoom.name}.
                      </p>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="bk-name" className="mb-1.5 flex items-center gap-1.5 font-display text-xs uppercase tracking-wider text-charcoal-soft">
                        <User className="h-3.5 w-3.5" /> Full name
                      </Label>
                      <Input id="bk-name" value={contact.name} onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))} placeholder="Anjali Mehta" className="bg-white" />
                    </div>
                    <div>
                      <Label htmlFor="bk-email" className="mb-1.5 flex items-center gap-1.5 font-display text-xs uppercase tracking-wider text-charcoal-soft">
                        <Mail className="h-3.5 w-3.5" /> Email
                      </Label>
                      <Input id="bk-email" type="email" value={contact.email} onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} placeholder="anjali@example.com" className="bg-white" />
                    </div>
                    <div>
                      <Label htmlFor="bk-phone" className="mb-1.5 flex items-center gap-1.5 font-display text-xs uppercase tracking-wider text-charcoal-soft">
                        <Phone className="h-3.5 w-3.5" /> Phone (with country code)
                      </Label>
                      <Input id="bk-phone" value={contact.phone} onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))} placeholder="+91 98765 43210" className="bg-white" />
                    </div>
                    <div>
                      <Label htmlFor="bk-requests" className="mb-1.5 flex items-center gap-1.5 font-display text-xs uppercase tracking-wider text-charcoal-soft">
                        <MessageSquare className="h-3.5 w-3.5" /> Special requests (optional)
                      </Label>
                      <Input id="bk-requests" value={contact.requests} onChange={(e) => setContact((c) => ({ ...c, requests: e.target.value }))} placeholder="Early check-in, airport pickup…" className="bg-white" />
                    </div>
                  </div>
                  <div className="rounded-xl border border-gold/30 bg-gold/5 p-3">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
                      <p className="font-display text-xs leading-relaxed text-charcoal-soft">
                        Your details are encrypted in transit. We use them only to
                        confirm your booking and send a calendar invite — never for
                        third-party marketing.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2 — payment */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <Label className="mb-2 flex items-center gap-1.5 font-display text-xs uppercase tracking-wider text-charcoal-soft">
                      <ShieldCheck className="h-3.5 w-3.5" /> Payment method
                    </Label>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {[
                        { id: "RAZORPAY" as const, label: "Razorpay", sub: "UPI · Cards · Netbanking", flag: "🇮🇳" },
                        { id: "STRIPE" as const, label: "Stripe", sub: "International cards", flag: "🌍" },
                        { id: "PAY_AT_HOTEL" as const, label: "Pay at hotel", sub: "Reserve now, pay on arrival", flag: "🏨" },
                      ].map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setPaymentMethod(p.id)}
                          className={`rounded-xl border p-3 text-left transition-all focus-ring ${
                            paymentMethod === p.id
                              ? "border-gold bg-gold/10"
                              : "border-charcoal/10 bg-white hover:border-teal/30"
                          }`}
                          aria-pressed={paymentMethod === p.id}
                        >
                          <div className="text-2xl">{p.flag}</div>
                          <div className="mt-1 font-serif text-sm font-semibold text-charcoal">{p.label}</div>
                          <div className="font-display text-[10px] text-charcoal-soft">{p.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Final price summary */}
                  {pricing && selectedRoom && dateRange.from && dateRange.to && (
                    <div className="rounded-2xl border border-teal/30 bg-white p-4">
                      <div className="mb-3 font-serif text-sm font-semibold text-charcoal">
                        Booking summary
                      </div>
                      <div className="mb-3 flex items-center gap-3 border-b border-charcoal/10 pb-3">
                        <div
                          className="h-14 w-14 shrink-0 rounded-lg bg-cover bg-center"
                          style={{
                            backgroundImage: `url(${JSON.parse(selectedRoom.imageUrls || "[]")[0] || "/images/heritage-room.jpg"})`,
                          }}
                        />
                        <div>
                          <div className="font-serif text-sm font-semibold text-charcoal">
                            {selectedRoom.name}
                          </div>
                          <div className="font-display text-xs text-charcoal-soft">
                            {dateRange.from.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            {" → "}
                            {dateRange.to.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            {" · "}
                            {nights} {nights === 1 ? "night" : "nights"}
                          </div>
                          <div className="font-display text-xs text-charcoal-soft">
                            {guests.adults} adults{guests.children > 0 ? ` · ${guests.children} children` : ""}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1.5 font-display text-sm text-charcoal-soft">
                        <Row label="Room subtotal" value={`₹${pricing.subtotal.toLocaleString("en-IN")}`} />
                        <Row label="GST (12%)" value={`₹${pricing.taxes.toLocaleString("en-IN")}`} />
                        <Row label="Service fee" value={`₹${pricing.serviceFee.toLocaleString("en-IN")}`} />
                        <div className="mt-2 flex items-center justify-between border-t border-charcoal/10 pt-2">
                          <span className="font-serif text-base font-semibold text-charcoal">Total payable</span>
                          <span className="font-serif text-xl font-bold text-teal">
                            ₹{pricing.total.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2 rounded-xl border border-marsala/20 bg-marsala/5 p-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-marsala" />
                    <p className="font-display text-xs leading-relaxed text-charcoal-soft">
                      Payment is processed via secure server-verified webhooks.
                      We never see or store your card details. Free cancellation
                      up to 72 hours before check-in.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 3 — confirmation */}
              {step === 3 && confirmedRef && (
                <div className="flex flex-col items-center py-6 text-center">
                  {/* Diya glow confirmation */}
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="relative mb-5"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 rounded-full bg-gold/30 blur-2xl"
                    />
                    <Diya size={84} className="relative text-gold" />
                  </motion.div>

                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="font-serif text-2xl font-semibold text-teal sm:text-3xl"
                  >
                    Your stay is confirmed
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-2 font-display text-sm text-charcoal-soft"
                  >
                    May your Braj yatra be blessed. A confirmation email with
                    your PDF invoice and calendar invite is on its way.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-5 w-full max-w-sm rounded-2xl border border-gold/30 bg-white p-4"
                  >
                    <div className="font-display text-[10px] uppercase tracking-wider text-charcoal-soft">
                      Booking reference
                    </div>
                    <div className="font-serif text-2xl font-bold text-teal">
                      {confirmedRef}
                    </div>
                    {selectedRoom && (
                      <div className="mt-3 space-y-1 border-t border-charcoal/10 pt-3 font-display text-xs text-charcoal-soft">
                        <div className="flex justify-between">
                          <span>Room</span>
                          <span className="font-semibold text-charcoal">{selectedRoom.name}</span>
                        </div>
                        {dateRange.from && dateRange.to && (
                          <div className="flex justify-between">
                            <span>Dates</span>
                            <span className="font-semibold text-charcoal">
                              {dateRange.from.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                              {" → "}
                              {dateRange.to.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </span>
                          </div>
                        )}
                        {pricing && (
                          <div className="flex justify-between">
                            <span>Paid</span>
                            <span className="font-semibold text-teal">
                              ₹{pricing.total.toLocaleString("en-IN")}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </div>
              )}
            </div>

            {/* Footer / actions */}
            <div className="flex items-center justify-between gap-3 border-t border-charcoal/10 bg-white px-5 py-4 sm:px-6">
              {step > 0 && step < 3 ? (
                <Button
                  onClick={() => setStep((s) => (s - 1) as 0 | 1 | 2)}
                  variant="outline"
                  className="rounded-full border-charcoal/20 text-charcoal-soft hover:bg-ivory"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
              ) : (
                <div className="font-display text-xs text-charcoal-soft">
                  {step === 3 ? (
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-teal" />
                      Secure · SSL encrypted
                    </span>
                  ) : (
                    <span>Step {step + 1} of {STEPS.length}</span>
                  )}
                </div>
              )}

              {step < 2 && (
                <Button
                  onClick={() => setStep((s) => (s + 1) as 1 | 2)}
                  disabled={step === 0 ? !canProceedDates : !canProceedGuests}
                  className="cta-glow rounded-full bg-gradient-to-r from-gold via-gold-soft to-gold px-6 py-2.5 font-semibold text-charcoal hover:from-gold-deep hover:to-gold disabled:opacity-40"
                >
                  Continue
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}
              {step === 2 && (
                <Button
                  onClick={handleConfirm}
                  disabled={submitting}
                  className="cta-glow rounded-full bg-teal px-6 py-2.5 font-semibold text-ivory hover:bg-teal-deep disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      Confirming…
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="mr-1.5 h-4 w-4" />
                      Confirm &amp; Pay
                    </>
                  )}
                </Button>
              )}
              {step === 3 && (
                <Button
                  onClick={() => onOpenChange(false)}
                  className="rounded-full bg-teal px-6 py-2.5 font-semibold text-ivory hover:bg-teal-deep"
                >
                  Done
                </Button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <span className="font-medium text-charcoal">{value}</span>
    </div>
  );
}

function GuestCounter({
  label, value, min, max, onChange,
}: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-charcoal/10 bg-white p-3">
      <span className="font-serif text-sm font-medium text-charcoal">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="grid h-8 w-8 place-items-center rounded-full border border-charcoal/15 text-charcoal transition-colors hover:border-teal hover:bg-teal hover:text-ivory disabled:opacity-40 focus-ring"
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          –
        </button>
        <span className="w-6 text-center font-serif text-lg font-bold text-teal">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="grid h-8 w-8 place-items-center rounded-full border border-charcoal/15 text-charcoal transition-colors hover:border-teal hover:bg-teal hover:text-ivory disabled:opacity-40 focus-ring"
          disabled={value >= max}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
