"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Edit, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminApi, adminFetch, LoadingSpinner, Field } from "./_shared";
import { toast } from "sonner";

export function BlogTab() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const reload = useCallback(() => { adminApi.get("blog").then((d) => { if (d) setPosts(d.posts||[]); setLoading(false); }); }, []);
  useEffect(() => { let c=false; adminApi.get("blog").then((d)=>{ if(c)return; if(d)setPosts(d.posts||[]); setLoading(false); }); return()=>{c=true}; }, []);
  const save = async (p: any) => { const m=p.id?"PATCH":"POST"; const r=await adminFetch("/api/admin/blog",{method:m,body:JSON.stringify(p)}); if(r){toast.success("Saved");setEditing(null);reload();} };
  const del = async (id:string) => { if(!confirm("Delete?"))return; const r=await adminFetch(`/api/admin/blog?id=${id}`,{method:"DELETE"}); if(r){toast.success("Deleted");reload();} };
  if (loading) return <LoadingSpinner />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><p className="font-display text-sm text-charcoal-soft">{posts.length} posts</p><Button onClick={()=>setEditing({slug:"",title:"",excerpt:"",body:"",category:"TEMPLE_GUIDE",tags:"[]",imageUrl:null,published:false,publishedAt:null,readingMins:4})} className="rounded-full bg-teal px-4 py-2 text-sm text-ivory"><Plus className="mr-1 h-4 w-4" /> New post</Button></div>
      <div className="space-y-3">
        {posts.map((p) => (<div key={p.id} className="rounded-2xl border border-charcoal/10 bg-white p-4"><div className="flex items-start justify-between gap-3"><div className="flex-1"><div className="flex items-center gap-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.published?"bg-teal/10 text-teal":"bg-marsala/10 text-marsala"}`}>{p.published?"Published":"Draft"}</span><span className="rounded-full bg-ivory-deep px-2 py-0.5 text-[10px] font-medium text-charcoal-soft">{p.category.replace("_"," ")}</span></div><h3 className="mt-1 font-serif text-base font-semibold text-charcoal">{p.title}</h3><p className="mt-0.5 font-display text-xs text-charcoal-soft">/{p.slug} · {p.readingMins} min</p></div><div className="flex gap-1"><button onClick={()=>setEditing(p)} className="grid h-8 w-8 place-items-center rounded-full border border-charcoal/15 text-charcoal-soft hover:bg-teal hover:text-ivory"><Edit className="h-3.5 w-3.5" /></button><button onClick={()=>del(p.id)} className="grid h-8 w-8 place-items-center rounded-full border border-charcoal/15 text-charcoal-soft hover:bg-marsala hover:text-ivory"><Trash2 className="h-3.5 w-3.5" /></button></div></div></div>))}
      </div>
      {editing && (<div className="fixed inset-0 z-[90] grid place-items-center bg-charcoal/70 p-4" onClick={()=>setEditing(null)}><div className="scrollbar-thin max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-ivory p-6" onClick={(e)=>e.stopPropagation()}><div className="mb-4 flex items-center justify-between"><h3 className="font-serif text-lg font-semibold text-charcoal">{editing.id?"Edit":"New"} post</h3><button onClick={()=>setEditing(null)} className="grid h-8 w-8 place-items-center rounded-full border border-charcoal/15 text-charcoal-soft"><X className="h-4 w-4" /></button></div><div className="grid gap-3 sm:grid-cols-2"><Field label="Slug" value={editing.slug} onChange={(v)=>setEditing({...editing,slug:v})} /><Field label="Title" value={editing.title} onChange={(v)=>setEditing({...editing,title:v})} /><div><Label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Category</Label><Select value={editing.category} onValueChange={(v)=>setEditing({...editing,category:v})}><SelectTrigger className="bg-ivory-deep/30"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="TEMPLE_GUIDE">Temple Guide</SelectItem><SelectItem value="FESTIVAL">Festival</SelectItem><SelectItem value="LOCAL_TIP">Local Tip</SelectItem><SelectItem value="EXPERIENCE">Experience</SelectItem></SelectContent></Select></div><Field label="Reading mins" type="number" value={editing.readingMins} onChange={(v)=>setEditing({...editing,readingMins:parseInt(v)||4})} /><Field label="Image URL" value={editing.imageUrl||""} onChange={(v)=>setEditing({...editing,imageUrl:v||null})} /></div><div className="mt-3"><Field label="Excerpt" textarea value={editing.excerpt} onChange={(v)=>setEditing({...editing,excerpt:v})} /></div><div className="mt-3"><Field label="Body (use ## for headings)" textarea value={editing.body} onChange={(v)=>setEditing({...editing,body:v})} /></div><div className="mt-3"><Field label="Tags (JSON)" value={editing.tags} onChange={(v)=>setEditing({...editing,tags:v})} /></div><div className="mt-3 flex items-center gap-2"><input type="checkbox" id="pub" checked={!!editing.published} onChange={(e)=>setEditing({...editing,published:e.target.checked})} /><Label htmlFor="pub">Published</Label></div><div className="mt-5 flex gap-3"><Button onClick={()=>save(editing)} className="rounded-full bg-teal px-6 py-2 text-ivory">Save</Button><Button onClick={()=>setEditing(null)} variant="outline" className="rounded-full">Cancel</Button></div></div></div>)}
    </div>
  );
}
