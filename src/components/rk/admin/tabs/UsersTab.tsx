"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Edit, Trash2, X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminApi, adminFetch, getAdmin, LoadingSpinner, Field } from "./_shared";
import { toast } from "sonner";

export function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const admin = getAdmin();
  const reload = useCallback(() => { adminApi.get("users").then((d) => { if (d) setUsers(d.users||[]); setLoading(false); }); }, []);
  useEffect(() => { let c=false; adminApi.get("users").then((d)=>{ if(c)return; if(d)setUsers(d.users||[]); setLoading(false); }); return()=>{c=true}; }, []);
  const save = async (u: any) => { const m=u.id?"PATCH":"POST"; const r=await adminFetch("/api/admin/users",{method:m,body:JSON.stringify(u)}); if(r){toast.success("Saved");setEditing(null);reload();} };
  const del = async (id:string) => { if(!confirm("Delete?"))return; const r=await adminFetch(`/api/admin/users?id=${id}`,{method:"DELETE"}); if(r){toast.success("Deleted");reload();} };
  if (loading) return <LoadingSpinner />;
  if (admin?.role !== "SUPER_ADMIN") return <div className="rounded-2xl border border-marsala/30 bg-marsala/5 p-8 text-center"><ShieldCheck className="mx-auto mb-3 h-8 w-8 text-marsala" /><p className="font-serif text-lg font-semibold text-marsala">Access Denied</p><p className="mt-1 font-display text-sm text-charcoal-soft">Only Super Admins can manage users.</p></div>;
  const RC: Record<string,string> = { SUPER_ADMIN:"bg-marsala/10 text-marsala", MANAGER:"bg-teal/10 text-teal", FRONT_DESK:"bg-gold/15 text-gold-deep" };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><p className="font-display text-sm text-charcoal-soft">{users.length} users</p><Button onClick={()=>setEditing({name:"",email:"",password:"",role:"MANAGER"})} className="rounded-full bg-teal px-4 py-2 text-sm text-ivory"><Plus className="mr-1 h-4 w-4" /> New user</Button></div>
      <div className="overflow-hidden rounded-2xl border border-charcoal/10 bg-white"><table className="w-full text-left"><thead className="border-b border-charcoal/10 bg-ivory-deep font-display text-[10px] uppercase tracking-wider text-charcoal-soft"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Created</th><th className="px-4 py-3">Actions</th></tr></thead><tbody className="divide-y divide-charcoal/8 font-display text-xs">{users.map((u)=>(<tr key={u.id} className="hover:bg-ivory-deep/30"><td className="px-4 py-3 font-semibold text-charcoal">{u.name}</td><td className="px-4 py-3 text-charcoal-soft">{u.email}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${RC[u.role]||"bg-charcoal/10"}`}>{u.role.replace("_"," ")}</span></td><td className="px-4 py-3 text-charcoal-soft">{new Date(u.createdAt).toLocaleDateString("en-IN")}</td><td className="px-4 py-3"><div className="flex gap-1"><button onClick={()=>setEditing({...u,password:""})} className="grid h-8 w-8 place-items-center rounded-full border border-charcoal/15 text-charcoal-soft hover:bg-teal hover:text-ivory"><Edit className="h-3.5 w-3.5" /></button>{u.id!==admin?.id&&<button onClick={()=>del(u.id)} className="grid h-8 w-8 place-items-center rounded-full border border-charcoal/15 text-charcoal-soft hover:bg-marsala hover:text-ivory"><Trash2 className="h-3.5 w-3.5" /></button>}</div></td></tr>))}</tbody></table></div>
      {editing && (<div className="fixed inset-0 z-[90] grid place-items-center bg-charcoal/70 p-4" onClick={()=>setEditing(null)}><div className="w-full max-w-md rounded-3xl bg-ivory p-6" onClick={(e)=>e.stopPropagation()}><div className="mb-4 flex items-center justify-between"><h3 className="font-serif text-lg font-semibold text-charcoal">{editing.id?"Edit":"New"} user</h3><button onClick={()=>setEditing(null)} className="grid h-8 w-8 place-items-center rounded-full border border-charcoal/15 text-charcoal-soft"><X className="h-4 w-4" /></button></div><div className="space-y-3"><Field label="Name" value={editing.name} onChange={(v)=>setEditing({...editing,name:v})} /><Field label="Email" value={editing.email} onChange={(v)=>setEditing({...editing,email:v})} /><Field label={editing.id?"New password (blank=keep)":"Password"} value={editing.password||""} onChange={(v)=>setEditing({...editing,password:v})} /><div><Label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Role</Label><Select value={editing.role} onValueChange={(v)=>setEditing({...editing,role:v})}><SelectTrigger className="bg-ivory-deep/30"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SUPER_ADMIN">Super Admin</SelectItem><SelectItem value="MANAGER">Manager</SelectItem><SelectItem value="FRONT_DESK">Front Desk</SelectItem></SelectContent></Select></div></div><div className="mt-5 flex gap-3"><Button onClick={()=>save(editing)} className="rounded-full bg-teal px-6 py-2 text-ivory">Save</Button><Button onClick={()=>setEditing(null)} variant="outline" className="rounded-full">Cancel</Button></div></div></div>)}
    </div>
  );
}
