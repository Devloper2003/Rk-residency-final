"use client";

import { useEffect, useState, useCallback, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, CalendarDays, BedDouble, Star, Mail,
  ScrollText, LogOut, Lock, Loader2, Menu, X,
  Tag, FileText, ShieldCheck, Edit, Sparkles,
  BarChart3, Users, Search, ExternalLink, Image as ImageIcon,
  Eye, EyeOff, MapPin, Utensils, Camera, CreditCard,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
  | "experiences" | "dining" | "gallery" | "payment" | "hero"
  | "settings" | "users" | "leads" | "audit" | "media";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }>; group: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Overview" },
  { id: "analytics", label: "Analytics & SEO", icon: BarChart3, group: "Overview" },
  { id: "bookings", label: "Bookings", icon: CalendarDays, group: "Operations" },
  { id: "rooms", label: "Rooms & Rates", icon: BedDouble, group: "Operations" },
  { id: "offers", label: "Offers", icon: Tag, group: "Operations" },
  { id: "experiences", label: "Experiences", icon: MapPin, group: "Operations" },
  { id: "dining", label: "Dining", icon: Utensils, group: "Operations" },
  { id: "gallery", label: "Gallery", icon: Camera, group: "Operations" },
  { id: "reviews", label: "Reviews", icon: Star, group: "Operations" },
  { id: "hero", label: "Hero Section", icon: Sparkles, group: "Content" },
  { id: "content", label: "Page Editor", icon: Edit, group: "Content" },
  { id: "blog", label: "Blog", icon: FileText, group: "Content" },
  { id: "media", label: "Media Library", icon: ImageIcon, group: "Content" },
  { id: "theme", label: "Theme & Colors", icon: Sparkles, group: "Settings" },
  { id: "payment", label: "Payment Settings", icon: CreditCard, group: "Settings" },
  { id: "settings", label: "Site Settings", icon: ShieldCheck, group: "Settings" },
  { id: "users", label: "User Management", icon: Users, group: "Settings" },
  { id: "leads", label: "Leads & Messages", icon: Mail, group: "Settings" },
  { id: "audit", label: "Audit Log", icon: ScrollText, group: "Settings" },
];

const TAB_GROUPS = ["Overview", "Operations", "Content", "Settings"];

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
const MediaTab = lazy(() => import("./tabs/MediaTab").then(m => ({ default: m.MediaTab })));
const ExperiencesTab = lazy(() => import("./tabs/ExperiencesTab").then(m => ({ default: m.ExperiencesTab })));
const DiningTab = lazy(() => import("./tabs/DiningTab").then(m => ({ default: m.DiningTab })));
const GalleryTab = lazy(() => import("./tabs/GalleryTab").then(m => ({ default: m.GalleryTab })));
const PaymentTab = lazy(() => import("./tabs/PaymentTab").then(m => ({ default: m.PaymentTab })));
const HeroTab = lazy(() => import("./tabs/HeroTab").then(m => ({ default: m.HeroTab })));

function TabFallback() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-charcoal/10" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-charcoal/5" />)}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-charcoal/5" />
    </div>
  );
}

