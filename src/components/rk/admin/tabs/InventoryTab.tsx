"use client";
import { Fragment, useEffect, useState, useCallback } from "react";
import {
  BedDouble, CalendarDays, AlertTriangle,
  CheckCircle2, ChevronLeft, ChevronRight, ChevronDown,
  Plus, Eye, Lock, LockOpen, IndianRupee, Loader2, X, Save, RotateCcw,
  Ban, User, Users, UserPlus, Baby,
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

/* ── Plan rate calendar (Phase 6) — OTA-style day × plan × occupancy matrix ── */
type PlanLite = {
  id: string; roomId: string; roomName: string; code: string; name: string;
  pricePerNight: number; priceSingle: number | null;
  extraAdultPrice: number; extraChildPrice: number;
  isActive: boolean; sortOrder: number;
};
type DayRateRow = {
  id: string; date: string; price: number;
  priceSingle: number | null; extraAdultPrice: number | null; extraChildPrice: number | null;
  isClosed: boolean; note: string | null;
};
type OccKind = "single" | "double" | "adult" | "child";

/** UTC-anchored ISO day keys — no timezone drift. */
function dayKeys(startISO: string, count: number): string[] {
  const keys: string[] = [];
  const d = new Date(startISO + "T00:00:00Z");
  for (let i = 0; i < count; i++) {
    keys.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return keys;
}

/** Effective rate for one occupancy kind: day override first, plan base fallback. */
function effRate(plan: PlanLite, row: DayRateRow | undefined, kind: OccKind): { value: number; isOverride: boolean } {
  const base =
    kind === "double" ? plan.pricePerNight
    : kind === "single" ? (plan.priceSingle && plan.priceSingle > 0 ? plan.priceSingle : plan.pricePerNight)
    : kind === "adult" ? (plan.extraAdultPrice || 0)
    : (plan.extraChildPrice || 0);
  if (!row) return { value: base, isOverride: false };
  const o =
    kind === "double" ? row.price
    : kind === "single" ? row.priceSingle
    : kind === "adult" ? row.extraAdultPrice
    : row.extraChildPrice;
  if (o != null && o > 0) return { value: o, isOverride: true };
  return { value: base, isOverride: false };
}

const OCC_ROWS: { kind: OccKind; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { kind: "single", label: "1 Person", Icon: User },
  { kind: "double", label: "2 Persons", Icon: Users },
  { kind: "adult", label: "+1 Adult", Icon: UserPlus },
  { kind: "child", label: "+1 Child", Icon: Baby },
];

/** Weekend (Sat/Sun) day keys inside an inclusive range — for bulk inventory. */
function weekendDaysIn(fromISO: string, toISO: string): string[] {
  const out: string[] = [];
  const d = new Date(fromISO + "T00:00:00Z");
  const to = new Date(toISO + "T00:00:00Z");
  while (d <= to && out.length < 200) {
    const wd = d.getUTCDay();
    if (wd === 0 || wd === 6) out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

function fmtDayHeader(key: string) {
  const d = new Date(key + "T00:00:00Z");
  return {
    weekday: d.toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" }),
    day: d.toLocaleDateString("en-IN", { day: "numeric", timeZone: "UTC" }),
  };
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

  // ── Plan rate calendar state (OTA matrix) ──
  const [plans, setPlans] = useState<PlanLite[]>([]);
  const [matrixRoomId, setMatrixRoomId] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [rateMaps, setRateMaps] = useState<Record<string, Record<string, DayRateRow>>>({});
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [savingCell, setSavingCell] = useState<string | null>(null); // "planId:date" quick toggles
  const [editor, setEditor] = useState<{ planId: string; date: string } | null>(null);
  // Bulk tools
  const [bulkPlanSel, setBulkPlanSel] = useState("all");
  const [bulkFrom, setBulkFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [bulkTo, setBulkTo] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 13);
    return d.toISOString().slice(0, 10);
  });
  const [bulkDouble, setBulkDouble] = useState(0);
  const [bulkSingle, setBulkSingle] = useState(0);
  const [bulkAdult, setBulkAdult] = useState(0);
  const [bulkChild, setBulkChild] = useState(0);
  const [bulkClosed, setBulkClosed] = useState<"any" | "open" | "closed">("any");
  const [bulkWeekend, setBulkWeekend] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  // Per-day inventory row inside the plan-rate matrix (sellable rooms for the selected room type)
  const [invMap, setInvMap] = useState<Record<string, { id: string | null; override: number | null; closed: boolean; booked: number }>>({});
  const [invEditing, setInvEditing] = useState<string | null>(null); // date key being edited
  const [invEditVal, setInvEditVal] = useState("");
  const [invSaving, setInvSaving] = useState<string | null>(null);
  const [bulkInventory, setBulkInventory] = useState(0); // 0 = skip inventory in bulk apply

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

  // Load ALL rate plans once (cross-room, incl. occupancy rates) for the matrix.
  useEffect(() => {
    let cancelled = false;
    adminFetch("/api/admin/plans").then((d: any) => {
      if (cancelled || !d) return;
      const list: PlanLite[] = (d.plans || []).map((p: any) => ({
        id: p.id, roomId: p.roomId, roomName: p.roomName || "", code: p.code, name: p.name,
        pricePerNight: p.pricePerNight, priceSingle: p.priceSingle ?? null,
        extraAdultPrice: p.extraAdultPrice || 0, extraChildPrice: p.extraChildPrice || 0,
        isActive: p.isActive, sortOrder: p.sortOrder || 0,
      }));
      setPlans(list);
      setMatrixRoomId((cur) => (cur && list.some((p) => p.roomId === cur) ? cur : list[0]?.roomId || ""));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const roomPlans = plans.filter((p) => p.roomId === matrixRoomId);
  const planRooms = (() => {
    const map = new Map<string, string>();
    for (const p of plans) if (!map.has(p.roomId)) map.set(p.roomId, p.roomName);
    return Array.from(map.entries()).map(([roomId, roomName]) => ({
      roomId, roomName, count: plans.filter((p) => p.roomId === roomId).length,
    }));
  })();
  const keys = dayKeys(viewDate, 14);
  const matrixTotal = rooms.find((r) => r.id === matrixRoomId)?.totalCount ?? 0;

  /** Load the 14-day override rows for every plan of the selected room. */
  const loadMatrix = useCallback(async () => {
    if (!matrixRoomId) { setRateMaps({}); return; }
    const targets = plans.filter((p) => p.roomId === matrixRoomId);
    if (targets.length === 0) { setRateMaps({}); return; }
    setMatrixLoading(true);
    const end = dayKeys(viewDate, 14)[13];
    try {
      const [results, inv] = await Promise.all([
        Promise.all(targets.map(async (p) => {
          try {
            const d = await adminFetch(`/api/admin/plans/day-rates?planId=${p.id}&startDate=${viewDate}&endDate=${end}`);
            const map: Record<string, DayRateRow> = {};
            for (const r of d?.rates || []) map[r.date] = r;
            return [p.id, map] as const;
          } catch { return [p.id, {}] as const; }
        })),
        // Day-wise sellable inventory for the selected room (Inventory row in the matrix)
        adminFetch(`/api/admin/inventory?roomId=${matrixRoomId}&startDate=${viewDate}&endDate=${end}`).catch(() => null),
      ]);
      setRateMaps(Object.fromEntries(results));
      const invMapData: Record<string, { id: string | null; override: number | null; closed: boolean; booked: number }> = {};
      const invOverrides: any[] = inv && !inv.error ? inv.overrides || [] : [];
      const invBooked: Record<string, number> = inv && !inv.error ? inv.bookedMap || {} : {};
      for (const k of dayKeys(viewDate, 14)) {
        const o = invOverrides.find((x) => x.date === k);
        invMapData[k] = { id: o?.id ?? null, override: o ? o.availableCount : null, closed: !!o?.isClosed, booked: invBooked[k] || 0 };
      }
      setInvMap(invMapData);
    } finally { setMatrixLoading(false); }
  }, [matrixRoomId, plans, viewDate]);

  useEffect(() => { loadMatrix(); }, [loadMatrix]);

  /** Save the Inventory cell for one day (empty value = reset to default). */
  const saveInvCell = async (dateKey: string) => {
    const raw = invEditVal.trim();
    const n = raw === "" ? NaN : parseInt(raw, 10);
    if (raw !== "" && (!Number.isInteger(n) || n < 0)) {
      toast.error("Enter a whole number ≥ 0 — or leave empty to reset to default");
      return;
    }
    setInvSaving(dateKey);
    try {
      if (raw === "") {
        const row = invMap[dateKey];
        if (row?.id) {
          await adminFetch(`/api/admin/inventory?id=${row.id}`, { method: "DELETE" });
          toast.success(`${dateKey}: inventory reverted to default`);
        } else {
          toast.info(`${dateKey}: already using default inventory`);
        }
      } else {
        await adminFetch("/api/admin/inventory", {
          method: "POST",
          body: JSON.stringify({ roomId: matrixRoomId, date: dateKey, availableCount: n }),
        });
        toast.success(`${dateKey}: sellable rooms set to ${n}`);
      }
      await loadMatrix();
      // keep the open/close grid + day view in sync
      adminFetch(`/api/admin/inventory?startDate=${viewDate}&days=14`).then((g: any) => { if (g && !g.error) setGrid(g); }).catch(() => {});
      adminApi.get("inventory", { date: viewDate }).then((data: any) => { if (data && !data.error) setRooms(data.rooms || []); }).catch(() => {});
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save inventory");
    } finally {
      setInvSaving(null);
      setInvEditing(null);
      setInvEditVal("");
    }
  };

  /** Quick open/close a plan for one day (channel-manager 🚫). */
  const quickToggleClosed = async (plan: PlanLite, date: string, currentlyClosed: boolean) => {
    const key = `${plan.id}:${date}`;
    setSavingCell(key);
    try {
      const r = await adminFetch("/api/admin/plans/day-rates", {
        method: "POST",
        body: JSON.stringify({ planId: plan.id, date, isClosed: !currentlyClosed }),
      });
      if (r && !r.error) {
        toast.success(`${plan.code} ${currentlyClosed ? "reopened" : "closed"} for ${date}`, {
          description: currentlyClosed ? "Plan reopened — sellable again." : "Plan closed — guests cannot book it for this day.",
        });
        loadMatrix();
      }
    } finally { setSavingCell(null); }
  };

  /** Bulk set / reset for a date range (one plan or every plan of the room). */
  const applyBulk = async (reset: boolean) => {
    if (!matrixRoomId) return;
    if (!reset) {
      const anyValue = bulkDouble > 0 || bulkSingle > 0 || bulkAdult > 0 || bulkChild > 0 || bulkClosed !== "any" || bulkInventory > 0;
      if (!anyValue) { toast.error("Enter at least one rate, inventory, or choose open/close"); return; }
    }
    if (new Date(bulkTo) < new Date(bulkFrom)) { toast.error("'To' must be on or after 'From'"); return; }
    setBulkSaving(true);
    try {
      const body: Record<string, unknown> = {
        from: bulkFrom, to: bulkTo,
        onlyDays: bulkWeekend ? "weekend" : "all",
      };
      if (bulkPlanSel === "all") body.roomId = matrixRoomId; else body.planId = bulkPlanSel;
      if (reset) body.reset = true;
      else {
        if (bulkDouble > 0) body.price = bulkDouble;
        if (bulkSingle > 0) body.priceSingle = bulkSingle;
        if (bulkAdult > 0) body.extraAdultPrice = bulkAdult;
        if (bulkChild > 0) body.extraChildPrice = bulkChild;
        if (bulkClosed !== "any") body.isClosed = bulkClosed === "closed";
      }
      const res = await adminFetch("/api/admin/plans/day-rates", { method: "POST", body: JSON.stringify(body) });
      if (res && !res.error) {
        toast.success(res.reset ? `Cleared overrides for ${res.count} plan-days` : `Updated ${res.count} plan-days`);
        loadMatrix();
      }
      // Room inventory (independent of plan selection) — same range / weekend filter
      if (bulkInventory > 0) {
        if (bulkWeekend) {
          for (const ds of weekendDaysIn(bulkFrom, bulkTo)) {
            await adminFetch("/api/admin/inventory", { method: "POST", body: JSON.stringify(reset ? { roomId: matrixRoomId, date: ds, reset: true } : { roomId: matrixRoomId, date: ds, availableCount: bulkInventory }) });
          }
        } else {
          await adminFetch("/api/admin/inventory", { method: "POST", body: JSON.stringify(reset ? { roomId: matrixRoomId, date: bulkFrom, dateTo: bulkTo, reset: true } : { roomId: matrixRoomId, date: bulkFrom, dateTo: bulkTo, availableCount: bulkInventory }) });
        }
        toast.success(`Inventory ${reset ? "reset to default" : `set to ${bulkInventory} rooms`} for the range`);
        adminFetch(`/api/admin/inventory?startDate=${viewDate}&days=14`).then((g: any) => { if (g && !g.error) setGrid(g); }).catch(() => {});
        adminApi.get("inventory", { date: viewDate }).then((data: any) => { if (data && !data.error) setRooms(data.rooms || []); }).catch(() => {});
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
          <p className="font-display text-xs text-charcoal-soft">Real-time room availability, day-wise pricing &amp; OTA-style rate calendar</p>
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

      {/* ===== Plan rate calendar — OTA-style day × plan × occupancy matrix (Phase 6) ===== */}
      <div className="rounded-2xl border border-charcoal/10 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-serif text-sm font-semibold text-charcoal">Plan rate calendar — day-wise pricing &amp; open/close</h3>
            <p className="mt-0.5 font-display text-[11px] text-charcoal-soft">
              Channel-manager style: click a price to edit 1-person / 2-person / extra-guest rates for that day — or the stop button to open/close a plan. Guests see these exact prices.
            </p>
          </div>
          <div className="flex items-center gap-3 font-display text-[10px] text-charcoal-soft">
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-teal/30" /> plan base rate</span>
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-gold/50" /> custom day rate</span>
            <span className="inline-flex items-center gap-1"><Ban className="h-3 w-3 text-marsala" /> plan closed</span>
          </div>
        </div>

        {plans.length === 0 ? (
          <div className="rounded-xl border border-dashed border-charcoal/15 bg-ivory-deep/20 p-6 text-center">
            <p className="font-display text-xs text-charcoal-soft">
              No rate plans yet. Create EP / CP / MAP / AP plans in <b>Rooms → Plans</b> first — then this calendar lets you set day-wise prices and open/close each plan.
            </p>
          </div>
        ) : (
          <>
            {/* Room selector pills */}
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              {planRooms.map((r) => {
                const sel = r.roomId === matrixRoomId;
                return (
                  <button
                    key={r.roomId}
                    onClick={() => setMatrixRoomId(r.roomId)}
                    className={`rounded-full border px-3 py-1.5 font-display text-[11px] font-semibold transition-colors ${
                      sel ? "border-teal bg-teal text-ivory" : "border-charcoal/15 bg-white text-charcoal-soft hover:border-teal/40"
                    }`}
                  >
                    {r.roomName} · {r.count} plan{r.count === 1 ? "" : "s"}
                  </button>
                );
              })}
            </div>

            {matrixLoading ? (
              <div className="flex h-24 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-teal" /></div>
            ) : roomPlans.length === 0 ? (
              <p className="py-4 text-center font-display text-xs text-charcoal-soft">No plans for this room.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 bg-white px-2 py-2 text-left font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Plan</th>
                      {keys.map((key) => {
                        const h = fmtDayHeader(key);
                        return (
                          <th key={key} className={`px-0.5 py-2 text-center font-display text-[9px] uppercase tracking-wider ${key === viewDate ? "text-teal" : "text-charcoal-soft"}`}>
                            <div>{h.weekday}</div>
                            <div className="font-serif text-xs font-bold text-charcoal">{h.day}</div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {roomPlans.map((plan) => {
                      const rates = rateMaps[plan.id] || {};
                      const isOpen = !!expanded[plan.id];
                      return (
                        <Fragment key={plan.id}>
                          {/* Plan header row — 2-person sellable rate + stop-sale toggle */}
                          <tr className="border-t border-charcoal/10">
                            <td className="sticky left-0 z-10 bg-ivory-deep/60 px-2 py-1.5">
                              <button onClick={() => setExpanded((e) => ({ ...e, [plan.id]: !isOpen }))} className="flex items-center gap-1.5 text-left" title={isOpen ? "Hide 1p / 2p / extra-guest rows" : "Show 1p / 2p / extra-guest rows"}>
                                {isOpen ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-charcoal-soft" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-charcoal-soft" />}
                                <span className="rounded bg-teal px-1.5 py-0.5 font-display text-[9px] font-bold tracking-widest text-ivory">{plan.code}</span>
                                <span className="font-serif text-xs font-semibold text-charcoal">{plan.name}</span>
                                {!plan.isActive && <span className="rounded-full bg-charcoal/10 px-1.5 py-0.5 font-display text-[8px] uppercase text-charcoal-soft">hidden</span>}
                              </button>
                              <div className="mt-0.5 pl-5 font-display text-[9px] leading-tight text-charcoal-soft">
                                2p ₹{plan.pricePerNight.toLocaleString("en-IN")}
                                {plan.priceSingle ? ` · 1p ₹${plan.priceSingle.toLocaleString("en-IN")}` : ""}
                                {plan.extraAdultPrice > 0 ? ` · +A ₹${plan.extraAdultPrice.toLocaleString("en-IN")}` : ""}
                                {plan.extraChildPrice > 0 ? ` · +C ₹${plan.extraChildPrice.toLocaleString("en-IN")}` : ""}
                              </div>
                            </td>
                            {keys.map((key) => {
                              const row = rates[key];
                              const closed = !!row?.isClosed;
                              const eff = effRate(plan, row, "double");
                              const saving = savingCell === `${plan.id}:${key}`;
                              return (
                                <td key={key} className="px-0.5 py-1 align-top">
                                  <div className="flex flex-col gap-0.5">
                                    <button
                                      onClick={() => setEditor({ planId: plan.id, date: key })}
                                      className={`h-7 w-full min-w-[48px] rounded-md font-serif text-[11px] font-bold transition-colors ${
                                        closed
                                          ? "bg-marsala/15 text-marsala/60 line-through"
                                          : eff.isOverride
                                            ? "bg-gold/20 text-gold-deep ring-1 ring-inset ring-gold/40"
                                            : "bg-teal/10 text-teal hover:bg-teal hover:text-ivory"
                                      }`}
                                      title={`${plan.code} · ${key}\n2-person: ₹${eff.value}${eff.isOverride ? " (custom)" : " (base)"}${closed ? " · CLOSED" : ""}\nClick to edit all rates for this day`}
                                    >
                                      {closed ? "—" : `₹${eff.value.toLocaleString("en-IN")}`}
                                    </button>
                                    <button
                                      onClick={() => quickToggleClosed(plan, key, closed)}
                                      disabled={saving}
                                      className={`mx-auto grid h-4 w-4 place-items-center rounded transition-colors disabled:opacity-40 ${
                                        closed ? "bg-marsala text-ivory" : "bg-charcoal/8 text-charcoal-soft hover:bg-marsala hover:text-ivory"
                                      }`}
                                      title={closed ? "Plan closed this day — click to OPEN" : "Stop-sale: close this plan for this day"}
                                    >
                                      {saving ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Ban className="h-2.5 w-2.5" />}
                                    </button>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                          {/* Expanded occupancy rows — 1 Person / 2 Persons / +1 Adult / +1 Child */}
                          {isOpen && OCC_ROWS.map(({ kind, label, Icon }) => (
                            <tr key={kind} className="border-t border-charcoal/5">
                              <td className="sticky left-0 z-10 bg-white px-2 py-0.5 pl-7">
                                <span className="flex items-center gap-1.5 font-display text-[10px] text-charcoal-soft">
                                  <Icon className="h-3 w-3 text-teal/60" /> {label}
                                </span>
                              </td>
                              {keys.map((key) => {
                                const row = rates[key];
                                const closed = !!row?.isClosed;
                                const eff = effRate(plan, row, kind);
                                return (
                                  <td key={key} className="px-0.5 py-0.5">
                                    <button
                                      onClick={() => setEditor({ planId: plan.id, date: key })}
                                      className={`h-6 w-full min-w-[48px] rounded-md font-display text-[10px] font-semibold transition-colors ${
                                        closed
                                          ? "bg-charcoal/5 text-charcoal/30"
                                          : eff.isOverride
                                            ? "bg-gold/15 text-gold-deep"
                                            : "bg-white text-charcoal-soft ring-1 ring-inset ring-charcoal/8 hover:ring-teal/40"
                                      }`}
                                      title={`${plan.code} · ${label} · ${key}\n₹${eff.value}${eff.isOverride ? " (custom)" : " (plan base)"}${closed ? " · plan CLOSED" : ""}\nClick to edit`}
                                    >
                                      {closed ? "—" : eff.value > 0 ? `₹${eff.value.toLocaleString("en-IN")}` : "free"}
                                    </button>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </Fragment>
                      );
                    })}
                    {/* Inventory row — day-wise sellable rooms for the selected room type */}
                    <tr className="border-t border-charcoal/10 bg-ivory-deep/40">
                      <td className="sticky left-0 z-10 bg-ivory-deep/90 px-2 py-1.5">
                        <span className="flex items-center gap-1.5 font-display text-[10px] font-semibold uppercase tracking-wider text-charcoal-soft">
                          <BedDouble className="h-3 w-3 text-teal/70" /> Inventory
                        </span>
                        <span className="mt-0.5 block font-display text-[9px] leading-tight text-charcoal-soft/70">rooms sellable · click to edit</span>
                      </td>
                      {keys.map((key) => {
                        const inv = invMap[key];
                        const booked = inv?.booked ?? 0;
                        const override = inv?.override ?? null;
                        const closed = !!inv?.closed || override === 0;
                        const sellable = closed ? 0 : (override ?? matrixTotal);
                        const left = Math.max(0, sellable - booked);
                        const editing = invEditing === key;
                        const saving = invSaving === key;
                        return (
                          <td key={key} className="px-0.5 py-1 align-top">
                            {editing ? (
                              <div className="flex flex-col gap-0.5">
                                <input
                                  autoFocus
                                  type="number"
                                  min={0}
                                  value={invEditVal}
                                  onChange={(e) => setInvEditVal(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveInvCell(key);
                                    if (e.key === "Escape") { setInvEditing(null); setInvEditVal(""); }
                                  }}
                                  placeholder={String(override ?? matrixTotal)}
                                  className="h-7 w-full min-w-[48px] rounded-md border border-teal/50 bg-white px-1 text-center font-serif text-[11px] font-bold text-charcoal focus:border-teal focus:outline-none"
                                />
                                <div className="flex gap-0.5">
                                  <button onClick={() => saveInvCell(key)} disabled={saving} className="flex-1 rounded bg-teal py-0.5 text-ivory disabled:opacity-50" title="Save"><Save className="mx-auto h-2.5 w-2.5" /></button>
                                  <button onClick={() => { setInvEditing(null); setInvEditVal(""); }} className="flex-1 rounded bg-charcoal/10 py-0.5 text-charcoal-soft" title="Cancel"><X className="mx-auto h-2.5 w-2.5" /></button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setInvEditing(key); setInvEditVal(""); }}
                                disabled={saving}
                                className={`flex h-7 w-full min-w-[48px] flex-col items-center justify-center rounded-md transition-colors ${
                                  closed
                                    ? "bg-marsala/15 text-marsala"
                                    : override !== null
                                      ? "bg-gold/20 text-gold-deep ring-1 ring-inset ring-gold/40"
                                      : "bg-white text-teal ring-1 ring-inset ring-charcoal/8 hover:ring-teal/40"
                                }`}
                                title={`Inventory · ${key}\nSellable: ${closed ? "CLOSED" : override !== null ? `${override} (custom)` : `${matrixTotal} (default)`}\nBooked: ${booked}\nClick to edit — empty value resets to default`}
                              >
                                {saving ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <>
                                    <span className="flex items-center gap-0.5 font-serif text-[11px] font-bold leading-none">
                                      {closed && <Lock className="h-2.5 w-2.5" />}{left}
                                    </span>
                                    <span className="font-display text-[8px] leading-none text-charcoal-soft/70">{booked}/{closed ? 0 : (override ?? matrixTotal)}</span>
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Bulk tools — date range across one plan or all plans of the room */}
            <div className="mt-3 rounded-xl border border-charcoal/10 bg-ivory-deep/20 p-3">
              <div className="mb-2 font-display text-[10px] font-semibold uppercase tracking-wider text-charcoal-soft">Bulk set — date range</div>
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setBulkPlanSel("all")}
                  className={`rounded-full border px-2.5 py-1 font-display text-[10px] font-semibold ${bulkPlanSel === "all" ? "border-teal bg-teal text-ivory" : "border-charcoal/15 bg-white text-charcoal-soft hover:border-teal/40"}`}
                >
                  All plans of room
                </button>
                {roomPlans.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setBulkPlanSel(p.id)}
                    className={`rounded-full border px-2.5 py-1 font-display text-[10px] font-semibold ${bulkPlanSel === p.id ? "border-teal bg-teal text-ivory" : "border-charcoal/15 bg-white text-charcoal-soft hover:border-teal/40"}`}
                  >
                    {p.code}
                  </button>
                ))}
              </div>
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
                  <label className="mb-1 block font-display text-[9px] uppercase tracking-wider text-charcoal-soft">2-person ₹</label>
                  <input type="number" min={0} value={bulkDouble || ""} onChange={(e) => setBulkDouble(parseInt(e.target.value) || 0)} placeholder="skip" className="w-20 rounded-lg border border-charcoal/10 bg-white px-2 py-1.5 font-display text-xs text-charcoal focus:border-teal focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block font-display text-[9px] uppercase tracking-wider text-charcoal-soft">1-person ₹</label>
                  <input type="number" min={0} value={bulkSingle || ""} onChange={(e) => setBulkSingle(parseInt(e.target.value) || 0)} placeholder="skip" className="w-20 rounded-lg border border-charcoal/10 bg-white px-2 py-1.5 font-display text-xs text-charcoal focus:border-teal focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block font-display text-[9px] uppercase tracking-wider text-charcoal-soft">+1 Adult ₹</label>
                  <input type="number" min={0} value={bulkAdult || ""} onChange={(e) => setBulkAdult(parseInt(e.target.value) || 0)} placeholder="skip" className="w-20 rounded-lg border border-charcoal/10 bg-white px-2 py-1.5 font-display text-xs text-charcoal focus:border-teal focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block font-display text-[9px] uppercase tracking-wider text-charcoal-soft">+1 Child ₹</label>
                  <input type="number" min={0} value={bulkChild || ""} onChange={(e) => setBulkChild(parseInt(e.target.value) || 0)} placeholder="skip" className="w-20 rounded-lg border border-charcoal/10 bg-white px-2 py-1.5 font-display text-xs text-charcoal focus:border-teal focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block font-display text-[9px] uppercase tracking-wider text-charcoal-soft">Inventory</label>
                  <input type="number" min={0} value={bulkInventory || ""} onChange={(e) => setBulkInventory(parseInt(e.target.value) || 0)} placeholder="skip" className="w-20 rounded-lg border border-charcoal/10 bg-white px-2 py-1.5 font-display text-xs text-charcoal focus:border-teal focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block font-display text-[9px] uppercase tracking-wider text-charcoal-soft">Plan status</label>
                  <select
                    value={bulkClosed}
                    onChange={(e) => setBulkClosed(e.target.value as "any" | "open" | "closed")}
                    className="rounded-lg border border-charcoal/10 bg-white px-2 py-1.5 font-display text-xs text-charcoal focus:border-teal focus:outline-none"
                  >
                    <option value="any">— leave as is</option>
                    <option value="open">Open (sellable)</option>
                    <option value="closed">Closed (stop sale)</option>
                  </select>
                </div>
                <label className="flex cursor-pointer items-center gap-1.5 pb-1.5 font-display text-[11px] text-charcoal">
                  <input type="checkbox" checked={bulkWeekend} onChange={(e) => setBulkWeekend(e.target.checked)} className="h-3.5 w-3.5 rounded border-charcoal/30" />
                  Weekends only
                </label>
                <Button onClick={() => applyBulk(false)} disabled={bulkSaving || !matrixRoomId} className="rounded-full bg-teal px-4 py-1.5 text-xs text-ivory hover:bg-teal-deep">
                  {bulkSaving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <IndianRupee className="mr-1 h-3.5 w-3.5" />} Apply
                </Button>
                <Button onClick={() => applyBulk(true)} disabled={bulkSaving || !matrixRoomId} variant="outline" className="rounded-full border-charcoal/20 px-4 py-1.5 text-xs text-charcoal-soft hover:border-marsala/40 hover:text-marsala">
                  <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset range
                </Button>
              </div>
              <p className="mt-2 font-display text-[9px] text-charcoal-soft/70">Leave a rate blank to skip it — only the filled values are applied to every selected day. Inventory blank = untouched; fill it to set sellable rooms for the range (Apply), or use Reset range with a value to revert inventory overrides.</p>
            </div>
          </>
        )}
      </div>

      {/* Single-day plan rate editor */}
      {editor && (() => {
        const plan = plans.find((p) => p.id === editor.planId);
        return plan ? (
          <PlanDayEditor
            plan={plan}
            date={editor.date}
            existing={rateMaps[plan.id]?.[editor.date] || null}
            onClose={() => setEditor(null)}
            onSaved={() => { setEditor(null); loadMatrix(); }}
          />
        ) : null;
      })()}

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

/* ── Single-day plan rate editor — 1p / 2p / extra-guest rates + open/close ── */
function PlanDayEditor({ plan, date, existing, onClose, onSaved }: {
  plan: PlanLite;
  date: string;
  existing: DayRateRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [double, setDouble] = useState(existing && existing.price > 0 ? existing.price : plan.pricePerNight);
  const [single, setSingle] = useState(existing?.priceSingle || 0); // 0 = plan default
  const [adult, setAdult] = useState(existing?.extraAdultPrice || 0);
  const [child, setChild] = useState(existing?.extraChildPrice || 0);
  const [closed, setClosed] = useState(existing?.isClosed || false);
  const [note, setNote] = useState(existing?.note || "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (double <= 0 && !closed) {
      toast.error("Enter the 2-person price (or close the day with stop-sale)");
      return;
    }
    setSaving(true);
    try {
      const res = await adminFetch("/api/admin/plans/day-rates", {
        method: "POST",
        body: JSON.stringify({
          planId: plan.id, date,
          price: double > 0 ? double : 0,
          priceSingle: single > 0 ? single : 0,
          extraAdultPrice: adult > 0 ? adult : 0,
          extraChildPrice: child > 0 ? child : 0,
          isClosed: closed,
          note,
        }),
      });
      if (res && !res.error) {
        toast.success(`${plan.code} · ${date} saved`, {
          description: closed ? "Plan closed for this day." : `2p ₹${double.toLocaleString("en-IN")}${single > 0 ? ` · 1p ₹${single.toLocaleString("en-IN")}` : ""}${adult > 0 ? ` · +A ₹${adult.toLocaleString("en-IN")}` : ""}${child > 0 ? ` · +C ₹${child.toLocaleString("en-IN")}` : ""}`,
        });
        onSaved();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally { setSaving(false); }
  };

  const resetDay = async () => {
    setSaving(true);
    try {
      const res = await adminFetch("/api/admin/plans/day-rates", {
        method: "POST",
        body: JSON.stringify({ planId: plan.id, date, reset: true }),
      });
      if (res && !res.error) {
        toast.success(`${date}: reverted to plan defaults`, { description: "All rates back to base and day reopened." });
        onSaved();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setSaving(false); }
  };

  const parsed = new Date(date + "T00:00:00Z");
  const dateLabel = parsed.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-charcoal/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-ivory p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-1 flex items-center gap-2">
          <span className="rounded-md bg-teal px-2 py-0.5 font-display text-[10px] font-bold tracking-widest text-ivory">{plan.code}</span>
          <span className="font-serif text-sm font-semibold text-charcoal">{plan.roomName}</span>
        </div>
        <h3 className="font-serif text-lg font-semibold text-charcoal">{dateLabel}</h3>
        <p className="mb-3 font-display text-[11px] text-charcoal-soft">
          Plan base — 2p ₹{plan.pricePerNight.toLocaleString("en-IN")} · 1p ₹{(plan.priceSingle || plan.pricePerNight).toLocaleString("en-IN")} · +A ₹{(plan.extraAdultPrice || 0).toLocaleString("en-IN")} · +C ₹{(plan.extraChildPrice || 0).toLocaleString("en-IN")}
          {existing ? " · custom day values set" : ""}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">2 persons ₹/night</label>
            <Input type="number" min={0} value={double} onChange={(e) => setDouble(parseInt(e.target.value) || 0)} className="bg-white" />
          </div>
          <div>
            <label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">1 person ₹/night</label>
            <Input type="number" min={0} value={single || ""} onChange={(e) => setSingle(parseInt(e.target.value) || 0)} placeholder={`default ₹${(plan.priceSingle || plan.pricePerNight).toLocaleString("en-IN")}`} className="bg-white" />
          </div>
          <div>
            <label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">+1 Adult ₹/night</label>
            <Input type="number" min={0} value={adult || ""} onChange={(e) => setAdult(parseInt(e.target.value) || 0)} placeholder={`default ₹${(plan.extraAdultPrice || 0).toLocaleString("en-IN")}`} className="bg-white" />
          </div>
          <div>
            <label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">+1 Child ₹/night</label>
            <Input type="number" min={0} value={child || ""} onChange={(e) => setChild(parseInt(e.target.value) || 0)} placeholder={`default ₹${(plan.extraChildPrice || 0).toLocaleString("en-IN")}`} className="bg-white" />
          </div>
        </div>

        <label className="mt-3 flex cursor-pointer items-center gap-2 font-display text-xs text-charcoal">
          <input type="checkbox" checked={closed} onChange={(e) => setClosed(e.target.checked)} className="h-4 w-4 rounded border-charcoal/30" />
          <Ban className="h-3.5 w-3.5 text-marsala" /> Stop sale — close this plan for this day
        </label>

        <label className="mb-1 mt-3 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Note (optional)</label>
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Janmashtami surge" className="bg-white" />

        <div className="mt-4 flex items-center justify-between">
          {existing ? (
            <Button onClick={resetDay} disabled={saving} variant="outline" className="rounded-full border-marsala/30 text-marsala hover:bg-marsala hover:text-ivory">
              <RotateCcw className="mr-1 h-3.5 w-3.5" /> Use plan defaults
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline" className="rounded-full">Cancel</Button>
            <Button onClick={save} disabled={saving} className="rounded-full bg-teal px-5 text-ivory hover:bg-teal-deep">
              <Save className="mr-1.5 h-4 w-4" /> Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
