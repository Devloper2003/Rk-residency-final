"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, X, Save, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminApi, LoadingSpinner, Field } from "./_shared";
import { ImageUploader } from "../ImageUploader";
import { refreshSiteContent } from "@/lib/site-content";
import { toast } from "sonner";

type Experience = { name: string; distance: string; walkTime: string; bestTime: string; timings: string; description: string; image: string; accent: string; };
const EMPTY: Experience = { name: "", distance: "", walkTime: "", bestTime: "day", timings: "", description: "", image: "", accent: "teal" };

export function ExperiencesTab() {
  const [items, setItems] = useState<Experience[]>([]);
  const [contentId, setContentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Experience>(EMPTY);

  const reload = useCallback(() => {
    adminApi.get("content").then((d) => {
      if (!d) { setLoading(false); return; }
      const item = (d.items || []).find((i: any) => i.key === "experiences.items");
      if (item) { setContentId(item.id); try { setItems(JSON.parse(item.value || "[]")); } catch { setItems([]); } }
      setLoading(false);
    });
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const saveAll = async (newItems: Experience[]) => {
    setItems(newItems);
    try {
      const res = await adminApi.patch("content", { id: contentId, value: JSON.stringify(newItems) });
      if (res) { toast.success("Experiences updated — live!"); refreshSiteContent(); }
    } catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
  };
  const startEdit = (idx: number) => { setEditing(idx); setEditForm(idx === -1 ? { ...EMPTY } : { ...items[idx] }); };
  const saveEdit = async () => {
    if (editing === null) return;
    if (!editForm.name.trim()) return toast.error("Name is required");
    const newItems = [...items];
    if (editing === -1) newItems.push(editForm); else newItems[editing] = editForm;
    await saveAll(newItems); setEditing(null);
  };
  const del = async (idx: number) => { if (!confirm("Delete?")) return; await saveAll(items.filter((_, i) => i !== idx)); };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-display text-sm text-charcoal-soft">{items.length} experiences</p>
        <Button onClick={() => startEdit(-1)} className="rounded-full bg-teal px-4 py-2 text-sm text-ivory hover:bg-teal-deep"><Plus className="mr-1 h-4 w-4" /> New</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((exp, i) => (
          <div key={i} className="flex flex-col overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-sm">
            <div className="relative h-32 w-full shrink-0 overflow-hidden bg-ivory-deep">
              {exp.image ? <img src={exp.image} alt={exp.name} className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-charcoal-soft/40"><MapPin className="h-8 w-8" /></div>}
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3"><div className="truncate font-serif text-base font-semibold text-ivory">{exp.name}</div><div className="truncate font-display text-[10px] text-ivory/80">{exp.distance} · {exp.walkTime}</div></div>
            </div>
            <div className="flex flex-1 flex-col p-3">
              <p className="mb-2 line-clamp-2 font-display text-[11px] text-charcoal-soft">{exp.description}</p>
              <div className="mt-auto flex gap-1 border-t border-charcoal/10 pt-2">
                <button onClick={() => startEdit(i)} className="flex-1 rounded-lg border border-charcoal/15 py-1.5 font-display text-[11px] font-semibold text-charcoal-soft hover:bg-teal hover:text-ivory">Edit</button>
                <button onClick={() => del(i)} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-charcoal/15 text-charcoal-soft hover:bg-marsala hover:text-ivory"><Trash2 className="h-3 w-3" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {editing !== null && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-charcoal/70 p-4 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div className="scrollbar-thin max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-ivory shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-charcoal/10 bg-ivory/95 px-6 py-4 backdrop-blur">
              <h3 className="font-serif text-lg font-semibold text-charcoal">{editing === -1 ? "New" : "Edit"} experience</h3>
              <button onClick={() => setEditing(null)} className="grid h-9 w-9 place-items-center rounded-full border border-charcoal/15 text-charcoal-soft hover:bg-charcoal hover:text-ivory"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4 p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Name" value={editForm.name} onChange={(v) => setEditForm({ ...editForm, name: v })} />
                <Field label="Distance" value={editForm.distance} onChange={(v) => setEditForm({ ...editForm, distance: v })} />
                <Field label="Walk time" value={editForm.walkTime} onChange={(v) => setEditForm({ ...editForm, walkTime: v })} />
                <Field label="Best time" value={editForm.bestTime} onChange={(v) => setEditForm({ ...editForm, bestTime: v })} />
                <Field label="Timings" value={editForm.timings} onChange={(v) => setEditForm({ ...editForm, timings: v })} />
                <Field label="Accent" value={editForm.accent} onChange={(v) => setEditForm({ ...editForm, accent: v })} />
              </div>
              <Field label="Description" textarea rows={3} value={editForm.description} onChange={(v) => setEditForm({ ...editForm, description: v })} />
              <ImageUploader label="Image" value={editForm.image} onChange={(v) => setEditForm({ ...editForm, image: v as string })} />
            </div>
            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-charcoal/10 bg-ivory/95 px-6 py-4 backdrop-blur">
              <Button onClick={() => setEditing(null)} variant="outline" className="rounded-full">Cancel</Button>
              <Button onClick={saveEdit} className="rounded-full bg-teal px-6 py-2 text-ivory hover:bg-teal-deep"><Save className="mr-2 h-4 w-4" /> Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
