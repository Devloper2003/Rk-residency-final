"use client";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { Plus, Edit, Trash2, X, Save, Calendar, Wand2, Clock, ListChecks, CheckCircle2, XCircle, Timer, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminApi, adminFetch, LoadingSpinner, Field } from "./_shared";
import { refreshSiteContent } from "@/lib/site-content";
import { ImageUploader } from "../ImageUploader";
import { toast } from "sonner";
import { slugifyTitle, calcReadingMins, countWords, evaluateChecklist, effectiveStatus } from "@/lib/blog-utils";

const EMPTY = {
  slug: "", title: "", excerpt: "", body: "",
  category: "TEMPLE_GUIDE", tags: "[]", imageUrl: null as string | null,
  published: false, publishedAt: null as string | null, readingMins: 4,
  // Phase 3 — auto-SEO fields (server fills the empty ones on save too)
  metaTitle: "", metaDescription: "", coverAlt: "", targetKeyword: "", readingMinsAuto: true,
  // Scheduling — status replaces the old Published checkbox
  status: "DRAFT" as "DRAFT" | "SCHEDULED" | "PUBLISHED", publishOn: "" as string,
};

const STATUS_CHIP: Record<string, string> = {
  PUBLISHED: "bg-teal/10 text-teal",
  SCHEDULED: "bg-gold/20 text-gold-deep",
  DRAFT: "bg-marsala/10 text-marsala",
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
    if (p.status === "SCHEDULED" && !p.publishOn) return toast.error("Pick a 'Publish on' date/time for a scheduled post.");
    const method = p.id ? "PATCH" : "POST";
    const payload = {
      ...p,
      // Legacy boolean mirrors the status for backward compatibility.
      published: p.status === "PUBLISHED",
      publishedAt: p.status === "PUBLISHED" ? (p.publishedAt || new Date().toISOString()) : null,
      publishOn: p.publishOn || null,
    };
    const r = await adminFetch("/api/admin/blog", { method, body: JSON.stringify(payload) });
    if (r) {
      if (r.warnings?.length) toast.warning(r.warnings.join(" · "));
      toast.success(p.id ? "Post updated" : "Post created");
      refreshSiteContent();
      setEditing(null);
      reload();
    }
  };

  /** Trigger the hourly scheduler manually (same endpoint the cron calls). */
  const runScheduler = async () => {
    try {
      const r = await adminFetch("/api/cron/publish-posts", { method: "POST" });
      if (r) {
        toast.success(`Scheduler run: ${r.publishedNow ?? 0} post(s) published${r.healedLegacy ? `, ${r.healedLegacy} legacy row(s) healed` : ""}`);
        reload();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Scheduler failed");
    }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this post permanently?")) return;
    try {
      const r = await adminFetch(`/api/admin/blog?id=${id}`, { method: "DELETE" });
      if (r) { toast.success("Post deleted"); reload(); }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-display text-sm text-charcoal-soft">
          {posts.length} post{posts.length === 1 ? "" : "s"} · {posts.filter((p) => effectiveStatus(p) === "PUBLISHED").length} published · {posts.filter((p) => effectiveStatus(p) === "SCHEDULED").length} scheduled
        </p>
        <div className="flex gap-2">
          <Button onClick={runScheduler} variant="outline" className="rounded-full px-3 py-2 text-xs" title="Publish any scheduled post whose time is due">
            <PlayCircle className="mr-1 h-4 w-4" /> Run scheduler now
          </Button>
          <Button onClick={() => setEditing({ ...EMPTY })} className="rounded-full bg-teal px-4 py-2 text-sm text-ivory hover:bg-teal-deep">
            <Plus className="mr-1 h-4 w-4" /> New post
          </Button>
        </div>
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
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_CHIP[effectiveStatus(p)] || "bg-charcoal/8 text-charcoal"}`}>
                    {effectiveStatus(p)}
                  </span>
                  {effectiveStatus(p) === "SCHEDULED" && p.publishOn && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-ivory-deep px-2 py-0.5 text-[10px] font-medium text-charcoal-soft">
                      <Timer className="h-3 w-3" />
                      {new Date(p.publishOn).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                  <span className="rounded-full bg-ivory-deep px-2 py-0.5 text-[10px] font-medium text-charcoal-soft">{p.category.replace("_", " ")}</span>
                  <span className="font-display text-[10px] text-charcoal-soft">{p.readingMins} min read</span>
                </div>
                <h3 className="mt-1 truncate font-serif text-base font-semibold text-charcoal">{p.title || "(untitled)"}</h3>
                <p className="truncate font-display text-xs text-charcoal-soft">/{p.slug}</p>
                <div className="mt-2 flex gap-1">
                  <button onClick={() => setEditing(normalizeForEditor(p))} className="grid h-7 w-7 place-items-center rounded-full border border-charcoal/15 text-charcoal-soft hover:bg-teal hover:text-ivory" title="Edit">
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

/** Map a stored row into editor state, deriving status for legacy rows. */
function normalizeForEditor(p: any) {
  return {
    ...EMPTY,
    ...p,
    status: effectiveStatus(p),
    publishOn: p.publishOn ? new Date(p.publishOn).toISOString().slice(0, 16) : "",
    metaTitle: p.metaTitle || "",
    metaDescription: p.metaDescription || "",
    coverAlt: p.coverAlt || "",
    targetKeyword: p.targetKeyword || "",
  };
}

function BlogEditor({ post, onClose, onSave }: { post: any; onClose: () => void; onSave: (p: any) => void }) {
  const [form, setForm] = useState(post);
  const [saving, setSaving] = useState(false);
  // Auto-slug: once the author edits the slug by hand, stop auto-filling it.
  const [slugTouched, setSlugTouched] = useState(!!post.slug);
  // Meta title/description follow the title/excerpt until the author edits them.
  const [metaTitleTouched, setMetaTitleTouched] = useState(!!post.metaTitle);
  const [metaDescTouched, setMetaDescTouched] = useState(!!post.metaDescription);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const words = useMemo(() => countWords(form.body || ""), [form.body]);
  const autoMins = useMemo(() => calcReadingMins(form.body || ""), [form.body]);
  // Natural dimensions of the cover image — for the 1600×900 checklist item.
  const coverSize = useImageSize(form.imageUrl);

  /** Live SEO checklist (Task 2) — pass/fail updates as the author types. */
  const checklist = useMemo(
    () =>
      evaluateChecklist({
        title: form.title || "",
        targetKeyword: form.targetKeyword || "",
        metaTitle: form.metaTitle || "",
        metaDescription: form.metaDescription || "",
        excerpt: form.excerpt || "",
        body: form.body || "",
        imageUrl: form.imageUrl || null,
        coverAlt: form.coverAlt || "",
        coverWidth: coverSize?.width ?? null,
        coverHeight: coverSize?.height ?? null,
      }),
    [form, coverSize]
  );

  /** Auto-generate the slug from the title (lowercase, hyphens, editable). */
  const onTitleChange = (v: string) => {
    setForm((f: any) => ({
      ...f,
      title: v,
      slug: slugTouched ? f.slug : slugifyTitle(v),
      metaTitle: metaTitleTouched ? f.metaTitle : v,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  const insertIntoBody = (text: string) => {
    const el = bodyRef.current;
    if (!el) { set("body", `${form.body || ""}${text}`); return; }
    const start = el.selectionStart ?? (form.body || "").length;
    const end = el.selectionEnd ?? start;
    const next = (form.body || "").slice(0, start) + text + (form.body || "").slice(end);
    set("body", next);
    requestAnimationFrame(() => { el.focus(); el.selectionStart = el.selectionEnd = start + text.length; });
  };

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-charcoal/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="scrollbar-thin max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-ivory shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-charcoal/10 bg-ivory/95 px-6 py-4 backdrop-blur">
          <div>
            <h3 className="font-serif text-lg font-semibold text-charcoal">{post.id ? "Edit post" : "New post"}</h3>
            <p className="font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Blog editor · auto-SEO on save</p>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-charcoal/15 text-charcoal-soft hover:bg-charcoal hover:text-ivory">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title" value={form.title} onChange={onTitleChange} />
            <div>
              <Label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">
                Slug <span className="normal-case text-teal">· auto-generated, editable</span>
              </Label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }}
                placeholder="auto-from-title"
                className="w-full rounded-md border border-charcoal/15 bg-ivory-deep/30 px-3 py-2 font-display text-xs text-charcoal focus:border-teal focus:outline-none"
              />
              <p className="mt-1 font-display text-[10px] text-charcoal-soft/70">/blog/{form.slug || "…"} — lowercase, hyphen-separated</p>
            </div>
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
            <div>
              <Label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">
                Reading mins {form.readingMinsAuto !== false && <span className="normal-case text-teal">· auto ({autoMins} min, {words} words)</span>}
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="number" min={1}
                  value={form.readingMinsAuto !== false ? autoMins : form.readingMins}
                  disabled={form.readingMinsAuto !== false}
                  onChange={(e) => set("readingMins", parseInt(e.target.value) || 4)}
                  className="w-full rounded-md border border-charcoal/15 bg-ivory-deep/30 px-3 py-2 font-display text-xs text-charcoal focus:border-teal focus:outline-none disabled:opacity-60"
                />
              </div>
              <label className="mt-1 flex cursor-pointer items-center gap-1.5 font-display text-[10px] text-charcoal-soft">
                <input
                  type="checkbox"
                  checked={form.readingMinsAuto !== false}
                  onChange={(e) => set("readingMinsAuto", e.target.checked)}
                  className="h-3 w-3 rounded border-charcoal/30"
                />
                <Wand2 className="h-3 w-3 text-teal" /> Auto from body (uncheck to override)
              </label>
            </div>
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

          <Field
            label="Target keyword"
            value={form.targetKeyword || ""}
            onChange={(v) => set("targetKeyword", v)}
            hint="The search phrase this post should rank for, e.g. 'banke bihari mandir darshan guide' — checked against title, intro and other published posts"
          />

          <Field
            label="Cover image alt text"
            value={form.coverAlt || ""}
            onChange={(v) => set("coverAlt", v)}
            hint="Describe the cover for Google Images + screen readers, e.g. 'Satvik thali on a brass plate at RK Residency Vrindavan'"
          />

          {/* SEO checklist — live pass/fail (Task 2) */}
          <SeoChecklist items={checklist} />

          <Field label="Excerpt" textarea value={form.excerpt} onChange={(v) => set("excerpt", v)} />

          {/* SEO meta — auto-filled from title/excerpt when left empty */}
          <div className="rounded-2xl border border-charcoal/10 bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-teal" />
              <span className="font-serif text-sm font-semibold text-charcoal">SEO meta</span>
              <span className="font-display text-[10px] text-charcoal-soft">auto-generated on save when left empty</span>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Meta title</Label>
                <input
                  type="text" maxLength={70}
                  value={form.metaTitle || ""}
                  onChange={(e) => { setMetaTitleTouched(true); set("metaTitle", e.target.value); }}
                  placeholder="auto from title"
                  className="w-full rounded-md border border-charcoal/15 bg-ivory-deep/30 px-3 py-2 font-display text-xs text-charcoal focus:border-teal focus:outline-none"
                />
                <CharCount value={form.metaTitle || ""} fallback={form.title} max={60} />
              </div>
              <div>
                <Label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Meta description</Label>
                <textarea
                  rows={2} maxLength={180}
                  value={form.metaDescription || ""}
                  onChange={(e) => { setMetaDescTouched(true); set("metaDescription", e.target.value); }}
                  placeholder="auto from excerpt"
                  className="w-full rounded-md border border-charcoal/15 bg-ivory-deep/30 px-3 py-2 font-display text-xs text-charcoal focus:border-teal focus:outline-none"
                />
                <CharCount value={form.metaDescription || ""} fallback={form.excerpt} max={155} />
              </div>
              <p className="font-display text-[10px] text-charcoal-soft/70">
                Canonical, og:title, og:description, og:image and og:url are generated automatically from these values when the post is saved.
              </p>
            </div>
          </div>

          <div>
            <Field label="Body (Markdown — use ## for headings)" textarea rows={12} value={form.body} onChange={(v) => set("body", v)} />
            <div className="mt-1 flex items-center gap-3 font-display text-[10px] text-charcoal-soft/70">
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{words} words · {autoMins} min read</span>
              <span>·</span>
              <button type="button" onClick={() => insertIntoBody("\n\n## New section\n\n")} className="text-teal hover:underline">+ Insert ## heading</button>
            </div>
          </div>

          {/* Status — replaces the old single Published checkbox (Task 3) */}
          <div className="rounded-xl border border-charcoal/10 bg-white p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Status</Label>
                <Select value={form.status || "DRAFT"} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger className="bg-ivory-deep/30"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft — only visible in the admin</SelectItem>
                    <SelectItem value="SCHEDULED">Scheduled — goes live at the set time</SelectItem>
                    <SelectItem value="PUBLISHED">Published — live on the website</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">
                  Publish on <span className="normal-case text-teal">· used when Scheduled</span>
                </Label>
                <input
                  type="datetime-local"
                  value={(form.publishOn || "").slice(0, 16)}
                  onChange={(e) => set("publishOn", e.target.value)}
                  disabled={form.status !== "SCHEDULED"}
                  className="w-full rounded-md border border-charcoal/15 bg-ivory-deep/30 px-3 py-2 font-display text-xs text-charcoal focus:border-teal focus:outline-none disabled:opacity-50"
                />
                <p className="mt-1 font-display text-[10px] text-charcoal-soft/70">
                  An hourly scheduler publishes due posts automatically. Scheduled posts stay hidden from the site until then.
                </p>
              </div>
            </div>
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

/** Character counter that shows the auto (fallback) length when the field is empty. */
function CharCount({ value, fallback, max }: { value: string; fallback: string; max: number }) {
  const len = (value.trim() || fallback || "").trim().length;
  const over = len > max;
  return (
    <p className={`mt-1 font-display text-[10px] ${over ? "text-marsala" : "text-charcoal-soft/70"}`}>
      {len}/{max} chars{over ? " — too long, shorten it" : ""}{!value.trim() && fallback ? " (auto)" : ""}
    </p>
  );
}

/** Load an image URL and report its natural dimensions (for the 1600×900 check). */
function useImageSize(url: string | null | undefined): { width: number; height: number } | null {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  useEffect(() => {
    if (!url) { setSize(null); return; }
    let alive = true;
    const img = new Image();
    img.onload = () => { if (alive) setSize({ width: img.naturalWidth, height: img.naturalHeight }); };
    img.onerror = () => { if (alive) setSize(null); };
    img.src = url;
    return () => { alive = false; };
  }, [url]);
  return size;
}

/** Live pass/fail SEO checklist panel shown inside the blog editor. */
function SeoChecklist({ items }: { items: ReturnType<typeof evaluateChecklist> }) {
  const passed = items.filter((i) => i.pass).length;
  const allPass = passed === items.length;
  return (
    <div className={`rounded-2xl border p-4 ${allPass ? "border-teal/40 bg-teal/5" : "border-gold/40 bg-gold/5"}`}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-teal" />
          <span className="font-serif text-sm font-semibold text-charcoal">SEO checklist</span>
        </div>
        <span className={`rounded-full px-2 py-0.5 font-display text-[10px] font-semibold ${allPass ? "bg-teal text-ivory" : "bg-gold/20 text-gold-deep"}`}>
          {passed}/{items.length} passed
        </span>
      </div>
      <ul className="space-y-1.5">
        {items.map((i) => (
          <li key={i.id} className="flex items-start gap-2 font-display text-xs">
            {i.pass ? (
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal" />
            ) : (
              <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-marsala" />
            )}
            <span className={i.pass ? "text-charcoal-soft" : "text-charcoal"}>
              {i.label}
              {i.info && <span className="ml-1 text-charcoal-soft/70">({i.info})</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
