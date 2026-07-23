"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Edit, Trash2, X, Save, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminApi, LoadingSpinner, Field } from "./_shared";
import { ImageUploader } from "../ImageUploader";
import { refreshSiteContent } from "@/lib/site-content";
import { toast } from "sonner";

type GalleryItem = { src: string; alt: string; caption: string; category: string; span: string };
const EMPTY: GalleryItem = { src: "", alt: "", caption: "", category: "Temples", span: "sm" };

export function GalleryTab() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [contentId, setContentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<GalleryItem>(EMPTY);

  const reload = useCallback(() => {
    adminApi.get("content").then((d) => {
      if (!d) { setLoading(false); return; }
      const item = (d.items || []).find((i: any) => i.key === "gallery.items");
      if (item) { setContentId(item.id); try { setItems(JSON.parse(item.value || "[]")); } catch { setItems([]); } }
      setLoading(false);
    });
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const saveAll = async (newItems: GalleryItem[]) => {
    setItems(newItems);
    try { const res = await adminApi.patch("content", { id: contentId, value: JSON.stringify(newItems) }); if (res) { toast.success("Gallery updated!"); refreshSiteContent(); } } catch (e) { toast.error(e instanceof Error ? e.message : "Save failed"); }
  };
  const startEdit = (idx: number) => { setEditing(idx); setEditForm(idx === -1 ? { ...EMPTY } : { ...items[idx] }); };
  const saveEdit = async () => { if (editing === null) return; if (!editForm.src.trim()) return toast.error("Image required"); if (!editForm.caption.trim()) return toast.error("Caption required"); const ni = [...items]; if (editing === -1) ni.push(editForm); else ni[editing] = editForm; await saveAll(ni); setEditing(null); };
  const del = async (idx: number) => { if (!confirm("Delete?")) return; await saveAll(items.filter((_, i) => i !== idx)); };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-display text-sm text-charcoal-soft">{items.length} images</p>
        <Button onClick={() => startEdit(-1)} className="rounded-full bg-teal px-4 py-2 text-sm text-ivory hover:bg-teal-deep"><Plus className="mr-1 h-4 w-4" /> Add image</Button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((g, i) => (
          <div key={i} className="group relative overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-sm">
            <div className="relative aspect-square bg-ivory-deep">
              {g.src ? <img src={g.src} alt={g.alt} className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-charcoal-soft/40"><ImageIcon className="h-6 w-6" /></div>}
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-charcoal/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex gap-1.5"><button onClick={() => startEdit(i)} className="grid h-7 w-7 place-items-center rounded-lg bg-ivory/90 text-charcoal hover:bg-ivory"><Edit className="h-3.5 w-3.5" /></button><button onClick={() => del(i)} className="grid h-7 w-7 place-items-center rounded-lg bg-ivory/90 text-marsala hover:bg-marsala hover:text-ivory"><Trash2 className="h-3.5 w-3.5" /></button></div>
              </div>
            </div>
            <div className="p-2"><div className="truncate font-mono text-[10px] text-charcoal-soft">{g.category}</div><div className="truncate font-serif text-xs font-semibold text-charcoal">{g.caption}</div></div>
          </div>
        ))}
      </div>
      {editing !== null && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-charcoal/70 p-4 backdrop-blur-sm" onClick={() => setEditing(null)}>
          <div className="scrollbar-thin max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-ivory shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-charcoal/10 bg-ivory/95 px-6 py-4 backdrop-blur"><h3 className="font-serif text-lg font-semibold text-charcoal">{editing === -1 ? "Add" : "Edit"} image</h3><button onClick={() => setEditing(null)} className="grid h-9 w-9 place-items-center rounded-full border border-charcoal/15 text-charcoal-soft"><X className="h-4 w-4" /></button></div>
            <div className="space-y-4 p-6">
              <ImageUploader label="Image" value={editForm.src} onChange={(v) => setEditForm({ ...editForm, src: v as string })} />
              <Field label="Caption" value={editForm.caption} onChange={(v) => setEditForm({ ...editForm, caption: v })} />
              <Field label="Alt text" value={editForm.alt} onChange={(v) => setEditForm({ ...editForm, alt: v })} />
              <div className="grid gap-3 sm:grid-cols-2"><Field label="Category" value={editForm.category} onChange={(v) => setEditForm({ ...editForm, category: v })} /><Field label="Span (sm/lg)" value={editForm.span} onChange={(v) => setEditForm({ ...editForm, span: v })} /></div>
            </div>
            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-charcoal/10 bg-ivory/95 px-6 py-4 backdrop-blur"><Button onClick={() => setEditing(null)} variant="outline" className="rounded-full">Cancel</Button><Button onClick={saveEdit} className="rounded-full bg-teal px-6 py-2 text-ivory hover:bg-teal-deep"><Save className="mr-2 h-4 w-4" /> Save</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}