export function AdminPanel() {
  const navigate = useRouter((s) => s.navigate);
  // Hyration-safe initialization: render null on the server, then on mount
  // read localStorage. This prevents the SSR/client markup mismatch that
  // happens because localStorage only exists in the browser.
  const [stored, setStored] = useState<AdminUser | null>(null);
  const [mounted, setMounted] = useState(false);
  const authed = stored !== null;
  const [tab, setTab] = useState<Tab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setStored(getAdmin());
    setMounted(true);
    // Listen for session-clear events (when a 401 is received, the session
    // is cleared and this event fires — we need to show the login form).
    const onSessionCleared = () => {
      setStored(null);
      toast.error("Session expired. Please sign in again.");
    };
    window.addEventListener("rk-admin-session-cleared", onSessionCleared);
    return () => window.removeEventListener("rk-admin-session-cleared", onSessionCleared);
  }, []);

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

  // ⌘K to open tab palette
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      } else if (e.key === "Escape") {
        setPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // SSR + first paint: render a neutral loading state so server markup
  // matches the first client render. After mount, useEffect resolves the
  // real auth state from localStorage.
  if (!mounted) {
    return (
      <div className="grid min-h-screen place-items-center bg-ivory">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-teal" />
          <p className="font-display text-xs uppercase tracking-wider text-charcoal-soft">Loading admin console…</p>
        </div>
      </div>
    );
  }

  if (!authed) {
    return <AdminLogin onLogin={handleLogin} onBack={() => navigate("home")} />;
  }

  const currentTab = TABS.find((t) => t.id === tab);

  // Filter tabs for the ⌘K palette
  const filteredTabs = search
    ? TABS.filter((t) => t.label.toLowerCase().includes(search.toLowerCase()))
    : TABS;

  return (
    <div className="flex min-h-screen bg-ivory">
      {/* ============ SIDEBAR ============ */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-charcoal text-ivory shadow-2xl transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Brand */}
          <div className="flex items-center justify-between border-b border-ivory/10 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl border border-gold/40 bg-ivory/5 text-gold">
                <Logo size={22} />
              </span>
              <div>
                <div className="font-serif text-base font-semibold leading-tight text-ivory">RK Residency</div>
                <div className="font-display text-[9px] uppercase tracking-[0.24em] text-gold-soft">Admin Console</div>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg border border-ivory/15 text-ivory/70 hover:bg-ivory/5 lg:hidden" aria-label="Close sidebar">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick search trigger */}
          <div className="px-3 pt-3">
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex w-full items-center gap-2 rounded-lg border border-ivory/10 bg-ivory/5 px-3 py-2 text-left font-display text-[11px] text-ivory/50 hover:bg-ivory/10"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Quick jump…</span>
              <kbd className="ml-auto rounded bg-ivory/10 px-1.5 py-0.5 font-mono text-[9px] text-ivory/60">⌘K</kbd>
            </button>
          </div>

          {/* Nav grouped */}
          <nav className="scrollbar-thin flex-1 space-y-4 overflow-y-auto p-3">
            {TAB_GROUPS.map((group) => (
              <div key={group}>
                <div className="px-3 pb-1 font-display text-[9px] uppercase tracking-[0.2em] text-ivory/40">{group}</div>
                <div className="space-y-0.5">
                  {TABS.filter((t) => t.group === group).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { setTab(t.id); setSidebarOpen(false); }}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left font-display text-[13px] transition-all ${
                        tab === t.id
                          ? "bg-gold/15 font-semibold text-gold-soft"
                          : "text-ivory/70 hover:bg-ivory/5 hover:text-ivory"
                      }`}
                    >
                      <t.icon className={`h-4 w-4 ${tab === t.id ? "text-gold-soft" : ""}`} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* User card */}
          <div className="border-t border-ivory/10 p-3">
            <div className="mb-2 flex items-center gap-3 rounded-xl bg-ivory/5 p-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gold/20 font-serif text-sm font-bold text-gold-soft">
                {stored?.name?.charAt(0) || "A"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-serif text-sm font-semibold text-ivory">{stored?.name}</div>
                <div className="truncate font-display text-[10px] text-ivory/60">{stored?.email}</div>
              </div>
              <span className="rounded-full bg-teal/20 px-1.5 py-0.5 font-display text-[9px] font-semibold text-teal-soft">
                {stored?.role === "SUPER_ADMIN" ? "SUPER" : stored?.role}
              </span>
            </div>
            <button onClick={handleLogout} className="flex w-full items-center justify-center gap-2 rounded-xl border border-ivory/15 px-3 py-2 font-display text-xs font-semibold text-ivory/80 transition-colors hover:border-marsala hover:bg-marsala hover:text-ivory">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-20 bg-charcoal/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ============ MAIN ============ */}
      <main className="scrollbar-thin flex-1 overflow-y-auto">
        {/* Topbar */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-charcoal/10 bg-ivory/90 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg border border-charcoal/15 text-charcoal-soft hover:bg-charcoal/5 lg:hidden" aria-label="Open sidebar">
              <Menu className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 font-display text-[10px] uppercase tracking-wider text-charcoal-soft">
                <span>{currentTab?.group}</span>
                <span className="text-charcoal-soft/40">/</span>
                <span className="text-teal">{currentTab?.label}</span>
              </div>
              <h1 className="font-serif text-xl font-semibold text-charcoal">{currentTab?.label}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setPaletteOpen(true)} variant="ghost" size="sm" className="hidden rounded-lg font-display text-xs text-charcoal-soft hover:bg-charcoal/5 sm:flex">
              <Search className="mr-1.5 h-3.5 w-3.5" /> Jump to… <kbd className="ml-1 rounded bg-charcoal/10 px-1 font-mono text-[9px]">⌘K</kbd>
            </Button>
            <Button onClick={() => navigate("home")} variant="outline" size="sm" className="rounded-lg border-charcoal/15 text-charcoal-soft hover:border-teal/40 hover:text-teal">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> <span className="hidden sm:inline">View site</span>
            </Button>
          </div>
        </header>

        {/* Tab content */}
        <div className="p-4 sm:p-6 lg:p-8">
          <Suspense fallback={<TabFallback />}>
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
              >
                {tab === "dashboard" && <DashboardTab />}
                {tab === "analytics" && <AnalyticsTab />}
                {tab === "bookings" && <BookingsTab />}
                {tab === "rooms" && <RoomsTab />}
                {tab === "offers" && <OffersTab />}
                {tab === "experiences" && <ExperiencesTab />}
                {tab === "dining" && <DiningTab />}
                {tab === "gallery" && <GalleryTab />}
                {tab === "blog" && <BlogTab />}
                {tab === "reviews" && <ReviewsTab />}
                {tab === "hero" && <HeroTab />}
                {tab === "content" && <ContentTab />}
                {tab === "media" && <MediaTab />}
                {tab === "theme" && <ThemeTab />}
                {tab === "payment" && <PaymentTab />}
                {tab === "settings" && <SettingsTab />}
                {tab === "users" && <UsersTab />}
                {tab === "leads" && <LeadsTab />}
                {tab === "audit" && <AuditTab />}
              </motion.div>
            </AnimatePresence>
          </Suspense>
        </div>
      </main>

      {/* ============ ⌘K PALETTE ============ */}
      {paletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-charcoal/60 p-4 pt-24 backdrop-blur-sm" onClick={() => setPaletteOpen(false)}>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-ivory shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-charcoal/10 px-4 py-3">
              <Search className="h-4 w-4 text-charcoal-soft" />
              <input
                autoFocus
                type="text"
                placeholder="Search admin sections…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent font-display text-sm text-charcoal outline-none placeholder:text-charcoal-soft/50"
              />
              <kbd className="rounded bg-charcoal/10 px-1.5 py-0.5 font-mono text-[9px] text-charcoal-soft">ESC</kbd>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {filteredTabs.length === 0 ? (
                <p className="px-3 py-6 text-center font-display text-xs text-charcoal-soft">No matching sections.</p>
              ) : (
                filteredTabs.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setTab(t.id); setPaletteOpen(false); setSearch(""); }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left font-display text-sm hover:bg-ivory-deep ${tab === t.id ? "bg-teal/10 text-teal" : "text-charcoal"}`}
                  >
                    <t.icon className="h-4 w-4" />
                    <span className="flex-1">{t.label}</span>
                    <span className="font-display text-[10px] uppercase tracking-wider text-charcoal-soft">{t.group}</span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// =================== LOGIN ===================

function AdminLogin({ onLogin, onBack }: { onLogin: (a: AdminUser, token: string) => void; onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="relative grid min-h-screen place-items-center bg-charcoal p-4">
      <div className="pointer-events-none absolute inset-0 bg-yamuna-ripple opacity-15" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-ivory shadow-2xl"
      >
        <div className="border-b border-charcoal/10 bg-teal px-6 py-5 text-ivory">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full border border-gold/40 bg-ivory/5 text-gold">
              <Logo size={24} />
            </span>
            <div>
              <div className="font-serif text-lg font-semibold">RK Residency Admin</div>
              <div className="font-display text-[10px] uppercase tracking-[0.28em] text-gold-soft">Restricted access</div>
            </div>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4 p-6">
          <div>
            <Label htmlFor="a-email" className="mb-1.5 block font-display text-xs uppercase tracking-wider text-charcoal-soft">Email</Label>
            <Input
              id="a-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@rkresidency.in"
              required
              autoComplete="username"
              className="bg-ivory-deep/40 focus-visible:ring-teal/30"
            />
          </div>
          <div>
            <Label htmlFor="a-pass" className="mb-1.5 block font-display text-xs uppercase tracking-wider text-charcoal-soft">Password</Label>
            <div className="relative">
              <Input
                id="a-pass"
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="bg-ivory-deep/40 pr-10 focus-visible:ring-teal/30"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-soft hover:text-charcoal"
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {error && (
            <div className="rounded-xl border border-marsala/30 bg-marsala/5 px-3 py-2 font-display text-xs text-marsala">{error}</div>
          )}
          <Button type="submit" disabled={loading} className="w-full rounded-full bg-teal py-3 font-serif text-base font-semibold text-ivory hover:bg-teal-deep disabled:opacity-50">
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in…</> : <><Lock className="mr-2 h-4 w-4" /> Sign in</>}
          </Button>
          <button type="button" onClick={onBack} className="block w-full text-center font-display text-xs text-charcoal-soft hover:text-charcoal">← Back to website</button>
        </form>
      </motion.div>
    </div>
  );
}

// (icons imported at top of file)
