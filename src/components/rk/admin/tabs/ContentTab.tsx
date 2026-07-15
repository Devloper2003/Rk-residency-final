"use client";
import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminApi, LoadingSpinner } from "./_shared";
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
      setLoading(false);
    });
    return () => { c = true; };
  }, []);

  const save = async (id: string) => {
    setSaving((s) => ({ ...s, [id]: true }));
    const res = await adminApi.patch("content", { id, value: editing[id] });
    if (res) { toast.success("Updated — live on website!"); setItems((prev) => prev.map((i) => i.id === id ? { ...i, value: editing[id] } : i)); }
    else toast.error("Failed");
    setSaving((s) => ({ ...s, [id]: false }));
  };

  if (loading) return <LoadingSpinner />;
  const sections = Array.from(new Set(items.map((i) => i.section)));
  const visible = items.filter((i) => i.section === activeSection);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-teal/20 bg-teal/5 p-4"><p className="font-display text-sm text-charcoal-soft"><strong className="text-teal">Edit website content.</strong> Changes are live instantly.</p></div>
      <div className="flex flex-wrap gap-2">
        {sections.map((s) => (<button key={s} onClick={() => setActiveSection(s)} className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${activeSection===s?"border-teal bg-teal text-ivory":"border-charcoal/15 bg-white text-charcoal-soft hover:border-teal/40"}`}>{s.charAt(0).toUpperCase()+s.slice(1)}</button>))}
      </div>
      <div className="space-y-3">
        {visible.map((item) => (
          <div key={item.id} className="rounded-2xl border border-charcoal/10 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <div><span className="font-serif text-sm font-semibold text-charcoal">{item.label||item.key}</span><span className="ml-2 font-mono text-[10px] text-charcoal-soft">{item.key}</span></div>
              <span className="rounded-full bg-ivory-deep px-2 py-0.5 font-display text-[10px] uppercase tracking-wider text-charcoal-soft">{item.type}</span>
            </div>
            {item.type === "textarea" ? <textarea value={editing[item.id]||""} onChange={(e)=>setEditing((p)=>({...p,[item.id]:e.target.value}))} rows={3} className="w-full rounded-lg border border-charcoal/15 bg-ivory-deep/30 px-3 py-2 font-display text-sm text-charcoal" /> : <Input value={editing[item.id]||""} onChange={(e)=>setEditing((p)=>({...p,[item.id]:e.target.value}))} className="bg-ivory-deep/30" />}
            <div className="mt-2 flex justify-end"><Button onClick={()=>save(item.id)} disabled={saving[item.id]||editing[item.id]===item.value} className="rounded-full bg-teal px-4 py-1.5 text-xs text-ivory disabled:opacity-40">{saving[item.id]?<><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Saving…</>:<><Check className="mr-1 h-3 w-3" /> Save</>}</Button></div>
          </div>
        ))}
      </div>
    </div>
  );
}
