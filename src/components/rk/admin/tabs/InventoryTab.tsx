"use client";
import { useEffect, useState, useCallback } from "react";
import {
  BedDouble, CalendarDays, AlertTriangle,
  CheckCircle2, ChevronLeft, ChevronRight,
  Plus, Eye, Lock, LockOpen, IndianRupee, Loader2, X, Save, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminApi, adminFetch, LoadingSpinner, ErrorState, KpiCard } from "./_shared";
import { ManualBookingModal } from "./ManualBookingModal";
import { toast } from "sonner";

type Booking = {
  id: string; referenceCode: string; guestName: string;
  checkIn: string; checkOut: string; nights: number;
  status: string; totalAmount: number; roomId: string;
};

type InventoryRoom = {
  id: string; name: string; slug: string; basePrice: number;
  totalCount: number; maxGuests: number; badge: string | null;
  bookedCount: number; availableCount: number;
  closed?: boolean; sellableOverride?: number | null;
  activeBookings: Booking[];
};

type GridDay = { booked: number; closed: boolean; override: number | null; sellable: number; note: string | null };
type GridRoom = { id: string; name: string; slug: string; totalCount: number; badge: string | null; days: Record<string, GridDay> };
type GridData = { startDate: string; days: number; keys: string[]; rooms: GridRoom[] };

/* ── Day-wise pricing (Phase 5) — OTA-style per-plan per-date rates ── */
type PricingPlan = { id: string; roomId: string; roomName: string; code: string; name: string; pricePerNight: number };
type DayRateRow = { id: string; date: string; price: number; note: string | null };

