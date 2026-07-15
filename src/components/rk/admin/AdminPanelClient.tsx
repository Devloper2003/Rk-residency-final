"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, CalendarDays, BedDouble, Star, Mail,
  ScrollText, LogOut, Lock, Loader2, Menu, X,
  Tag, FileText, ShieldCheck, Edit, Trash2, Plus, Sparkles,
  BarChart3, Users, Check, Search, ArrowDownToLine, ArrowUpFromLine,
  IndianRupee, Percent, TrendingUp, Globe, MousePointerClick, Target,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Logo } from "../Motifs";
import { useRouter } from "@/lib/router";
import {
  getAdmin, setAdminSession, clearAdminSession, adminFetch,
} from "@/lib/admin-client";
import { toast } from "sonner";

type AdminUser = { id: string; email: string; name: string; role: string };
type Tab = "dashboard" | "analytics" | "bookings" | "rooms" | "offers" | "blog" | "reviews" | "content" | "theme" | "settings" | "users" | "leads" | "audit";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "analytics", label: "Analytics & SEO", icon: BarChart3 },
  { id: "bookings", label: "Bookings", icon: CalendarDays },
  { id: "rooms", label: "Rooms & Rates", icon: BedDouble },
  { id: "offers", label: "Offers", icon: Tag },
  { id: "blog", label: "Blog", icon: FileText },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "content", label: "Page Editor", icon: Edit },
  { id: "theme", label: "Theme & Colors", icon: Sparkles },
  { id: "settings", label: "Site Settings", icon: ShieldCheck },
  { id: "users", label: "User Management", icon: Users },
  { id: "leads", label: "Leads & Messages", icon: Mail },
  { id: "audit", label: "Audit Log", icon: ScrollText },
];

export interface AdminData {
  stats: any;
  analytics: any;
  bookings: any[];
  rooms: any[];
  offers: any[];
  blogPosts: any[];
  reviews: any[];
  contentItems: any[];
  settings: any[];
  themes: any[];
  subscribers: any[];
  messages: any[];
  auditLogs: any[];
  adminUsers: any[];
}

