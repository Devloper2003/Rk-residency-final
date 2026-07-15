"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Edit, Trash2, X, Save, BedDouble, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminApi, adminFetch, LoadingSpinner, Field } from "./_shared";
import { ImageUploader } from "../ImageUploader";
import { toast } from "sonner";

const EMPTY = {
  slug: "", name: "", tagline: "", description: "", longDescription: "",
  basePrice: 5000, maxGuests: 2, sizeSqft: 300, bedType: "Queen", view: "Garden",
  imageUrls: "[]", amenities: "[]", totalCount: 4, badge: null as string | null,
  featured: false, sortOrder: 0,
};

export function RoomsTab() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);

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
      setEditing(null);
      reload();
    } else {
      toast.error("Save failed");
    }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this room? Existing bookings will be preserved.")) return;
    const res = await adminFetch(`/api/admin/rooms?id=${id}`, { method: "DELETE" });
    if (res) { toast.success("Deleted"); reload(); }
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
                    <button onClick={() => toggleFeatured(r)} className={`grid h-7 w-7 place-items-center rounded-lg border border-charcoal/15 hover:bg-gold hover:text-charcoal ${r.featured ? "text-gold-deep" : "text-charcoal-soft"}`} title={r.featured ? "Unfeature" : "Feature"}>
                      <Star className={`h-3 w-3 ${r.featured ? "fill-current" : ""}`} />
                    </button>
                    <button onClick={() => del(r.id)} className="grid h-7 w-7 place-items-center rounded-lg border border-charcoal/15 text-charcoal-soft hover:bg-marsala hover:text-ivory" title="Delete">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && <RoomEditor room={editing} onClose={() => setEditing(null)} onSave={save} />}
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
