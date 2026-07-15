"use client";
import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminApi, LoadingSpinner } from "./_shared";
import { toast } from "sonner";

export function SettingsTab() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

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
    if (res) { toast.success("Setting updated"); setSettings((prev) => prev.map((s) => s.id === id ? { ...s, value: editing[id] } : s)); }
    else toast.error("Failed");
    setSaving((s) => ({ ...s, [id]: false }));
  };

  if (loading) return <LoadingSpinner />;
  const categories = Array.from(new Set(settings.map((s) => s.category)));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-teal/20 bg-teal/5 p-4"><p className="font-display text-sm text-charcoal-soft"><strong className="text-teal">Site settings.</strong> GA ID, WhatsApp, social links, etc.</p></div>
      {categories.map((cat) => (
        <div key={cat}>
          <h3 className="mb-3 font-serif text-lg font-semibold text-charcoal">{cat.charAt(0).toUpperCase()+cat.slice(1)}</h3>
          <div className="space-y-3">
            {settings.filter((s) => s.category === cat).map((s) => (
              <div key={s.id} className="rounded-2xl border border-charcoal/10 bg-white p-4">
                <div className="mb-2"><span className="font-serif text-sm font-semibold text-charcoal">{s.label||s.key}</span><span className="ml-2 font-mono text-[10px] text-charcoal-soft">{s.key}</span></div>
                <Input value={editing[s.id]||""} onChange={(e)=>setEditing((p)=>({...p,[s.id]:e.target.value}))} className="bg-ivory-deep/30" placeholder={s.key==="ga_measurement_id"?"G-XXXXXXXXXX":""} />
                <div className="mt-2 flex justify-end"><Button onClick={()=>save(s.id)} disabled={saving[s.id]||editing[s.id]===s.value} className="rounded-full bg-teal px-4 py-1.5 text-xs text-ivory disabled:opacity-40">{saving[s.id]?<><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Saving…</>:<><Check className="mr-1 h-3 w-3" /> Save</>}</Button></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
