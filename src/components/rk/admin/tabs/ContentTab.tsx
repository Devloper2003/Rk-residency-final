"use client";
import { useEffect, useState } from "react";
import { Check, Loader2, Image as ImageIcon, Code } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminApi, LoadingSpinner } from "./_shared";
import { ImageUploader } from "../ImageUploader";
import { toast } from "sonner";

// Friendly section labels + descriptions
const SECTION_META: Record<string, { label: string; description: string }> = {
  hero: { label: "Hero Section", description: "Homepage banner — background image, headline, CTAs" },
  trust: { label: "Trust Badges", description: "The 4 trust badges under the hero rating" },
  about: { label: "About Section", description: "Our Story — body text, founder quote, image, stats" },
  rooms: { label: "Rooms Section", description: "Section header above the rooms grid" },
  experiences: { label: "Experiences", description: "5 sacred walks + section header" },
  dining: { label: "Dining", description: "Satvik principles, signature dishes, image, amenities" },
  gallery: { label: "Gallery", description: "Photo gallery items + section header" },
  offers: { label: "Offers Section", description: "Section header above the offers grid" },
  testimonials: { label: "Testimonials", description: "Aggregate rating + review counts" },
  faq: { label: "FAQ", description: "15 FAQ items + section header" },
  festivals: { label: "Festival Calendar", description: "6 Braj festivals + section header" },
  contact: { label: "Contact Section", description: "Phone, email, address, WhatsApp, nearby places" },
  footer: { label: "Footer", description: "Brand description, newsletter, copyright, links" },
  exit_modal: { label: "Exit Modal", description: "Popup shown when user is about to leave" },
};

export function ContentTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("hero");
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let c = false;
    adminApi.get("content").then((data) => {
      if (c || !data) { setLoading(false); return; }
      setItems(data.items || []);
      const m: Record<string, string> = {};
      (data.items || []).forEach((i: any) => { m[i.id] = i.value; });
      setEditing(m);
      // Auto-pick the first available section if "hero" doesn't exist
      const sections: string[] = Array.from(new Set((data.items || []).map((i: any) => i.section as string)));
      if (sections.length > 0 && !sections.includes("hero")) setActiveSection(sections[0]);
      setLoading(false);
    });
    return () => { c = true; };
  }, []);

  const save = async (id: string) => {
    setSaving((s) => ({ ...s, [id]: true }));
    const res = await adminApi.patch("content", { id, value: editing[id] });
    if (res) {
      toast.success("Updated — live on website!");
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, value: editing[id] } : i));
    } else toast.error("Failed");
    setSaving((s) => ({ ...s, [id]: false }));
  };

  if (loading) return <LoadingSpinner />;
  const sections = Array.from(new Set(items.map((i) => i.section)));
  const visible = items.filter((i) => i.section === activeSection);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-teal/20 bg-teal/5 p-4">
        <p className="font-display text-sm text-charcoal-soft">
          <strong className="text-teal">Page Editor.</strong> Edit every text and image on the website. Changes go live instantly — no rebuild required. For image fields, upload or paste any URL. For JSON fields (FAQ items, gallery, festivals), edit carefully — invalid JSON won't save.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {sections.map((s) => {
          const meta = SECTION_META[s] || { label: s.charAt(0).toUpperCase() + s.slice(1), description: "" };
          return (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                activeSection === s
                  ? "border-teal bg-teal text-ivory"
                  : "border-charcoal/15 bg-white text-charcoal-soft hover:border-teal/40"
              }`}
              title={meta.description}
            >
              {meta.label}
            </button>
          );
        })}
      </div>
      <div className="rounded-xl border border-charcoal/10 bg-ivory-deep/30 px-4 py-2.5">
        <p className="font-display text-xs text-charcoal-soft">
          {SECTION_META[activeSection]?.description || ""}
        </p>
      </div>
      <div className="space-y-3">
        {visible.map((item) => {
          const isImage = item.type === "image";
          const isTextarea = item.type === "textarea" || item.type === "richtext";
          const isJson = item.type === "json";
          return (
            <div key={item.id} className="rounded-2xl border border-charcoal/10 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <span className="font-serif text-sm font-semibold text-charcoal">{item.label || item.key}</span>
                  <span className="ml-2 font-mono text-[10px] text-charcoal-soft">{item.key}</span>
                </div>
                <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 font-display text-[10px] uppercase tracking-wider ${
                  isImage ? "bg-gold/15 text-gold-deep" : isJson ? "bg-marsala/10 text-marsala" : isTextarea ? "bg-teal/10 text-teal" : "bg-ivory-deep text-charcoal-soft"
                }`}>
                  {isJson && <Code className="h-2.5 w-2.5" />}
                  {item.type}
                </span>
              </div>
              {isImage ? (
                <ImageUploader
                  value={editing[item.id] || null}
                  onChange={(v) => setEditing((p) => ({ ...p, [item.id]: v || "" }))}
                  compact
                />
              ) : isJson ? (
                <textarea
                  value={editing[item.id] || ""}
                  onChange={(e) => setEditing((p) => ({ ...p, [item.id]: e.target.value }))}
                  rows={10}
                  className="w-full rounded-lg border border-marsala/20 bg-marsala/5 px-3 py-2 font-mono text-[11px] text-charcoal focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/30"
                  spellCheck={false}
                />
              ) : isTextarea ? (
                <textarea
                  value={editing[item.id] || ""}
                  onChange={(e) => setEditing((p) => ({ ...p, [item.id]: e.target.value }))}
                  rows={4}
                  className="w-full rounded-lg border border-charcoal/15 bg-ivory-deep/30 px-3 py-2 font-display text-sm text-charcoal focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/30"
                />
              ) : (
                <Input
                  value={editing[item.id] || ""}
                  onChange={(e) => setEditing((p) => ({ ...p, [item.id]: e.target.value }))}
                  className="bg-ivory-deep/30 focus-visible:ring-teal/30"
                />
              )}
              {isJson && (
                <p className="mt-1 font-display text-[10px] text-charcoal-soft">
                  ⚠️ JSON field — edit carefully. Validate at jsonlint.com before saving.
                </p>
              )}
              <div className="mt-2 flex items-center justify-between">
                {isImage && editing[item.id] ? (
                  <a href={editing[item.id]} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-display text-[10px] text-teal hover:underline">
                    <ImageIcon className="h-3 w-3" /> View current image
                  </a>
                ) : <span />}
                <Button
                  onClick={() => save(item.id)}
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
  );
}

