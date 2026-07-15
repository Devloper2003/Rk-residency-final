"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Edit, Trash2, X, Save, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminApi, adminFetch, LoadingSpinner, Field } from "./_shared";
import { ImageUploader } from "../ImageUploader";
import { toast } from "sonner";

const EMPTY = {
  slug: "", title: "", excerpt: "", body: "",
  category: "TEMPLE_GUIDE", tags: "[]", imageUrl: null as string | null,
  published: false, publishedAt: null as string | null, readingMins: 4,
};

export function BlogTab() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);

  const reload = useCallback(() => {
    adminApi.get("blog").then((d) => {
      if (d) setPosts(d.posts || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let c = false;
    adminApi.get("blog").then((d) => {
      if (c) return;
      if (d) setPosts(d.posts || []);
      setLoading(false);
    });
    return () => { c = true; };
  }, []);

  const save = async (p: any) => {
    if (!p.slug.trim()) return toast.error("Slug is required");
    if (!p.title.trim()) return toast.error("Title is required");
    const method = p.id ? "PATCH" : "POST";
    const payload = {
      ...p,
      publishedAt: p.published ? (p.publishedAt || new Date().toISOString()) : null,
    };
    const r = await adminFetch("/api/admin/blog", { method, body: JSON.stringify(payload) });
    if (r) {
      toast.success(p.id ? "Post updated" : "Post created");
      setEditing(null);
      reload();
    }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this post permanently?")) return;
    const r = await adminFetch(`/api/admin/blog?id=${id}`, { method: "DELETE" });
    if (r) { toast.success("Deleted"); reload(); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-display text-sm text-charcoal-soft">{posts.length} post{posts.length === 1 ? "" : "s"} · {posts.filter((p) => p.published).length} published</p>
        <Button onClick={() => setEditing({ ...EMPTY })} className="rounded-full bg-teal px-4 py-2 text-sm text-ivory hover:bg-teal-deep">
          <Plus className="mr-1 h-4 w-4" /> New post
        </Button>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-charcoal/15 bg-white p-12 text-center">
          <p className="font-serif text-base font-semibold text-charcoal">No blog posts yet</p>
          <p className="mt-1 font-display text-xs text-charcoal-soft">Click "New post" to write your first story.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {posts.map((p) => (
            <div key={p.id} className="flex gap-3 rounded-2xl border border-charcoal/10 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-ivory-deep">
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-charcoal-soft/40"><Calendar className="h-6 w-6" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.published ? "bg-teal/10 text-teal" : "bg-marsala/10 text-marsala"}`}>
                    {p.published ? "Published" : "Draft"}
                  </span>
                  <span className="rounded-full bg-ivory-deep px-2 py-0.5 text-[10px] font-medium text-charcoal-soft">{p.category.replace("_", " ")}</span>
                  <span className="font-display text-[10px] text-charcoal-soft">{p.readingMins} min read</span>
                </div>
                <h3 className="mt-1 truncate font-serif text-base font-semibold text-charcoal">{p.title || "(untitled)"}</h3>
                <p className="truncate font-display text-xs text-charcoal-soft">/{p.slug}</p>
                <div className="mt-2 flex gap-1">
                  <button onClick={() => setEditing(p)} className="grid h-7 w-7 place-items-center rounded-full border border-charcoal/15 text-charcoal-soft hover:bg-teal hover:text-ivory" title="Edit">
                    <Edit className="h-3 w-3" />
                  </button>
                  <button onClick={() => del(p.id)} className="grid h-7 w-7 place-items-center rounded-full border border-charcoal/15 text-charcoal-soft hover:bg-marsala hover:text-ivory" title="Delete">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <BlogEditor post={editing} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  );
}

function BlogEditor({ post, onClose, onSave }: { post: any; onClose: () => void; onSave: (p: any) => void }) {
  const [form, setForm] = useState(post);
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-charcoal/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="scrollbar-thin max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-ivory shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-charcoal/10 bg-ivory/95 px-6 py-4 backdrop-blur">
          <div>
            <h3 className="font-serif text-lg font-semibold text-charcoal">{post.id ? "Edit post" : "New post"}</h3>
            <p className="font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Blog editor</p>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-charcoal/15 text-charcoal-soft hover:bg-charcoal hover:text-ivory">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title" value={form.title} onChange={(v) => set("title", v)} />
            <Field label="Slug" value={form.slug} onChange={(v) => set("slug", v)} hint="URL-safe, lowercase, hyphen-separated" />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Category</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger className="bg-ivory-deep/30"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEMPLE_GUIDE">Temple Guide</SelectItem>
                  <SelectItem value="FESTIVAL">Festival</SelectItem>
                  <SelectItem value="LOCAL_TIP">Local Tip</SelectItem>
                  <SelectItem value="EXPERIENCE">Experience</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Field label="Reading mins" type="number" value={form.readingMins} onChange={(v) => set("readingMins", parseInt(v) || 4)} />
            <Field label="Tags (comma-separated)" value={(() => {
              try { return JSON.parse(form.tags).join(", "); } catch { return form.tags; }
            })()} onChange={(v) => set("tags", JSON.stringify(v.split(",").map((t) => t.trim()).filter(Boolean)))} />
          </div>

          <ImageUploader
            label="Cover image"
            value={form.imageUrl}
            onChange={(v) => set("imageUrl", v)}
            hint="Recommended: 1600×900px, webp/jpg/png"
          />

          <Field label="Excerpt" textarea value={form.excerpt} onChange={(v) => set("excerpt", v)} />
          <Field label="Body (Markdown — use ## for headings)" textarea value={form.body} onChange={(v) => set("body", v)} />

          <div className="flex items-center gap-3 rounded-xl border border-charcoal/10 bg-white p-3">
            <input type="checkbox" id="pub" checked={!!form.published} onChange={(e) => set("published", e.target.checked)} className="h-4 w-4 rounded border-charcoal/30" />
            <Label htmlFor="pub" className="cursor-pointer font-display text-sm text-charcoal">
              Published
              <span className="block font-display text-[10px] font-normal text-charcoal-soft">Tick to make this post visible on the website.</span>
            </Label>
          </div>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-charcoal/10 bg-ivory/95 px-6 py-4 backdrop-blur">
          <Button onClick={onClose} variant="outline" className="rounded-full">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="rounded-full bg-teal px-6 py-2 text-ivory hover:bg-teal-deep">
            {saving ? <><Save className="mr-2 h-4 w-4 animate-pulse" /> Saving…</> : <><Save className="mr-2 h-4 w-4" /> Save post</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
