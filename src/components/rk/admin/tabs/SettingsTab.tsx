"use client";
import { useEffect, useState } from "react";
import { Check, Loader2, Phone, Mail, MapPin, Share2, Search, Settings, BarChart3, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminApi, LoadingSpinner } from "./_shared";
import { ImageUploader } from "../ImageUploader";
import { toast } from "sonner";

const CATEGORY_META: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; description: string }> = {
  general: { label: "General", icon: Settings, description: "Brand identity, timings, GSTIN" },
  contact: { label: "Contact Information", icon: Phone, description: "Phone, email, address, WhatsApp, map" },
  social: { label: "Social Media", icon: Share2, description: "Instagram, Facebook, YouTube, TripAdvisor" },
  seo: { label: "SEO & Metadata", icon: Search, description: "Meta title, description, canonical URL, OG image" },
  analytics: { label: "Analytics", icon: BarChart3, description: "Google Analytics, tracking" },
};

const IMAGE_SETTINGS = new Set(["logo_image_url", "og_image_url", "favicon_url"]);

export function SettingsTab() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [activeCat, setActiveCat] = useState("general");

  useEffect(() => {
    let c = false;
    adminApi.get("settings").then((data) => {
      if (c || !data) { setLoading(false); return; }
      setSettings(data.settings || []);
      const m: Record<string, string> = {};
      (data.settings || []).forEach((s: any) => { m[s.id] = s.value; });
      setEditing(m);
      setLoading(false);
    });
    return () => { c = true; };
  }, []);

  const save = async (id: string) => {
    setSaving((s) => ({ ...s, [id]: true }));
    const res = await adminApi.patch("setting", { id, value: editing[id] });
    if (res) {
      toast.success("Setting updated — live on website!");
      setSettings((prev) => prev.map((s) => s.id === id ? { ...s, value: editing[id] } : s));
    } else toast.error("Failed");
    setSaving((s) => ({ ...s, [id]: false }));
  };

  if (loading) return <LoadingSpinner />;

  const categories = Array.from(new Set(settings.map((s) => s.category)));
  const visible = settings.filter((s) => s.category === activeCat);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-teal/20 bg-teal/5 p-4">
        <p className="font-display text-sm text-charcoal-soft">
          <strong className="text-teal">Site Settings.</strong> All changes go live instantly on the website — no rebuild needed. Logo uploads appear in navbar + footer + admin within seconds.
        </p>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const meta = CATEGORY_META[cat] || { label: cat, icon: Settings, description: "" };
          return (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                activeCat === cat
                  ? "border-teal bg-teal text-ivory"
                  : "border-charcoal/15 bg-white text-charcoal-soft hover:border-teal/40"
              }`}
            >
              <meta.icon className="h-3.5 w-3.5" />
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* Category description */}
      <div className="rounded-xl border border-charcoal/10 bg-ivory-deep/30 px-4 py-2.5">
        <p className="font-display text-xs text-charcoal-soft">
          {CATEGORY_META[activeCat]?.description || ""}
        </p>
      </div>

      {/* Settings cards */}
      <div className="grid gap-3 sm:grid-cols-2">
        {visible.map((s) => {
          const isImage = IMAGE_SETTINGS.has(s.key);
          return (
            <div key={s.id} className="rounded-2xl border border-charcoal/10 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="font-serif text-sm font-semibold text-charcoal">{s.label || s.key}</span>
                  <div className="mt-0.5 font-mono text-[10px] text-charcoal-soft">{s.key}</div>
                </div>
                {isImage && <Upload className="h-3.5 w-3.5 text-gold-deep" />}
              </div>

              {isImage ? (
                <ImageUploader
                  value={editing[s.id] || null}
                  onChange={(v) => setEditing((p) => ({ ...p, [s.id]: v || "" }))}
                  compact
                />
              ) : (
                <Input
                  value={editing[s.id] || ""}
                  onChange={(e) => setEditing((p) => ({ ...p, [s.id]: e.target.value }))}
                  className="bg-ivory-deep/30 focus-visible:ring-teal/30"
                  placeholder={s.key === "ga_measurement_id" ? "G-XXXXXXXXXX" : ""}
                />
              )}

              <div className="mt-2 flex justify-end">
                <Button
                  onClick={() => save(s.id)}
                  disabled={saving[s.id] || editing[s.id] === s.value}
                  className="rounded-full bg-teal px-4 py-1.5 text-xs text-ivory disabled:opacity-40 hover:bg-teal-deep"
                >
                  {saving[s.id] ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Saving…</> : <><Check className="mr-1 h-3 w-3" /> Save</>}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
