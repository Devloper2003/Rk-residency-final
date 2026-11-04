"use client";
import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Plus, RotateCcw, ListPlus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminApi, LoadingSpinner } from "./_shared";
import { toast } from "sonner";
import {
  DEFAULT_SEO_KEYWORDS,
  SEO_KEYWORDS_MAX_COUNT,
  parseKeywords,
} from "@/lib/seo-keywords";

/**
 * SEO Keywords tab — OWNER FEATURE (Nov 2026).
 * The primary keywords rendered on the live website (<meta name="keywords">
 * on every page + the Hotel JSON-LD on the homepage) come from here, not
 * from code. Supports BOTH single adds and bulk adds (comma / newline
 * separated), per-keyword removal and reset-to-defaults.
 */
export function SeoKeywordsTab() {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [source, setSource] = useState<"custom" | "default">("default");
  const [loadedList, setLoadedList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [input, setInput] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");

  useEffect(() => {
    let c = false;
    adminApi.get("seo_keywords").then((data) => {
      if (c || !data) { setLoading(false); return; }
      const list: string[] = Array.isArray(data.keywords) ? data.keywords : [];
      setKeywords(list);
      setLoadedList(list);
      setSource(data.source === "custom" ? "custom" : "default");
      setLoading(false);
    });
    return () => { c = true; };
  }, []);

  const dirty = useMemo(
    () => keywords.join("||").toLowerCase() !== loadedList.join("||").toLowerCase(),
    [keywords, loadedList]
  );

  /** Add from the single input. Commas inside the input add multiple at once. */
  const addFromInput = () => {
    const additions = parseKeywords(input);
    if (additions.length === 0) { toast.error("Type a keyword first"); return; }
    mergeIn(additions);
    setInput("");
  };

  /** Merge additions into the editor list, skipping duplicates (case-insensitive). */
  const mergeIn = (additions: string[]) => {
    setKeywords((prev) => {
      const seen = new Set(prev.map((k) => k.toLowerCase()));
      const fresh: string[] = [];
      for (const k of additions) {
        if (seen.has(k.toLowerCase())) continue;
        seen.add(k.toLowerCase());
        fresh.push(k);
      }
      const merged = [...prev, ...fresh].slice(0, SEO_KEYWORDS_MAX_COUNT);
      const skipped = additions.length - fresh.length;
      if (fresh.length === 0) toast.error("Already in the list");
      else toast.success(`${fresh.length} keyword${fresh.length > 1 ? "s" : ""} added${skipped > 0 ? `, ${skipped} duplicate${skipped > 1 ? "s" : ""} skipped` : ""}`);
      return merged;
    });
  };

  const addBulk = () => {
    const additions = parseKeywords(bulkText);
    if (additions.length === 0) { toast.error("Paste keywords first (comma ya newline separated)"); return; }
    mergeIn(additions);
    setBulkText("");
    setBulkOpen(false);
  };

  const removeKeyword = (kw: string) => {
    setKeywords((prev) => prev.filter((k) => k !== kw));
  };

  const resetToDefaults = () => {
    setKeywords([...DEFAULT_SEO_KEYWORDS]);
    toast.info("Default keywords loaded — press Save to make them live");
  };

  const save = async () => {
    if (keywords.length === 0) { toast.error("Add at least one keyword"); return; }
    setSaving(true);
    const res = await adminApi.patch("seo_keywords", { keywords });
    if (res?.ok) {
      const saved: string[] = Array.isArray(res.keywords) ? res.keywords : keywords;
      setKeywords(saved);
      setLoadedList(saved);
      setSource("custom");
      toast.success("Saved — live on website!");
    } else toast.error("Save failed");
    setSaving(false);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-teal/20 bg-teal/5 p-4">
        <p className="font-display text-sm text-charcoal-soft">
          <strong className="text-teal">Primary SEO keywords.</strong> Ye keywords website ke har page ke <code className="rounded bg-ivory-deep px-1 font-mono text-[11px]">&lt;meta name=&quot;keywords&quot;&gt;</code> tag aur homepage ke Hotel structured data mein jaate hain. Jo yahan save hoga wahi website pe chalega — code mein kuch bhi hardcode nahi hai. Single add karo ya bulk mein (comma / newline separated) — phir Save dabao.
        </p>
      </div>

      {/* Status + actions bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 font-display text-[10px] font-bold uppercase tracking-wider ${source === "custom" ? "bg-teal/10 text-teal" : "bg-gold/15 text-gold-deep"}`}>
            {source === "custom" ? "Admin-managed (live)" : "Default list (code fallback)"}
          </span>
          <span className="font-display text-xs text-charcoal-soft">
            {keywords.length} / {SEO_KEYWORDS_MAX_COUNT} keywords
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={resetToDefaults}
            variant="outline"
            className="rounded-full border-charcoal/20 px-4 py-1.5 text-xs text-charcoal-soft hover:bg-charcoal/5"
          >
            <RotateCcw className="mr-1 h-3 w-3" /> Reset to defaults
          </Button>
          <Button
            onClick={() => setBulkOpen((o) => !o)}
            variant="outline"
            className="rounded-full border-teal/30 px-4 py-1.5 text-xs text-teal hover:bg-teal/5"
          >
            <ListPlus className="mr-1 h-3 w-3" /> Bulk add
          </Button>
        </div>
      </div>

      {/* Single add */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFromInput(); } }}
          placeholder="Type a keyword and press Enter — e.g. hotel near Banke Bihari Mandir"
          className="bg-ivory-deep/30 focus-visible:ring-teal/30"
          maxLength={100}
        />
        <Button
          onClick={addFromInput}
          className="shrink-0 rounded-full bg-teal px-4 py-2 text-xs text-ivory hover:bg-teal-deep"
        >
          <Plus className="mr-1 h-3 w-3" /> Add
        </Button>
      </div>

      {/* Bulk add */}
      {bulkOpen && (
        <div className="rounded-2xl border border-teal/20 bg-white p-4 shadow-sm">
          <p className="mb-2 font-serif text-sm font-semibold text-charcoal">Bulk add keywords</p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={5}
            placeholder={"Ek line mein ek keyword, ya comma se separate karo:\n\nhotel near Banke Bihari Mandir\nbudget hotel Vrindavan\nISKCON temple hotel, family rooms Vrindavan"}
            className="w-full rounded-lg border border-charcoal/15 bg-ivory-deep/30 px-3 py-2 font-display text-sm text-charcoal focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/30"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="font-display text-[10px] text-charcoal-soft">
              {parseKeywords(bulkText).length} keyword{parseKeywords(bulkText).length === 1 ? "" : "s"} detected — duplicates auto-skip honge
            </span>
            <Button
              onClick={addBulk}
              className="rounded-full bg-teal px-4 py-1.5 text-xs text-ivory hover:bg-teal-deep"
            >
              <ListPlus className="mr-1 h-3 w-3" /> Add all
            </Button>
          </div>
        </div>
      )}

      {/* Keyword chips */}
      {keywords.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-charcoal/20 bg-ivory-deep/20 p-8 text-center">
          <Search className="mx-auto h-6 w-6 text-charcoal-soft/50" />
          <p className="mt-2 font-display text-sm text-charcoal-soft">
            No keywords yet — upar se add karo ya &quot;Reset to defaults&quot; dabao.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 rounded-2xl border border-charcoal/10 bg-white p-4 shadow-sm">
          {keywords.map((kw) => (
            <span
              key={kw}
              className="group inline-flex items-center gap-1.5 rounded-full border border-teal/25 bg-teal/5 py-1.5 pl-3 pr-2 font-display text-xs font-medium text-charcoal"
            >
              {kw}
              <button
                type="button"
                onClick={() => removeKeyword(kw)}
                aria-label={`Remove ${kw}`}
                className="grid h-4 w-4 place-items-center rounded-full text-charcoal-soft transition-colors hover:bg-marsala/15 hover:text-marsala"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Live preview + save */}
      <div className="rounded-2xl border border-charcoal/10 bg-ivory-deep/30 p-4">
        <p className="mb-1 font-display text-[10px] font-bold uppercase tracking-wider text-charcoal-soft">
          Live preview — what search engines will see
        </p>
        <code className="block break-all font-mono text-[11px] text-charcoal-soft">
          &lt;meta name=&quot;keywords&quot; content=&quot;{keywords.join(", ")}&quot;&gt;
        </code>
      </div>
      <div className="flex justify-end">
        <Button
          onClick={save}
          disabled={saving || !dirty || keywords.length === 0}
          className="rounded-full bg-teal px-6 py-2 text-sm text-ivory disabled:opacity-40 hover:bg-teal-deep"
        >
          {saving ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Saving…</> : <><Check className="mr-1 h-4 w-4" /> Save keywords</>}
        </Button>
      </div>
    </div>
  );
}
