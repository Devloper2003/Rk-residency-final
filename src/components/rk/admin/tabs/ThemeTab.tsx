"use client";
import { useEffect, useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminApi, LoadingSpinner } from "./_shared";
import { toast } from "sonner";

export function ThemeTab() {
  const [themes, setThemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let c = false;
    adminApi.get("theme").then((data) => {
      if (c || !data) { setLoading(false); return; }
      setThemes(data.themes || []);
      const m: Record<string, string> = {};
      (data.themes || []).forEach((t: any) => { m[t.id] = t.value; });
      setEditing(m);
      setLoading(false);
    });
    return () => { c = true; };
  }, []);

  const save = async (id: string) => {
    setSaving((s) => ({ ...s, [id]: true }));
    const res = await adminApi.patch("theme", { id, value: editing[id] });
    if (res) { toast.success("Color updated!"); setThemes((prev) => prev.map((t) => t.id === id ? { ...t, value: editing[id] } : t)); }
    else toast.error("Failed");
    setSaving((s) => ({ ...s, [id]: false }));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-teal/20 bg-teal/5 p-4"><p className="font-display text-sm text-charcoal-soft"><strong className="text-teal">Customize colors.</strong> Use the color picker or enter a hex code.</p></div>
      <div className="grid gap-4 sm:grid-cols-2">
        {themes.map((t) => (
          <div key={t.id} className="rounded-2xl border border-charcoal/10 bg-white p-4">
            <div className="mb-2 flex items-center justify-between"><span className="font-serif text-sm font-semibold text-charcoal">{t.label||t.key}</span><span className="font-mono text-[10px] text-charcoal-soft">{t.key}</span></div>
            <div className="flex items-center gap-3">
              <input type="color" value={editing[t.id]||"#000000"} onChange={(e)=>setEditing((p)=>({...p,[t.id]:e.target.value}))} className="h-12 w-16 cursor-pointer rounded-lg border border-charcoal/15" />
              <Input value={editing[t.id]||""} onChange={(e)=>setEditing((p)=>({...p,[t.id]:e.target.value}))} className="flex-1 bg-ivory-deep/30 font-mono text-sm" placeholder="#000000" />
              <div className="h-12 w-12 shrink-0 rounded-lg border border-charcoal/15" style={{backgroundColor:editing[t.id]||"#fff"}} />
            </div>
            <div className="mt-2 flex justify-end"><Button onClick={()=>save(t.id)} disabled={saving[t.id]||editing[t.id]===t.value} className="rounded-full bg-teal px-4 py-1.5 text-xs text-ivory disabled:opacity-40">{saving[t.id]?<><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Saving…</>:<><Check className="mr-1 h-3 w-3" /> Save</>}</Button></div>
          </div>
        ))}
      </div>
    </div>
  );
}
