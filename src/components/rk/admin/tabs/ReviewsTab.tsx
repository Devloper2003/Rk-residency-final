"use client";
import { useEffect, useState, useCallback } from "react";
import { Star } from "lucide-react";
import { adminApi, LoadingSpinner } from "./_shared";

export function ReviewsTab() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(() => { adminApi.get("reviews").then((d) => { if (d) setReviews(d.reviews||[]); setLoading(false); }); }, []);
  useEffect(() => { let c=false; adminApi.get("reviews").then((d)=>{ if(c)return; if(d)setReviews(d.reviews||[]); setLoading(false); }); return()=>{c=true}; }, []);
  const toggle = async (id: string, action: "APPROVE"|"HIDE") => { await adminApi.patch("review", { id, reviewAction: action }); reload(); };
  if (loading) return <LoadingSpinner />;
  return (
    <div className="grid gap-3">
      {reviews.map((r) => (
        <div key={r.id} className={`rounded-2xl border bg-white p-4 ${r.approved?"border-teal/30":"border-marsala/30"}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="flex">{Array.from({length:5}).map((_,i)=><Star key={i} className={`h-3.5 w-3.5 ${i<r.rating?"fill-gold text-gold":"text-charcoal/20"}`} />)}</div>
                <h4 className="font-serif text-sm font-semibold text-charcoal">{r.title}</h4>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.approved?"bg-teal/10 text-teal":"bg-marsala/10 text-marsala"}`}>{r.approved?"Live":"Pending"}</span>
              </div>
              <p className="mt-1.5 font-display text-xs leading-relaxed text-charcoal-soft">{r.body}</p>
              <div className="mt-2 font-display text-[10px] text-charcoal-soft">— {r.guestName} {r.guestLocation&&`· ${r.guestLocation}`} · {r.source}</div>
            </div>
            <div className="flex flex-col gap-1">
              {r.approved ? <button onClick={()=>toggle(r.id,"HIDE")} className="rounded-full border border-marsala/30 px-3 py-1 text-[10px] font-semibold text-marsala hover:bg-marsala hover:text-ivory">Hide</button>
              : <button onClick={()=>toggle(r.id,"APPROVE")} className="rounded-full border border-teal/30 px-3 py-1 text-[10px] font-semibold text-teal hover:bg-teal hover:text-ivory">Approve</button>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
