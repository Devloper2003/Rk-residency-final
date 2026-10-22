"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, X, Save, BedDouble, Star, CalendarDays, ChevronDown, ChevronUp, Loader2, RotateCcw, Tag, Pencil, Coffee, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminApi, adminFetch, LoadingSpinner, Field } from "./_shared";
import { refreshSiteContent } from "@/lib/site-content";
import { ImageUploader } from "../ImageUploader";
import { toast } from "sonner";

const EMPTY = {
  slug: "", name: "", tagline: "", description: "", longDescription: "",
  basePrice: 5000, maxGuests: 2, sizeSqft: 300, bedType: "Queen", view: "Garden",
  imageUrls: "[]", amenities: "[]", totalCount: 4, badge: null as string | null,
  featured: false, sortOrder: 0,
};

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* ── Inline Day-wise Quick Inventory Editor ──
   Talks to /api/admin/inventory (RoomInventoryDay model):
   GET  ?startDate=&days=7 → { rooms: [{ id, days: { [date]: { booked, closed, override, sellable, note } } }] }
   POST { roomId, date, sellableOverride } | { roomId, date, reset: true }
   A day with no control row behaves exactly like the room default. */
type DayCell = { booked: number; closed: boolean; override: number | null; sellable: number; note: string | null };

function InlineInventoryEditor({ roomId, totalCount, onOpenInventory }: { roomId: string; totalCount: number; onOpenInventory?: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [dayData, setDayData] = useState<Record<string, DayCell>>({});
  const [loading, setLoading] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editCount, setEditCount] = useState(0);
  const [saving, setSaving] = useState(false);

  // Next 7 days
  const next7 = useCallback(() => {
    const days: string[] = [];
    const d = new Date();
    for (let i = 0; i < 7; i++) {
      days.push(d.toISOString().slice(0, 10));
      d.setDate(d.getDate() + 1);
    }
    return days;
  }, []);

  const dayKeys = next7();
  const startDate = dayKeys[0];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/inventory?startDate=${startDate}&days=7`);
      if (res && typeof res === "object") {
        const data = res as { rooms?: Array<{ id: string; days: Record<string, DayCell> }> };
        const row = data.rooms?.find((r) => r.id === roomId);
        setDayData(row?.days || {});
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [roomId, startDate]);

  const toggleExpand = () => {
    if (!expanded) {
      fetchData();
    }
    setExpanded(!expanded);
  };

  const startEdit = (date: string) => {
    const day = dayData[date];
    setEditingDate(date);
    setEditCount(day ? Math.max(0, day.sellable) : totalCount);
  };

  const cancelEdit = () => {
    setEditingDate(null);
    setEditCount(0);
  };

  const saveEdit = async () => {
    if (!editingDate) return;
    setSaving(true);
    try {
      // Setting the count back to the room default reverts to default behaviour;
      // any other value (including 0 = block the day) is stored as a sellable override.
      const body = editCount === totalCount
        ? { roomId, date: editingDate, reset: true }
        : { roomId, date: editingDate, sellableOverride: editCount };
      const res = await adminFetch("/api/admin/inventory", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (res) {
        toast.success(
          editCount === totalCount
            ? `${editingDate}: reverted to default (${totalCount})`
            : `${editingDate}: set to ${editCount} sellable`,
        );
        await fetchData();
        cancelEdit();
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const removeOverride = async (date: string) => {
    try {
      const res = await adminFetch("/api/admin/inventory", {
        method: "POST",
        body: JSON.stringify({ roomId, date, reset: true }),
      });
      if (res) {
        toast.success(`${date}: reverted to default (${totalCount})`);
        await fetchData();
      }
    } catch {
      toast.error("Failed to remove override");
    }
  };

  const getCellData = (date: string) => {
    const day = dayData[date];
    const booked = day?.booked || 0;
    const total = day ? day.sellable : totalCount;
    const avail = Math.max(0, total - booked);
    const hasOverride = !!day && (day.closed || day.override !== null);
    const isBlocked = !!day && (day.closed || total === 0);
    const isSoldOut = !isBlocked && avail <= 0;
    return { booked, total, avail, hasOverride, isBlocked, isSoldOut };
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="border-t border-charcoal/10">
      {/* Toggle bar */}
      <button
        onClick={toggleExpand}
        className="flex w-full items-center justify-between px-3 py-2 font-display text-[11px] font-semibold text-teal hover:bg-teal/5"
      >
        <span className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" />
          Day-wise Inventory
        </span>
        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-3 pb-3">
          {loading ? (
            <div className="flex h-16 items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-teal" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {dayKeys.map((date) => {
                  const d = new Date(date + "T12:00:00Z");
                  const isToday = date === today;
                  return (
                    <div key={date} className="text-center">
                      <div className={`font-display text-[8px] uppercase tracking-wider ${isToday ? "text-teal font-bold" : "text-charcoal-soft/60"}`}>
                        {DAY_SHORT[d.getDay()]}
                      </div>
                      <div className={`font-display text-[9px] ${isToday ? "text-teal font-bold" : "text-charcoal-soft"}`}>
                        {d.getDate()} {MONTH_SHORT[d.getMonth()]}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {dayKeys.map((date) => {
                  const cell = getCellData(date);
                  const isToday = date === today;
                  const isEditing = editingDate === date;

                  let bgColor = "bg-teal/5";
                  if (cell.isBlocked) bgColor = "bg-marsala/15";
                  else if (cell.isSoldOut) bgColor = "bg-marsala/10";
                  else if (cell.booked > 0 && cell.avail > 0) bgColor = "bg-gold/10";

                  return (
                    <div
                      key={date}
                      className={`relative rounded-md border p-1 text-center transition-all ${
                        cell.hasOverride ? "border-gold/50" : "border-charcoal/8"
                      } ${isToday ? "ring-1 ring-teal" : ""} ${bgColor}`}
                    >
                      {isEditing ? (
                        <div className="space-y-0.5">
                          <Input
                            type="number"
                            min={0}
                            max={50}
                            value={editCount}
                            onChange={(e) => setEditCount(parseInt(e.target.value) || 0)}
                            className="h-5 bg-white px-1 py-0 text-[10px]"
                            autoFocus
                          />
                          <div className="flex gap-0.5">
                            <button
                              onClick={saveEdit}
                              disabled={saving}
                              className="flex-1 rounded bg-teal px-0.5 py-0.5 text-[8px] font-semibold text-ivory hover:bg-teal-deep disabled:opacity-50"
                            >
                              <Save className="inline h-2 w-2" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex-1 rounded bg-charcoal/10 px-0.5 py-0.5 text-[8px] text-charcoal-soft hover:bg-charcoal/20"
                            >
                              <X className="inline h-2 w-2" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(date)}
                          className="w-full"
                        >
                          <div className={`font-serif text-xs font-bold ${
                            cell.isBlocked ? "text-marsala" : cell.isSoldOut ? "text-marsala/80" : cell.avail === 1 ? "text-gold-deep" : "text-teal"
                          }`}>
                            {cell.avail}
                          </div>
                          <div className="font-display text-[7px] text-charcoal-soft/60 leading-tight">
                            {cell.isBlocked ? "BLOCKED" : `${cell.booked}/${cell.total}`}
                          </div>
                        </button>
                      )}
                      {cell.hasOverride && !isEditing && (
                        <button
                          onClick={(e) => { e.stopPropagation(); removeOverride(date); }}
                          className="absolute -right-0.5 -top-0.5 text-charcoal-soft/30 hover:text-marsala"
                          title="Reset to default"
                        >
                          <RotateCcw className="h-2 w-2" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legend + Full calendar link */}
              <div className="mt-2 flex items-center justify-between">
                <div className="flex flex-wrap gap-2 font-display text-[8px] text-charcoal-soft/60">
                  <span className="flex items-center gap-0.5"><span className="inline-block h-1.5 w-1.5 rounded-sm bg-teal/30" /> Available</span>
                  <span className="flex items-center gap-0.5"><span className="inline-block h-1.5 w-1.5 rounded-sm bg-gold/40" /> Partial</span>
                  <span className="flex items-center gap-0.5"><span className="inline-block h-1.5 w-1.5 rounded-sm bg-marsala/40" /> Closed / blocked</span>
                </div>
                <button
                  onClick={onOpenInventory}
                  className="font-display text-[9px] font-semibold text-teal hover:text-teal-deep"
                >
                  Full calendar →
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function RoomsTab({ onOpenInventory }: { onOpenInventory?: () => void }) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [plansFor, setPlansFor] = useState<any | null>(null);

  const reload = useCallback(() => {
    adminApi.get("rooms").then((d) => {
      if (d) setRooms(d.rooms || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let c = false;
    adminApi.get("rooms").then((d) => {
      if (c) return;
      if (d) setRooms(d.rooms || []);
      setLoading(false);
    });
    return () => { c = true; };
  }, []);

  const save = async (room: any) => {
    if (!room.slug.trim()) return toast.error("Slug is required");
    if (!room.name.trim()) return toast.error("Name is required");
    const method = room.id ? "PATCH" : "POST";
    const res = await adminFetch("/api/admin/rooms", { method, body: JSON.stringify(room) });
    if (res) {
      toast.success(room.id ? "Room updated" : "Room created");
      refreshSiteContent();
      setEditing(null);
      reload();
    } else {
      toast.error("Save failed");
    }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this room?\n\nIf any bookings reference this room, the deletion will be blocked to preserve historical data. You can set inventory to 0 to hide the room instead.")) return;
    try {
      const res = await adminFetch(`/api/admin/rooms?id=${id}`, { method: "DELETE" });
      if (res) { toast.success("Room deleted"); reload(); }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const toggleFeatured = async (r: any) => {
    const res = await adminFetch("/api/admin/rooms", { method: "PATCH", body: JSON.stringify({ ...r, featured: !r.featured }) });
    if (res) { toast.success(r.featured ? "Unfeatured" : "Featured"); reload(); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-display text-sm text-charcoal-soft">{rooms.length} room{rooms.length === 1 ? "" : "s"} · {rooms.filter((r) => r.featured).length} featured</p>
        <Button onClick={() => setEditing({ ...EMPTY, sortOrder: rooms.length + 1 })} className="rounded-full bg-teal px-4 py-2 text-sm text-ivory hover:bg-teal-deep">
          <Plus className="mr-1 h-4 w-4" /> New room
        </Button>
      </div>

      {rooms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-charcoal/15 bg-white p-12 text-center">
          <BedDouble className="mx-auto h-8 w-8 text-charcoal-soft/40" />
          <p className="mt-2 font-serif text-base font-semibold text-charcoal">No rooms yet</p>
          <p className="mt-1 font-display text-xs text-charcoal-soft">Add your first room type.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((r) => {
            const imgs: string[] = JSON.parse(r.imageUrls || "[]");
            const amenities: string[] = JSON.parse(r.amenities || "[]");
            return (
              <div key={r.id} className="overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-sm transition-shadow hover:shadow-md">
                <div className="relative h-36 overflow-hidden bg-ivory-deep">
                  {imgs[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imgs[0]} alt={r.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-charcoal-soft/40"><BedDouble className="h-8 w-8" /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent" />
                  {r.featured && (
                    <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold text-charcoal">
                      <Star className="h-3 w-3 fill-charcoal" /> Featured
                    </span>
                  )}
                  {r.badge && (
                    <span className="absolute left-2 top-2 rounded-full bg-teal px-2 py-0.5 text-[10px] font-semibold text-ivory">{r.badge}</span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <div className="font-serif text-base font-semibold text-ivory">{r.name}</div>
                    <div className="font-display text-[10px] text-ivory/80">{r.tagline}</div>
                  </div>
                </div>
                <div className="space-y-2 p-3">
                  <div className="flex items-center justify-between font-display text-[11px] text-charcoal-soft">
                    <span>{r.totalCount} inventory</span>
                    <span>{r.maxGuests} guests · {r.sizeSqft} sqft</span>
                  </div>
                  <div className="font-serif text-base font-bold text-teal">₹{r.basePrice.toLocaleString("en-IN")}<span className="font-display text-[10px] font-normal text-charcoal-soft">/night</span></div>
                  {imgs.length > 1 && <div className="font-display text-[10px] text-charcoal-soft">{imgs.length} images · {amenities.length} amenities</div>}
                  <div className="flex gap-1 border-t border-charcoal/10 pt-2">
                    <button onClick={() => setEditing(r)} className="flex-1 rounded-lg border border-charcoal/15 py-1.5 font-display text-[11px] font-semibold text-charcoal-soft hover:bg-teal hover:text-ivory">Edit</button>
                    <button onClick={() => setPlansFor(r)} className="flex-1 rounded-lg border border-charcoal/15 py-1.5 font-display text-[11px] font-semibold text-charcoal-soft hover:bg-teal hover:text-ivory" title="Rate plans (EP/CP/MAP/AP)">Plans</button>
                    <button onClick={() => onOpenInventory?.()} className="flex-1 rounded-lg border border-charcoal/15 py-1.5 font-display text-[11px] font-semibold text-charcoal-soft hover:bg-gold hover:text-charcoal">Calendar</button>
                    <button onClick={() => toggleFeatured(r)} className={`grid h-7 w-7 place-items-center rounded-lg border border-charcoal/15 hover:bg-gold hover:text-charcoal ${r.featured ? "text-gold-deep" : "text-charcoal-soft"}`} title={r.featured ? "Unfeature" : "Feature"}>
                      <Star className={`h-3 w-3 ${r.featured ? "fill-current" : ""}`} />
                    </button>
                    <button onClick={() => del(r.id)} className="grid h-7 w-7 place-items-center rounded-lg border border-charcoal/15 text-charcoal-soft hover:bg-marsala hover:text-ivory" title="Delete">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                {/* Inline day-wise inventory editor */}
                <InlineInventoryEditor
                  roomId={r.id}
                  totalCount={r.totalCount}
                  onOpenInventory={onOpenInventory}
                />
              </div>
            );
          })}
        </div>
      )}

      {editing && <RoomEditor room={editing} onClose={() => setEditing(null)} onSave={save} />}
      {plansFor && <PlansManager room={plansFor} onClose={() => setPlansFor(null)} />}
    </div>
  );
}

/* ── Standard hospitality plan templates (owner-editable, nothing invented —
   prices are always set by the owner; EP prefills the room's own base price) ── */
const PLAN_TEMPLATES: Record<string, { name: string; description: string; inclusions: string[] }> = {
  EP: { name: "Room Only", description: "Stay only — meals available at extra cost.", inclusions: ["Room only — no meals included"] },
  CP: { name: "Bed & Breakfast", description: "Stay with complimentary morning breakfast.", inclusions: ["Complimentary breakfast"] },
  MAP: { name: "Half Board", description: "Stay with breakfast and dinner included.", inclusions: ["Complimentary breakfast", "Dinner included"] },
  AP: { name: "Full Board", description: "Stay with all three meals included.", inclusions: ["Breakfast included", "Lunch included", "Dinner included"] },
};

type PlanRow = {
  id: string; code: string; name: string; description: string | null;
  inclusions: string; pricePerNight: number; priceSingle?: number | null;
  extraAdultPrice?: number; extraChildPrice?: number;
  sortOrder: number;
  isActive: boolean; _count?: { dayRates: number };
};

function PlansManager({ room, onClose }: { room: any; onClose: () => void }) {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; description: string; pricePerNight: number; priceSingle: number; extraAdultPrice: number; extraChildPrice: number; inclusions: string; isActive: boolean } | null>(null);
  // Add-form state
  const [newCode, setNewCode] = useState("EP");
  const [newName, setNewName] = useState(PLAN_TEMPLATES.EP.name);
  const [newDesc, setNewDesc] = useState(PLAN_TEMPLATES.EP.description);
  const [newInclusions, setNewInclusions] = useState(PLAN_TEMPLATES.EP.inclusions.join(", "));
  const [newPrice, setNewPrice] = useState<number>(room.basePrice || 0);
  const [newPriceSingle, setNewPriceSingle] = useState<number>(0); // 0 = same as double
  const [newExtraAdult, setNewExtraAdult] = useState<number>(0);
  const [newExtraChild, setNewExtraChild] = useState<number>(0);

  const load = useCallback(() => {
    setLoading(true);
    adminFetch(`/api/admin/plans?roomId=${room.id}`)
      .then((d) => { if (d) setPlans(d.plans || []); })
      .catch(() => toast.error("Failed to load plans"))
      .finally(() => setLoading(false));
  }, [room.id]);

  useEffect(() => { load(); }, [load]);

  /** Choosing a standard code prefills the standard name/inclusions template. */
  const applyTemplate = (code: string) => {
    setNewCode(code);
    const t = PLAN_TEMPLATES[code];
    if (t) {
      setNewName(t.name);
      setNewDesc(t.description);
      setNewInclusions(t.inclusions.join(", "));
    }
    if (code === "EP") setNewPrice(room.basePrice || 0);
  };

  const addPlan = async () => {
    if (!newName.trim()) return toast.error("Plan name is required");
    if (!newPrice || newPrice <= 0) return toast.error("Set a price per night (activate plans only with a real price)");
    setSaving(true);
    try {
      await adminFetch("/api/admin/plans", {
        method: "POST",
        body: JSON.stringify({
          roomId: room.id,
          code: newCode.trim().toUpperCase(),
          name: newName.trim(),
          description: newDesc.trim() || null,
          inclusions: newInclusions.split(",").map((s) => s.trim()).filter(Boolean),
          pricePerNight: newPrice,
          priceSingle: newPriceSingle > 0 ? newPriceSingle : null,
          extraAdultPrice: newExtraAdult > 0 ? newExtraAdult : 0,
          extraChildPrice: newExtraChild > 0 ? newExtraChild : 0,
          sortOrder: plans.length,
          isActive: true,
        }),
      });
      toast.success(`${newCode.toUpperCase()} plan added`);
      setNewPrice(0);
      setNewPriceSingle(0);
      setNewExtraAdult(0);
      setNewExtraChild(0);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add plan");
    } finally { setSaving(false); }
  };

  const startEdit = (p: PlanRow) => {
    setEditId(p.id);
    setEditForm({
      name: p.name,
      description: p.description || "",
      pricePerNight: p.pricePerNight,
      priceSingle: p.priceSingle || 0,
      extraAdultPrice: p.extraAdultPrice || 0,
      extraChildPrice: p.extraChildPrice || 0,
      inclusions: (() => { try { return JSON.parse(p.inclusions || "[]").join(", "); } catch { return ""; } })(),
      isActive: p.isActive,
    });
  };

  const saveEdit = async () => {
    if (!editId || !editForm) return;
    setSaving(true);
    try {
      await adminFetch("/api/admin/plans", {
        method: "PATCH",
        body: JSON.stringify({
          id: editId,
          code: plans.find((p) => p.id === editId)?.code || "EP",
          name: editForm.name.trim(),
          description: editForm.description.trim() || null,
          inclusions: editForm.inclusions.split(",").map((s) => s.trim()).filter(Boolean),
          pricePerNight: editForm.pricePerNight,
          priceSingle: editForm.priceSingle > 0 ? editForm.priceSingle : null,
          extraAdultPrice: editForm.extraAdultPrice > 0 ? editForm.extraAdultPrice : 0,
          extraChildPrice: editForm.extraChildPrice > 0 ? editForm.extraChildPrice : 0,
          isActive: editForm.isActive,
        }),
      });
      toast.success("Plan updated");
      setEditId(null);
      setEditForm(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update plan");
    } finally { setSaving(false); }
  };

  const toggleActive = async (p: PlanRow) => {
    try {
      await adminFetch("/api/admin/plans", {
        method: "PATCH",
        body: JSON.stringify({ id: p.id, code: p.code, name: p.name, inclusions: (() => { try { return JSON.parse(p.inclusions || "[]"); } catch { return []; } })(), pricePerNight: p.pricePerNight, isActive: !p.isActive }),
      });
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const delPlan = async (p: PlanRow) => {
    if (!confirm(`Delete the ${p.code} plan? Its day-wise prices will also be removed.`)) return;
    try {
      await adminFetch(`/api/admin/plans?id=${p.id}`, { method: "DELETE" });
      toast.success("Plan deleted");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-charcoal/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="scrollbar-thin max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-ivory shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-charcoal/10 bg-teal px-6 py-4 text-ivory">
          <div>
            <h3 className="font-serif text-lg font-semibold">Rate plans — {room.name}</h3>
            <p className="font-display text-[10px] uppercase tracking-wider text-ivory/70">EP / CP / MAP / AP — shown on the room page like an OTA</p>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-ivory/25 text-ivory hover:bg-ivory/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {/* Add plan */}
          <div className="rounded-2xl border border-charcoal/10 bg-white p-4">
            <div className="mb-3 flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-wider text-charcoal-soft">
              <Plus className="h-4 w-4 text-teal" /> Add a plan
            </div>
            <div className="grid gap-3 sm:grid-cols-[110px_1fr_140px]">
              <div>
                <label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Code</label>
                <select
                  value={newCode}
                  onChange={(e) => applyTemplate(e.target.value)}
                  className="w-full rounded-md border border-charcoal/15 bg-white px-2 py-2 font-display text-xs text-charcoal focus:border-teal focus:outline-none"
                >
                  {Object.keys(PLAN_TEMPLATES).map((c) => <option key={c} value={c}>{c}</option>)}
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Plan name</label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Room Only" className="bg-white" />
              </div>
              <div>
                <label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Price ₹/night</label>
                <Input type="number" min={0} value={newPrice || ""} onChange={(e) => setNewPrice(parseInt(e.target.value) || 0)} className="bg-white" />
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">1-person rate ₹/night</label>
                <Input type="number" min={0} value={newPriceSingle || ""} onChange={(e) => setNewPriceSingle(parseInt(e.target.value) || 0)} placeholder="same as 2-person" className="bg-white" />
              </div>
              <div>
                <label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">+1 Adult ₹/night</label>
                <Input type="number" min={0} value={newExtraAdult || ""} onChange={(e) => setNewExtraAdult(parseInt(e.target.value) || 0)} placeholder="0 = free" className="bg-white" />
              </div>
              <div>
                <label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">+1 Child ₹/night</label>
                <Input type="number" min={0} value={newExtraChild || ""} onChange={(e) => setNewExtraChild(parseInt(e.target.value) || 0)} placeholder="0 = free" className="bg-white" />
              </div>
            </div>
            <div className="mt-3 grid gap-3">
              <div>
                <label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Short description</label>
                <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Stay with breakfast and dinner included" className="bg-white" />
              </div>
              <div>
                <label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Inclusions (comma separated)</label>
                <Input value={newInclusions} onChange={(e) => setNewInclusions(e.target.value)} placeholder="Complimentary breakfast, Dinner included" className="bg-white" />
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <Button onClick={addPlan} disabled={saving} className="rounded-full bg-teal px-5 py-2 text-sm text-ivory hover:bg-teal-deep">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-1.5 h-4 w-4" />} Add plan
              </Button>
            </div>
          </div>

          {/* Plan list */}
          {loading ? (
            <LoadingSpinner />
          ) : plans.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-charcoal/15 bg-white p-8 text-center">
              <Tag className="mx-auto h-7 w-7 text-charcoal-soft/40" />
              <p className="mt-2 font-serif text-sm font-semibold text-charcoal">No plans yet</p>
              <p className="mt-1 font-display text-xs text-charcoal-soft">
                Add EP / CP / MAP / AP above — they appear on the room page instantly. Until then the room uses its single base price.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {plans.map((p) => {
                const incs: string[] = (() => { try { return JSON.parse(p.inclusions || "[]"); } catch { return []; } })();
                const isEditing = editId === p.id;
                return (
                  <div key={p.id} className={`rounded-2xl border bg-white p-4 ${p.isActive ? "border-charcoal/10" : "border-charcoal/10 opacity-60"}`}>
                    {isEditing && editForm ? (
                      <div className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Plan name</label>
                            <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="bg-white" />
                          </div>
                          <div>
                            <label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Price ₹/night (2 persons)</label>
                            <Input type="number" min={0} value={editForm.pricePerNight} onChange={(e) => setEditForm({ ...editForm, pricePerNight: parseInt(e.target.value) || 0 })} className="bg-white" />
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div>
                            <label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">1-person rate ₹/night</label>
                            <Input type="number" min={0} value={editForm.priceSingle || ""} onChange={(e) => setEditForm({ ...editForm, priceSingle: parseInt(e.target.value) || 0 })} placeholder="same as 2-person" className="bg-white" />
                          </div>
                          <div>
                            <label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">+1 Adult ₹/night</label>
                            <Input type="number" min={0} value={editForm.extraAdultPrice || ""} onChange={(e) => setEditForm({ ...editForm, extraAdultPrice: parseInt(e.target.value) || 0 })} placeholder="0 = free" className="bg-white" />
                          </div>
                          <div>
                            <label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">+1 Child ₹/night</label>
                            <Input type="number" min={0} value={editForm.extraChildPrice || ""} onChange={(e) => setEditForm({ ...editForm, extraChildPrice: parseInt(e.target.value) || 0 })} placeholder="0 = free" className="bg-white" />
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Description</label>
                          <Input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="bg-white" />
                        </div>
                        <div>
                          <label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Inclusions (comma separated)</label>
                          <Input value={editForm.inclusions} onChange={(e) => setEditForm({ ...editForm, inclusions: e.target.value })} className="bg-white" />
                        </div>
                        <div className="flex items-center justify-between">
                          <label className="flex cursor-pointer items-center gap-2 font-display text-xs text-charcoal">
                            <input type="checkbox" checked={editForm.isActive} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })} className="h-4 w-4 rounded border-charcoal/30" />
                            Active (visible on site)
                          </label>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => { setEditId(null); setEditForm(null); }} className="rounded-full">Cancel</Button>
                            <Button onClick={saveEdit} disabled={saving} className="rounded-full bg-teal px-5 text-ivory hover:bg-teal-deep"><Save className="mr-1.5 h-4 w-4" /> Save</Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-md bg-teal px-2 py-0.5 font-display text-[11px] font-bold tracking-widest text-ivory">{p.code}</span>
                              <span className="font-serif text-sm font-semibold text-charcoal">{p.name}</span>
                              {!p.isActive && <span className="rounded-full bg-charcoal/10 px-2 py-0.5 font-display text-[9px] uppercase tracking-wider text-charcoal-soft">Hidden</span>}
                            </div>
                            {p.description && <p className="mt-1 font-display text-xs text-charcoal-soft">{p.description}</p>}
                            {incs.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1.5">
                                {incs.map((inc) => (
                                  <span key={inc} className="flex items-center gap-1 rounded-full bg-ivory-deep/60 px-2 py-0.5 font-display text-[10px] text-charcoal-soft">
                                    {/breakfast/i.test(inc) ? <Coffee className="h-2.5 w-2.5 text-teal" /> : /lunch|dinner|meal/i.test(inc) ? <UtensilsCrossed className="h-2.5 w-2.5 text-teal" /> : null}
                                    {inc}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-serif text-base font-bold text-teal">₹{p.pricePerNight.toLocaleString("en-IN")}</div>
                            <div className="font-display text-[9px] uppercase tracking-wider text-charcoal-soft">per night · 2 persons</div>
                            {(p.priceSingle && p.priceSingle > 0 && p.priceSingle !== p.pricePerNight) && (
                              <div className="font-display text-[9px] text-charcoal-soft">1 person ₹{p.priceSingle.toLocaleString("en-IN")}</div>
                            )}
                            {(p.extraAdultPrice ?? 0) > 0 && (
                              <div className="font-display text-[9px] text-charcoal-soft">+1 adult ₹{(p.extraAdultPrice || 0).toLocaleString("en-IN")}</div>
                            )}
                            {(p.extraChildPrice ?? 0) > 0 && (
                              <div className="font-display text-[9px] text-charcoal-soft">+1 child ₹{(p.extraChildPrice || 0).toLocaleString("en-IN")}</div>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-charcoal/10 pt-2">
                          <span className="font-display text-[10px] text-charcoal-soft">
                            {p._count?.dayRates ?? 0} day-wise price{p._count?.dayRates === 1 ? "" : "s"} · edit in Inventory calendar
                          </span>
                          <div className="flex gap-1">
                            <button onClick={() => toggleActive(p)} className="rounded-lg border border-charcoal/15 px-2.5 py-1 font-display text-[10px] font-semibold text-charcoal-soft hover:bg-teal hover:text-ivory" title={p.isActive ? "Hide from site" : "Show on site"}>
                              {p.isActive ? "Hide" : "Show"}
                            </button>
                            <button onClick={() => startEdit(p)} className="grid h-7 w-7 place-items-center rounded-lg border border-charcoal/15 text-charcoal-soft hover:bg-teal hover:text-ivory" title="Edit plan">
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button onClick={() => delPlan(p)} className="grid h-7 w-7 place-items-center rounded-lg border border-charcoal/15 text-charcoal-soft hover:bg-marsala hover:text-ivory" title="Delete plan">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <p className="font-display text-[10px] leading-relaxed text-charcoal-soft/70">
            Tip: set EP close to the room's base price so "from ₹" stays honest. 1-person rate applies when a guest books solo; +Adult/+Child apply per extra guest beyond 2 adults. Day-wise (festival/weekend) pricing for each plan is managed in Inventory → Plan rate calendar.
          </p>
        </div>
      </div>
    </div>
  );
}

function RoomEditor({ room, onClose, onSave }: { room: any; onClose: () => void; onSave: (r: any) => void }) {
  const [form, setForm] = useState(room);
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState<string[]>(() => {
    try { return JSON.parse(room.imageUrls || "[]"); } catch { return []; }
  });
  const [amenitiesText, setAmenitiesText] = useState(() => {
    try { return JSON.parse(room.amenities || "[]").join("\n"); } catch { return room.amenities; }
  });
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        ...form,
        imageUrls: JSON.stringify(images),
        amenities: JSON.stringify(amenitiesText.split("\n").map((t) => t.trim()).filter(Boolean)),
      });
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-charcoal/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="scrollbar-thin max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-ivory shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-charcoal/10 bg-ivory/95 px-6 py-4 backdrop-blur">
          <div>
            <h3 className="font-serif text-lg font-semibold text-charcoal">{room.id ? "Edit room" : "New room"}</h3>
            <p className="font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Room editor</p>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-charcoal/15 text-charcoal-soft hover:bg-charcoal hover:text-ivory">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name" value={form.name} onChange={(v) => set("name", v)} />
            <Field label="Slug" value={form.slug} onChange={(v) => set("slug", v)} hint="URL-safe, lowercase" />
            <Field label="Tagline" value={form.tagline} onChange={(v) => set("tagline", v)} />
            <Field label="Badge (e.g. Best Seller)" value={form.badge || ""} onChange={(v) => set("badge", v || null)} />
            <Field label="Bed type" value={form.bedType} onChange={(v) => set("bedType", v)} />
            <Field label="View" value={form.view} onChange={(v) => set("view", v)} />
            <Field label="Base price ₹/night" type="number" value={form.basePrice} onChange={(v) => set("basePrice", parseInt(v) || 0)} />
            <Field label="Max guests" type="number" value={form.maxGuests} onChange={(v) => set("maxGuests", parseInt(v) || 1)} />
            <Field label="Size (sqft)" type="number" value={form.sizeSqft} onChange={(v) => set("sizeSqft", parseInt(v) || 1)} />
            <Field label="Inventory (rooms)" type="number" value={form.totalCount} onChange={(v) => set("totalCount", parseInt(v) || 1)} />
            <Field label="Sort order" type="number" value={form.sortOrder} onChange={(v) => set("sortOrder", parseInt(v) || 0)} />
            <div className="flex items-center gap-3 rounded-xl border border-charcoal/10 bg-white p-3">
              <input type="checkbox" id="room-featured" checked={!!form.featured} onChange={(e) => set("featured", e.target.checked)} className="h-4 w-4 rounded border-charcoal/30" />
              <label htmlFor="room-featured" className="cursor-pointer font-display text-sm text-charcoal">Featured <span className="block font-display text-[10px] font-normal text-charcoal-soft">Show on home page</span></label>
            </div>
          </div>

          <ImageUploader
            label="Room images (first image is the cover)"
            value={images}
            multiple
            onChange={(v) => setImages((v as string[]) || [])}
            hint="Recommended: 1400×900px each. Drag-drop or click to upload."
          />

          <Field label="Short description" textarea rows={2} value={form.description} onChange={(v) => set("description", v)} />
          <Field label="Long description" textarea rows={5} value={form.longDescription} onChange={(v) => set("longDescription", v)} />

          <div>
            <label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Amenities (one per line)</label>
            <textarea
              value={amenitiesText}
              onChange={(e) => setAmenitiesText(e.target.value)}
              rows={5}
              placeholder={"Free Wi-Fi\nAC\nSatvik breakfast\nTemple pickup"}
              className="w-full rounded-md border border-charcoal/15 bg-ivory-deep/30 px-3 py-2 font-display text-xs text-charcoal focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/30"
            />
          </div>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-charcoal/10 bg-ivory/95 px-6 py-4 backdrop-blur">
          <Button onClick={onClose} variant="outline" className="rounded-full">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="rounded-full bg-teal px-6 py-2 text-ivory hover:bg-teal-deep">
            {saving ? <><Save className="mr-2 h-4 w-4 animate-pulse" /> Saving…</> : <><Save className="mr-2 h-4 w-4" /> Save room</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
