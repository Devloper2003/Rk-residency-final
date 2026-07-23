"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Edit, Trash2, X, Save, Utensils, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminApi, LoadingSpinner, Field } from "./_shared";
import { refreshSiteContent } from "@/lib/site-content";
import { toast } from "sonner";

type Dish = { name: string; desc: string; price: string; veg: boolean };
const EMPTY: Dish = { name: "", desc: "", price: "", veg: true };

export function DiningTab() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [contentId, setContentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Dish>(EMPTY);

  const reload = useCallback(() => {
    adminApi.get("content").then((d) => {
      if (!d) { setLoading(false); return; }
      const item = (d.items || []).find((i: any) => i.key === "dining.signature_dishes");
      if (item) { setContentId(item.id); try { setDishes(JSON.parse(item.value || "[]")); } catch { setDishes([]); } }
      setLoading(false);
    });
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const saveAll = async (newDishes: Dish[]) => {
    setDishes(newDishes);
    try { const res = await adminApi.patch("content", { id: contentId, value: JSON.stringify(newDishes) }); if (res) { toast.success("Dishes updated!"); refreshSiteContent(); } } catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
  };
  const startEdit = (idx: number) => { setEditing(idx); setEditForm(idx === -1 ? { ...EMPTY } : { ...dishes[idx] }); };
  const saveEdit = async () => { if (editing === null) return; if (!editForm.name.trim()) return toast.error("Name required"); const nd = [...dishes]; if (editing === -1) nd.push(editForm); else nd[editing] = editForm; await saveAll(nd); setEditing(null); };
  const del = async (idx: number) => { if (!confirm("Delete?")) return; await saveAll(dishes.filter((_, i) => i !== idx)); };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-display text-sm text-charcoal-soft">{dishes.length} dishes</p>
        <Button onClick={() => startEdit(-1)} className="rounded-full bg-teal px-4 py-2 text-sm text-ivory hover:bg-teal-deep"><Plus className="mr-1 h-4 w-4" /> Add dish</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {dishes.map((d, i) => (
          <div key={i} className="flex items-start gap-3 rounded-2xl border border-charcoal/10 bg-white p-4 shadow-sm">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-teal/8"><Leaf className={`h-4 w-4 ${d.veg ? "text-teal" : "text-marsala"}`} /></div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2"><h4 className="truncate font-serif text-sm font-semibold text-charcoal">{d.name}</h4><span className="shrink-0 font-serif text-sm font-bold text-teal">{d.price}</span></div>
              <p className="mt-0.5 line-clamp-2 font-display text-xs text-charcoal-soft">{d.desc}</p>
              <div className="mt-2 flex gap-1"><button onClick={() => startEdit(i)} className="rounded-lg border border-charcoal/15 px-2.5 py-1 font-display text-[10px] font-semibold text-charcoal-soft hover:bg-teal hover:text-ivory">Edit</button><button onClick={() => del(i)} className="grid h-6 w-6 place-items-center rounded-lg border border-charcoal/15 text-charcoal-soft hover:bg-marsala hover:text-ivory"><Trash2 className="h-3 w-3" /></button></div>
            </div>
          </div>
        ))}
      </div>
      {editing !== null && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-charcoal/70 p-4 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div className="w-full max-w-lg rounded-3xl bg-ivory shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-charcoal/10 px-6 py-4"><h3 className="font-serif text-lg font-semibold text-charcoal">{editing === -1 ? "Add" : "Edit"} dish</h3><button onClick={() => setEditing(null)} className="grid h-9 w-9 place-items-center rounded-full border border-charcoal/15 text-charcoal-soft"><X className="h-4 w-4" /></button></div>
            <div className="space-y-4 p-6">
              <Field label="Name" value={editForm.name} onChange={(v) => setEditForm({ ...editForm, name: v })} />
              <Field label="Description" textarea rows={2} value={editForm.desc} onChange={(v) => setEditForm({ ...editForm, desc: v })} />
              <Field label="Price" value={editForm.price} onChange={(v) => setEditForm({ ...editForm, price: v })} />
              <div className="flex items-center gap-3 rounded-xl border border-charcoal/10 bg-white p-3"><input type="checkbox" id="dv" checked={editForm.veg} onChange={(e) => setEditForm({ ...editForm, veg: e.target.checked })} className="h-4 w-4 rounded border-charcoal/30" /><label htmlFor="dv" className="cursor-pointer font-display text-sm text-charcoal">Vegetarian</label></div>
            </div>
            <div className="flex justify-end gap-3 border-t border-charcoal/10 px-6 py-4"><Button onClick={() => setEditing(null)} variant="outline" className="rounded-full">Cancel</Button><Button onClick={saveEdit} className="rounded-full bg-teal px-6 py-2 text-ivory hover:bg-teal-deep"><Save className="mr-2 h-4 w-4" /> Save</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}
