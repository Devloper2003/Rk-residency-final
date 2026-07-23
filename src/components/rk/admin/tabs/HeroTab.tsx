"use client";
import { useEffect, useState, useCallback } from "react";
import { Check, Loader2, Image as ImageIcon, Sliders } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminApi, LoadingSpinner, Field } from "./_shared";
import { ImageUploader } from "../ImageUploader";
import { refreshSiteContent } from "@/lib/site-content";
import { toast } from "sonner";

// Hero content keys managed by this tab
const HERO_TEXT_KEYS = [
  { key: "hero.location_badge", label: "Location Badge", type: "text" },
  { key: "hero.headline_line1", label: "Headline Line 1", type: "text" },
  { key: "hero.headline_line2", label: "Headline Line 2 (italic gold)", type: "text" },
  { key: "hero.subheadline", label: "Sub-headline / Description", type: "textarea" },
  { key: "hero.cta_primary", label: "Primary CTA Button Text", type: "text" },
  { key: "hero.cta_secondary", label: "Secondary CTA Button Text", type: "text" },
  { key: "hero.rating_text", label: "Rating Text", type: "text" },
  { key: "hero.featured_on_text", label: "Featured On Text", type: "text" },
];

const HERO_DISPLAY_KEYS = [
  { key: "hero.overlay_opacity", label: "Overlay Opacity (0-100)", type: "number", default: "55" },
  { key: "hero.show_weather", label: "Show Weather Widget", type: "boolean", default: "true" },
  { key: "hero.show_rating", label: "Show Rating Stars", type: "boolean", default: "true" },
  { key: "hero.show_featured_on", label: "Show 'Featured On' Text", type: "boolean", default: "true" },
  { key: "hero.show_cta_secondary", label: "Show Secondary CTA", type: "boolean", default: "true" },
  { key: "hero.slider_autoplay", label: "Slider Autoplay", type: "boolean", default: "true" },
  { key: "hero.slider_interval", label: "Slider Interval (seconds)", type: "number", default: "5" },
];

