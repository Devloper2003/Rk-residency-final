"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Edit, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminApi, adminFetch, LoadingSpinner, Field } from "./_shared";
import { toast } from "sonner";

export function RoomsTab() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);

  const reload = useCallback(() => { adminApi.get("rooms").then((d) => { if (d) setRooms(d.rooms||[]); setLoading(false); }); }, []);
  useEffect(() => { let c=false; adminApi.get("rooms").then((d)=>{ if(c)return; if(d)setRooms(d.rooms||[]); setLoading(false); }); return()=>{c=true}; }, []);

  const save = async (room: any) => {
    const method = room.id ? "PATCH" : "POST";
    const res = await adminFetch("/api/admin/rooms", { method, body: JSON.stringify(room) });
    if (res) { toast.success(room.id?"Room updated":"Room created"); setEditing(null); reload(); } else toast.error("Save failed");
  };
  const del = async (id: string) => { if (!confirm("Delete this room?")) return; const res = await adminFetch(`/api/admin/rooms?id=${id}`, { method: "DELETE" }); if (res) { toast.success("Deleted"); reload(); } };

  if (loading) return <LoadingSpinner />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-display text-sm text-charcoal-soft">{rooms.length} rooms</p>
        <Button onClick={() => setEditing({slug:"",name:"",tagline:"",description:"",longDescription:"",basePrice:5000,maxGuests:2,sizeSqft:300,bedType:"Queen",view:"Garden",imageUrls:"[]",amenities:"[]",totalCount:4,badge:null,featured:false,sortOrder:rooms.length+1})} className="rounded-full bg-teal px-4 py-2 text-sm text-ivory"><Plus className="mr-1 h-4 w-4" /> New room</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((r) => {
          const imgs: string[] = JSON.parse(r.imageUrls || "[]");
          return (
            <div key={r.id} className="overflow-hidden rounded-2xl border border-charcoal/10 bg-white">
              <div className="relative h-32 overflow-hidden">
                <div className="h-full w-full bg-cover bg-center" style={{backgroundImage:`url(${imgs[0]||"/images/heritage-room.jpg"})`}} />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3"><div className="font-serif text-sm font-semibold text-ivory">{r.name}</div><div className="font-serif text-base font-bold text-gold-soft">₹{r.basePrice.toLocaleString("en-IN")}/night</div></div>
              </div>
              <div className="flex items-center justify-between p-3">
                <div className="font-display text-[11px] text-charcoal-soft">{r.totalCount} inv · {r.maxGuests} guests · {r.sizeSqft}sqft</div>
                <div className="flex gap-1"><button onClick={()=>setEditing(r)} className="grid h-8 w-8 place-items-center rounded-full border border-charcoal/15 text-charcoal-soft hover:bg-teal hover:text-ivory"><Edit className="h-3.5 w-3.5" /></button><button onClick={()=>del(r.id)} className="grid h-8 w-8 place-items-center rounded-full border border-charcoal/15 text-charcoal-soft hover:bg-marsala hover:text-ivory"><Trash2 className="h-3.5 w-3.5" /></button></div>
              </div>
            </div>
          );
        })}
      </div>
      {editing && <RoomEditor room={editing} onClose={()=>setEditing(null)} onSave={save} />}
    </div>
  );
}

function RoomEditor({ room, onClose, onSave }: { room: any; onClose: () => void; onSave: (r: any) => void }) {
  const [form, setForm] = useState(room);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-charcoal/70 p-4" onClick={onClose}>
      <div className="scrollbar-thin max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-ivory p-6" onClick={(e)=>e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between"><h3 className="font-serif text-lg font-semibold text-charcoal">{room.id?"Edit room":"New room"}</h3><button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full border border-charcoal/15 text-charcoal-soft"><X className="h-4 w-4" /></button></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Slug" value={form.slug} onChange={(v)=>set("slug",v)} /><Field label="Name" value={form.name} onChange={(v)=>set("name",v)} />
          <Field label="Tagline" value={form.tagline} onChange={(v)=>set("tagline",v)} /><Field label="Bed type" value={form.bedType} onChange={(v)=>set("bedType",v)} />
          <Field label="View" value={form.view} onChange={(v)=>set("view",v)} /><Field label="Badge" value={form.badge||""} onChange={(v)=>set("badge",v||null)} />
          <Field label="Base price ₹" type="number" value={form.basePrice} onChange={(v)=>set("basePrice",parseInt(v)||0)} /><Field label="Max guests" type="number" value={form.maxGuests} onChange={(v)=>set("maxGuests",parseInt(v)||1)} />
          <Field label="Size sqft" type="number" value={form.sizeSqft} onChange={(v)=>set("sizeSqft",parseInt(v)||1)} /><Field label="Inventory" type="number" value={form.totalCount} onChange={(v)=>set("totalCount",parseInt(v)||1)} />
        </div>
        <div className="mt-3"><Field label="Description" value={form.description} onChange={(v)=>set("description",v)} /></div>
        <div className="mt-3"><Field label="Long description" textarea value={form.longDescription} onChange={(v)=>set("longDescription",v)} /></div>
        <div className="mt-3"><Field label="Image URLs (JSON)" textarea value={form.imageUrls} onChange={(v)=>set("imageUrls",v)} /></div>
        <div className="mt-3"><Field label="Amenities (JSON)" textarea value={form.amenities} onChange={(v)=>set("amenities",v)} /></div>
        <div className="mt-5 flex gap-3"><Button onClick={()=>onSave(form)} className="rounded-full bg-teal px-6 py-2 text-ivory">Save</Button><Button onClick={onClose} variant="outline" className="rounded-full">Cancel</Button></div>
      </div>
    </div>
  );
}