function nextKeys(from: string, count: number): string[] {
  const keys: string[] = [];
  const d = new Date(from + "T00:00:00");
  for (let i = 0; i < count; i++) {
    keys.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return keys;
}

export function InventoryTab() {
  const [rooms, setRooms] = useState<InventoryRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [viewDate, setViewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [detailRoom, setDetailRoom] = useState<string | null>(null);
  // Day-by-day open/close grid (14 days from the viewed date)
  const [grid, setGrid] = useState<GridData | null>(null);
  const [gridSaving, setGridSaving] = useState<string | null>(null); // "roomId:date"

  // Day-wise pricing state
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [pricingPlanId, setPricingPlanId] = useState("");
  const [priceStrip, setPriceStrip] = useState<Record<string, DayRateRow>>({});
  const [priceLoading, setPriceLoading] = useState(false);
  const [priceModalDate, setPriceModalDate] = useState<string | null>(null);
  const [bulkFrom, setBulkFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [bulkTo, setBulkTo] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 13);
    return d.toISOString().slice(0, 10);
  });
  const [bulkPrice, setBulkPrice] = useState(0);
  const [bulkWeekend, setBulkWeekend] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    adminApi.get("inventory", { date: viewDate }).then((data: any) => {
      if (cancelled) return;
      if (!data) { setError(true); setLoading(false); return; }
      setRooms(data.rooms || []);
      setLoading(false);
    }).catch(() => { if (!cancelled) { setError(true); setLoading(false); } });
    // Load the editable 14-day open/close grid in parallel
    adminFetch(`/api/admin/inventory?startDate=${viewDate}&days=14`).then((data: any) => {
      if (cancelled) return;
      if (data && !data.error) setGrid(data);
    }).catch(() => { /* grid is auxiliary — day view still works */ });
    return () => { cancelled = true; };
  }, [viewDate]);

  useEffect(() => { const c = load(); return c; }, [load]);

  // Load active rate plans once (cross-room) for the pricing panel.
  useEffect(() => {
    let cancelled = false;
    adminFetch("/api/admin/plans").then((d: any) => {
      if (cancelled || !d) return;
      const list: PricingPlan[] = (d.plans || []).map((p: any) => ({
        id: p.id, roomId: p.roomId, roomName: p.roomName || "", code: p.code, name: p.name, pricePerNight: p.pricePerNight,
      }));
      setPlans(list);
      if (list.length > 0) setPricingPlanId((cur) => (cur && list.some((p) => p.id === cur) ? cur : list[0].id));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Load the 14-day price strip for the selected plan.
  const loadPriceStrip = useCallback(async () => {
    if (!pricingPlanId) { setPriceStrip({}); return; }
    setPriceLoading(true);
    try {
      const end = new Date(viewDate + "T00:00:00");
      end.setDate(end.getDate() + 13);
      const d = await adminFetch(`/api/admin/plans/day-rates?planId=${pricingPlanId}&startDate=${viewDate}&endDate=${end.toISOString().slice(0, 10)}`);
      if (d && !d.error) {
        const map: Record<string, DayRateRow> = {};
        for (const r of d.rates || []) map[r.date] = r;
        setPriceStrip(map);
      }
    } catch { /* strip is auxiliary */ }
    finally { setPriceLoading(false); }
  }, [pricingPlanId, viewDate]);

  useEffect(() => { loadPriceStrip(); }, [loadPriceStrip]);

  const pricingPlan = plans.find((p) => p.id === pricingPlanId) || null;
  const priceKeys = nextKeys(viewDate, 14);

  /** Bulk-set or bulk-clear day rates for the selected plan. */
  const applyBulk = async (reset: boolean) => {
    if (!pricingPlan) return;
    if (!reset && (!bulkPrice || bulkPrice <= 0)) { toast.error("Enter a price per night first"); return; }
    if (new Date(bulkTo) < new Date(bulkFrom)) { toast.error("'To' must be on or after 'From'"); return; }
    setBulkSaving(true);
    try {
      const res = await adminFetch("/api/admin/plans/day-rates", {
        method: "POST",
        body: JSON.stringify(reset
          ? { planId: pricingPlan.id, from: bulkFrom, to: bulkTo, reset: true }
          : { planId: pricingPlan.id, from: bulkFrom, to: bulkTo, price: bulkPrice, onlyDays: bulkWeekend ? "weekend" : "all" }),
      });
      if (res && !res.error) {
        toast.success(res.reset ? `Cleared overrides for ${res.count} days` : `Set ₹${bulkPrice}/night for ${res.count} days${bulkWeekend ? " (weekends)" : ""}`);
        await loadPriceStrip();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bulk update failed");
    } finally { setBulkSaving(false); }
  };

  const retry = () => { setError(false); load(); };
  const shiftDate = (days: number) => {
    const d = new Date(viewDate);
    d.setDate(d.getDate() + days);
    setViewDate(d.toISOString().slice(0, 10));
  };

  /** Toggle a room-type OPEN/CLOSED for one calendar day. */
  const toggleDay = async (roomId: string, date: string, currentlyClosed: boolean) => {
    const key = `${roomId}:${date}`;
    setGridSaving(key);
    try {
      const r = await adminFetch("/api/admin/inventory", {
        method: "POST",
        body: JSON.stringify({ roomId, date, isClosed: !currentlyClosed }),
      });
      if (r && !r.error) {
        // refresh grid + day view so both stay in sync
        const g = await adminFetch(`/api/admin/inventory?startDate=${viewDate}&days=14`);
        if (g && !g.error) setGrid(g);
        adminApi.get("inventory", { date: viewDate }).then((data: any) => {
          if (data && !data.error) setRooms(data.rooms || []);
        });
      }
    } finally {
      setGridSaving(null);
    }
  };

  /** Shift+click a cell → set a custom sellable limit for that day (empty = reset). */
  const setDayLimit = async (roomId: string, date: string, roomName: string, current: number | null) => {
    const input = window.prompt(
      `Sellable rooms for ${roomName} on ${date}\n\n` +
      `Current: ${current === null ? "default (all rooms)" : current}\n` +
      `Enter a number to limit how many rooms can be sold that day,\nor leave empty to reset to default:`,
      current === null ? "" : String(current)
    );
    if (input === null) return; // cancelled
    const key = `${roomId}:${date}`;
    setGridSaving(key);
    try {
      const trimmed = input.trim();
      const body = trimmed === ""
        ? { roomId, date, reset: true }
        : { roomId, date, sellableOverride: parseInt(trimmed, 10) };
      if (trimmed !== "" && (!Number.isInteger(body.sellableOverride) || (body.sellableOverride as number) < 0)) {
        window.alert("Please enter a whole number 0 or greater (or leave empty to reset).");
        return;
      }
      const r = await adminFetch("/api/admin/inventory", { method: "POST", body: JSON.stringify(body) });
      if (r && !r.error) {
        const g = await adminFetch(`/api/admin/inventory?startDate=${viewDate}&days=14`);
        if (g && !g.error) setGrid(g);
        adminApi.get("inventory", { date: viewDate }).then((data: any) => {
          if (data && !data.error) setRooms(data.rooms || []);
        });
      }
    } finally {
      setGridSaving(null);
    }
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
                  <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${room.closed ? "bg-marsala/10" : statusBg}`}>
                    {room.closed && <Lock className="h-3.5 w-3.5 text-marsala" />}
                    <span className={`font-serif text-lg font-bold ${room.closed ? "text-marsala" : statusColor}`}>
                      {room.closed ? "Closed" : room.availableCount}
                    </span>
                    {!room.closed && <span className={`font-display text-[10px] uppercase tracking-wider ${statusColor}`}>avail</span>}
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

      {/* Day-by-day OPEN/CLOSE inventory control (Phase 4) */}
      {grid && grid.rooms.length > 0 && (
        <div className="rounded-2xl border border-charcoal/10 bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-serif text-sm font-semibold text-charcoal">Open / Close inventory by day</h3>
              <p className="mt-0.5 font-display text-[11px] text-charcoal-soft">
                Click a cell to close/reopen that room type for the day — closed days are blocked for bookings instantly.
                Shift+click to set a custom sellable limit (empty = reset). Next 14 days from {dateLabel}.
              </p>
            </div>
            <div className="flex items-center gap-3 font-display text-[10px] text-charcoal-soft">
              <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-teal/15" /> open (rooms left)</span>
              <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded bg-marsala/15" /> closed</span>
              <span className="inline-flex items-center gap-1"><LockOpen className="h-3 w-3" /> custom limit</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-white px-2 py-2 text-left font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Room type</th>
                  {grid.keys.map((key) => {
                    const d = new Date(key + "T00:00:00");
                    return (
                      <th key={key} className={`px-1 py-2 text-center font-display text-[10px] uppercase tracking-wider ${key === viewDate ? "text-teal" : "text-charcoal-soft"}`}>
                        <div>{d.toLocaleDateString("en-IN", { weekday: "short" })}</div>
                        <div className="font-serif text-xs font-bold text-charcoal">{d.getDate()}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {grid.rooms.map((room) => (
                  <tr key={room.id} className="border-t border-charcoal/5">
                    <td className="sticky left-0 z-10 bg-white px-2 py-1.5">
                      <div className="font-serif text-xs font-semibold text-charcoal">{room.name}</div>
                      <div className="font-display text-[9px] text-charcoal-soft">{room.totalCount} total</div>
                    </td>
                    {grid.keys.map((key) => {
                      const day = room.days[key];
                      if (!day) return <td key={key} />;
                      const saving = gridSaving === `${room.id}:${key}`;
                      const left = Math.max(0, day.sellable - day.booked);
                      const tooltip = `${room.name} — ${key}\nBooked: ${day.booked}\nSellable: ${day.closed ? "CLOSED" : day.override !== null ? `${day.override} (custom limit)` : `${room.totalCount} (default)`}\n\nClick: ${day.closed ? "REOPEN" : "CLOSE"} this day\nShift+click: set custom sellable limit`;
                      return (
                        <td key={key} className="px-0.5 py-1">
                          <button
                            disabled={saving}
                            onClick={(e) => {
                              if (e.shiftKey) setDayLimit(room.id, key, room.name, day.override);
                              else toggleDay(room.id, key, day.closed);
                            }}
                            title={tooltip}
                            className={`relative h-10 w-full min-w-[44px] rounded-lg font-serif text-sm font-bold transition-all disabled:opacity-50 ${
                              day.closed
                                ? "bg-marsala/15 text-marsala hover:bg-marsala/25"
                                : day.override !== null
                                ? "bg-gold/15 text-gold-deep ring-1 ring-inset ring-gold/40 hover:bg-gold/25"
                                : left === 0
                                ? "bg-charcoal/10 text-charcoal/40 hover:bg-charcoal/15"
                                : "bg-teal/10 text-teal hover:bg-teal hover:text-ivory"
                            }`}
                          >
                            {saving ? "…" : day.closed ? (
                              <Lock className="mx-auto h-4 w-4" />
                            ) : (
                              <>
                                {left}
                                {day.override !== null && <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-gold-deep" />}
                              </>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Day-wise pricing (Phase 5) — OTA-style per-plan rates */}
      <div className="rounded-2xl border border-charcoal/10 bg-white p-4">
        <div className="mb-3">
          <h3 className="font-serif text-sm font-semibold text-charcoal">Day-wise pricing (OTA rates)</h3>
          <p className="mt-0.5 font-display text-[11px] text-charcoal-soft">
            Set a different price for any day — festival surge, weekend rates, offers. Guests see these exact prices at checkout.
          </p>
        </div>

        {plans.length === 0 ? (
          <div className="rounded-xl border border-dashed border-charcoal/15 bg-ivory-deep/20 p-6 text-center">
            <p className="font-display text-xs text-charcoal-soft">
              No rate plans yet. Create EP / CP / MAP / AP plans in <b>Rooms → Plans</b> first — then day-wise pricing can be set per plan here.
            </p>
          </div>
        ) : (
          <>
            {/* Plan selector pills */}
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              {plans.map((p) => {
                const sel = p.id === pricingPlanId;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPricingPlanId(p.id)}
                    className={`rounded-full border px-3 py-1.5 font-display text-[11px] font-semibold transition-colors ${
                      sel ? "border-teal bg-teal text-ivory" : "border-charcoal/15 bg-white text-charcoal-soft hover:border-teal/40"
                    }`}
                  >
                    {p.code} · {p.roomName} · ₹{p.pricePerNight.toLocaleString("en-IN")}
                  </button>
                );
              })}
            </div>

            {/* 14-day price strip */}
            <div className="overflow-x-auto">
              <div className="flex min-w-[900px] gap-1">
                {priceKeys.map((key) => {
                  const d = new Date(key + "T00:00:00");
                  const row = priceStrip[key];
                  const isOverride = !!row;
                  const eff = row ? row.price : pricingPlan?.pricePerNight ?? 0;
                  const isSel = key === viewDate;
                  return (
                    <button
                      key={key}
                      onClick={() => setPriceModalDate(key)}
                      className={`relative min-w-[60px] flex-1 rounded-lg border p-1.5 text-center transition-all ${
                        isOverride ? "border-gold/60 bg-gold/10" : "border-charcoal/8 bg-ivory-deep/20 hover:border-teal/40"
                      } ${isSel ? "ring-1 ring-teal" : ""}`}
                      title={`${key} — click to edit price for ${pricingPlan?.code || "plan"}`}
                    >
                      <div className="font-display text-[8px] uppercase text-charcoal-soft">{d.toLocaleDateString("en-IN", { weekday: "short" })}</div>
                      <div className="font-serif text-[11px] font-bold text-charcoal">{d.getDate()}</div>
                      {priceLoading ? (
                        <Loader2 className="mx-auto h-3 w-3 animate-spin text-charcoal-soft" />
                      ) : (
                        <div className={`font-display text-[10px] font-bold ${isOverride ? "text-gold-deep" : "text-teal"}`}>
                          ₹{eff.toLocaleString("en-IN")}
                        </div>
                      )}
                      {isOverride && <span className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-gold-deep" />}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-3 font-display text-[9px] text-charcoal-soft">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-teal/40" /> plan base price</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-gold/50" /> custom day price</span>
              <span>Click any day to edit — prices apply to the selected plan</span>
            </div>

            {/* Bulk range tools */}
            <div className="mt-3 rounded-xl border border-charcoal/10 bg-ivory-deep/20 p-3">
              <div className="mb-2 font-display text-[10px] font-semibold uppercase tracking-wider text-charcoal-soft">Bulk set — date range</div>
              <div className="flex flex-wrap items-end gap-2">
                <div>
                  <label className="mb-1 block font-display text-[9px] uppercase tracking-wider text-charcoal-soft">From</label>
                  <input type="date" value={bulkFrom} onChange={(e) => setBulkFrom(e.target.value)} className="rounded-lg border border-charcoal/10 bg-white px-2 py-1.5 font-display text-xs text-charcoal focus:border-teal focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block font-display text-[9px] uppercase tracking-wider text-charcoal-soft">To</label>
                  <input type="date" value={bulkTo} onChange={(e) => setBulkTo(e.target.value)} className="rounded-lg border border-charcoal/10 bg-white px-2 py-1.5 font-display text-xs text-charcoal focus:border-teal focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block font-display text-[9px] uppercase tracking-wider text-charcoal-soft">Price ₹/night</label>
                  <input type="number" min={0} value={bulkPrice || ""} onChange={(e) => setBulkPrice(parseInt(e.target.value) || 0)} placeholder="e.g. 6500" className="w-28 rounded-lg border border-charcoal/10 bg-white px-2 py-1.5 font-display text-xs text-charcoal focus:border-teal focus:outline-none" />
                </div>
                <label className="flex cursor-pointer items-center gap-1.5 pb-1.5 font-display text-[11px] text-charcoal">
                  <input type="checkbox" checked={bulkWeekend} onChange={(e) => setBulkWeekend(e.target.checked)} className="h-3.5 w-3.5 rounded border-charcoal/30" />
                  Weekends only
                </label>
                <Button onClick={() => applyBulk(false)} disabled={bulkSaving || !pricingPlan} className="rounded-full bg-teal px-4 py-1.5 text-xs text-ivory hover:bg-teal-deep">
                  {bulkSaving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <IndianRupee className="mr-1 h-3.5 w-3.5" />} Apply
                </Button>
                <Button onClick={() => applyBulk(true)} disabled={bulkSaving || !pricingPlan} variant="outline" className="rounded-full border-charcoal/20 px-4 py-1.5 text-xs text-charcoal-soft hover:border-marsala/40 hover:text-marsala">
                  <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset range
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Single-day price editor */}
      {priceModalDate && pricingPlan && (
        <DayPriceEditor
          plan={pricingPlan}
          date={priceModalDate}
          existing={priceStrip[priceModalDate] || null}
          onClose={() => setPriceModalDate(null)}
          onSaved={() => { setPriceModalDate(null); loadPriceStrip(); }}
        />
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

/* ── Single-day price editor for the selected rate plan ── */
function DayPriceEditor({ plan, date, existing, onClose, onSaved }: {
  plan: PricingPlan;
  date: string;
  existing: DayRateRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [price, setPrice] = useState(existing ? existing.price : plan.pricePerNight);
  const [note, setNote] = useState(existing?.note || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await adminFetch("/api/admin/plans/day-rates", {
        method: "POST",
        body: JSON.stringify({ planId: plan.id, date, price, note }),
      });
      toast.success(`${date}: ₹${price.toLocaleString("en-IN")}/night saved for ${plan.code}`);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally { setSaving(false); }
  };

  const removeOverride = async () => {
    setSaving(true);
    try {
      await adminFetch("/api/admin/plans/day-rates", {
        method: "POST",
        body: JSON.stringify({ planId: plan.id, date, price: 0 }),
      });
      toast.success(`${date}: reverted to plan base (₹${plan.pricePerNight.toLocaleString("en-IN")})`);
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-charcoal/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-ivory p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-1 flex items-center gap-2">
          <span className="rounded-md bg-teal px-2 py-0.5 font-display text-[10px] font-bold tracking-widest text-ivory">{plan.code}</span>
          <span className="font-serif text-sm font-semibold text-charcoal">{plan.roomName}</span>
        </div>
        <h3 className="font-serif text-lg font-semibold text-charcoal">
          {new Date(date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
        </h3>
        <p className="mb-3 font-display text-[11px] text-charcoal-soft">
          Plan base: ₹{plan.pricePerNight.toLocaleString("en-IN")}/night{existing ? " · custom price set" : ""}
        </p>
        <label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Price ₹/night</label>
        <Input type="number" min={0} value={price} onChange={(e) => setPrice(parseInt(e.target.value) || 0)} className="bg-white" />
        <label className="mb-1 mt-3 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Note (optional)</label>
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Janmashtami surge" className="bg-white" />
        <div className="mt-4 flex items-center justify-between">
          {existing ? (
            <Button onClick={removeOverride} disabled={saving} variant="outline" className="rounded-full border-marsala/30 text-marsala hover:bg-marsala hover:text-ivory">
              <RotateCcw className="mr-1 h-3.5 w-3.5" /> Use base price
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline" className="rounded-full">Cancel</Button>
            <Button onClick={save} disabled={saving || price <= 0} className="rounded-full bg-teal px-5 text-ivory hover:bg-teal-deep">
              <Save className="mr-1.5 h-4 w-4" /> Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