export function AdminPanelClient({ initialData }: { initialData: AdminData }) {
  const navigate = useRouter((s) => s.navigate);
  const [stored, setStored] = useState<AdminUser | null>(() => getAdmin());
  const authed = stored !== null;
  const [tab, setTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState<AdminData>(initialData);

  const handleLogin = useCallback((admin: AdminUser, token: string) => {
    setAdminSession(admin, token);
    setStored(admin);
  }, []);

  const handleLogout = useCallback(async () => {
    try { await fetch("/api/admin/auth", { method: "DELETE" }); } catch {}
    clearAdminSession();
    setStored(null);
    navigate("home");
  }, [navigate]);

  if (!authed) {
    return <AdminLogin onLogin={handleLogin} onBack={() => navigate("home")} />;
  }

  return (
    <div className="flex min-h-screen bg-ivory">
      <aside className={`fixed inset-y-0 left-0 z-20 w-64 transform bg-charcoal text-ivory transition-transform lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-ivory/10 p-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-full border border-gold/40 bg-ivory/5 text-gold"><Logo size={20} /></span>
              <div><div className="font-serif text-sm font-semibold text-ivory">RK Residency</div><div className="font-display text-[9px] uppercase tracking-[0.24em] text-gold-soft">Admin Console</div></div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="grid h-8 w-8 place-items-center rounded-full border border-ivory/15 text-ivory/70 lg:hidden"><X className="h-4 w-4" /></button>
          </div>
          <nav className="scrollbar-thin flex-1 space-y-1 overflow-y-auto p-3">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => { setTab(t.id); setSidebarOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-display text-sm transition-all ${tab === t.id ? "bg-gold/15 text-gold-soft" : "text-ivory/70 hover:bg-ivory/5 hover:text-ivory"}`}>
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            ))}
          </nav>
          <div className="border-t border-ivory/10 p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gold/20 font-serif text-sm font-bold text-gold-soft">{stored?.name?.charAt(0) || "A"}</div>
              <div className="min-w-0 flex-1"><div className="truncate font-serif text-sm font-semibold text-ivory">{stored?.name}</div><div className="truncate font-display text-[10px] text-ivory/60">{stored?.role === "SUPER_ADMIN" ? "Super Admin" : stored?.role}</div></div>
            </div>
            <button onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-xl border border-ivory/15 px-3 py-2 font-display text-xs font-semibold text-ivory/80 hover:border-marsala hover:bg-marsala hover:text-ivory"><LogOut className="h-3.5 w-3.5" /> Sign out</button>
          </div>
        </div>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 z-10 bg-charcoal/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <main className="scrollbar-thin flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-charcoal/10 bg-ivory/90 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="grid h-9 w-9 place-items-center rounded-full border border-charcoal/15 text-charcoal-soft lg:hidden"><Menu className="h-4 w-4" /></button>
            <div><h1 className="font-serif text-lg font-semibold text-charcoal">{TABS.find((t) => t.id === tab)?.label}</h1><p className="font-display text-[10px] uppercase tracking-wider text-charcoal-soft">RK Residency · Admin Console</p></div>
          </div>
          <button onClick={() => navigate("home")} className="rounded-full border border-charcoal/15 bg-white px-3 py-1.5 font-display text-xs font-semibold text-charcoal-soft hover:bg-ivory-deep">View site</button>
        </header>
        <div className="p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
              {tab === "dashboard" && <DashboardTab stats={data.stats} />}
              {tab === "analytics" && <AnalyticsTab analytics={data.analytics} />}
              {tab === "bookings" && <BookingsTab bookings={data.bookings} onUpdate={setData} data={data} />}
              {tab === "rooms" && <RoomsTab rooms={data.rooms} />}
              {tab === "offers" && <OffersTab offers={data.offers} />}
              {tab === "blog" && <BlogTab posts={data.blogPosts} />}
              {tab === "reviews" && <ReviewsTab reviews={data.reviews} data={data} onUpdate={setData} />}
              {tab === "content" && <ContentTab items={data.contentItems} />}
              {tab === "theme" && <ThemeTab themes={data.themes} />}
              {tab === "settings" && <SettingsTab settings={data.settings} />}
              {tab === "users" && <UsersTab users={data.adminUsers} />}
              {tab === "leads" && <LeadsTab messages={data.messages} subscribers={data.subscribers} />}
              {tab === "audit" && <AuditTab logs={data.auditLogs} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// =================== LOGIN ===================
function AdminLogin({ onLogin, onBack }: { onLogin: (a: AdminUser, token: string) => void; onBack: () => void }) {
  const [email, setEmail] = useState("admin@rkresidency.in");
  const [password, setPassword] = useState("rk-admin-2026");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const res = await fetch("/api/admin/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        // Check if response is OK
        if (!res.ok) {
          // Try to parse error JSON, but handle non-JSON responses
          let errMsg = `Server error (${res.status})`;
          try {
            const errData = await res.json();
            errMsg = errData.error || errMsg;
          } catch {}
          throw new Error(errMsg);
        }

        // Parse JSON response
        const d = await res.json();
        if (!d.ok || !d.admin || !d.token) {
          throw new Error(d.error || "Invalid response from server");
        }

        // Success!
        onLogin(d.admin, d.token);
        toast.success(`Welcome, ${d.admin.name}`);
        setLoading(false);
        return;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Login failed";

        // Retry on network errors, timeouts, or server errors
        const shouldRetry = (
          msg.includes("fetch") ||
          msg.includes("network") ||
          msg.includes("timeout") ||
          msg.includes("500") ||
          msg.includes("502") ||
          msg.includes("503") ||
          msg.includes("Load failed")
        );

        if (shouldRetry && attempt < 4) {
          setError(`Connecting to server... retry ${attempt + 2}/5`);
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }

        // Final failure
        setError(msg);
        toast.error("Login failed", { description: msg });
        setLoading(false);
        return;
      }
    }
    setError("Unable to connect. Please refresh the page and try again.");
    setLoading(false);
  };

  return (
    <div className="grid min-h-screen place-items-center bg-charcoal p-4">
      <div className="pointer-events-none absolute inset-0 bg-yamuna-ripple opacity-15" />
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-md overflow-hidden rounded-3xl bg-ivory shadow-2xl">
        <div className="border-b border-charcoal/10 bg-teal px-6 py-5 text-ivory">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full border border-gold/40 bg-ivory/5 text-gold"><Logo size={24} /></span>
            <div><div className="font-serif text-lg font-semibold">RK Residency Admin</div><div className="font-display text-[10px] uppercase tracking-[0.28em] text-gold-soft">Restricted access</div></div>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4 p-6">
          <div><Label htmlFor="a-email" className="mb-1.5 block font-display text-xs uppercase tracking-wider text-charcoal-soft">Email</Label><Input id="a-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-ivory-deep/40" /></div>
          <div><Label htmlFor="a-pass" className="mb-1.5 block font-display text-xs uppercase tracking-wider text-charcoal-soft">Password</Label><div className="relative"><Input id="a-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-ivory-deep/40" /><button type="button" onClick={() => {}} className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-soft">👁️</button></div></div>
          {error && <div className="rounded-xl border border-marsala/30 bg-marsala/5 px-3 py-2 font-display text-xs text-marsala">{error}</div>}
          <Button type="submit" disabled={loading} className="w-full rounded-full bg-teal py-3 font-serif text-base font-semibold text-ivory hover:bg-teal-deep disabled:opacity-50">{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…</> : <><Lock className="mr-2 h-4 w-4" /> Sign in</>}</Button>
          <div className="rounded-xl border border-gold/30 bg-gold/5 px-3 py-2 font-display text-[11px] leading-relaxed text-charcoal-soft"><strong className="text-gold-deep">Demo credentials</strong> — admin@rkresidency.in / rk-admin-2026</div>
          <button type="button" onClick={onBack} className="block w-full text-center font-display text-xs text-charcoal-soft hover:text-charcoal">← Back to website</button>
        </form>
      </motion.div>
    </div>
  );
}

