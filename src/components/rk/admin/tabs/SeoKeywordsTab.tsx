"use client";
import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Eraser, Loader2, Plus, RotateCcw, ListPlus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminApi, LoadingSpinner } from "./_shared";
import { toast } from "sonner";
import {
  DEFAULT_SEO_KEYWORDS,
  SEO_KEYWORDS_MAX_COUNT,
  SEO_PAGES,
  resolveSeoKeywords,
} from "@/lib/seo-keywords";

/**
 * SEO Keywords tab — OWNER FEATURE (Nov 2026).
 *
 * The primary keywords rendered on the live website (<meta name="keywords">
 * on every page + the Hotel JSON-LD on the homepage) come from here, not
 * from code. TWO levels:
 *   • Global list — the default set every page renders.
 *   • Per-page sets — pick a page below and save its own keywords; that page
 *     then renders ONLY its own set. Pages without their own set keep using
 *     the global list. Clearing a page's set puts it back on the global list.
 *
 * Both levels support single adds (Enter / Add) and bulk adds (comma or
 * newline separated), per-keyword removal, and a live meta preview.
 */

type Target = "global" | string;

const GLOBAL: Target = "global";

export function SeoKeywordsTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Saved state (what the server has).
  const [globalSaved, setGlobalSaved] = useState<string[]>([]);
  const [pageSaved, setPageSaved] = useState<Record<string, string[]>>({});

  // Draft state (what the editor is showing, per target — switches preserve
  // unsaved edits so the owner can prepare several pages before saving).
  const [globalDraft, setGlobalDraft] = useState<string[]>([]);
  const [pageDrafts, setPageDrafts] = useState<Record<string, string[]>>({});

  const [selected, setSelected] = useState<Target>(GLOBAL);
  const [input, setInput] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");

  useEffect(() => {
    let c = false;
    adminApi.get("seo_keywords").then((data) => {
      if (c) return;
      // Server sends: globalKeywords (saved global row), keywords (the
      // effective global view — the code defaults while nothing is saved),
      // and pageSets (every per-page set). While no global list is saved the
      // editor pre-fills the effective defaults so "Reset to defaults" and
      // the preview match what live pages actually render.
      const g: string[] = Array.isArray(data?.globalKeywords) ? data.globalKeywords : [];
      const base: string[] = g.length > 0 ? g : (Array.isArray(data?.keywords) ? data.keywords : []);
      const ps: Record<string, string[]> = data?.pageSets && typeof data.pageSets === "object" ? data.pageSets : {};
      setGlobalSaved(base);
      setGlobalDraft([...base]);
      setPageSaved(ps);
      setPageDrafts(Object.fromEntries(Object.entries(ps).map(([k, v]) => [k, [...v]])));
      setLoading(false);
    }).catch(() => setLoading(false));
    return () => { c = true; };
  }, []);

  const isPage = selected !== GLOBAL;
  const editing: string[] = isPage ? (pageDrafts[selected] ?? []) : globalDraft;
  const savedList: string[] = isPage ? (pageSaved[selected] ?? []) : globalSaved;

  const dirty = useMemo(
    () => editing.join("||").toLowerCase() !== savedList.join("||").toLowerCase(),
    [editing, savedList]
  );

  /** What the live site will render for the selected target after a save. */
  const effective = useMemo(
    () => resolveSeoKeywords(isPage ? selected : null, pageDrafts, globalDraft),
    [isPage, selected, pageDrafts, globalDraft]
  );

  /** Write into the current target's draft (single + bulk share this). */
  const setEditing = (updater: (prev: string[]) => string[]) => {
    if (isPage) setPageDrafts((prev) => ({ ...prev, [selected]: updater(prev[selected] ?? []) }));
    else setGlobalDraft(updater);
  };

  /** Merge additions into the editor list, skipping duplicates (case-insensitive). */
  const mergeIn = (additions: string[]) => {
    let added = 0;
    let skipped = 0;
    setEditing((prev) => {
      const seen = new Set(prev.map((k) => k.toLowerCase()));
      const fresh: string[] = [];
      for (const k of additions) {
        if (seen.has(k.toLowerCase())) { skipped += 1; continue; }
        seen.add(k.toLowerCase());
        fresh.push(k);
      }
      added = fresh.length;
      return [...prev, ...fresh].slice(0, SEO_KEYWORDS_MAX_COUNT);
    });
    if (added === 0) toast.error("Already in the list");
    else toast.success(`${added} keyword${added > 1 ? "s" : ""} added${skipped > 0 ? `, ${skipped} duplicate${skipped > 1 ? "s" : ""} skipped` : ""}`);
  };

  const addFromInput = () => {
    const additions = parseInputList(input);
    if (additions.length === 0) { toast.error("Type a keyword first"); return; }
    mergeIn(additions);
    setInput("");
  };

  const addBulk = () => {
    const additions = parseInputList(bulkText);
    if (additions.length === 0) { toast.error("Paste keywords first (comma ya newline separated)"); return; }
    mergeIn(additions);
    setBulkText("");
    setBulkOpen(false);
  };

  const removeKeyword = (kw: string) => setEditing((prev) => prev.filter((k) => k !== kw));

  const resetToDefaults = () => {
    if (isPage) { toast.error("Ye sirf Global list ke liye hai — page ke liye 'Global list copy karo' use karo"); return; }
    setGlobalDraft([...DEFAULT_SEO_KEYWORDS]);
    toast.info("Default keywords loaded — press Save to make them live");
  };

  /** Page helper: start this page's set from the (live) global list. */
  const copyGlobalIntoPage = () => {
    if (!isPage) return;
    setPageDrafts((prev) => ({ ...prev, [selected]: [...globalSaved] }));
    toast.info("Global list loaded — edit karke Save dabao");
  };

  /** Page helper: empty the draft; saving then removes the page's own set. */
  const clearPageSet = () => {
    if (!isPage) return;
    setPageDrafts((prev) => ({ ...prev, [selected]: [] }));
    toast.info("Draft cleared — Save dabao, is page pe phir Global list chalegi");
  };

  const save = async () => {
    if (!isPage && editing.length === 0) { toast.error("Add at least one keyword"); return; }
    setSaving(true);
    if (isPage) {
      const res = await adminApi.patch("seo_keywords_page", { pageKey: selected, keywords: editing });
      if (res?.ok) {
        const sets: Record<string, string[]> = res.pageSets && typeof res.pageSets === "object" ? res.pageSets : {};
        setPageSaved(sets);
        setPageDrafts((prev) => ({ ...prev, [selected]: Array.isArray(res.keywords) ? res.keywords : [] }));
        toast.success(res.keywords?.length > 0 ? `Saved — /${selected === "home" ? "" : selected} pe ab ye hi keywords live hain!` : "Cleared — ab is page pe Global list chalegi");
      } else toast.error("Save failed");
    } else {
      const res = await adminApi.patch("seo_keywords", { keywords: globalDraft });
      if (res?.ok) {
        const saved: string[] = Array.isArray(res.keywords) ? res.keywords : globalDraft;
        setGlobalSaved(saved);
        setGlobalDraft(saved);
        toast.success("Saved — Global list live on website!");
      } else toast.error("Save failed");
    }
    setSaving(false);
  };

  if (loading) return <LoadingSpinner />;

  const targetLabel = isPage ? SEO_PAGES.find((p) => p.key === selected)?.label ?? selected : "Global (all pages)";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-teal/20 bg-teal/5 p-4">
        <p className="font-display text-sm text-charcoal-soft">
          <strong className="text-teal">SEO keywords — Global + per-page.</strong> Jo yahan save hoga wahi website ke <code className="rounded bg-ivory-deep px-1 font-mono text-[11px]">&lt;meta name=&quot;keywords&quot;&gt;</code> tag aur homepage ke Hotel structured data mein jaata hai — code mein kuch bhi hardcode nahi hai. <strong>Global list</strong> har page pe chalti hai; kisi page ko apna alag set chahiye to neeche us page ko select karke uske keywords add karo — us page pe sirf uska apna set hi ginega. Single add ya bulk (comma / newline) — phir Save dabao.
        </p>
      </div>

      {/* Target selector: Global + every page */}
      <div className="rounded-2xl border border-charcoal/10 bg-white p-3 shadow-sm">
        <p className="mb-2 px-1 font-display text-[10px] font-bold uppercase tracking-wider text-charcoal-soft">
          Kiska keywords edit karne hain?
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelected(GLOBAL)}
            className={`rounded-full px-3.5 py-1.5 font-display text-xs font-semibold transition-colors ${selected === GLOBAL ? "bg-teal text-ivory" : "border border-charcoal/15 bg-ivory-deep/30 text-charcoal-soft hover:bg-charcoal/5"}`}
          >
            🌐 Global (all pages)
            {globalSaved.length > 0 && (
              <span className={`ml-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle ${selected === GLOBAL ? "bg-ivory" : "bg-teal"}`} aria-label="admin-managed" />
            )}
          </button>
          {SEO_PAGES.map((p) => {
            const hasOwn = (pageSaved[p.key]?.length ?? 0) > 0;
            const active = selected === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setSelected(p.key)}
                className={`rounded-full px-3.5 py-1.5 font-display text-xs font-semibold transition-colors ${active ? "bg-teal text-ivory" : "border border-charcoal/15 bg-ivory-deep/30 text-charcoal-soft hover:bg-charcoal/5"}`}
              >
                {p.label}
                {hasOwn && (
                  <span className={`ml-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle ${active ? "bg-ivory" : "bg-teal"}`} aria-label="apna set saved hai" />
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-2 px-1 font-display text-[11px] text-charcoal-soft">
          • dot = us target ka apna admin-saved set live hai. Page select karo → uske apne keywords edit honge. Room/blog detail pages apne section ka set follow karte hain (e.g. /rooms/deluxe → Rooms).
        </p>
      </div>

      {/* Status + actions bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 font-display text-[10px] font-bold uppercase tracking-wider ${effective.source === "page" ? "bg-teal/10 text-teal" : effective.source === "global" ? "bg-gold/15 text-gold-deep" : "bg-charcoal/10 text-charcoal-soft"}`}>
            {isPage
              ? effective.source === "page" ? `${targetLabel}: apna set (live)` : effective.source === "global" ? `${targetLabel}: Global list chalegi` : `${targetLabel}: Default list`
              : globalSaved.length > 0 ? "Global: Admin-managed (live)" : "Global: Default list (code fallback)"}
          </span>
          <span className="font-display text-xs text-charcoal-soft">
            {editing.length} / {SEO_KEYWORDS_MAX_COUNT} keywords
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isPage ? (
            <>
              <Button
                onClick={copyGlobalIntoPage}
                variant="outline"
                className="rounded-full border-charcoal/20 px-4 py-1.5 text-xs text-charcoal-soft hover:bg-charcoal/5"
              >
                <Copy className="mr-1 h-3 w-3" /> Global list copy karo
              </Button>
              {(pageDrafts[selected]?.length ?? 0) > 0 && (
                <Button
                  onClick={clearPageSet}
                  variant="outline"
                  className="rounded-full border-marsala/30 px-4 py-1.5 text-xs text-marsala hover:bg-marsala/5"
                >
                  <Eraser className="mr-1 h-3 w-3" /> Clear page set
                </Button>
              )}
            </>
          ) : (
            <Button
              onClick={resetToDefaults}
              variant="outline"
              className="rounded-full border-charcoal/20 px-4 py-1.5 text-xs text-charcoal-soft hover:bg-charcoal/5"
            >
              <RotateCcw className="mr-1 h-3 w-3" /> Reset to defaults
            </Button>
          )}
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
          placeholder={`Keyword for ${targetLabel} — e.g. ${isPage ? `${targetLabel.toLowerCase()} specific keyword` : "hotel near Banke Bihari Mandir"}`}
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
          <p className="mb-2 font-serif text-sm font-semibold text-charcoal">
            Bulk add keywords — {targetLabel}
          </p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={5}
            placeholder={"Ek line mein ek keyword, ya comma se separate karo:\n\nhotel near Banke Bihari Mandir\nbudget hotel Vrindavan\nISKCON temple hotel, family rooms Vrindavan"}
            className="w-full rounded-lg border border-charcoal/15 bg-ivory-deep/30 px-3 py-2 font-display text-sm text-charcoal focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/30"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="font-display text-[10px] text-charcoal-soft">
              {parseInputList(bulkText).length} keyword{parseInputList(bulkText).length === 1 ? "" : "s"} detected — duplicates auto-skip honge
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
      {editing.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-charcoal/20 bg-ivory-deep/20 p-8 text-center">
          <Search className="mx-auto h-6 w-6 text-charcoal-soft/50" />
          <p className="mt-2 font-display text-sm text-charcoal-soft">
            {isPage
              ? `${targetLabel} ka apna koi set nahi — abhi Global list chal rahi hai. Upar se add karo ya "Global list copy karo" dabao.`
              : "No keywords yet — upar se add karo ya \"Reset to defaults\" dabao."}
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 rounded-2xl border border-charcoal/10 bg-white p-4 shadow-sm">
          {editing.map((kw) => (
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
          Live preview — {isPage ? `/${selected === "home" ? "" : selected} page` : "har page"} ke search engines kya dekhenge
        </p>
        <code className="block break-all font-mono text-[11px] text-charcoal-soft">
          &lt;meta name=&quot;keywords&quot; content=&quot;{effective.keywords.join(", ")}&quot;&gt;
        </code>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-[11px] text-charcoal-soft">
          {isPage && editing.length === 0 && dirty
            ? "Save daboge to is page ka apna set hat jayega — Global list wapas lag jayegi."
            : "Save ke turant baad live — koi rebuild nahi chahiye."}
        </p>
        <Button
          onClick={save}
          disabled={saving || !dirty || (!isPage && editing.length === 0)}
          className="rounded-full bg-teal px-6 py-2 text-sm text-ivory disabled:opacity-40 hover:bg-teal-deep"
        >
          {saving ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Saving…</> : <><Check className="mr-1 h-4 w-4" /> {isPage ? `Save ${targetLabel} keywords` : "Save Global keywords"}</>}
        </Button>
      </div>
    </div>
  );
}

/** Same parsing rules as parseKeywords, local so this stays a pure-UI helper. */
function parseInputList(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(/[,\n\r]+/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter((kw) => kw.length > 0 && kw.length <= 100);
}
