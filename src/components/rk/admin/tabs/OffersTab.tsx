"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Edit, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminApi, adminFetch, LoadingSpinner, Field } from "./_shared";
import { toast } from "sonner";

export function OffersTab() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const reload = useCallback(() => { adminApi.get("offers").then((d) => { if (d) setOffers(d.offers||[]); setLoading(false); }); }, []);
  useEffect(() => { let c=false; adminApi.get("offers").then((d)=>{ if(c)return; if(d)setOffers(d.offers||[]); setLoading(false); }); return()=>{c=true}; }, []);
  const save = async (o: any) => { const m=o.id?"PATCH":"POST"; const r=await adminFetch("/api/admin/offers",{method:m,body:JSON.stringify(o)}); if(r){toast.success("Saved");setEditing(null);reload();} };
  const del = async (id:string) => { if(!confirm("Delete?"))return; const r=await adminFetch(`/api/admin/offers?id=${id}`,{method:"DELETE"}); if(r){toast.success("Deleted");reload();} };
  if (loading) return <LoadingSpinner />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><p className="font-display text-sm text-charcoal-soft">{offers.length} offers</p><Button onClick={()=>setEditing({slug:"",title:"",tagline:"",description:"",perks:"[]",discountPct:null,validFrom:new Date().toISOString(),validUntil:new Date(Date.now()+90*86400000).toISOString(),imageUrl:null,badge:null,featured:false})} className="rounded-full bg-teal px-4 py-2 text-sm text-ivory"><Plus className="mr-1 h-4 w-4" /> New</Button></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {offers.map((o) => (<div key={o.id} className="overflow-hidden rounded-2xl border border-charcoal/10 bg-white"><div className="relative h-32 overflow-hidden">{o.imageUrl&&<div className="h-full w-full bg-cover bg-center" style={{backgroundImage:`url(${o.imageUrl})`}} />}<div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-3"><div className="font-serif text-sm font-semibold text-ivory">{o.title}</div>{o.discountPct&&<div className="font-serif text-base font-bold text-gold-soft">{o.discountPct}% OFF</div>}</div></div><div className="flex items-center justify-between p-3"><div className="font-display text-[11px] text-charcoal-soft">{o.badge||"—"}</div><div className="flex gap-1"><button onClick={()=>setEditing(o)} className="grid h-8 w-8 place-items-center rounded-full border border-charcoal/15 text-charcoal-soft hover:bg-teal hover:text-ivory"><Edit className="h-3.5 w-3.5" /></button><button onClick={()=>del(o.id)} className="grid h-8 w-8 place-items-center rounded-full border border-charcoal/15 text-charcoal-soft hover:bg-marsala hover:text-ivory"><Trash2 className="h-3.5 w-3.5" /></button></div></div></div>))}
      </div>
      {editing && (<div className="fixed inset-0 z-[90] grid place-items-center bg-charcoal/70 p-4" onClick={()=>setEditing(null)}><div className="scrollbar-thin max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-ivory p-6" onClick={(e)=>e.stopPropagation()}><div className="mb-4 flex items-center justify-between"><h3 className="font-serif text-lg font-semibold text-charcoal">{editing.id?"Edit":"New"} offer</h3><button onClick={()=>setEditing(null)} className="grid h-8 w-8 place-items-center rounded-full border border-charcoal/15 text-charcoal-soft"><X className="h-4 w-4" /></button></div><div className="grid gap-3 sm:grid-cols-2"><Field label="Slug" value={editing.slug} onChange={(v)=>setEditing({...editing,slug:v})} /><Field label="Title" value={editing.title} onChange={(v)=>setEditing({...editing,title:v})} /><Field label="Tagline" value={editing.tagline} onChange={(v)=>setEditing({...editing,tagline:v})} /><Field label="Badge" value={editing.badge||""} onChange={(v)=>setEditing({...editing,badge:v||null})} /><Field label="Discount %" type="number" value={editing.discountPct||""} onChange={(v)=>setEditing({...editing,discountPct:v?parseInt(v):null})} /><Field label="Image URL" value={editing.imageUrl||""} onChange={(v)=>setEditing({...editing,imageUrl:v||null})} /></div><div className="mt-3"><Field label="Description" textarea value={editing.description} onChange={(v)=>setEditing({...editing,description:v})} /></div><div className="mt-3"><Field label="Perks (JSON)" textarea value={editing.perks} onChange={(v)=>setEditing({...editing,perks:v})} /></div><div className="mt-5 flex gap-3"><Button onClick={()=>save(editing)} className="rounded-full bg-teal px-6 py-2 text-ivory">Save</Button><Button onClick={()=>setEditing(null)} variant="outline" className="rounded-full">Cancel</Button></div></div></div>)}
    </div>
  );
}
