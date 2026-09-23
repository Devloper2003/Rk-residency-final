"use client";
import { useState, useEffect } from "react";
import { X, Loader2, AlertCircle, CalendarDays, User, Phone, Mail, MessageSquare } from "lucide-react";
import { adminFetch } from "./_shared";

type Room = { id: string; name: string; basePrice: number; maxGuests: number; totalCount: number };

export function ManualBookingModal({ preselectedRoomId, onClose, onCreated }: {
  preselectedRoomId: string | null; onClose: () => void; onCreated: () => void;
}) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    roomId: preselectedRoomId || "", guestName: "", guestEmail: "", guestPhone: "",
    checkIn: new Date().toISOString().slice(0, 10), checkOut: "",
    adults: 2, children: 0, specialRequests: "", paymentMethod: "PAY_AT_HOTEL",
  });

  useEffect(() => {
    setLoading(true);
    adminFetch("/api/admin/all?action=rooms").then((data: any) => {
      if (data?.rooms) setRooms(data.rooms); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { if (preselectedRoomId) setForm((f) => ({ ...f, roomId: preselectedRoomId })); }, [preselectedRoomId]);

  const selectedRoom = rooms.find((r) => r.id === form.roomId);
  const checkInDate = form.checkIn ? new Date(form.checkIn) : null;
  const checkOutDate = form.checkOut ? new Date(form.checkOut) : null;
  const nights = checkInDate && checkOutDate ? Math.max(1, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / 86400000)) : 0;
  const pricePerNight = selectedRoom?.basePrice || 0;
  const subtotal = nights * pricePerNight;
  const taxesGst = Math.round(subtotal * 0.12);
  const serviceFee = Math.round(subtotal * 0.05);
  const totalAmount = subtotal + taxesGst + serviceFee;

  const handleSubmit = async () => {
    if (!form.roomId || !form.guestName || !form.guestEmail || !form.guestPhone || !form.checkIn || !form.checkOut) { setError("Please fill all required fields"); return; }
    if (nights < 1) { setError("Check-out must be after check-in"); return; }
    setCreating(true); setError("");
    try {
      const res: any = await adminFetch("/api/admin/booking/create", { method: "POST", body: JSON.stringify({ ...form, nights, pricePerNight, subtotal, taxesGst, serviceFee, totalAmount }) });
      if (res?.error) setError(res.error); else onCreated();
    } catch (e: any) { setError(e?.message || "Failed to create booking"); }
    setCreating(false);
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-charcoal/10 px-6 py-4">
          <div><h3 className="font-serif text-lg font-semibold text-charcoal">Create Manual Booking</h3><p className="font-display text-xs text-charcoal-soft">Book a room directly from the admin panel</p></div>
          <button onClick={onClose} className="rounded-full p-1.5 text-charcoal-soft hover:bg-charcoal/5"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-5">
            <div>
              <label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Room *</label>
              {loading ? <div className="flex items-center gap-2 py-2 font-display text-xs text-charcoal-soft"><Loader2 className="h-3 w-3 animate-spin" /> Loading rooms...</div> : (
                <select value={form.roomId} onChange={set("roomId")} className="w-full rounded-lg border border-charcoal/10 bg-ivory-deep/30 px-3 py-2 font-display text-sm text-charcoal focus:border-teal focus:outline-none">
                  <option value="">Select a room</option>
                  {rooms.map((r) => <option key={r.id} value={r.id}>{r.name} — ₹{r.basePrice.toLocaleString("en-IN")}/night (Max {r.maxGuests})</option>)}
                </select>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft"><User className="mr-1 inline h-3 w-3" /> Guest Name *</label><input type="text" value={form.guestName} onChange={set("guestName")} placeholder="Full name" className="w-full rounded-lg border border-charcoal/10 bg-ivory-deep/30 px-3 py-2 font-display text-sm text-charcoal placeholder:text-charcoal-soft/50 focus:border-teal focus:outline-none" /></div>
              <div><label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft"><Mail className="mr-1 inline h-3 w-3" /> Email *</label><input type="email" value={form.guestEmail} onChange={set("guestEmail")} placeholder="guest@email.com" className="w-full rounded-lg border border-charcoal/10 bg-ivory-deep/30 px-3 py-2 font-display text-sm text-charcoal placeholder:text-charcoal-soft/50 focus:border-teal focus:outline-none" /></div>
              <div><label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft"><Phone className="mr-1 inline h-3 w-3" /> Phone *</label><input type="tel" value={form.guestPhone} onChange={set("guestPhone")} placeholder="+91 98765 43210" className="w-full rounded-lg border border-charcoal/10 bg-ivory-deep/30 px-3 py-2 font-display text-sm text-charcoal placeholder:text-charcoal-soft/50 focus:border-teal focus:outline-none" /></div>
              <div><label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft"><CalendarDays className="mr-1 inline h-3 w-3" /> Payment Method</label><select value={form.paymentMethod} onChange={set("paymentMethod")} className="w-full rounded-lg border border-charcoal/10 bg-ivory-deep/30 px-3 py-2 font-display text-sm text-charcoal focus:border-teal focus:outline-none"><option value="PAY_AT_HOTEL">Pay at Hotel</option><option value="RAZORPAY">Razorpay (Online)</option></select></div>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <div><label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Check-in *</label><input type="date" value={form.checkIn} onChange={set("checkIn")} min={new Date().toISOString().slice(0, 10)} className="w-full rounded-lg border border-charcoal/10 bg-ivory-deep/30 px-3 py-2 font-display text-sm text-charcoal focus:border-teal focus:outline-none" /></div>
              <div><label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Check-out *</label><input type="date" value={form.checkOut} onChange={set("checkOut")} min={form.checkIn || new Date().toISOString().slice(0, 10)} className="w-full rounded-lg border border-charcoal/10 bg-ivory-deep/30 px-3 py-2 font-display text-sm text-charcoal focus:border-teal focus:outline-none" /></div>
              <div><label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Adults</label><input type="number" value={form.adults} onChange={(e) => setForm((f) => ({ ...f, adults: Number(e.target.value) }))} min={1} max={selectedRoom?.maxGuests || 6} className="w-full rounded-lg border border-charcoal/10 bg-ivory-deep/30 px-3 py-2 font-display text-sm text-charcoal focus:border-teal focus:outline-none" /></div>
              <div><label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Children</label><input type="number" value={form.children} onChange={(e) => setForm((f) => ({ ...f, children: Number(e.target.value) }))} min={0} max={4} className="w-full rounded-lg border border-charcoal/10 bg-ivory-deep/30 px-3 py-2 font-display text-sm text-charcoal focus:border-teal focus:outline-none" /></div>
            </div>
            <div><label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft"><MessageSquare className="mr-1 inline h-3 w-3" /> Special Requests</label><textarea value={form.specialRequests} onChange={set("specialRequests")} rows={2} placeholder="Early check-in, extra pillows..." className="w-full rounded-lg border border-charcoal/10 bg-ivory-deep/30 px-3 py-2 font-display text-sm text-charcoal placeholder:text-charcoal-soft/50 focus:border-teal focus:outline-none" /></div>
            {selectedRoom && nights > 0 && (
              <div className="rounded-xl border border-teal/20 bg-teal/5 p-4">
                <h4 className="mb-2 font-serif text-sm font-semibold text-charcoal">Price Summary</h4>
                <div className="space-y-1 font-display text-xs text-charcoal-soft">
                  <div className="flex justify-between"><span>{selectedRoom.name} x {nights} night{nights > 1 ? "s" : ""}</span><span className="text-charcoal">₹{subtotal.toLocaleString("en-IN")}</span></div>
                  <div className="flex justify-between"><span>GST (12%)</span><span className="text-charcoal">₹{taxesGst.toLocaleString("en-IN")}</span></div>
                  <div className="flex justify-between"><span>Service Fee (5%)</span><span className="text-charcoal">₹{serviceFee.toLocaleString("en-IN")}</span></div>
                  <div className="flex justify-between border-t border-charcoal/10 pt-2 font-serif text-sm font-bold text-charcoal"><span>Total</span><span>₹{totalAmount.toLocaleString("en-IN")}</span></div>
                </div>
              </div>
            )}
            {error && <div className="flex items-center gap-2 rounded-lg bg-marsala/10 px-3 py-2 font-display text-xs text-marsala"><AlertCircle className="h-3.5 w-3.5" /> {error}</div>}
          </div>
        </div>
        <div className="flex gap-2 border-t border-charcoal/10 px-6 py-4">
          <button onClick={onClose} className="flex-1 rounded-full border border-charcoal/15 py-2 font-display text-xs font-semibold text-charcoal-soft hover:bg-charcoal/5">Cancel</button>
          <button onClick={handleSubmit} disabled={creating || !form.roomId || !form.guestName || !form.guestEmail || !form.checkOut} className="flex-1 rounded-full bg-teal py-2 font-display text-xs font-semibold text-ivory hover:bg-teal-deep disabled:opacity-50">{creating ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : `Create Booking — ₹${totalAmount.toLocaleString("en-IN")}`}</button>
        </div>
      </div>
    </div>
  );
}
