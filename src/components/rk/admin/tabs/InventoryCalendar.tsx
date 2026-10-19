"use client";
import { useEffect, useState, useCallback } from "react";
import {
  X, Loader2, ChevronLeft, ChevronRight, Save, RotateCcw,
  AlertCircle, CheckCircle2, Lock, Unlock, Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminFetch } from "./_shared";
import { toast } from "sonner";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface Props {
  roomId: string;
  roomName: string;
  totalCount: number; // default inventory for this room type
  onClose: () => void;
}

/* ── Types ── */
type Override = { id: string; date: string; availableCount: number; note: string | null };
type DayData = {
  date: string;       // "YYYY-MM-DD"
  dayOfWeek: number;
  defaultCount: number; // room.totalCount
  override: Override | null;
  booked: number;       // booked count from bookings
};

function dayAvailable(cell: DayData): number {
  return (cell.override?.availableCount ?? cell.defaultCount) - cell.booked;
}

export function InventoryCalendar({ roomId, roomName, totalCount, onClose }: Props) {
  // Current month being viewed
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());

  // Data
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [bookedMap, setBookedMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Inline editing state
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editCount, setEditCount] = useState(0);
  const [editNote, setEditNote] = useState("");
  const [saving, setSaving] = useState(false);

  // ── Calculate date range for current month view ──
  const monthStart = new Date(viewYear, viewMonth, 1);
  const monthEnd = new Date(viewYear, viewMonth + 1, 0); // last day of month

  // We want to show a full calendar grid, so include days from prev/next month
  const gridStart = new Date(monthStart);
  gridStart.setDate(gridStart.getDate() - monthStart.getDay()); // go back to Sunday

  const gridEnd = new Date(monthEnd);
  gridEnd.setDate(gridEnd.getDate() + (6 - monthEnd.getDay())); // go forward to Saturday

  const startStr = gridStart.toISOString().slice(0, 10);
  const endStr = gridEnd.toISOString().slice(0, 10);

  // ── Fetch data ──
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch(
        `/api/admin/inventory?roomId=${roomId}&startDate=${startStr}&endDate=${endStr}`,
      );
      if (res && typeof res === "object") {
        const data = res as any;
        setOverrides(data.overrides || []);
        setBookedMap(data.bookedMap || {});
      }
    } catch (e) {
      toast.error("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  }, [roomId, startStr, endStr]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Build grid cells ──
  const cells: DayData[] = [];
  const current = new Date(gridStart);
  while (current <= gridEnd) {
    const dateStr = current.toISOString().slice(0, 10);
    const override = overrides.find((o) => o.date === dateStr) || null;
    cells.push({
      date: dateStr,
      dayOfWeek: current.getDay(),
      defaultCount: totalCount,
      override,
      booked: bookedMap[dateStr] || 0,
    } as DayData);
    current.setDate(current.getDate() + 1);
  }

  // ── Navigation ──
  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };
  const goToday = () => {
    setViewYear(new Date().getFullYear());
    setViewMonth(new Date().getMonth());
  };

  // ── Edit a day ──
  const startEdit = (cell: DayData) => {
    setEditingDate(cell.date);
    setEditCount(cell.override?.availableCount ?? cell.defaultCount);
    setEditNote(cell.override?.note || "");
  };

  const cancelEdit = () => {
    setEditingDate(null);
    setEditCount(0);
    setEditNote("");
  };

  const saveEdit = async () => {
    if (!editingDate) return;
    setSaving(true);
    try {
      const res = await adminFetch("/api/admin/inventory", {
        method: "POST",
        body: JSON.stringify({
          roomId,
          date: editingDate,
          availableCount: editCount,
          note: editNote,
        }),
      });
      if (res) {
        toast.success(`${editingDate}: set to ${editCount} available`);
        await fetchData();
        cancelEdit();
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const removeOverride = async (overrideId: string, date: string) => {
    try {
      const res = await adminFetch(`/api/admin/inventory?id=${overrideId}`, { method: "DELETE" });
      if (res) {
        toast.success(`${date}: reverted to default (${totalCount})`);
        await fetchData();
      }
    } catch {
      toast.error("Failed to remove override");
    }
  };

  // ── Bulk: Block all dates in month ──
  const bulkBlock = async () => {
    if (!confirm(`Block all dates in ${MONTHS[viewMonth]} ${viewYear}? This sets availableCount=0 for every day.`)) return;
    setSaving(true);
    let count = 0;
    const d = new Date(monthStart);
    while (d <= monthEnd) {
      const dateStr = d.toISOString().slice(0, 10);
      try {
        await adminFetch("/api/admin/inventory", {
          method: "POST",
          body: JSON.stringify({ roomId, date: dateStr, availableCount: 0, note: "Blocked" }),
        });
        count++;
      } catch {}
      d.setDate(d.getDate() + 1);
    }
    toast.success(`Blocked ${count} days`);
    await fetchData();
    setSaving(false);
  };

  // ── Bulk: Reset all overrides in month ──
  const bulkReset = async () => {
    const monthOverrides = overrides.filter((o) => {
      const d = new Date(o.date + "T12:00:00Z");
      return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
    });
    if (monthOverrides.length === 0) { toast.info("No overrides to reset"); return; }
    if (!confirm(`Remove ${monthOverrides.length} overrides in ${MONTHS[viewMonth]} ${viewYear}?`)) return;
    setSaving(true);
    let count = 0;
    for (const o of monthOverrides) {
      try {
        await adminFetch(`/api/admin/inventory?id=${o.id}`, { method: "DELETE" });
        count++;
      } catch {}
    }
    toast.success(`Reset ${count} days to default`);
    await fetchData();
    setSaving(false);
  };

  const today = new Date().toISOString().slice(0, 10);
  const isCurrentMonth = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00Z");
    return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-charcoal/60 p-4 pt-6 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-ivory shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-charcoal/10 bg-teal px-6 py-4 text-ivory">
          <div>
            <h2 className="font-serif text-lg font-semibold">Room Inventory</h2>
            <p className="font-display text-[10px] uppercase tracking-wider text-ivory/70">
              {roomName} — {totalCount} rooms default · Day-wise management
            </p>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg border border-ivory/20 text-ivory/80 hover:bg-ivory/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {/* Month navigation */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button onClick={prevMonth} variant="outline" size="sm" className="rounded-lg border-charcoal/20 bg-white">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[140px] text-center font-serif text-lg font-semibold text-charcoal">
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <Button onClick={nextMonth} variant="outline" size="sm" className="rounded-lg border-charcoal/20 bg-white">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button onClick={goToday} variant="ghost" size="sm" className="font-display text-[10px] uppercase tracking-wider text-charcoal-soft">
                Today
              </Button>
            </div>
            <div className="flex gap-2">
              <Button onClick={bulkBlock} disabled={saving} variant="outline" size="sm" className="rounded-lg border-marsala/30 text-marsala hover:bg-marsala hover:text-ivory">
                <Lock className="mr-1 h-3 w-3" /> Block month
              </Button>
              <Button onClick={bulkReset} disabled={saving} variant="outline" size="sm" className="rounded-lg border-charcoal/20 text-charcoal-soft hover:border-teal/40 hover:text-teal">
                <RotateCcw className="mr-1 h-3 w-3" /> Reset overrides
              </Button>
            </div>
          </div>

          {/* Legend */}
          <div className="mb-3 flex flex-wrap gap-3 font-display text-[10px] uppercase tracking-wider text-charcoal-soft">
            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-teal/30" /> Available</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-gold/40" /> Partially booked</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-marsala/40" /> Sold out / Blocked</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm border border-gold/60 bg-ivory-deep" /> Override set</span>
          </div>

          {/* Calendar grid */}
          {loading ? (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-teal" />
            </div>
          ) : (
            <>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DAYS.map((d) => (
                  <div key={d} className="text-center font-display text-[10px] uppercase tracking-wider text-charcoal-soft py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Cells */}
              <div className="grid grid-cols-7 gap-1">
                {cells.map((cell) => {
                  const avail = (cell.override?.availableCount ?? cell.defaultCount) - cell.booked;
                  const total = cell.override?.availableCount ?? cell.defaultCount;
                  const isToday = cell.date === today;
                  const inMonth = isCurrentMonth(cell.date);
                  const hasOverride = !!cell.override;
                  const isBlocked = total === 0;
                  const isSoldOut = avail <= 0 && total > 0;
                  const isPartial = cell.booked > 0 && avail > 0;
                  const isEditing = editingDate === cell.date;

                  let bgColor = "bg-white";
                  if (isBlocked) bgColor = "bg-marsala/15";
                  else if (isSoldOut) bgColor = "bg-marsala/10";
                  else if (isPartial) bgColor = "bg-gold/10";
                  else bgColor = "bg-teal/5";

                  return (
                    <div
                      key={cell.date}
                      className={`relative rounded-lg border p-1.5 transition-all ${
                        hasOverride ? "border-gold/50" : "border-charcoal/8"
                      } ${inMonth ? "" : "opacity-40"} ${isToday ? "ring-2 ring-teal ring-offset-1" : ""} ${bgColor}`}
                    >
                      {/* Date number */}
                      <div className="flex items-center justify-between">
                        <span className={`font-display text-[10px] ${isToday ? "font-bold text-teal" : "text-charcoal-soft"}`}>
                          {new Date(cell.date + "T12:00:00Z").getDate()}
                        </span>
                        {hasOverride && !isEditing && (
                          <button
                            onClick={() => removeOverride(cell.override!.id, cell.date)}
                            className="text-charcoal-soft/40 hover:text-marsala"
                            title="Remove override"
                          >
                            <RotateCcw className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </div>

                      {isEditing ? (
                        /* ── Inline edit mode ── */
                        <div className="mt-1 space-y-1">
                          <Input
                            type="number"
                            min={0}
                            max={50}
                            value={editCount}
                            onChange={(e) => setEditCount(parseInt(e.target.value) || 0)}
                            className="h-6 bg-white px-1 py-0 text-[11px]"
                          />
                          <Input
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            placeholder="Note"
                            className="h-6 bg-white px-1 py-0 text-[10px]"
                          />
                          <div className="flex gap-0.5">
                            <button
                              onClick={saveEdit}
                              disabled={saving}
                              className="flex-1 rounded bg-teal px-1 py-0.5 text-[9px] font-semibold text-ivory hover:bg-teal-deep disabled:opacity-50"
                            >
                              <Save className="inline h-2.5 w-2.5" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex-1 rounded bg-charcoal/10 px-1 py-0.5 text-[9px] text-charcoal-soft hover:bg-charcoal/20"
                            >
                              <X className="inline h-2.5 w-2.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* ── Display mode (clickable to edit) ── */
                        <button
                          onClick={() => startEdit(cell)}
                          className="mt-0.5 w-full text-left"
                        >
                          <div className={`font-serif text-sm font-bold ${
                            isBlocked ? "text-marsala" : isSoldOut ? "text-marsala/80" : avail === 1 ? "text-gold-deep" : "text-teal"
                          }`}>
                            {avail}
                          </div>
                          <div className="font-display text-[8px] text-charcoal-soft/70 leading-tight">
                            {isBlocked ? "BLOCKED" : `${cell.booked}/${total}`}
                          </div>
                          {cell.override?.note && (
                            <div className="mt-0.5 truncate font-display text-[8px] text-gold-deep/80" title={cell.override.note}>
                              {cell.override.note}
                            </div>
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Summary */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-charcoal/10 bg-white p-3 text-center">
              <div className="font-serif text-xl font-bold text-teal">{totalCount}</div>
              <div className="font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Default inventory</div>
            </div>
            <div className="rounded-xl border border-charcoal/10 bg-white p-3 text-center">
              <div className="font-serif text-xl font-bold text-gold-deep">
                {overrides.filter((o) => isCurrentMonth(o.date)).length}
              </div>
              <div className="font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Overrides this month</div>
            </div>
            <div className="rounded-xl border border-charcoal/10 bg-white p-3 text-center">
              <div className="font-serif text-xl font-bold text-charcoal">
                {Object.keys(bookedMap).filter((d) => isCurrentMonth(d)).length}
              </div>
              <div className="font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Days with bookings</div>
            </div>
          </div>

          {/* Help */}
          <p className="mt-3 font-display text-[10px] text-charcoal-soft/70">
            Click any date cell to edit available rooms for that day. Set to 0 to block. Overrides take priority over default inventory.
            &quot;booked/total&quot; shows current bookings out of available rooms.
          </p>
        </div>
      </div>
    </div>
  );
}
