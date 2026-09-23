"use client";
import { useEffect, useState, useCallback } from "react";
import {
  BedDouble, CalendarDays, AlertTriangle,
  CheckCircle2, ChevronLeft, ChevronRight,
  Plus, Eye,
} from "lucide-react";
import { adminApi, LoadingSpinner, ErrorState, KpiCard } from "./_shared";
import { ManualBookingModal } from "./ManualBookingModal";

type Booking = {
  id: string; referenceCode: string; guestName: string;
  checkIn: string; checkOut: string; nights: number;
  status: string; totalAmount: number; roomId: string;
};

type InventoryRoom = {
  id: string; name: string; slug: string; basePrice: number;
  totalCount: number; maxGuests: number; badge: string | null;
  bookedCount: number; availableCount: number;
  activeBookings: Booking[];
};

export function InventoryTab() {
  const [rooms, setRooms] = useState<InventoryRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [viewDate, setViewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [detailRoom, setDetailRoom] = useState<string | null>(null);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    adminApi.get("inventory", { date: viewDate }).then((data: any) => {
      if (cancelled) return;
      if (!data) { setError(true); setLoading(false); return; }
      setRooms(data.rooms || []);
      setLoading(false);
    }).catch(() => { if (!cancelled) { setError(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, [viewDate]);

  useEffect(() => { const c = load(); return c; }, [load]);
  const retry = () => { setError(false); load(); };
  const shiftDate = (days: number) => {
    const d = new Date(viewDate);
    d.setDate(d.getDate() + days);
    setViewDate(d.toISOString().slice(0, 10));
  };

  const totalInventory = rooms.reduce((s, r) => s + r.totalCount, 0);
  const totalBooked = rooms.reduce((s, r) => s + r.bookedCount, 0);
  const totalAvailable = rooms.reduce((s, r) => s + r.availableCount, 0);
  const occupancyPct = totalInventory > 0 ? Math.round((totalBooked / totalInventory) * 100) : 0;
  const dateObj = new Date(viewDate + "T00:00:00");
  const dateLabel = dateObj.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const isToday = viewDate === new Date().toISOString().slice(0, 10);

  if (error) return <ErrorState title="Unable to load inventory" message="Please retry." onRetry={retry} />;

  return (
    <div className="space-y-6">
      {showBookingModal && (
        <ManualBookingModal
          preselectedRoomId={selectedRoomId}
          onClose={() => { setShowBookingModal(false); setSelectedRoomId(null); }}
          onCreated={() => { setShowBookingModal(false); setSelectedRoomId(null); load(); }}
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl font-bold text-charcoal">Room Inventory</h2>
          <p className="font-display text-xs text-charcoal-soft">Real-time room availability &amp; occupancy management</p>
        </div>
        <button onClick={() => setShowBookingModal(true)} className="inline-flex items-center gap-1.5 rounded-full bg-teal px-4 py-2 font-display text-xs font-semibold text-ivory hover:bg-teal-deep">
          <Plus className="h-3.5 w-3.5" /> Manual Booking
        </button>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-charcoal/10 bg-white px-4 py-3">
        <button onClick={() => shiftDate(-1)} className="rounded-full p-1.5 text-charcoal-soft hover:bg-charcoal/5"><ChevronLeft className="h-4 w-4" /></button>
        <div className="text-center">
          <div className="font-serif text-lg font-semibold text-charcoal">{dateLabel}</div>
          <div className="font-display text-[10px] uppercase tracking-wider text-charcoal-soft">{isToday ? "Today" : "Selected Date"}</div>
        </div>
        <button onClick={() => shiftDate(1)} className="rounded-full p-1.5 text-charcoal-soft hover:bg-charcoal/5"><ChevronRight className="h-4 w-4" /></button>
        <input type="date" value={viewDate} onChange={(e) => setViewDate(e.target.value)} className="rounded-lg border border-charcoal/10 bg-ivory-deep/30 px-2 py-1 font-display text-xs text-charcoal focus:border-teal focus:outline-none" />
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <KpiCard icon={BedDouble} label="Total Inventory" value={String(totalInventory)} accent="teal" />
        <KpiCard icon={CalendarDays} label="Booked Tonight" value={String(totalBooked)} sub={`${occupancyPct}% occupancy`} accent="gold" />
        <KpiCard icon={CheckCircle2} label="Available" value={String(totalAvailable)} accent="teal" />
        <KpiCard icon={AlertTriangle} label="Overbooked Rooms" value={String(rooms.filter(r => r.availableCount < 0).length)} accent="marsala" />
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="space-y-3">
          {rooms.map((room) => {
            const pct = room.totalCount > 0 ? Math.round((room.bookedCount / room.totalCount) * 100) : 0;
            const statusColor = room.availableCount <= 0 ? "text-marsala" : room.availableCount <= 1 ? "text-gold-deep" : "text-teal";
            const statusBg = room.availableCount <= 0 ? "bg-marsala/10" : room.availableCount <= 1 ? "bg-gold/10" : "bg-teal/10";
            const showDetail = detailRoom === room.id;
            return (
              <div key={room.id} className="overflow-hidden rounded-2xl border border-charcoal/10 bg-white">
                <div className="flex items-center gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-base font-semibold text-charcoal">{room.name}</span>
                      {room.badge && <span className="rounded-full bg-teal/10 px-2 py-0.5 font-display text-[9px] font-semibold uppercase tracking-wider text-teal">{room.badge}</span>}
                    </div>
                    <div className="mt-1 flex items-center gap-3 font-display text-xs text-charcoal-soft">
                      <span>₹{room.basePrice.toLocaleString("en-IN")}/night</span><span>·</span>
                      <span>Max {room.maxGuests} guests</span><span>·</span><span>Total: {room.totalCount}</span>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${statusBg}`}>
                    <span className={`font-serif text-lg font-bold ${statusColor}`}>{room.availableCount}</span>
                    <span className={`font-display text-[10px] uppercase tracking-wider ${statusColor}`}>avail</span>
                  </div>
                  <div className="hidden w-24 sm:block">
                    <div className="mb-1 flex justify-between font-display text-[9px] text-charcoal-soft"><span>{pct}%</span><span>{room.bookedCount}/{room.totalCount}</span></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-charcoal/10">
                      <div className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-marsala" : pct >= 80 ? "bg-gold" : "bg-teal"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setDetailRoom(showDetail ? null : room.id)} className="rounded-full p-1.5 text-charcoal-soft/50 transition-colors hover:bg-charcoal/5 hover:text-charcoal" title={showDetail ? "Hide" : "Show bookings"}><Eye className="h-4 w-4" /></button>
                    <button onClick={() => { setSelectedRoomId(room.id); setShowBookingModal(true); }} className="rounded-full p-1.5 text-teal/50 transition-colors hover:bg-teal/10 hover:text-teal" title="Book this room"><Plus className="h-4 w-4" /></button>
                  </div>
                </div>
                {showDetail && (
                  <div className="border-t border-charcoal/10 bg-ivory-deep/10 px-4 py-3">
                    {room.activeBookings.length === 0 ? (
                      <p className="py-4 text-center font-display text-xs text-charcoal-soft">No active bookings for this date</p>
                    ) : (
                      <table className="w-full text-left font-display text-xs">
                        <thead className="border-b border-charcoal/10 text-[10px] uppercase tracking-wider text-charcoal-soft">
                          <tr><th className="py-2 pr-3">Ref</th><th className="py-2 pr-3">Guest</th><th className="py-2 pr-3">Check-in</th><th className="py-2 pr-3">Check-out</th><th className="py-2 pr-3">Nights</th><th className="py-2 pr-3">Status</th><th className="py-2 text-right">Amount</th></tr>
                        </thead>
                        <tbody className="divide-y divide-charcoal/8">
                          {room.activeBookings.map((b) => (
                            <tr key={b.id}>
                              <td className="py-2 pr-3 font-mono text-[11px] font-semibold text-charcoal">{b.referenceCode}</td>
                              <td className="py-2 pr-3 text-charcoal-soft">{b.guestName}</td>
                              <td className="py-2 pr-3 text-charcoal-soft">{new Date(b.checkIn).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</td>
                              <td className="py-2 pr-3 text-charcoal-soft">{new Date(b.checkOut).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</td>
                              <td className="py-2 pr-3 text-charcoal-soft">{b.nights}</td>
                              <td className="py-2 pr-3"><span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${b.status === "CONFIRMED" ? "bg-teal/10 text-teal" : b.status === "CHECKED_IN" ? "bg-gold/10 text-gold-deep" : b.status === "CANCELLED" ? "bg-marsala/10 text-marsala" : "bg-charcoal/10 text-charcoal-soft"}`}>{b.status.replace("_", " ")}</span></td>
                              <td className="py-2 text-right font-semibold text-charcoal">₹{b.totalAmount.toLocaleString("en-IN")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border border-charcoal/10 bg-white p-4">
        <h3 className="mb-3 font-serif text-sm font-semibold text-charcoal">7-Day Occupancy Forecast</h3>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }, (_, i) => {
            const d = new Date(); d.setDate(d.getDate() + i);
            const key = d.toISOString().slice(0, 10);
            const dayLabel = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
            const parts = dayLabel.split(" ");
            const isSel = key === viewDate;
            return (
              <button key={key} onClick={() => setViewDate(key)} className={`rounded-xl p-2 text-center transition-colors ${isSel ? "bg-teal text-ivory" : "bg-ivory-deep/30 text-charcoal hover:bg-charcoal/5"}`}>
                <div className="font-display text-[9px] uppercase">{parts[0]}</div>
                <div className="font-serif text-base font-bold">{parts[1]}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
