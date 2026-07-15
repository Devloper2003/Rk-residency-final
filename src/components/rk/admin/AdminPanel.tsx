"use client";

import { useEffect, useState, useCallback, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, CalendarDays, BedDouble, Star, Mail,
  ScrollText, LogOut, Lock, Loader2, Menu, X,
  Tag, FileText, ShieldCheck, Edit, Trash2, Plus, Sparkles,
  BarChart3, Users,
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
  getAdmin, setAdminSession, clearAdminSession,
} from "@/lib/admin-client";
import { toast } from "sonner";

type AdminUser = { id: string; email: string; name: string; role: string };
type Tab =
  | "dashboard" | "analytics" | "bookings" | "rooms" | "offers"
  | "blog" | "reviews" | "content" | "theme"
  | "settings" | "users" | "leads" | "audit";

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

// Lazy-load ALL tab components so Turbopack compiles them on-demand
const DashboardTab = lazy(() => import("./tabs/DashboardTab").then(m => ({ default: m.DashboardTab })));
const AnalyticsTab = lazy(() => import("./tabs/AnalyticsTab").then(m => ({ default: m.AnalyticsTab })));
const BookingsTab = lazy(() => import("./tabs/BookingsTab").then(m => ({ default: m.BookingsTab })));
const RoomsTab = lazy(() => import("./tabs/RoomsTab").then(m => ({ default: m.RoomsTab })));
const OffersTab = lazy(() => import("./tabs/OffersTab").then(m => ({ default: m.OffersTab })));
const BlogTab = lazy(() => import("./tabs/BlogTab").then(m => ({ default: m.BlogTab })));
const ReviewsTab = lazy(() => import("./tabs/ReviewsTab").then(m => ({ default: m.ReviewsTab })));
const ContentTab = lazy(() => import("./tabs/ContentTab").then(m => ({ default: m.ContentTab })));
const ThemeTab = lazy(() => import("./tabs/ThemeTab").then(m => ({ default: m.ThemeTab })));
const SettingsTab = lazy(() => import("./tabs/SettingsTab").then(m => ({ default: m.SettingsTab })));
const UsersTab = lazy(() => import("./tabs/UsersTab").then(m => ({ default: m.UsersTab })));
const LeadsTab = lazy(() => import("./tabs/LeadsTab").then(m => ({ default: m.LeadsTab })));
const AuditTab = lazy(() => import("./tabs/AuditTab").then(m => ({ default: m.AuditTab })));

function TabFallback() {
  return (
    <div className="flex h-40 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-teal" />
    </div>
  );
}

