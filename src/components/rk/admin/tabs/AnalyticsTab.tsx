"use client";
import { useEffect, useState, useCallback } from "react";
import { BarChart3, MousePointerClick, Users, Target, TrendingUp, Globe, Loader2 } from "lucide-react";
import { adminApi } from "./_shared";
import { LoadingSpinner, ErrorState, KpiCard } from "./_shared";
import { Button } from "@/components/ui/button";

export function AnalyticsTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    let cancelled = false;
    adminApi.get("analytics").then((d) => {
      if (cancelled) return;
      if (!d) { setError(true); setLoading(false); return; }
      setData(d); setLoading(false);
    }).catch(() => { if (!cancelled) { setError(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { const c = load(); return c; }, [load]);
  const retry = () => { setLoading(true); setError(false); load(); };

  if (loading) return <LoadingSpinner />;
  if (error || !data) return <ErrorState title="Unable to load analytics" message="The server may be starting up. Please retry." onRetry={retry} />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard icon={MousePointerClick} label="Page views today" value={data.today.pageViews.toString()} accent="teal" />
        <KpiCard icon={Users} label="Unique visitors today" value={data.today.uniqueVisitors.toString()} accent="gold" />
        <KpiCard icon={Target} label="Booking conversion" value={`${data.bookingFunnel.conversionRate}%`} sub={`${data.bookingFunnel.bookings} / ${data.bookingFunnel.views} views`} accent="marsala" />
      </div>
      <div className="rounded-2xl border border-charcoal/10 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div><h3 className="font-serif text-base font-semibold text-charcoal">Visitor traffic</h3><p className="font-display text-xs text-charcoal-soft">Last 7 days</p></div>
          <TrendingUp className="h-5 w-5 text-teal" />
        </div>
        <div className="flex h-48 items-end justify-between gap-2 sm:gap-4">
          {data.last7Days.map((d: any) => {
            const max = Math.max(...data.last7Days.map((x: any) => x.pageViews), 1);
            return (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                <div className="text-[10px] font-semibold text-charcoal-soft">{d.pageViews}</div>
                <div className="flex w-full flex-1 items-end gap-1">
                  <div className="flex-1 rounded-t-md bg-teal transition-all" style={{ height: `${Math.max(4, (d.pageViews / max) * 100)}%` }} />
                  <div className="flex-1 rounded-t-md bg-gold transition-all" style={{ height: `${Math.max(4, (d.uniqueVisitors / max) * 100)}%` }} />
                </div>
                <div className="font-display text-[10px] uppercase tracking-wider text-charcoal-soft">{d.label}</div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center justify-center gap-4 font-display text-[10px] text-charcoal-soft">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-teal" /> Page views</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-gold" /> Unique visitors</span>
        </div>
      </div>
      <div className="rounded-2xl border border-charcoal/10 bg-white p-5">
        <h3 className="mb-4 font-serif text-base font-semibold text-charcoal">Monthly trend (last 6 months)</h3>
        <div className="overflow-x-auto"><table className="w-full text-left font-display text-xs">
          <thead className="border-b border-charcoal/10 text-[10px] uppercase tracking-wider text-charcoal-soft"><tr><th className="py-2 pr-4">Month</th><th className="py-2 pr-4 text-right">Views</th><th className="py-2 pr-4 text-right">Visitors</th><th className="py-2 pr-4 text-right">Bookings</th><th className="py-2 text-right">Revenue</th></tr></thead>
          <tbody className="divide-y divide-charcoal/8">
            {data.monthlyTrend.map((m: any) => (<tr key={m.month} className="hover:bg-ivory-deep/30"><td className="py-2 pr-4 font-semibold text-charcoal">{m.label}</td><td className="py-2 pr-4 text-right text-charcoal-soft">{m.pageViews}</td><td className="py-2 pr-4 text-right text-charcoal-soft">{m.uniqueVisitors}</td><td className="py-2 pr-4 text-right text-charcoal-soft">{m.bookings}</td><td className="py-2 text-right font-semibold text-teal">₹{m.revenue.toLocaleString("en-IN")}</td></tr>))}
          </tbody>
        </table></div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-charcoal/10 bg-white p-5">
          <h3 className="mb-4 font-serif text-base font-semibold text-charcoal">Top pages (30 days)</h3>
          <div className="space-y-2">
            {data.topPages.length === 0 ? <p className="font-display text-xs text-charcoal-soft">No page views recorded yet.</p> : data.topPages.map((p: any, i: number) => (
              <div key={p.path} className="flex items-center justify-between font-display text-xs"><span className="flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-teal/10 text-[10px] font-bold text-teal">{i + 1}</span><span className="font-medium text-charcoal">{p.path}</span></span><span className="font-semibold text-charcoal-soft">{p.views} views</span></div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-charcoal/10 bg-white p-5">
          <h3 className="mb-4 font-serif text-base font-semibold text-charcoal">Top referrers (30 days)</h3>
          <div className="space-y-2">
            {data.topReferrers.length === 0 ? <p className="font-display text-xs text-charcoal-soft">No external referrers yet.</p> : data.topReferrers.map((r: any, i: number) => (
              <div key={r.source} className="flex items-center justify-between font-display text-xs"><span className="flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-gold/10 text-[10px] font-bold text-gold-deep">{i + 1}</span><span className="font-medium text-charcoal">{r.source}</span></span><span className="font-semibold text-charcoal-soft">{r.visits} visits</span></div>
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-charcoal/10 bg-white p-5">
        <h3 className="mb-4 font-serif text-base font-semibold text-charcoal">Booking funnel (30 days)</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[{label:"Page views",value:data.bookingFunnel.views,color:"bg-teal"},{label:"Availability checks",value:data.bookingFunnel.checks,color:"bg-gold"},{label:"Bookings",value:data.bookingFunnel.bookings,color:"bg-marsala"},{label:"Conversion rate",value:`${data.bookingFunnel.conversionRate}%`,color:"bg-teal"}].map((s) => (
            <div key={s.label} className="rounded-xl border border-charcoal/10 bg-ivory-deep/30 p-3 text-center"><div className={`mx-auto mb-2 h-1 w-12 rounded-full ${s.color}`} /><div className="font-serif text-xl font-bold text-charcoal">{s.value}</div><div className="font-display text-[10px] uppercase tracking-wider text-charcoal-soft">{s.label}</div></div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-charcoal/10 bg-white p-5">
        <div className="mb-4 flex items-center justify-between"><h3 className="font-serif text-base font-semibold text-charcoal">SEO keyword tracking</h3><Globe className="h-5 w-5 text-teal" /></div>
        {data.seoKeywords.length === 0 ? <p className="font-display text-xs text-charcoal-soft">No SEO keyword data yet.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-left font-display text-xs">
            <thead className="border-b border-charcoal/10 text-[10px] uppercase tracking-wider text-charcoal-soft"><tr><th className="py-2 pr-4">Keyword</th><th className="py-2 pr-4 text-right">Position</th><th className="py-2 pr-4 text-right">Clicks</th><th className="py-2 pr-4 text-right">Impr.</th><th className="py-2 text-right">CTR</th></tr></thead>
            <tbody className="divide-y divide-charcoal/8">{data.seoKeywords.map((k: any) => (<tr key={k.id}><td className="py-2 pr-4 font-medium text-charcoal">{k.keyword}</td><td className="py-2 pr-4 text-right text-charcoal-soft">{k.position || "—"}</td><td className="py-2 pr-4 text-right text-charcoal-soft">{k.clicks}</td><td className="py-2 pr-4 text-right text-charcoal-soft">{k.impressions}</td><td className="py-2 text-right text-charcoal-soft">{k.ctr ? `${k.ctr.toFixed(1)}%` : "—"}</td></tr>))}</tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}