export function HeroTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let c = false;
    adminApi.get("content").then((data) => {
      if (c || !data) { setLoading(false); return; }
      const heroItems = (data.items || []).filter((i: any) => i.section === "hero");
      setItems(heroItems);
      const m: Record<string, string> = {};
      heroItems.forEach((i: any) => { m[i.id] = i.value; });
      setEditing(m);
      setLoading(false);
    });
    return () => { c = true; };
  }, []);

  const getValue = (key: string): string => {
    const item = items.find((i: any) => i.key === key);
    if (item && editing[item.id] !== undefined) return editing[item.id];
    return "";
  };

  const setValue = (key: string, value: string) => {
    const item = items.find((i: any) => i.key === key);
    if (item) {
      setEditing((p) => ({ ...p, [item.id]: value }));
    }
  };

  const save = async (id: string, key: string) => {
    setSaving((s) => ({ ...s, [id]: true }));
    try {
      const res = await adminApi.patch("content", { id, value: editing[id] });
      if (res) {
        toast.success("Hero setting saved — live on website!");
        setItems((prev) => prev.map((i) => i.id === id ? { ...i, value: editing[id] } : i));
        refreshSiteContent();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
    setSaving((s) => ({ ...s, [id]: false }));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-teal/20 bg-teal/5 p-4">
        <p className="font-display text-sm text-charcoal-soft">
          <strong className="text-teal">Hero Section Management.</strong> Edit the homepage hero — headlines, CTAs, background image, slider, overlay, and display settings. All changes go live instantly.
        </p>
      </div>

      {/* Text Content */}
      <div>
        <h3 className="mb-3 font-serif text-lg font-semibold text-charcoal">Text Content</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {HERO_TEXT_KEYS.map((pk) => {
            const item = items.find((i: any) => i.key === pk.key);
            if (!item) return null;
            const value = getValue(pk.key);
            return (
              <div key={pk.key} className="rounded-2xl border border-charcoal/10 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <span className="font-serif text-sm font-semibold text-charcoal">{pk.label}</span>
                    <div className="mt-0.5 font-mono text-[10px] text-charcoal-soft">{pk.key}</div>
                  </div>
                </div>
                {pk.type === "textarea" ? (
                  <textarea
                    value={value}
                    onChange={(e) => setValue(pk.key, e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-charcoal/15 bg-ivory-deep/30 px-3 py-2 font-display text-xs text-charcoal focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/30"
                  />
                ) : (
                  <Input
                    value={value}
                    onChange={(e) => setValue(pk.key, e.target.value)}
                    className="bg-ivory-deep/30 focus-visible:ring-teal/30"
                  />
                )}
                <div className="mt-2 flex justify-end">
                  <Button
                    onClick={() => save(item.id, pk.key)}
                    disabled={saving[item.id] || editing[item.id] === item.value}
                    className="rounded-full bg-teal px-4 py-1.5 text-xs text-ivory disabled:opacity-40 hover:bg-teal-deep"
                  >
                    {saving[item.id] ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Saving…</> : <><Check className="mr-1 h-3 w-3" /> Save</>}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Background Image */}
      <div>
        <h3 className="mb-3 font-serif text-lg font-semibold text-charcoal">Background Image (Single)</h3>
        <div className="rounded-2xl border border-charcoal/10 bg-white p-4 shadow-sm">
          {(() => {
            const item = items.find((i: any) => i.key === "hero.background_image");
            if (!item) return <p className="font-display text-xs text-charcoal-soft">Background image key not found.</p>;
            const value = getValue("hero.background_image");
            return (
              <>
                <ImageUploader
                  label="Hero Background Image"
                  value={value}
                  onChange={(v) => setValue("hero.background_image", v as string)}
                  hint="Recommended: 1920×1080px. This is the fallback image when no slides are defined."
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    onClick={() => save(item.id, "hero.background_image")}
                    disabled={saving[item.id] || editing[item.id] === item.value}
                    className="rounded-full bg-teal px-4 py-1.5 text-xs text-ivory disabled:opacity-40 hover:bg-teal-deep"
                  >
                    {saving[item.id] ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Saving…</> : <><Check className="mr-1 h-3 w-3" /> Save</>}
                  </Button>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Slider Slides (JSON) */}
      <div>
        <h3 className="mb-3 font-serif text-lg font-semibold text-charcoal">Slider Slides</h3>
        <div className="rounded-2xl border border-charcoal/10 bg-white p-4 shadow-sm">
          {(() => {
            const item = items.find((i: any) => i.key === "hero.slides");
            if (!item) return <p className="font-display text-xs text-charcoal-soft">Slides key not found. Add it via Page Editor → Hero Section.</p>;
            const value = getValue("hero.slides");
            let slideCount = 0;
            try { slideCount = JSON.parse(value || "[]").length; } catch {}
            return (
              <>
                <p className="mb-2 font-display text-xs text-charcoal-soft">
                  {slideCount} slide{slideCount === 1 ? "" : "s"} configured. Each slide: {`{ image, headline_line1, headline_line2, subheadline }`}
                </p>
                <textarea
                  value={value}
                  onChange={(e) => setValue("hero.slides", e.target.value)}
                  rows={10}
                  className="w-full rounded-md border border-marsala/20 bg-marsala/5 px-3 py-2 font-mono text-[11px] text-charcoal focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/30"
                  spellCheck={false}
                />
                <p className="mt-1 font-display text-[10px] text-charcoal-soft">⚠️ JSON field — edit carefully. Each slide needs an "image" URL. Text fields are optional (fall back to global hero text).</p>
                <div className="mt-2 flex justify-end">
                  <Button
                    onClick={() => save(item.id, "hero.slides")}
                    disabled={saving[item.id] || editing[item.id] === item.value}
                    className="rounded-full bg-teal px-4 py-1.5 text-xs text-ivory disabled:opacity-40 hover:bg-teal-deep"
                  >
                    {saving[item.id] ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Saving…</> : <><Check className="mr-1 h-3 w-3" /> Save Slides</>}
                  </Button>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Display Settings */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 font-serif text-lg font-semibold text-charcoal">
          <Sliders className="h-5 w-5 text-gold-deep" /> Display Settings
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {HERO_DISPLAY_KEYS.map((pk) => {
            const item = items.find((i: any) => i.key === pk.key);
            if (!item) return null;
            const value = getValue(pk.key) || pk.default;
            const isBool = pk.type === "boolean";
            return (
              <div key={pk.key} className="rounded-2xl border border-charcoal/10 bg-white p-4 shadow-sm">
                <div className="mb-2">
                  <span className="font-serif text-sm font-semibold text-charcoal">{pk.label}</span>
                  <div className="mt-0.5 font-mono text-[10px] text-charcoal-soft">{pk.key}</div>
                </div>
                {isBool ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setValue(pk.key, value === "true" ? "false" : "true")}
                      className={`relative h-7 w-12 rounded-full transition-colors ${value === "true" ? "bg-teal" : "bg-charcoal/20"}`}
                    >
                      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${value === "true" ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                    <span className="font-display text-xs text-charcoal-soft">{value === "true" ? "Enabled" : "Disabled"}</span>
                  </div>
                ) : (
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(pk.key, e.target.value)}
                    className="bg-ivory-deep/30 focus-visible:ring-teal/30"
                  />
                )}
                <div className="mt-2 flex justify-end">
                  <Button
                    onClick={() => save(item.id, pk.key)}
                    disabled={saving[item.id] || editing[item.id] === item.value}
                    className="rounded-full bg-teal px-4 py-1.5 text-xs text-ivory disabled:opacity-40 hover:bg-teal-deep"
                  >
                    {saving[item.id] ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Saving…</> : <><Check className="mr-1 h-3 w-3" /> Save</>}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