export function AdminPanel() {
  const navigate = useRouter((s) => s.navigate);
  const [stored, setStored] = useState<AdminUser | null>(() => getAdmin());
  const authed = stored !== null;
  const [tab, setTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <aside
        className={`fixed inset-y-0 left-0 z-20 w-64 transform bg-charcoal text-ivory transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-ivory/10 p-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-full border border-gold/40 bg-ivory/5 text-gold">
                <Logo size={20} />
              </span>
              <div>
                <div className="font-serif text-sm font-semibold text-ivory">RK Residency</div>
                <div className="font-display text-[9px] uppercase tracking-[0.24em] text-gold-soft">Admin Console</div>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="grid h-8 w-8 place-items-center rounded-full border border-ivory/15 text-ivory/70 lg:hidden" aria-label="Close sidebar">
              <X className="h-4 w-4" />
            </button>
          </div>
          <nav className="scrollbar-thin flex-1 space-y-1 overflow-y-auto p-3">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setSidebarOpen(false); }}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-display text-sm transition-all ${
                  tab === t.id ? "bg-gold/15 text-gold-soft" : "text-ivory/70 hover:bg-ivory/5 hover:text-ivory"
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </nav>
          <div className="border-t border-ivory/10 p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gold/20 font-serif text-sm font-bold text-gold-soft">
                {stored?.name?.charAt(0) || "A"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-serif text-sm font-semibold text-ivory">{stored?.name}</div>
                <div className="truncate font-display text-[10px] text-ivory/60">
                  {stored?.role === "SUPER_ADMIN" ? "Super Admin" : stored?.role}
                </div>
              </div>
            </div>
            <button onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-xl border border-ivory/15 px-3 py-2 font-display text-xs font-semibold text-ivory/80 hover:border-marsala hover:bg-marsala hover:text-ivory">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-10 bg-charcoal/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <main className="scrollbar-thin flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-charcoal/10 bg-ivory/90 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="grid h-9 w-9 place-items-center rounded-full border border-charcoal/15 text-charcoal-soft lg:hidden" aria-label="Open sidebar">
              <Menu className="h-4 w-4" />
            </button>
            <div>
              <h1 className="font-serif text-lg font-semibold text-charcoal">{TABS.find((t) => t.id === tab)?.label}</h1>
              <p className="font-display text-[10px] uppercase tracking-wider text-charcoal-soft">RK Residency · Admin Console</p>
            </div>
          </div>
          <button onClick={() => navigate("home")} className="rounded-full border border-charcoal/15 bg-white px-3 py-1.5 font-display text-xs font-semibold text-charcoal-soft hover:bg-ivory-deep">View site</button>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          <Suspense fallback={<TabFallback />}>
            {tab === "dashboard" && <DashboardTab />}
            {tab === "analytics" && <AnalyticsTab />}
            {tab === "bookings" && <BookingsTab />}
            {tab === "rooms" && <RoomsTab />}
            {tab === "offers" && <OffersTab />}
            {tab === "blog" && <BlogTab />}
            {tab === "reviews" && <ReviewsTab />}
            {tab === "content" && <ContentTab />}
            {tab === "theme" && <ThemeTab />}
            {tab === "settings" && <SettingsTab />}
            {tab === "users" && <UsersTab />}
            {tab === "leads" && <LeadsTab />}
            {tab === "audit" && <AuditTab />}
          </Suspense>
        </div>
      </main>
    </div>
  );
}

// =================== LOGIN (kept inline — it's small) ===================

function AdminLogin({ onLogin, onBack }: { onLogin: (a: AdminUser, token: string) => void; onBack: () => void }) {
  const [email, setEmail] = useState("admin@rkresidency.in");
  const [password, setPassword] = useState("rk-admin-2026");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    // Retry loop — server may be compiling on first attempt
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch("/api/admin/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Login failed");
        onLogin(data.admin, data.token);
        toast.success(`Welcome, ${data.admin.name}`);
        setLoading(false);
        return;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Login failed";
        // If network error (server compiling), retry after delay
        if (msg.includes("fetch") && attempt < 2) {
          setError(`Server is starting up... retrying (${attempt + 2}/3)`);
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }
        setError(msg);
        toast.error("Login failed", { description: msg });
        setLoading(false);
        return;
      }
    }
    setLoading(false);
  };

  return (
    <div className="grid min-h-screen place-items-center bg-charcoal p-4">
      <div className="pointer-events-none absolute inset-0 bg-yamuna-ripple opacity-15" />
      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-md overflow-hidden rounded-3xl bg-ivory shadow-2xl">
        <div className="border-b border-charcoal/10 bg-teal px-6 py-5 text-ivory">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full border border-gold/40 bg-ivory/5 text-gold"><Logo size={24} /></span>
            <div>
              <div className="font-serif text-lg font-semibold">RK Residency Admin</div>
              <div className="font-display text-[10px] uppercase tracking-[0.28em] text-gold-soft">Restricted access</div>
            </div>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4 p-6">
          <div>
            <Label htmlFor="a-email" className="mb-1.5 block font-display text-xs uppercase tracking-wider text-charcoal-soft">Email</Label>
            <Input id="a-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-ivory-deep/40" />
          </div>
          <div>
            <Label htmlFor="a-pass" className="mb-1.5 block font-display text-xs uppercase tracking-wider text-charcoal-soft">Password</Label>
            <div className="relative">
              <Input id="a-pass" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="bg-ivory-deep/40 pr-10" />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-soft hover:text-charcoal" aria-label={show ? "Hide password" : "Show password"}>
                {show ? "🙈" : "👁️"}
              </button>
            </div>
          </div>
          {error && <div className="rounded-xl border border-marsala/30 bg-marsala/5 px-3 py-2 font-display text-xs text-marsala">{error}</div>}
          <Button type="submit" disabled={loading} className="w-full rounded-full bg-teal py-3 font-serif text-base font-semibold text-ivory hover:bg-teal-deep disabled:opacity-50">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…</> : <><Lock className="mr-2 h-4 w-4" /> Sign in</>}
          </Button>
          <div className="rounded-xl border border-gold/30 bg-gold/5 px-3 py-2 font-display text-[11px] leading-relaxed text-charcoal-soft">
            <strong className="text-gold-deep">Demo credentials</strong> — admin@rkresidency.in / rk-admin-2026
          </div>
          <button type="button" onClick={onBack} className="block w-full text-center font-display text-xs text-charcoal-soft hover:text-charcoal">← Back to website</button>
        </form>
      </motion.div>
    </div>
  );
}
