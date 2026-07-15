"use client";
import { useEffect, useState } from "react";
import { Mail, ArrowDownToLine } from "lucide-react";
import { adminApi, LoadingSpinner } from "./_shared";

export function LeadsTab() {
  const [messages, setMessages] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"messages"|"subscribers">("messages");

  useEffect(() => {
    let c = false;
    adminApi.get("data").then((data) => {
      if (c || !data) { setLoading(false); return; }
      setMessages(data.messages || []);
      setSubscribers(data.subscribers || []);
      setLoading(false);
    });
    return () => { c = true; };
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={()=>setView("messages")} className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${view==="messages"?"border-teal bg-teal text-ivory":"border-charcoal/15 bg-white text-charcoal-soft"}`}>Contact Leads ({messages.length})</button>
        <button onClick={()=>setView("subscribers")} className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${view==="subscribers"?"border-teal bg-teal text-ivory":"border-charcoal/15 bg-white text-charcoal-soft"}`}>Newsletter ({subscribers.length})</button>
        {view==="subscribers"&&subscribers.length>0&&(<button onClick={()=>{const csv="email,name,language\n"+subscribers.map(s=>`${s.email},${s.name||""},${s.language}`).join("\n");const b=new Blob([csv],{type:"text/csv"});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download="newsletter.csv";a.click()}} className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-charcoal/15 px-3 py-1.5 font-display text-xs font-semibold text-charcoal-soft hover:bg-ivory-deep"><ArrowDownToLine className="h-3.5 w-3.5" /> Export</button>)}
      </div>
      {view==="messages" ? (
        <div className="space-y-3">
          {messages.length===0 ? <div className="rounded-2xl border border-charcoal/10 bg-white p-8 text-center"><Mail className="mx-auto mb-2 h-8 w-8 text-charcoal/30" /><p className="font-display text-sm text-charcoal-soft">No leads yet.</p></div> :
          messages.map((m)=>(<div key={m.id} className="rounded-2xl border border-charcoal/10 bg-white p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><div className="font-serif text-sm font-semibold text-charcoal">{m.subject}</div><div className="font-display text-[10px] text-charcoal-soft">{m.name} · {m.email} {m.phone&&`· ${m.phone}`} · <span className="rounded-full bg-teal/8 px-1.5 py-0.5 font-semibold text-teal">{m.topic}</span></div></div><div className="font-display text-[10px] text-charcoal-soft">{new Date(m.createdAt).toLocaleString("en-IN")}</div></div><p className="mt-2 font-display text-xs leading-relaxed text-charcoal-soft">{m.message}</p><a href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`} className="mt-3 inline-block rounded-full bg-teal px-3 py-1 font-display text-[10px] font-semibold text-ivory">Reply</a></div>))}
        </div>
      ) : (
        <div className="rounded-2xl border border-charcoal/10 bg-white p-5"><div className="scrollbar-thin max-h-[60vh] space-y-1 overflow-y-auto">{subscribers.length===0?<p className="py-8 text-center font-display text-sm text-charcoal-soft">No subscribers yet.</p>:subscribers.map((s)=>(<div key={s.id} className="flex items-center justify-between border-b border-charcoal/5 py-2 last:border-0"><div><div className="font-serif text-sm font-semibold text-charcoal">{s.email}</div><div className="font-display text-[10px] text-charcoal-soft">{s.name||"—"} · {s.language}</div></div><div className="font-display text-[10px] text-charcoal-soft">{new Date(s.createdAt).toLocaleDateString("en-IN")}</div></div>))}</div></div>
      )}
    </div>
  );
}
