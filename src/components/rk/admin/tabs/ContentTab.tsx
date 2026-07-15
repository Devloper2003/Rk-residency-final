"use client";
import { useEffect, useState } from "react";
import { Check, Loader2, Image as ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminApi, LoadingSpinner } from "./_shared";
import { ImageUploader } from "../ImageUploader";
import { toast } from "sonner";

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
      const sections = Array.from(new Set((data.items || []).map((i: any) => i.section)));
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
          <strong className="text-teal">Edit website content.</strong> Changes are live instantly — no rebuild required. For image fields, upload or paste any URL.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {sections.map((s) => (
          <button
            key={s}
            onClick={() => setActiveSection(s)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
              activeSection === s
                ? "border-teal bg-teal text-ivory"
                : "border-charcoal/15 bg-white text-charcoal-soft hover:border-teal/40"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {visible.map((item) => {
          const isImage = item.type === "image";
          const isTextarea = item.type === "textarea" || item.type === "richtext";
          return (
            <div key={item.id} className="rounded-2xl border border-charcoal/10 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <span className="font-serif text-sm font-semibold text-charcoal">{item.label || item.key}</span>
                  <span className="ml-2 font-mono text-[10px] text-charcoal-soft">{item.key}</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 font-display text-[10px] uppercase tracking-wider ${
                  isImage ? "bg-gold/15 text-gold-deep" : isTextarea ? "bg-teal/10 text-teal" : "bg-ivory-deep text-charcoal-soft"
                }`}>{item.type}</span>
              </div>
              {isImage ? (
                <ImageUploader
                  value={editing[item.id] || null}
                  onChange={(v) => setEditing((p) => ({ ...p, [item.id]: v || "" }))}
                  compact
                />
              ) : isTextarea ? (
                <textarea
                  value={editing[item.id] || ""}
                  onChange={(e) => setEditing((p) => ({ ...p, [item.id]: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-charcoal/15 bg-ivory-deep/30 px-3 py-2 font-display text-sm text-charcoal focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/30"
                />
              ) : (
                <Input
                  value={editing[item.id] || ""}
                  onChange={(e) => setEditing((p) => ({ ...p, [item.id]: e.target.value }))}
                  className="bg-ivory-deep/30 focus-visible:ring-teal/30"
                />
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
