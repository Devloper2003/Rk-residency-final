"use client";
import { useCallback, useEffect, useState } from "react";
import { Plus, Edit, Trash2, X, Save, CalendarDays, Sparkles, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminApi, adminFetch, LoadingSpinner, Field } from "./_shared";
import { toast } from "sonner";

type Row = {
  id: string;
  month: string;
  event: string;
  targetKeywords: string; // parsed JSON array
  category: string;
  status: string;
  linkedPostId: string | null;
  notes: string | null;
  post: { id: string; slug: string; title: string; status: string } | null;
};

const EMPTY_ROW = {
  month: "", event: "", targetKeywords: "[]",
  category: "FESTIVAL", status: "PLANNED",
  linkedPostId: null as string | null, notes: "",
};

const STATUS_CHIP: Record<string, string> = {
  PLANNED: "bg-gold/20 text-gold-deep",
  DRAFTED: "bg-marsala/10 text-marsala",
  PUBLISHED: "bg-teal/10 text-teal",
};

export function CalendarTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);

  const reload = useCallback(() => {
    adminApi.get("calendar").then((d) => {
      if (d) setRows(d.rows || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    let c = false;
    adminApi.get("calendar").then((d) => {
      if (c) return;
      if (d) setRows(d.rows || []);
      setLoading(false);
    }).catch(() => setLoading(false));
    return () => { c = true; };
  }, []);

  const seedPreset = async () => {
    try {
      const r = await adminFetch("/api/admin/calendar?seed=all", { method: "POST", body: JSON.stringify({}) });
      if (r) {
        toast.success(`Suggested Braj calendar loaded — ${r.created} row(s) added. Dates are TODO — please confirm each one.`);
        reload();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Seed failed");
    }
  };

  const save = async (p: any) => {
    if (!p.month.trim()) return toast.error("Month is required (e.g. 2026-08)");
    if (!p.event.trim()) return toast.error("Event is required");
    const method = p.id ? "PATCH" : "POST";
    const r = await adminFetch("/api/admin/calendar", { method, body: JSON.stringify(p) });
    if (r) {
      toast.success(p.id ? "Calendar row updated" : "Calendar row added");
      setEditing(null);
      reload();
    }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this calendar row? (A linked post is NOT deleted.)")) return;
    try {
      const r = await adminFetch(`/api/admin/calendar?id=${id}`, { method: "DELETE" });
      if (r) { toast.success("Row deleted"); reload(); }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-display text-sm text-charcoal-soft">
          {rows.length} planned post{rows.length === 1 ? "" : "s"} · {rows.filter((r) => r.status === "PUBLISHED").length} published
        </p>
        <div className="flex gap-2">
          <Button onClick={seedPreset} variant="outline" className="rounded-full px-3 py-2 text-xs" title="Add the suggested Braj festival rows (existing rows are never duplicated)">
            <Download className="mr-1 h-4 w-4" /> Load suggested Braj calendar
          </Button>
          <Button onClick={() => setEditing({ ...EMPTY_ROW })} className="rounded-full bg-teal px-4 py-2 text-sm text-ivory hover:bg-teal-deep">
            <Plus className="mr-1 h-4 w-4" /> Add row
          </Button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-charcoal/15 bg-white p-12 text-center">
          <CalendarDays className="mx-auto mb-3 h-8 w-8 text-gold" />
          <p className="font-serif text-base font-semibold text-charcoal">No content calendar rows yet</p>
          <p className="mt-1 font-display text-xs text-charcoal-soft">
            Load the suggested Braj calendar (Janmashtami, Radhashtami, Holi, Kartik month…) or add rows yourself.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => {
            const keywords: string[] = Array.isArray(r.targetKeywords) ? r.targetKeywords : [];
            return (
              <div key={r.id} className="flex flex-col gap-3 rounded-2xl border border-charcoal/10 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
                <div className="w-20 shrink-0">
                  <div className="rounded-xl bg-ivory-deep px-2 py-1.5 text-center">
                    <div className="font-serif text-sm font-bold text-charcoal">{r.month}</div>
                    <div className="font-display text-[9px] uppercase tracking-wider text-charcoal-soft">month</div>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-serif text-base font-semibold text-charcoal">{r.event}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_CHIP[r.status] || "bg-charcoal/8"}`}>{r.status}</span>
                    <span className="rounded-full bg-ivory-deep px-2 py-0.5 text-[10px] font-medium text-charcoal-soft">{r.category.replace("_", " ")}</span>
                  </div>
                  {r.notes && (
                    <p className="mt-0.5 font-display text-[11px] text-marsala">⚠ {r.notes}</p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {keywords.slice(0, 3).map((k) => (
                      <span key={k} className="rounded-full bg-ivory-deep px-2 py-0.5 font-display text-[10px] text-charcoal-soft">{k}</span>
                    ))}
                    {keywords.length > 3 && (
                      <span className="font-display text-[10px] text-charcoal-soft">+{keywords.length - 3} more</span>
                    )}
                  </div>
                  {r.post && (
                    <a href={`/admin`} className="mt-1 inline-flex items-center gap-1 font-display text-[11px] text-teal hover:underline">
                      <ExternalLink className="h-3 w-3" /> Linked post: “{r.post.title}” ({r.post.status.toLowerCase()})
                    </a>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button onClick={() => setEditing({ ...EMPTY_ROW, ...r, targetKeywords: JSON.stringify(keywords), notes: r.notes || "" })} className="grid h-7 w-7 place-items-center rounded-full border border-charcoal/15 text-charcoal-soft hover:bg-teal hover:text-ivory" title="Edit row">
                    <Edit className="h-3 w-3" />
                  </button>
                  <button onClick={() => del(r.id)} className="grid h-7 w-7 place-items-center rounded-full border border-charcoal/15 text-charcoal-soft hover:bg-marsala hover:text-ivory" title="Delete row">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && <RowEditor row={editing} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  );
}

function RowEditor({ row, onClose, onSave }: { row: any; onClose: () => void; onSave: (r: any) => void }) {
  const [form, setForm] = useState(row);
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-charcoal/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="scrollbar-thin max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-ivory shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-charcoal/10 bg-ivory/95 px-6 py-4 backdrop-blur">
          <div>
            <h3 className="font-serif text-lg font-semibold text-charcoal">{row.id ? "Edit calendar row" : "New calendar row"}</h3>
            <p className="font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Content calendar</p>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-charcoal/15 text-charcoal-soft hover:bg-charcoal hover:text-ivory">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Month (YYYY-MM)" value={form.month} onChange={(v) => set("month", v)} hint="e.g. 2026-08 — dates are TODO until you confirm the exact tithi" />
            <Field label="Event / festival" value={form.event} onChange={(v) => set("event", v)} />
          </div>

          <Field
            label="Target keywords (comma-separated)"
            value={(() => { try { return JSON.parse(form.targetKeywords || "[]").join(", "); } catch { return ""; } })()}
            onChange={(v) => set("targetKeywords", JSON.stringify(v.split(",").map((t: string) => t.trim()).filter(Boolean)))}
            hint="Keyword groups: core hotel · local discovery · brand · commercial · attraction · long-tail (Banke Bihari, ISKCON, Prem Mandir, Shani Dev Mandir, Kailash Nagar)"
          />

          <div className="grid gap-3 sm:grid-cols-2">
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
              <Label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger className="bg-ivory-deep/30"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PLANNED">Planned</SelectItem>
                  <SelectItem value="DRAFTED">Drafted</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Field label="Notes" textarea value={form.notes || ""} onChange={(v) => set("notes", v)} hint="e.g. 'Date TODO — confirm exact tithi'" />
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-charcoal/10 bg-ivory/95 px-6 py-4 backdrop-blur">
          <Button onClick={onClose} variant="outline" className="rounded-full">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="rounded-full bg-teal px-6 py-2 text-ivory hover:bg-teal-deep">
            {saving ? <><Save className="mr-2 h-4 w-4 animate-pulse" /> Saving…</> : <><Save className="mr-2 h-4 w-4" /> Save row</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