// =================== DASHBOARD ===================
function DashboardTab({ stats }: { stats: any }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Percent} label="Occupancy" value={`${stats.occupancyPct}%`} accent="teal" />
        <KpiCard icon={IndianRupee} label="Total revenue" value={`₹${stats.totalRevenue.toLocaleString("en-IN")}`} sub={`ADR ₹${stats.adr.toLocaleString("en-IN")}`} accent="gold" />
        <KpiCard icon={CalendarDays} label="Total bookings" value={stats.totalBookings.toString()} sub={`${stats.cancelledBookings} cancelled`} accent="marsala" />
        <KpiCard icon={Users} label="Today" value={`${stats.arrivalsToday}/${stats.departuresToday}`} sub="arrivals/departures" accent="teal" />
      </div>
      <div className="rounded-2xl border border-charcoal/10 bg-white p-5">
        <div className="mb-4 flex items-center justify-between"><div><h3 className="font-serif text-base font-semibold text-charcoal">Revenue trend</h3><p className="font-display text-xs text-charcoal-soft">Last 7 days</p></div><TrendingUp className="h-5 w-5 text-teal" /></div>
        <div className="flex h-44 items-end justify-between gap-2 sm:gap-4">
          {stats.revenueTrend.map((d: any) => {
            const max = Math.max(...stats.revenueTrend.map((x: any) => x.revenue), 1);
            return (<div key={d.date} className="flex flex-1 flex-col items-center gap-1"><div className="text-[10px] font-semibold text-charcoal-soft">{d.revenue > 0 ? `₹${(d.revenue / 1000).toFixed(0)}k` : ""}</div><div className="flex w-full flex-1 items-end"><div className="w-full rounded-t-md bg-gradient-to-t from-teal to-teal-soft" style={{ height: `${Math.max(4, (d.revenue / max) * 100)}%` }} /></div><div className="font-display text-[10px] uppercase tracking-wider text-charcoal-soft">{d.label}</div></div>);
          })}
        </div>
      </div>
      <div className="rounded-2xl border border-charcoal/10 bg-white p-5">
        <h3 className="mb-4 font-serif text-base font-semibold text-charcoal">Bookings &amp; revenue by room</h3>
        <div className="space-y-3">
          {stats.roomTypeStats.map((r: any) => {
            const maxRev = Math.max(...stats.roomTypeStats.map((x: any) => x.revenue), 1);
            return (<div key={r.roomId}><div className="mb-1 flex items-center justify-between font-display text-xs"><span className="font-semibold text-charcoal">{r.roomName}</span><span className="text-charcoal-soft">{r.bookings} bookings · ₹{r.revenue.toLocaleString("en-IN")} · {r.occupancy}%</span></div><div className="h-2 overflow-hidden rounded-full bg-ivory-deep"><div className="h-full rounded-full bg-gradient-to-r from-gold to-gold-soft" style={{ width: `${(r.revenue / maxRev) * 100}%` }} /></div></div>);
          })}
        </div>
      </div>
    </div>
  );
}

// =================== ANALYTICS ===================
function AnalyticsTab({ analytics }: { analytics: any }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard icon={MousePointerClick} label="Page views today" value={analytics.today.pageViews.toString()} accent="teal" />
        <KpiCard icon={Users} label="Unique visitors today" value={analytics.today.uniqueVisitors.toString()} accent="gold" />
        <KpiCard icon={Target} label="Conversion rate" value={`${analytics.bookingFunnel.conversionRate}%`} sub={`${analytics.bookingFunnel.bookings} bookings`} accent="marsala" />
      </div>
      <div className="rounded-2xl border border-charcoal/10 bg-white p-5">
        <h3 className="mb-4 font-serif text-base font-semibold text-charcoal">Visitor traffic (7 days)</h3>
        <div className="flex h-48 items-end justify-between gap-2 sm:gap-4">
          {analytics.last7Days.map((d: any) => {
            const max = Math.max(...analytics.last7Days.map((x: any) => x.pageViews), 1);
            return (<div key={d.date} className="flex flex-1 flex-col items-center gap-1"><div className="text-[10px] font-semibold text-charcoal-soft">{d.pageViews}</div><div className="flex w-full flex-1 items-end gap-1"><div className="flex-1 rounded-t-md bg-teal" style={{ height: `${Math.max(4, (d.pageViews / max) * 100)}%` }} /><div className="flex-1 rounded-t-md bg-gold" style={{ height: `${Math.max(4, (d.uniqueVisitors / max) * 100)}%` }} /></div><div className="font-display text-[10px] uppercase tracking-wider text-charcoal-soft">{d.label}</div></div>);
          })}
        </div>
      </div>
      <div className="rounded-2xl border border-charcoal/10 bg-white p-5">
        <h3 className="mb-4 font-serif text-base font-semibold text-charcoal">Monthly trend</h3>
        <div className="overflow-x-auto"><table className="w-full text-left font-display text-xs"><thead className="border-b border-charcoal/10 text-[10px] uppercase tracking-wider text-charcoal-soft"><tr><th className="py-2 pr-4">Month</th><th className="py-2 pr-4 text-right">Views</th><th className="py-2 pr-4 text-right">Visitors</th><th className="py-2 pr-4 text-right">Bookings</th><th className="py-2 text-right">Revenue</th></tr></thead><tbody className="divide-y divide-charcoal/8">{analytics.monthlyTrend.map((m: any) => (<tr key={m.month}><td className="py-2 pr-4 font-semibold text-charcoal">{m.label}</td><td className="py-2 pr-4 text-right text-charcoal-soft">{m.pageViews}</td><td className="py-2 pr-4 text-right text-charcoal-soft">{m.uniqueVisitors}</td><td className="py-2 pr-4 text-right text-charcoal-soft">{m.bookings}</td><td className="py-2 text-right font-semibold text-teal">₹{m.revenue.toLocaleString("en-IN")}</td></tr>))}</tbody></table></div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-charcoal/10 bg-white p-5"><h3 className="mb-4 font-serif text-base font-semibold text-charcoal">Top pages</h3><div className="space-y-2">{analytics.topPages.length === 0 ? <p className="font-display text-xs text-charcoal-soft">No data yet.</p> : analytics.topPages.map((p: any, i: number) => (<div key={p.path} className="flex items-center justify-between font-display text-xs"><span className="flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-teal/10 text-[10px] font-bold text-teal">{i + 1}</span>{p.path}</span><span className="font-semibold text-charcoal-soft">{p.views}</span></div>))}</div></div>
        <div className="rounded-2xl border border-charcoal/10 bg-white p-5"><h3 className="mb-4 font-serif text-base font-semibold text-charcoal">Top referrers</h3><div className="space-y-2">{analytics.topReferrers.length === 0 ? <p className="font-display text-xs text-charcoal-soft">No referrers yet.</p> : analytics.topReferrers.map((r: any, i: number) => (<div key={r.source} className="flex items-center justify-between font-display text-xs"><span className="flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-gold/10 text-[10px] font-bold text-gold-deep">{i + 1}</span>{r.source}</span><span className="font-semibold text-charcoal-soft">{r.visits}</span></div>))}</div></div>
      </div>
    </div>
  );
}

