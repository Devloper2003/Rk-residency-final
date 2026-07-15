"use client";
import { useEffect, useState, useCallback } from "react";
import { Percent, IndianRupee, CalendarDays, Users, TrendingUp, ShieldCheck, Loader2 } from "lucide-react";
import { adminApi } from "./_shared";
import { Button } from "@/components/ui/button";
import { LoadingSpinner, ErrorState, KpiCard } from "./_shared";

export function DashboardTab() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    let cancelled = false;
    adminApi.get("stats").then((data) => {
      if (cancelled) return;
      if (!data) { setError(true); setLoading(false); return; }
      setStats(data); setLoading(false);
    }).catch(() => { if (!cancelled) { setError(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { const c = load(); return c; }, [load]);
  const retry = () => { setLoading(true); setError(false); load(); };

  if (loading) return <LoadingSpinner />;
  if (error || !stats) return <ErrorState title="Unable to load dashboard" message="The server may be starting up. Please retry." onRetry={retry} />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Percent} label="Occupancy (next 30 days)" value={`${stats.occupancyPct}%`} accent="teal" />
        <KpiCard icon={IndianRupee} label="Total revenue" value={`₹${stats.totalRevenue.toLocaleString("en-IN")}`} sub={`ADR ₹${stats.adr.toLocaleString("en-IN")} · RevPAR ₹${stats.revpar.toLocaleString("en-IN")}`} accent="gold" />
        <KpiCard icon={CalendarDays} label="Total bookings" value={stats.totalBookings.toString()} sub={`${stats.cancelledBookings} cancelled`} accent="marsala" />
        <KpiCard icon={Users} label="Today" value={`${stats.arrivalsToday}/${stats.departuresToday}`} sub="arrivals / departures" accent="teal" />
      </div>
      <div className="rounded-2xl border border-charcoal/10 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div><h3 className="font-serif text-base font-semibold text-charcoal">Revenue trend</h3><p className="font-display text-xs text-charcoal-soft">Last 7 days</p></div>
          <TrendingUp className="h-5 w-5 text-teal" />
        </div>
        <div className="flex h-44 items-end justify-between gap-2 sm:gap-4">
          {stats.revenueTrend.map((d: any) => {
            const max = Math.max(...stats.revenueTrend.map((x: any) => x.revenue), 1);
            const h = Math.max(4, (d.revenue / max) * 100);
            return (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                <div className="text-[10px] font-semibold text-charcoal-soft">{d.revenue > 0 ? `₹${(d.revenue / 1000).toFixed(0)}k` : ""}</div>
                <div className="flex w-full flex-1 items-end"><div className="w-full rounded-t-md bg-gradient-to-t from-teal to-teal-soft transition-all" style={{ height: `${h}%` }} title={`${d.bookings} bookings · ₹${d.revenue}`} /></div>
                <div className="font-display text-[10px] uppercase tracking-wider text-charcoal-soft">{d.label}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="rounded-2xl border border-charcoal/10 bg-white p-5">
        <h3 className="mb-4 font-serif text-base font-semibold text-charcoal">Bookings &amp; revenue by room</h3>
        <div className="space-y-3">
          {stats.roomTypeStats.map((r: any) => {
            const maxRev = Math.max(...stats.roomTypeStats.map((x: any) => x.revenue), 1);
            return (
              <div key={r.roomId}>
                <div className="mb-1 flex items-center justify-between font-display text-xs">
                  <span className="font-semibold text-charcoal">{r.roomName}</span>
                  <span className="text-charcoal-soft">{r.bookings} bookings · ₹{r.revenue.toLocaleString("en-IN")} · {r.occupancy}% occ</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-ivory-deep"><div className="h-full rounded-full bg-gradient-to-r from-gold to-gold-soft" style={{ width: `${(r.revenue / maxRev) * 100}%` }} /></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