// =================== BOOKINGS ===================
function BookingsTab({ bookings, data, onUpdate }: { bookings: any[]; data: AdminData; onUpdate: (d: AdminData) => void }) {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const filtered = bookings.filter((b) => {
    if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
    if (search && !b.referenceCode.toLowerCase().includes(search.toLowerCase()) && !b.guestName.toLowerCase().includes(search.toLowerCase()) && !b.guestEmail.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const action = async (id: string, a: string) => {
    setLoading((s) => ({ ...s, [id]: true }));
    const res = await adminFetch("/api/admin/all", { method: "PATCH", body: JSON.stringify({ action: "booking_status", id, bookingAction: a }) });
    if (res) {
      toast.success(`Booking ${a.toLowerCase().replace("_", " ")}`);
      onUpdate({ ...data, bookings: data.bookings.map((b) => b.id === id ? { ...b, status: res.booking.status, paymentStatus: res.booking.paymentStatus } : b) });
    } else toast.error("Action failed");
    setLoading((s) => ({ ...s, [id]: false }));
  };

  const SC: Record<string, string> = { CONFIRMED: "bg-teal/10 text-teal", CHECKED_IN: "bg-gold/15 text-gold-deep", CHECKED_OUT: "bg-charcoal/10 text-charcoal-soft", CANCELLED: "bg-marsala/10 text-marsala" };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-soft" /><Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="bg-white pl-10" /></div>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full bg-white sm:w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">All statuses</SelectItem><SelectItem value="CONFIRMED">Confirmed</SelectItem><SelectItem value="CHECKED_IN">Checked in</SelectItem><SelectItem value="CHECKED_OUT">Checked out</SelectItem><SelectItem value="CANCELLED">Cancelled</SelectItem></SelectContent></Select>
      </div>
      <div className="overflow-hidden rounded-2xl border border-charcoal/10 bg-white">
        <div className="scrollbar-thin overflow-x-auto"><table className="w-full text-left"><thead className="border-b border-charcoal/10 bg-ivory-deep font-display text-[10px] uppercase tracking-wider text-charcoal-soft"><tr><th className="px-4 py-3">Ref</th><th className="px-4 py-3">Guest</th><th className="px-4 py-3">Room</th><th className="px-4 py-3">Dates</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Pay</th><th className="px-4 py-3">Actions</th></tr></thead>
        <tbody className="divide-y divide-charcoal/8 font-display text-xs">
          {filtered.length === 0 ? <tr><td colSpan={8} className="px-4 py-10 text-center text-charcoal-soft">No bookings found.</td></tr> :
          filtered.map((b) => (
            <tr key={b.id} className="hover:bg-ivory-deep/30">
              <td className="px-4 py-3 font-mono text-[11px] font-semibold text-teal">{b.referenceCode}</td>
              <td className="px-4 py-3"><div className="font-semibold text-charcoal">{b.guestName}</div><div className="text-[10px] text-charcoal-soft">{b.guestEmail}</div></td>
              <td className="px-4 py-3 text-charcoal-soft">{b.room?.name || "—"}</td>
              <td className="px-4 py-3 text-charcoal-soft"><div>{new Date(b.checkIn).toLocaleDateString("en-IN",{day:"numeric",month:"short"})} → {new Date(b.checkOut).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</div><div className="text-[10px]">{b.nights}n · {b.adults}a</div></td>
              <td className="px-4 py-3 text-right font-serif text-sm font-bold text-teal">₹{b.totalAmount.toLocaleString("en-IN")}</td>
              <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${SC[b.status]||"bg-charcoal/10"}`}>{b.status.replace("_"," ")}</span></td>
              <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${b.paymentStatus==="PAID"?"bg-teal/10 text-teal":"bg-gold/15 text-gold-deep"}`}>{b.paymentStatus}</span></td>
              <td className="px-4 py-3"><div className="flex flex-wrap gap-1">
                {loading[b.id] ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                {b.status==="CONFIRMED"&&<ActionBtn label="Check-in" icon={ArrowDownToLine} onClick={()=>action(b.id,"CHECK_IN")} />}
                {b.status==="CHECKED_IN"&&<ActionBtn label="Check-out" icon={ArrowDownToLine} onClick={()=>action(b.id,"CHECK_OUT")} />}
                {b.paymentStatus==="PENDING"&&<ActionBtn label="Paid" icon={IndianRupee} onClick={()=>action(b.id,"MARK_PAID")} />}
                {b.status!=="CANCELLED"&&b.status!=="CHECKED_OUT"&&<ActionBtn label="Cancel" icon={X} onClick={()=>action(b.id,"CANCEL")} color="marsala" />}
                {b.paymentStatus==="PAID"&&<ActionBtn label="Refund" icon={IndianRupee} onClick={()=>action(b.id,"REFUND")} color="marsala" />}
              </div></td>
            </tr>
          ))}
        </tbody></table></div>
      </div>
    </div>
  );
}

// =================== ROOMS ===================
function RoomsTab({ rooms }: { rooms: any[] }) {
  const [editing, setEditing] = useState<any | null>(null);
  const save = async (room: any) => {
    const method = room.id ? "PATCH" : "POST";
    const res = await adminFetch("/api/admin/rooms", { method, body: JSON.stringify(room) });
    if (res) { toast.success("Saved"); setEditing(null); } else toast.error("Failed");
  };
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><p className="font-display text-sm text-charcoal-soft">{rooms.length} rooms</p><Button onClick={() => setEditing({})} className="rounded-full bg-teal px-4 py-2 text-sm text-ivory"><Plus className="mr-1 h-4 w-4" /> New</Button></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((r) => { const imgs = JSON.parse(r.imageUrls || "[]"); return (
          <div key={r.id} className="overflow-hidden rounded-2xl border border-charcoal/10 bg-white">
            <div className="relative h-32 overflow-hidden"><div className="h-full w-full bg-cover bg-center" style={{backgroundImage:`url(${imgs[0]||"/images/heritage-room.jpg"})`}} /><div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-3"><div className="font-serif text-sm font-semibold text-ivory">{r.name}</div><div className="font-serif text-base font-bold text-gold-soft">₹{r.basePrice.toLocaleString("en-IN")}/night</div></div></div>
            <div className="flex items-center justify-between p-3"><div className="font-display text-[11px] text-charcoal-soft">{r.totalCount} · {r.maxGuests} guests · {r.sizeSqft}sqft</div><div className="flex gap-1"><button onClick={() => setEditing(r)} className="grid h-8 w-8 place-items-center rounded-full border border-charcoal/15 text-charcoal-soft hover:bg-teal hover:text-ivory"><Edit className="h-3.5 w-3.5" /></button></div></div>
          </div>); })}
      </div>
      {editing && <EditorModal title={editing.id?"Edit room":"New room"} onClose={()=>setEditing(null)}><div className="space-y-3"><Field label="Name" value={editing.name||""} onChange={(v)=>setEditing({...editing,name:v})} /><Field label="Price" type="number" value={editing.basePrice||0} onChange={(v)=>setEditing({...editing,basePrice:parseInt(v)})} /><Field label="Description" textarea value={editing.description||""} onChange={(v)=>setEditing({...editing,description:v})} /><Button onClick={()=>save(editing)} className="rounded-full bg-teal px-6 py-2 text-ivory">Save</Button></div></EditorModal>}
    </div>
  );
}

// =================== OFFERS ===================
function OffersTab({ offers }: { offers: any[] }) {
  return (<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{offers.map((o) => (<div key={o.id} className="overflow-hidden rounded-2xl border border-charcoal/10 bg-white"><div className="relative h-32 overflow-hidden">{o.imageUrl&&<div className="h-full w-full bg-cover bg-center" style={{backgroundImage:`url(${o.imageUrl})`}} />}<div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-3"><div className="font-serif text-sm font-semibold text-ivory">{o.title}</div>{o.discountPct&&<div className="font-serif text-base font-bold text-gold-soft">{o.discountPct}% OFF</div>}</div></div><div className="p-3 font-display text-[11px] text-charcoal-soft">{o.badge||"—"}</div></div>))}</div>);
}

// =================== BLOG ===================
function BlogTab({ posts }: { posts: any[] }) {
  return (<div className="space-y-3">{posts.map((p) => (<div key={p.id} className="rounded-2xl border border-charcoal/10 bg-white p-4"><div className="flex items-center gap-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.published?"bg-teal/10 text-teal":"bg-marsala/10 text-marsala"}`}>{p.published?"Published":"Draft"}</span><span className="rounded-full bg-ivory-deep px-2 py-0.5 text-[10px] font-medium text-charcoal-soft">{p.category.replace("_"," ")}</span></div><h3 className="mt-1 font-serif text-base font-semibold text-charcoal">{p.title}</h3><p className="mt-0.5 font-display text-xs text-charcoal-soft">/{p.slug} · {p.readingMins} min</p></div>))}</div>);
}

// =================== REVIEWS ===================
function ReviewsTab({ reviews, data, onUpdate }: { reviews: any[]; data: AdminData; onUpdate: (d: AdminData) => void }) {
  const toggle = async (id: string, action: "APPROVE" | "HIDE") => {
    const res = await adminFetch("/api/admin/all", { method: "PATCH", body: JSON.stringify({ action: "review", id, reviewAction: action }) });
    if (res) { toast.success(action === "APPROVE" ? "Approved" : "Hidden"); onUpdate({ ...data, reviews: data.reviews.map((r) => r.id === id ? { ...r, approved: res.review.approved } : r) }); }
  };
  return (<div className="grid gap-3">{reviews.map((r) => (<div key={r.id} className={`rounded-2xl border bg-white p-4 ${r.approved?"border-teal/30":"border-marsala/30"}`}><div className="flex items-start justify-between gap-3"><div className="flex-1"><div className="flex items-center gap-2"><div className="flex">{Array.from({length:5}).map((_,i)=><Star key={i} className={`h-3.5 w-3.5 ${i<r.rating?"fill-gold text-gold":"text-charcoal/20"}`} />)}</div><h4 className="font-serif text-sm font-semibold text-charcoal">{r.title}</h4><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.approved?"bg-teal/10 text-teal":"bg-marsala/10 text-marsala"}`}>{r.approved?"Live":"Pending"}</span></div><p className="mt-1.5 font-display text-xs text-charcoal-soft">{r.body}</p><div className="mt-2 font-display text-[10px] text-charcoal-soft">— {r.guestName} · {r.source}</div></div><div>{r.approved?<button onClick={()=>toggle(r.id,"HIDE")} className="rounded-full border border-marsala/30 px-3 py-1 text-[10px] font-semibold text-marsala">Hide</button>:<button onClick={()=>toggle(r.id,"APPROVE")} className="rounded-full border border-teal/30 px-3 py-1 text-[10px] font-semibold text-teal">Approve</button>}</div></div></div>))}</div>);
}

// =================== CONTENT ===================
function ContentTab({ items }: { items: any[] }) {
  const [activeSection, setActiveSection] = useState(items[0]?.section || "hero");
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const sections = Array.from(new Set(items.map((i) => i.section)));
  const visible = items.filter((i) => i.section === activeSection);
  const save = async (id: string) => {
    setSaving((s) => ({ ...s, [id]: true }));
    const res = await adminFetch("/api/admin/all", { method: "PATCH", body: JSON.stringify({ action: "content", id, value: editing[id] }) });
    if (res) toast.success("Updated — live on website!"); else toast.error("Failed");
    setSaving((s) => ({ ...s, [id]: false }));
  };
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-teal/20 bg-teal/5 p-4"><p className="font-display text-sm text-charcoal-soft"><strong className="text-teal">Edit website content.</strong> Changes are live instantly.</p></div>
      <div className="flex flex-wrap gap-2">{sections.map((s) => (<button key={s} onClick={() => setActiveSection(s)} className={`rounded-full border px-4 py-1.5 text-sm font-medium ${activeSection===s?"border-teal bg-teal text-ivory":"border-charcoal/15 bg-white text-charcoal-soft"}`}>{s.charAt(0).toUpperCase()+s.slice(1)}</button>))}</div>
      <div className="space-y-3">{visible.map((item) => (
        <div key={item.id} className="rounded-2xl border border-charcoal/10 bg-white p-4">
          <div className="mb-2 flex items-center justify-between"><div><span className="font-serif text-sm font-semibold text-charcoal">{item.label||item.key}</span><span className="ml-2 font-mono text-[10px] text-charcoal-soft">{item.key}</span></div></div>
          {item.type==="textarea"?<textarea value={editing[item.id]??item.value} onChange={(e)=>setEditing((p)=>({...p,[item.id]:e.target.value}))} rows={3} className="w-full rounded-lg border border-charcoal/15 bg-ivory-deep/30 px-3 py-2 font-display text-sm text-charcoal" />:<Input value={editing[item.id]??item.value} onChange={(e)=>setEditing((p)=>({...p,[item.id]:e.target.value}))} className="bg-ivory-deep/30" />}
          <div className="mt-2 flex justify-end"><Button onClick={()=>save(item.id)} disabled={saving[item.id]} className="rounded-full bg-teal px-4 py-1.5 text-xs text-ivory">{saving[item.id]?<Loader2 className="h-3 w-3 animate-spin" />:<><Check className="mr-1 h-3 w-3" /> Save</>}</Button></div>
        </div>))}</div>
    </div>
  );
}

// =================== THEME ===================
function ThemeTab({ themes }: { themes: any[] }) {
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const save = async (id: string) => { setSaving((s)=>({...s,[id]:true})); const r=await adminFetch("/api/admin/all",{method:"PATCH",body:JSON.stringify({action:"theme",id,value:editing[id]})}); if(r)toast.success("Color updated!"); else toast.error("Failed"); setSaving((s)=>({...s,[id]:false})); };
  return (<div className="space-y-4"><div className="rounded-2xl border border-teal/20 bg-teal/5 p-4"><p className="font-display text-sm text-charcoal-soft"><strong className="text-teal">Customize colors.</strong></p></div><div className="grid gap-4 sm:grid-cols-2">{themes.map((t)=>(<div key={t.id} className="rounded-2xl border border-charcoal/10 bg-white p-4"><div className="mb-2"><span className="font-serif text-sm font-semibold text-charcoal">{t.label||t.key}</span></div><div className="flex items-center gap-3"><input type="color" value={editing[t.id]??t.value} onChange={(e)=>setEditing((p)=>({...p,[t.id]:e.target.value}))} className="h-12 w-16 cursor-pointer rounded-lg border border-charcoal/15" /><Input value={editing[t.id]??t.value} onChange={(e)=>setEditing((p)=>({...p,[t.id]:e.target.value}))} className="flex-1 bg-ivory-deep/30 font-mono text-sm" /><div className="h-12 w-12 rounded-lg border border-charcoal/15" style={{backgroundColor:editing[t.id]??t.value}} /></div><div className="mt-2 flex justify-end"><Button onClick={()=>save(t.id)} disabled={saving[t.id]} className="rounded-full bg-teal px-4 py-1.5 text-xs text-ivory">{saving[t.id]?<Loader2 className="h-3 w-3 animate-spin" />:<><Check className="mr-1 h-3 w-3" /> Save</>}</Button></div></div>))}</div></div>);
}

// =================== SETTINGS ===================
function SettingsTab({ settings }: { settings: any[] }) {
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const save = async (id: string) => { setSaving((s)=>({...s,[id]:true})); const r=await adminFetch("/api/admin/all",{method:"PATCH",body:JSON.stringify({action:"setting",id,value:editing[id]})}); if(r)toast.success("Saved"); else toast.error("Failed"); setSaving((s)=>({...s,[id]:false})); };
  const cats = Array.from(new Set(settings.map((s) => s.category)));
  return (<div className="space-y-6"><div className="rounded-2xl border border-teal/20 bg-teal/5 p-4"><p className="font-display text-sm text-charcoal-soft"><strong className="text-teal">Site settings.</strong></p></div>{cats.map((c)=>(<div key={c}><h3 className="mb-3 font-serif text-lg font-semibold text-charcoal">{c.charAt(0).toUpperCase()+c.slice(1)}</h3><div className="space-y-3">{settings.filter((s)=>s.category===c).map((s)=>(<div key={s.id} className="rounded-2xl border border-charcoal/10 bg-white p-4"><div className="mb-2"><span className="font-serif text-sm font-semibold text-charcoal">{s.label||s.key}</span></div><Input value={editing[s.id]??s.value} onChange={(e)=>setEditing((p)=>({...p,[s.id]:e.target.value}))} className="bg-ivory-deep/30" placeholder={s.key==="ga_measurement_id"?"G-XXXXXXXXXX":""} /><div className="mt-2 flex justify-end"><Button onClick={()=>save(s.id)} disabled={saving[s.id]} className="rounded-full bg-teal px-4 py-1.5 text-xs text-ivory">{saving[s.id]?<Loader2 className="h-3 w-3 animate-spin" />:<><Check className="mr-1 h-3 w-3" /> Save</>}</Button></div></div>))}</div></div>))}</div>);
}

// =================== USERS ===================
function UsersTab({ users }: { users: any[] }) {
  const admin = getAdmin();
  if (admin?.role !== "SUPER_ADMIN") return <div className="rounded-2xl border border-marsala/30 bg-marsala/5 p-8 text-center"><ShieldCheck className="mx-auto mb-3 h-8 w-8 text-marsala" /><p className="font-serif text-lg font-semibold text-marsala">Access Denied</p></div>;
  const RC: Record<string,string> = { SUPER_ADMIN:"bg-marsala/10 text-marsala", MANAGER:"bg-teal/10 text-teal", FRONT_DESK:"bg-gold/15 text-gold-deep" };
  return (<div className="space-y-4"><div className="flex items-center justify-between"><p className="font-display text-sm text-charcoal-soft">{users.length} users</p></div><div className="overflow-hidden rounded-2xl border border-charcoal/10 bg-white"><table className="w-full text-left"><thead className="border-b border-charcoal/10 bg-ivory-deep font-display text-[10px] uppercase tracking-wider text-charcoal-soft"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Created</th></tr></thead><tbody className="divide-y divide-charcoal/8 font-display text-xs">{users.map((u)=>(<tr key={u.id}><td className="px-4 py-3 font-semibold text-charcoal">{u.name}</td><td className="px-4 py-3 text-charcoal-soft">{u.email}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${RC[u.role]||"bg-charcoal/10"}`}>{u.role.replace("_"," ")}</span></td><td className="px-4 py-3 text-charcoal-soft">{new Date(u.createdAt).toLocaleDateString("en-IN")}</td></tr>))}</tbody></table></div></div>);
}

// =================== LEADS ===================
function LeadsTab({ messages, subscribers }: { messages: any[]; subscribers: any[] }) {
  const [view, setView] = useState<"messages"|"subscribers">("messages");
  return (<div className="space-y-4"><div className="flex gap-2"><button onClick={()=>setView("messages")} className={`rounded-full border px-4 py-1.5 text-sm font-medium ${view==="messages"?"border-teal bg-teal text-ivory":"border-charcoal/15 bg-white text-charcoal-soft"}`}>Leads ({messages.length})</button><button onClick={()=>setView("subscribers")} className={`rounded-full border px-4 py-1.5 text-sm font-medium ${view==="subscribers"?"border-teal bg-teal text-ivory":"border-charcoal/15 bg-white text-charcoal-soft"}`}>Newsletter ({subscribers.length})</button></div>{view==="messages"?<div className="space-y-3">{messages.length===0?<div className="rounded-2xl border border-charcoal/10 bg-white p-8 text-center"><Mail className="mx-auto mb-2 h-8 w-8 text-charcoal/30" /><p className="font-display text-sm text-charcoal-soft">No leads yet.</p></div>:messages.map((m)=>(<div key={m.id} className="rounded-2xl border border-charcoal/10 bg-white p-4"><div className="flex justify-between"><div><div className="font-serif text-sm font-semibold text-charcoal">{m.subject}</div><div className="font-display text-[10px] text-charcoal-soft">{m.name} · {m.email} · <span className="rounded-full bg-teal/8 px-1.5 py-0.5 font-semibold text-teal">{m.topic}</span></div></div><div className="font-display text-[10px] text-charcoal-soft">{new Date(m.createdAt).toLocaleString("en-IN")}</div></div><p className="mt-2 font-display text-xs text-charcoal-soft">{m.message}</p><a href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`} className="mt-3 inline-block rounded-full bg-teal px-3 py-1 font-display text-[10px] font-semibold text-ivory">Reply</a></div>))}</div>:<div className="rounded-2xl border border-charcoal/10 bg-white p-5"><div className="scrollbar-thin max-h-[60vh] space-y-1 overflow-y-auto">{subscribers.length===0?<p className="py-8 text-center font-display text-sm text-charcoal-soft">No subscribers yet.</p>:subscribers.map((s)=>(<div key={s.id} className="flex items-center justify-between border-b border-charcoal/5 py-2 last:border-0"><div><div className="font-serif text-sm font-semibold text-charcoal">{s.email}</div><div className="font-display text-[10px] text-charcoal-soft">{s.name||"—"} · {s.language}</div></div><div className="font-display text-[10px] text-charcoal-soft">{new Date(s.createdAt).toLocaleDateString("en-IN")}</div></div>))}</div></div>}</div>);
}

// =================== AUDIT ===================
function AuditTab({ logs }: { logs: any[] }) {
  return (<div className="rounded-2xl border border-charcoal/10 bg-white p-5"><div className="mb-4 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-teal" /><h3 className="font-serif text-base font-semibold text-charcoal">{logs.length} actions</h3></div><div className="scrollbar-thin max-h-[65vh] space-y-1 overflow-y-auto font-mono text-[11px]">{logs.map((l)=>(<div key={l.id} className="flex items-start gap-3 border-b border-charcoal/5 py-2 last:border-0"><span className="shrink-0 text-charcoal-soft">{new Date(l.createdAt).toLocaleString("en-IN",{dateStyle:"short",timeStyle:"short"})}</span><span className="shrink-0 rounded bg-gold/15 px-1.5 py-0.5 font-semibold text-gold-deep">{l.action}</span><span className="flex-1 text-charcoal">{l.details}{l.admin&&<span className="text-charcoal-soft"> · by {l.admin.name}</span>}</span></div>))}</div></div>);
}

// =================== SHARED ===================
function KpiCard({ icon: Icon, label, value, sub, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub?: string; accent: "teal"|"gold"|"marsala" }) {
  const c = accent==="gold"?"bg-gold/10 text-gold-deep":accent==="marsala"?"bg-marsala/10 text-marsala":"bg-teal/10 text-teal";
  return (<div className="rounded-2xl border border-charcoal/10 bg-white p-4"><div className="mb-2"><span className={`grid h-9 w-9 place-items-center rounded-full ${c}`}><Icon className="h-4 w-4" /></span></div><div className="font-serif text-2xl font-bold text-charcoal">{value}</div><div className="font-display text-[10px] uppercase tracking-wider text-charcoal-soft">{label}</div>{sub&&<div className="mt-1 font-display text-[10px] text-charcoal-soft">{sub}</div>}</div>);
}
function ActionBtn({ label, icon: Icon, onClick, color = "teal" }: { label: string; icon: React.ComponentType<{ className?: string }>; onClick: () => void; color?: "teal"|"marsala" }) {
  const c = color==="marsala"?"border-marsala/30 text-marsala hover:bg-marsala hover:text-ivory":"border-teal/30 text-teal hover:bg-teal hover:text-ivory";
  return <button onClick={onClick} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${c}`}><Icon className="h-3 w-3" /><span className="hidden sm:inline">{label}</span></button>;
}
function Field({ label, value, onChange, type="text", textarea }: { label: string; value: any; onChange: (v: string)=>void; type?: string; textarea?: boolean }) {
  return (<div><Label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">{label}</Label>{textarea?<textarea value={value} onChange={(e)=>onChange(e.target.value)} rows={3} className="w-full rounded-md border border-charcoal/15 bg-ivory-deep/30 px-3 py-2 font-display text-xs text-charcoal" />:<Input type={type} value={value} onChange={(e)=>onChange(e.target.value)} className="bg-ivory-deep/30" />}</div>);
}
function EditorModal({ title, onClose, children }: { title: string; onClose: ()=>void; children: React.ReactNode }) {
  return (<div className="fixed inset-0 z-[90] grid place-items-center bg-charcoal/70 p-4" onClick={onClose}><div className="w-full max-w-2xl rounded-3xl bg-ivory p-6" onClick={(e)=>e.stopPropagation()}><div className="mb-4 flex items-center justify-between"><h3 className="font-serif text-lg font-semibold text-charcoal">{title}</h3><button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full border border-charcoal/15 text-charcoal-soft"><X className="h-4 w-4" /></button></div>{children}</div></div>);
}
