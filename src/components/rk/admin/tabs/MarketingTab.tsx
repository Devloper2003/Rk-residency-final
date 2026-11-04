"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Megaphone, Loader2, Facebook, Instagram, Copy, CheckCircle2,
  LogOut, MessageCircle, Target, Search, Save, Send,
  ExternalLink, KeyRound, Info, BarChart3, Mail, Image as ImageIcon,
  Sparkles, AlertTriangle, Eye, Users, Ticket, Star, Inbox, LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminFetch, LoadingSpinner, ErrorState } from "./_shared";
import { toast } from "sonner";

type MetaStatus = {
  configured: boolean;
  connected: boolean;
  user: { name: string };
  page: { id: string; name: string };
  instagram: { id: string; username: string };
  tokenExpires: string;
  appMasked: string;
};

type MetaAuth = {
  configured: boolean;
  authUrl?: string;
  redirectUri: string;
  scopes: string;
};

type Setting = { id: string; key: string; value: string; label?: string; configured?: boolean };

type MarketingStats = {
  last30: { bookings: number; revenue: number; avgLeadDays: number };
  audience: { newsletterSubscribers: number; reviewsApproved: number };
  coupons: { total: number; active: number; redeemed: number };
  leads: { total: number; last30: number };
};

type MediaFile = { name: string; url: string; size: number; mtime: number };

const WA_TEMPLATES = [
  { name: "Early bird", text: "🙏 Namaste! RK Residency, Vrindavan mein aapka swagat hai. Is hafte special rates chal rahe hain — jaldi book karein aur best price payein: https://www.rkresidencyvrindavan.in/rooms" },
  { name: "Festival season", text: "🦚 Braj ke utsav mein RK Residency ke saath rukna mat bhuliyega! Rooms jaldi full ho rahe hain — abhi book karein: https://www.rkresidencyvrindavan.in/rooms" },
  { name: "Weekend getaway", text: "Vrindavan weekend plan? RK Residency mein comfortable rooms, Mandir se sirf kuch minute. Booking: https://www.rkresidencyvrindavan.in/rooms" },
  { name: "Repeat guest offer", text: "🙏 Dhanyavaad ki aapne RK Residency chuna! Apni agli visit ke liye special returning-guest rate available hai — reply karein aur hum room block kar denge." },
];

const SOCIAL_TEMPLATES = [
  { name: "Offer post", text: "✨ SPECIAL OFFER — RK Residency, Vrindavan\n\nIs month direct booking par best rates! Comfortable rooms, mandiron ke paas, sattvik breakfast ke saath.\n\n📞 Book: +91 9760814931\n🌐 https://www.rkresidencyvrindavan.in/rooms\n\n#Vrindavan #RKResidency #HotelDeals #BrajBhoomi" },
  { name: "Festival post", text: "🦚 Shri Vrindavan Dham mein utsav ka mahaul hai!\n\nIs festival season mein apke liye special stay packages. Radha Rani ke nagar mein apna aarambh karein RK Residency ke saath.\n\n🌐 Book now: https://www.rkresidencyvrindavan.in/rooms\n\n#Vrindavan #Janmashtami #Braj #HotelVrindavan" },
  { name: "Room showcase", text: "🛏️ Apna perfect room chuniye!\n\nHeritage rooms, modern comfort — AC, hot water, room service aur mandiron se sirf kuch minute. Family rooms bhi available.\n\n📷 Photos aur booking: https://www.rkresidencyvrindavan.in/rooms\n\n#HotelRooms #VrindavanStay #RKResidency" },
  { name: "Review highlight", text: "⭐ Aapke pyaar ne kaha — 4.6★ Google rating!\n\n\"Clean rooms, helpful staff, mandir ke bahut paas\" — RK Residency guests ki favourite choice.\n\nApna agla Vrindavan trip humare saath: https://www.rkresidencyvrindavan.in\n\n#GuestLove #VrindavanHotel #RKResidency" },
];

const EMAIL_TEMPLATES = [
  {
    name: "Special offer blast",
    subject: "Special Offer — RK Residency Vrindavan mein apna stay book karein",
    message: "🙏 Namaste!\n\nIs month RK Residency mein direct booking par special rates available hain — comfortable rooms, mandiron ke paas, aur sattvik breakfast ke saath.\n\nRooms limited hain, jaldi book karein aur best price payein.\n\nDhanyavaad,\nTeam RK Residency",
    ctaLabel: "Abhi Book Karein",
    ctaUrl: "https://www.rkresidencyvrindavan.in/rooms",
  },
  {
    name: "Festival season invite",
    subject: "Braj ke utsav — RK Residency mein swagat hai",
    message: "🦚 Vrindavan ke festival season mein aapka swagat hai!\n\nMandiron ke darshan, Yamuna aarti aur Braj ka apna mahaul — sab kuch paas mein. Festival dates mein rooms jaldi full ho jate hain.\n\nAaj hi apna room reserve karein.\n\nRadhe Radhe,\nTeam RK Residency",
    ctaLabel: "Rooms Dekhein",
    ctaUrl: "https://www.rkresidencyvrindavan.in/rooms",
  },
  {
    name: "Returning guest thank-you",
    subject: "Dhanyavaad! Aapke liye special returning-guest rate",
    message: "🙏 Aapne pehle RK Residency chuna — iske liye dhanyavaad!\n\nApni agli visit ke liye apke liye special rate ka intezaam hai. Reply karein ya seedha call karein — hum room block kar denge.\n\nHum phir se aapki seva karne ka mauka dein.\n\nTeam RK Residency",
    ctaLabel: "Website Dekhein",
    ctaUrl: "https://www.rkresidencyvrindavan.in",
  },
];

const SHORTCUTS = [
  { tab: "bookings", label: "Bookings", desc: "Check-ins, revenue, vouchers", icon: Inbox },
  { tab: "coupons", label: "Coupons", desc: "Loyalty discount codes", icon: Ticket },
  { tab: "offers", label: "Offers", desc: "Website offer sections", icon: Sparkles },
  { tab: "blog", label: "Blog", desc: "SEO articles + drafts", icon: Star },
  { tab: "calendar", label: "Content Calendar", desc: "Publishing planner", icon: LayoutGrid },
  { tab: "analytics", label: "Analytics & SEO", desc: "Traffic + search console", icon: BarChart3 },
  { tab: "leads", label: "Leads & Messages", desc: "Contact enquiries", icon: Mail },
  { tab: "reviews", label: "Reviews", desc: "Guest testimonials", icon: Star },
];

function inr(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function Section({ icon: Icon, title, children, tone = "charcoal", right }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode; tone?: "charcoal" | "teal" | "gold"; right?: React.ReactNode }) {
  const border = tone === "teal" ? "border-teal/20" : tone === "gold" ? "border-gold/30" : "border-charcoal/10";
  return (
    <div className={`rounded-2xl border ${border} bg-white p-5`}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal/10 text-teal"><Icon className="h-4 w-4" /></span>
          <h3 className="font-serif text-base font-semibold text-charcoal">{title}</h3>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function inputCls() {
  return "w-full rounded-lg border border-charcoal/15 bg-ivory-deep/30 px-3 py-2 font-display text-sm text-charcoal placeholder:text-charcoal-soft/50 focus:border-teal focus:outline-none";
}

function labelCls() {
  return "mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft";
}

/**
 * Marketing Hub — the complete marketing workcenter:
 *   1. Performance snapshot (real DB numbers)
 *   2. Social Login — Facebook + Instagram (Meta OAuth) + direct posting
 *   3. Email campaigns to newsletter subscribers (Resend, test + bulk)
 *   4. WhatsApp promo link builder
 *   5. UTM campaign link builder
 *   6. SEO & tracking snapshot + shortcuts to every marketing tab
 */
export function MarketingTab() {
  const [booting, setBooting] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // — Meta state —
  const [meta, setMeta] = useState<MetaStatus | null>(null);
  const [metaAuth, setMetaAuth] = useState<MetaAuth | null>(null);
  const [appIdInput, setAppIdInput] = useState("");
  const [appSecretInput, setAppSecretInput] = useState("");
  const [savingCreds, setSavingCreds] = useState(false);
  const [startingLogin, setStartingLogin] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [fbMessage, setFbMessage] = useState("");
  const [fbLink, setFbLink] = useState("");
  const [igImageUrl, setIgImageUrl] = useState("");
  const [igCaption, setIgCaption] = useState("");
  const [publishing, setPublishing] = useState<"fb" | "ig" | null>(null);

  // — Media picker (IG) —
  const [mediaOpen, setMediaOpen] = useState(false);
  const [media, setMedia] = useState<MediaFile[] | null>(null);
  const [mediaLoading, setMediaLoading] = useState(false);

  // — Performance stats —
  const [stats, setStats] = useState<MarketingStats | null>(null);

  // — Email campaign —
  const [campaign, setCampaign] = useState({ subject: EMAIL_TEMPLATES[0].subject, message: EMAIL_TEMPLATES[0].message, ctaLabel: EMAIL_TEMPLATES[0].ctaLabel, ctaUrl: EMAIL_TEMPLATES[0].ctaUrl });
  const [campaignBusy, setCampaignBusy] = useState<"test" | "send" | null>(null);
  const [confirmSend, setConfirmSend] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // — WhatsApp builder —
  const [waNumber, setWaNumber] = useState("");
  const [waTemplate, setWaTemplate] = useState(WA_TEMPLATES[0].text);
  const [copied, setCopied] = useState<string | null>(null);

  // — UTM builder —
  const [utmUrl, setUtmUrl] = useState("https://www.rkresidencyvrindavan.in/rooms");
  const [utmSource, setUtmSource] = useState("instagram");
  const [utmMedium, setUtmMedium] = useState("social");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmContent, setUtmContent] = useState("");

  // — SEO snapshot —
  const [settings, setSettings] = useState<Setting[]>([]);

  const loadAll = useCallback(async () => {
    setLoadError(null);
    try {
      const [status, auth, settingsData, statsData] = await Promise.all([
        adminFetch("/api/admin/marketing/meta"),
        adminFetch("/api/admin/marketing/meta/auth"),
        adminFetch("/api/admin/settings"),
        adminFetch("/api/admin/marketing/stats"),
      ]);
      if (status?.error) throw new Error(status.error);
      setMeta(status);
      setMetaAuth(auth);
      setSettings(settingsData?.settings || []);
      if (!statsData?.error) setStats(statsData);
      const wa = (settingsData?.settings || []).find((s: Setting) => s.key === "whatsapp_number");
      if (wa?.value) setWaNumber(wa.value.replace(/[^0-9]/g, ""));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Marketing data load failed");
    } finally {
      setBooting(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // OAuth callback result: /admin?tab=marketing&meta=connected|error:…
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const metaParam = params.get("meta");
    if (!metaParam) return;
    if (metaParam === "connected" || metaParam === "connected_no_ig") {
      toast.success(metaParam === "connected" ? "Facebook + Instagram connected 🎉" : "Facebook page connected — IG professional account is page se linked nahi mila");
    } else if (metaParam.startsWith("error:")) {
      toast.error("Meta login failed", { description: metaParam.slice(6).slice(0, 200) });
    }
    params.delete("meta");
    const qs = params.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
    loadAll();
  }, [loadAll]);

  const copyText = (text: string, tag: string) => {
    navigator.clipboard.writeText(text);
    setCopied(tag);
    toast.success("Copied");
    setTimeout(() => setCopied(null), 1500);
  };

  const jumpToTab = (tab: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url.toString());
    window.dispatchEvent(new CustomEvent("rk-admin-tab"));
  };

  const saveCredentials = async () => {
    if (!appIdInput.trim() || !appSecretInput.trim()) {
      toast.error("App ID aur App Secret dono required hain");
      return;
    }
    setSavingCreds(true);
    try {
      const res = await adminFetch("/api/admin/marketing/meta", {
        method: "POST",
        body: JSON.stringify({ action: "save_credentials", appId: appIdInput, appSecret: appSecretInput }),
      });
      if (res?.error) throw new Error(res.error);
      toast.success("Meta credentials saved — ab login button use kar sakte hain");
      setAppIdInput(""); setAppSecretInput("");
      loadAll();
    } catch (e) {
      toast.error("Save failed", { description: e instanceof Error ? e.message : "" });
    } finally {
      setSavingCreds(false);
    }
  };

  const startLogin = async () => {
    setStartingLogin(true);
    try {
      const auth = await adminFetch("/api/admin/marketing/meta/auth");
      if (auth?.error) throw new Error(auth.error);
      if (!auth?.configured || !auth?.authUrl) throw new Error("Meta App configured nahi hai — pehle App ID/Secret save karein");
      window.location.href = auth.authUrl; // full redirect — Meta requirement
    } catch (e) {
      toast.error("Login start nahi hua", { description: e instanceof Error ? e.message : "" });
      setStartingLogin(false);
    }
  };

  const disconnect = async () => {
    setDisconnecting(true);
    try {
      await adminFetch("/api/admin/marketing/meta", { method: "DELETE" });
      toast.success("Facebook + Instagram disconnected");
      loadAll();
    } finally {
      setDisconnecting(false);
    }
  };

  const publish = async (channel: "fb" | "ig") => {
    setPublishing(channel);
    try {
      const body = channel === "fb"
        ? { action: "publish_facebook", message: fbMessage, link: fbLink || undefined }
        : { action: "publish_instagram", imageUrl: igImageUrl, caption: igCaption };
      const res = await adminFetch("/api/admin/marketing/meta", { method: "POST", body: JSON.stringify(body) });
      if (res?.error) throw new Error(res.error);
      toast.success(channel === "fb" ? "Facebook Page par post ho gaya ✅" : "Instagram par post ho gaya ✅");
      if (channel === "fb") { setFbMessage(""); setFbLink(""); } else { setIgImageUrl(""); setIgCaption(""); }
    } catch (e) {
      toast.error("Publish failed", { description: e instanceof Error ? e.message : "" });
    } finally {
      setPublishing(null);
    }
  };

  // — Media picker —
  const openMediaPicker = async () => {
    setMediaOpen(true);
    if (media) return; // cached
    setMediaLoading(true);
    try {
      const data = await adminFetch("/api/admin/upload");
      if (data?.error) throw new Error(data.error);
      setMedia(data.files || []);
    } catch (e) {
      toast.error("Media Library load nahi hua", { description: e instanceof Error ? e.message : "" });
      setMediaOpen(false);
    } finally {
      setMediaLoading(false);
    }
  };

  // — Email campaign —
  const runCampaign = async (action: "test" | "send") => {
    if (!campaign.subject.trim() || campaign.message.trim().length < 10) {
      toast.error("Subject aur message (kam se kam 10 letters) required hain");
      return;
    }
    setConfirmSend(false);
    setCampaignBusy(action);
    try {
      const res = await adminFetch("/api/admin/marketing/email-campaign", {
        method: "POST",
        body: JSON.stringify({ action, ...campaign }),
      });
      if (res?.error) throw new Error(res.error);
      if (action === "test") {
        toast.success(`Test email aapke inbox me bhej diya (${res.testedTo}) — check karein phir sabko bhejein`);
      } else {
        toast.success(`Campaign bhej diya — ${res.sent} delivered${res.failed ? `, ${res.failed} failed` : ""}`);
      }
    } catch (e) {
      toast.error("Campaign failed", { description: e instanceof Error ? e.message : "" });
    } finally {
      setCampaignBusy(null);
    }
  };

  if (booting) return <LoadingSpinner />;
  if (loadError) return <ErrorState title="Could not load marketing" message={loadError} onRetry={loadAll} />;

  const gaSetting = settings.find((s) => s.key === "ga_measurement_id");
  const igUrlSetting = settings.find((s) => s.key === "instagram_url");
  const fbUrlSetting = settings.find((s) => s.key === "facebook_url");

  const utmFinal = (() => {
    try {
      const u = new URL(utmUrl);
      if (utmSource) u.searchParams.set("utm_source", utmSource);
      if (utmMedium) u.searchParams.set("utm_medium", utmMedium);
      if (utmCampaign) u.searchParams.set("utm_campaign", utmCampaign);
      if (utmContent) u.searchParams.set("utm_content", utmContent);
      return u.toString();
    } catch {
      return "";
    }
  })();

  const waLink = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(waTemplate)}` : "";

  const campaignPreviewHtml = (() => {
    const paras = campaign.message
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#3d3a34;">${p.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br>")}</p>`)
      .join("");
    return `<div style="background:#faf6ee;padding:18px;font-family:Arial,sans-serif;"><div style="max-width:560px;margin:0 auto;background:#fff;padding:22px;border-radius:12px;border:1px solid #eee;">
      <div style="text-align:center;padding-bottom:12px;border-bottom:2px solid #C9A227;"><span style="font-size:22px;color:#1D5B45;font-family:Georgia,serif;font-weight:bold;">RK Residency</span><div style="font-size:10px;color:#8a8577;letter-spacing:3px;margin-top:3px;">VRINDAVAN</div></div>
      <div style="padding:18px 4px;">${paras}
      ${campaign.ctaLabel && campaign.ctaUrl ? `<a href="#" style="background:#1D5B45;color:#fff;padding:10px 24px;text-decoration:none;border-radius:999px;font-size:14px;display:inline-block;margin-top:8px;">${campaign.ctaLabel}</a>` : ""}</div>
      <div style="border-top:1px solid #e5dfce;padding-top:12px;text-align:center;font-size:11px;color:#8a8577;">RK Residency, Kailash Nagar, Vrindavan · +91 9760814931</div>
    </div></div>`;
  })();

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-teal/20 bg-teal/5 p-4">
        <p className="font-display text-sm text-charcoal-soft">
          <strong className="text-teal">Marketing Hub.</strong> Performance, social login (Facebook + Instagram), email campaigns, WhatsApp promos, UTM links — poora marketing ek jagah se. Sab actions audit-log hote hain.
        </p>
      </div>

      {/* ============ 1. PERFORMANCE ============ */}
      <Section icon={BarChart3} title="Marketing Performance — real numbers" tone="teal">
        {!stats ? (
          <p className="font-display text-xs text-charcoal-soft">Stats load nahi hue (database busy?) — refresh karein.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <PerfCard icon={Inbox} label="Bookings (30 din)" value={String(stats.last30.bookings)} sub={`${inr(stats.last30.revenue)} revenue`} />
            <PerfCard icon={Users} label="Newsletter audience" value={String(stats.audience.newsletterSubscribers)} sub="email campaign receivers" />
            <PerfCard icon={Target} label="Avg booking lead" value={`${stats.last30.avgLeadDays} din`} sub="booking se check-in tak" />
            <PerfCard icon={Ticket} label="Coupons" value={`${stats.coupons.active}/${stats.coupons.total}`} sub={`${stats.coupons.redeemed} redeemed · ${stats.coupons.active} active`} />
            <PerfCard icon={Star} label="Approved reviews" value={String(stats.audience.reviewsApproved)} sub="website testimonials" />
            <PerfCard icon={Mail} label="Leads (30 din)" value={String(stats.leads.last30)} sub={`${stats.leads.total} total enquiries`} />
          </div>
        )}
      </Section>

      {/* ============ 2. META SOCIAL LOGIN ============ */}
      <Section icon={Facebook} title="Social Login — Facebook & Instagram (Meta)">
        {!meta ? (
          <LoadingSpinner />
        ) : !meta.configured ? (
          /* —— Setup guide —— */
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-xl bg-gold/10 p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />
              <div className="font-display text-xs text-charcoal-soft">
                <p className="font-semibold text-charcoal">One-time setup (2 minute):</p>
                <ol className="mt-1 list-decimal space-y-0.5 pl-4">
                  <li><a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" className="font-semibold text-teal underline">developers.facebook.com/apps</a> par apna Business type App banayein</li>
                  <li>App mein <strong>Facebook Login for Business</strong> product add karein</li>
                  <li>Settings → Basic se <strong>App ID</strong> aur <strong>App Secret</strong> copy karein aur neeche save karein</li>
                  <li>Facebook Login settings mein ye <strong>Valid OAuth Redirect URI</strong> paste karein:</li>
                </ol>
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5">
                  <code className="flex-1 break-all font-mono text-[11px] text-charcoal">{metaAuth?.redirectUri || "…"}</code>
                  <button onClick={() => copyText(metaAuth?.redirectUri || "", "redirect")} className="text-teal hover:text-teal-deep" title="Copy redirect URI">
                    {copied === "redirect" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls()}><KeyRound className="mr-1 inline h-3 w-3" /> Meta App ID</label>
                <input type="text" value={appIdInput} onChange={(e) => setAppIdInput(e.target.value)} placeholder="1234567890123456" className={inputCls()} />
              </div>
              <div>
                <label className={labelCls()}>Meta App Secret</label>
                <input type="password" value={appSecretInput} onChange={(e) => setAppSecretInput(e.target.value)} placeholder="••••••••••••••••" className={inputCls()} autoComplete="new-password" />
              </div>
            </div>
            <Button onClick={saveCredentials} disabled={savingCreds} className="rounded-full bg-teal text-ivory hover:bg-teal-deep">
              {savingCreds ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save & continue
            </Button>
          </div>
        ) : !meta.connected ? (
          /* —— Configured, not connected —— */
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-ivory-deep/50 p-4">
              <div className="flex-1">
                <p className="font-serif text-sm font-semibold text-charcoal">Meta App ready {meta.appMasked && <span className="font-mono text-xs text-charcoal-soft">({meta.appMasked})</span>}</p>
                <p className="mt-0.5 font-display text-xs text-charcoal-soft">Neeche button se Facebook/Instagram login karein — permission popups mein <strong>Continue</strong> aur apna <strong>Page select</strong> karein. Instagram professional account (Page se linked) bhi connect ho jayega.</p>
              </div>
              <Button onClick={startLogin} disabled={startingLogin} className="rounded-full bg-[#1877F2] text-white hover:bg-[#166fe0]">
                {startingLogin ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Facebook className="mr-2 h-4 w-4" />}
                Login with Facebook &amp; Instagram
              </Button>
            </div>
            <details className="rounded-xl border border-charcoal/10 p-3">
              <summary className="cursor-pointer font-display text-xs font-semibold text-charcoal-soft">App ID change karna hai?</summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input type="text" value={appIdInput} onChange={(e) => setAppIdInput(e.target.value)} placeholder="New App ID" className={inputCls()} />
                <input type="password" value={appSecretInput} onChange={(e) => setAppSecretInput(e.target.value)} placeholder="New App Secret" className={inputCls()} autoComplete="new-password" />
                <div><Button onClick={saveCredentials} disabled={savingCreds || !appIdInput || !appSecretInput} size="sm" className="rounded-full bg-teal text-ivory hover:bg-teal-deep"><Save className="mr-1.5 h-3.5 w-3.5" /> Update credentials</Button></div>
              </div>
            </details>
          </div>
        ) : (
          /* —— Connected —— */
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-teal/20 bg-teal/5 p-4">
              <div className="flex gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#1877F2]/10 text-[#1877F2]"><Facebook className="h-5 w-5" /></span>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#E4405F]/10 text-[#E4405F]"><Instagram className="h-5 w-5" /></span>
              </div>
              <div className="flex-1">
                <p className="flex items-center gap-1.5 font-serif text-sm font-semibold text-charcoal">
                  <CheckCircle2 className="h-4 w-4 text-teal" /> Connected
                  {meta.user.name && <span className="font-display text-xs font-normal text-charcoal-soft">— {meta.user.name}</span>}
                </p>
                <p className="mt-0.5 font-display text-xs text-charcoal-soft">
                  Page: <strong className="text-charcoal">{meta.page.name || meta.page.id}</strong>
                  {meta.instagram.username && <> · Instagram: <strong className="text-charcoal">@{meta.instagram.username}</strong></>}
                  {tokenExpiryLabel(meta.tokenExpires)}
                </p>
              </div>
              <Button onClick={disconnect} disabled={disconnecting} variant="outline" size="sm" className="rounded-full border-marsala/40 text-marsala hover:bg-marsala hover:text-ivory">
                {disconnecting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <LogOut className="mr-1.5 h-3.5 w-3.5" />} Disconnect
              </Button>
            </div>

            {/* Post templates */}
            <div className="rounded-xl border border-charcoal/10 p-4">
              <p className="mb-2 flex items-center gap-1.5 font-display text-xs font-semibold text-charcoal"><Sparkles className="h-3.5 w-3.5 text-gold-deep" /> Ready templates — click to fill</p>
              <div className="flex flex-wrap gap-1.5">
                {SOCIAL_TEMPLATES.map((t) => (
                  <button key={t.name} onClick={() => { setFbMessage(t.text); setIgCaption(t.text); toast.success(`${t.name} FB aur IG dono me fill ho gaya`); }} className="rounded-full border border-charcoal/15 px-2.5 py-1 font-display text-[11px] font-semibold text-charcoal-soft hover:border-teal/40 hover:text-teal">{t.name}</button>
                ))}
              </div>
            </div>

            {/* FB composer */}
            <div className="rounded-xl border border-charcoal/10 p-4">
              <p className="mb-2 flex items-center gap-1.5 font-display text-xs font-semibold text-charcoal"><Facebook className="h-3.5 w-3.5 text-[#1877F2]" /> Post to Facebook Page</p>
              <textarea rows={3} value={fbMessage} onChange={(e) => setFbMessage(e.target.value)} placeholder="Aaj ka post… (offer, festival wish, photo update)" className={inputCls()} />
              <input type="url" value={fbLink} onChange={(e) => setFbLink(e.target.value)} placeholder="Optional link (https://www.rkresidencyvrindavan.in/offers)" className={`${inputCls()} mt-2`} />
              <Button onClick={() => publish("fb")} disabled={publishing !== null || !fbMessage.trim()} size="sm" className="mt-2 rounded-full bg-[#1877F2] text-white hover:bg-[#166fe0]">
                {publishing === "fb" ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />} Publish to Page
              </Button>
            </div>

            {/* IG composer */}
            <div className="rounded-xl border border-charcoal/10 p-4">
              <p className="mb-2 flex items-center gap-1.5 font-display text-xs font-semibold text-charcoal">
                <Instagram className="h-3.5 w-3.5 text-[#E4405F]" />
                Post to Instagram {meta.instagram.username ? <span className="font-normal text-charcoal-soft">(@{meta.instagram.username})</span> : <span className="font-normal text-marsala">— IG account linked nahi hai</span>}
              </p>
              {meta.instagram.username ? (
                <>
                  <div className="flex gap-2">
                    <input type="url" value={igImageUrl} onChange={(e) => setIgImageUrl(e.target.value)} placeholder="Public image URL (https://…)" className={inputCls()} />
                    <Button variant="outline" size="sm" className="shrink-0 rounded-full" onClick={openMediaPicker}>
                      <ImageIcon className="mr-1.5 h-3.5 w-3.5" /> Media se chunein
                    </Button>
                  </div>
                  <textarea rows={2} value={igCaption} onChange={(e) => setIgCaption(e.target.value)} placeholder="Caption + #hashtags…" className={`${inputCls()} mt-2`} />
                  {igImageUrl && (
                    <div className="mt-2 flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={igImageUrl} alt="preview" className="h-14 w-14 rounded-lg border border-charcoal/10 object-cover" />
                      <p className="font-display text-[10px] text-charcoal-soft">Preview — image public URL honi chahiye</p>
                    </div>
                  )}
                  <Button onClick={() => publish("ig")} disabled={publishing !== null || !igImageUrl.trim()} size="sm" className="mt-2 rounded-full bg-[#E4405F] text-white hover:bg-[#c93652]">
                    {publishing === "ig" ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />} Publish to Instagram
                  </Button>
                </>
              ) : (
                <p className="flex items-center gap-1.5 font-display text-xs text-charcoal-soft"><Info className="h-3.5 w-3.5" /> Apne Facebook Page ko Instagram professional account se link karein (Page settings → Linked accounts), phir yahin re-login karein.</p>
              )}
            </div>
          </div>
        )}
      </Section>

      {/* Media picker modal */}
      {mediaOpen && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-charcoal/60 p-4 backdrop-blur-sm" onClick={() => setMediaOpen(false)}>
          <div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-ivory shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-charcoal/10 px-5 py-3">
              <p className="font-serif text-base font-semibold text-charcoal">Media Library se image chunein</p>
              <button onClick={() => setMediaOpen(false)} className="font-display text-xs text-charcoal-soft hover:text-charcoal">✕</button>
            </div>
            <div className="max-h-[65vh] overflow-y-auto p-4">
              {mediaLoading ? (
                <LoadingSpinner />
              ) : !media || media.length === 0 ? (
                <p className="py-8 text-center font-display text-xs text-charcoal-soft">Koi image nahi mili — pehle Media Library tab me upload karein.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {media.map((f) => (
                    <button key={f.name} onClick={() => { setIgImageUrl(f.url.startsWith("http") ? f.url : `https://www.rkresidencyvrindavan.in${f.url}`); setMediaOpen(false); toast.success("Image select ho gayi"); }} className={`overflow-hidden rounded-xl border-2 transition-all ${igImageUrl.includes(f.name) ? "border-teal" : "border-transparent hover:border-teal/40"}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f.url} alt={f.name} className="aspect-square w-full object-cover" />
                      <p className="truncate px-1 py-1 font-mono text-[9px] text-charcoal-soft">{f.name}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============ 3. EMAIL CAMPAIGNS ============ */}
      <Section icon={Mail} title="Email Campaign — newsletter subscribers ko bhejein" tone="teal"
        right={<span className="rounded-full bg-teal/10 px-2.5 py-1 font-display text-[10px] font-bold text-teal">{stats?.audience.newsletterSubscribers ?? "—"} subscribers</span>}>
        <p className="mb-3 font-display text-xs text-charcoal-soft">Website ke newsletter subscribers ko branded promotional email bhejein (Resend ke through — wahi service jo booking confirmations bhejti hai). <strong>Pehle Test bhejein</strong>, preview dekhein, phir sabko.</p>
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="space-y-3">
            <div>
              <label className={labelCls()}>Templates</label>
              <div className="flex flex-wrap gap-1.5">
                {EMAIL_TEMPLATES.map((t) => (
                  <button key={t.name} onClick={() => setCampaign({ subject: t.subject, message: t.message, ctaLabel: t.ctaLabel, ctaUrl: t.ctaUrl })} className="rounded-full border border-charcoal/15 px-2.5 py-1 font-display text-[11px] font-semibold text-charcoal-soft hover:border-teal/40 hover:text-teal">{t.name}</button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls()}>Subject *</label>
              <input type="text" value={campaign.subject} onChange={(e) => setCampaign((c) => ({ ...c, subject: e.target.value }))} className={inputCls()} />
            </div>
            <div>
              <label className={labelCls()}>Message * (blank line = naya paragraph)</label>
              <textarea rows={7} value={campaign.message} onChange={(e) => setCampaign((c) => ({ ...c, message: e.target.value }))} className={inputCls()} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls()}>Button text</label>
                <input type="text" value={campaign.ctaLabel} onChange={(e) => setCampaign((c) => ({ ...c, ctaLabel: e.target.value }))} placeholder="Abhi Book Karein" className={inputCls()} />
              </div>
              <div>
                <label className={labelCls()}>Button link</label>
                <input type="url" value={campaign.ctaUrl} onChange={(e) => setCampaign((c) => ({ ...c, ctaUrl: e.target.value }))} className={inputCls()} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button onClick={() => runCampaign("test")} disabled={campaignBusy !== null} variant="outline" size="sm" className="rounded-full">
                {campaignBusy === "test" ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Eye className="mr-1.5 h-3.5 w-3.5" />} Test bhejein (apne aap ko)
              </Button>
              <Button onClick={() => setPreviewOpen((v) => !v)} variant="outline" size="sm" className="rounded-full">
                <Eye className="mr-1.5 h-3.5 w-3.5" /> {previewOpen ? "Preview hide" : "Preview dekhein"}
              </Button>
              <Button onClick={() => setConfirmSend(true)} disabled={campaignBusy !== null} size="sm" className="rounded-full bg-teal text-ivory hover:bg-teal-deep">
                {campaignBusy === "send" ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />} Sabko bhejein ({stats?.audience.newsletterSubscribers ?? 0})
              </Button>
            </div>
            {previewOpen && (
              <div className="rounded-xl border border-charcoal/10 p-3">
                <p className="mb-2 font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Email preview (in-house template)</p>
                <div className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: campaignPreviewHtml }} />
              </div>
            )}
          </div>
          <div className="rounded-xl bg-ivory-deep/40 p-4">
            <p className="mb-2 font-display text-[11px] font-semibold uppercase tracking-wider text-charcoal-soft">Kaise kaam karta hai</p>
            <ul className="space-y-2 font-display text-xs text-charcoal-soft">
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal" /> Subscriber list website newsletter form se banti hai</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal" /> Email branded RK Residency template me jaati hai (header + CTA + footer)</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal" /> "Test bhejein" sirf aapke apne inbox me aata hai</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal" /> "Sabko bhejein" har subscriber ko individually bhejta hai (max 500)</li>
              <li className="flex gap-2"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-deep" /> Bhejne se pehle Test zaroor dekhein — bulk email wapas nahi aati</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal" /> Har campaign Audit Log me record hota hai</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* Send confirmation modal */}
      {confirmSend && (
        <div className="fixed inset-0 z-[95] grid place-items-center bg-charcoal/70 p-4 backdrop-blur-sm" onClick={() => setConfirmSend(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-ivory p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gold/15 text-gold-deep"><AlertTriangle className="h-4 w-4" /></span>
              <h3 className="font-serif text-base font-semibold text-charcoal">Sabko bhejein?</h3>
            </div>
            <p className="mb-1 font-display text-xs text-charcoal-soft">Ye email <strong>{stats?.audience.newsletterSubscribers ?? 0} subscribers</strong> ko jayega:</p>
            <p className="mb-4 rounded-md bg-ivory-deep px-2 py-1.5 font-display text-xs text-charcoal">“{campaign.subject}”</p>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setConfirmSend(false)} variant="outline" size="sm" className="rounded-full">Cancel</Button>
              <Button onClick={() => runCampaign("send")} disabled={campaignBusy !== null} size="sm" className="rounded-full bg-teal text-ivory hover:bg-teal-deep">
                {campaignBusy === "send" ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />} Confirm &amp; send
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============ 4. WHATSAPP PROMO BUILDER ============ */}
      <Section icon={MessageCircle} title="WhatsApp Promo Link Builder" tone="teal">
        <p className="mb-3 font-display text-xs text-charcoal-soft">Ready-made promo links — WhatsApp status, groups ya broadcast mein paste karein. Jab guest link kholega, message pehle se likha aayega.</p>
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="space-y-3">
            <div>
              <label className={labelCls()}>WhatsApp number (from Site Settings)</label>
              <input type="text" value={waNumber} onChange={(e) => setWaNumber(e.target.value.replace(/[^0-9]/g, ""))} placeholder="919760814931" className={inputCls()} />
              <p className="mt-1 font-display text-[10px] text-charcoal-soft/70">Country code ke saath (91…). Site Settings mein whatsapp_number setting se aata hai.</p>
            </div>
            <div>
              <label className={labelCls()}>Templates</label>
              <div className="flex flex-wrap gap-1.5">
                {WA_TEMPLATES.map((t) => (
                  <button key={t.name} onClick={() => setWaTemplate(t.text)} className={`rounded-full border px-2.5 py-1 font-display text-[11px] font-semibold transition-colors ${waTemplate === t.text ? "border-teal bg-teal text-ivory" : "border-charcoal/15 text-charcoal-soft hover:border-teal/40 hover:text-teal"}`}>{t.name}</button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls()}>Message</label>
              <textarea rows={4} value={waTemplate} onChange={(e) => setWaTemplate(e.target.value)} className={inputCls()} />
            </div>
          </div>
          <div className="flex flex-col">
            <label className={labelCls()}>Generated link</label>
            <div className="flex flex-1 items-start gap-2 rounded-xl bg-ivory-deep/50 p-3">
              <code className="flex-1 break-all font-mono text-[11px] text-charcoal">{waLink || "WhatsApp number set karein…"}</code>
              {waLink && (
                <button onClick={() => copyText(waLink, "wa")} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-teal text-ivory hover:bg-teal-deep" title="Copy link">
                  {copied === "wa" ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              )}
            </div>
            {waLink && (
              <a href={waLink} target="_blank" rel="noreferrer" className="mt-2 inline-flex w-fit items-center gap-1.5 font-display text-xs font-semibold text-teal hover:text-teal-deep">
                <ExternalLink className="h-3 w-3" /> Test link (opens WhatsApp)
              </a>
            )}
          </div>
        </div>
      </Section>

      {/* ============ 5. UTM CAMPAIGN BUILDER ============ */}
      <Section icon={Target} title="UTM Campaign Link Builder" tone="teal">
        <p className="mb-3 font-display text-xs text-charcoal-soft">Google Analytics mein har campaign alag track ho — source/medium tag ke saath link banayein, phir Analytics &amp; SEO tab mein results dekhein.</p>
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="space-y-3">
            <div>
              <label className={labelCls()}>Base URL</label>
              <input type="url" value={utmUrl} onChange={(e) => setUtmUrl(e.target.value)} className={inputCls()} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls()}>utm_source *</label>
                <input type="text" value={utmSource} onChange={(e) => setUtmSource(e.target.value)} className={inputCls()} />
              </div>
              <div>
                <label className={labelCls()}>utm_medium</label>
                <input type="text" value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)} className={inputCls()} />
              </div>
              <div>
                <label className={labelCls()}>utm_campaign</label>
                <input type="text" value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} placeholder="diwali-2026" className={inputCls()} />
              </div>
              <div>
                <label className={labelCls()}>utm_content</label>
                <input type="text" value={utmContent} onChange={(e) => setUtmContent(e.target.value)} placeholder="story-vs-feed" className={inputCls()} />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[{ source: "facebook", medium: "social" }, { source: "instagram", medium: "social" }, { source: "google", medium: "cpc" }, { source: "whatsapp", medium: "message" }, { source: "email", medium: "newsletter" }].map((p) => (
                <button key={p.source} onClick={() => { setUtmSource(p.source); setUtmMedium(p.medium); }} className="rounded-full border border-charcoal/15 px-2.5 py-1 font-display text-[11px] font-semibold text-charcoal-soft hover:border-teal/40 hover:text-teal">{p.source}</button>
              ))}
            </div>
          </div>
          <div className="flex flex-col">
            <label className={labelCls()}>Tracked URL</label>
            <div className="flex flex-1 items-start gap-2 rounded-xl bg-ivory-deep/50 p-3">
              <code className="flex-1 break-all font-mono text-[11px] text-charcoal">{utmFinal || "Valid URL daalein…"}</code>
              {utmFinal && (
                <button onClick={() => copyText(utmFinal, "utm")} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-teal text-ivory hover:bg-teal-deep" title="Copy URL">
                  {copied === "utm" ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* ============ 6. SEO SNAPSHOT + SHORTCUTS ============ */}
      <Section icon={Search} title="SEO & Tracking Snapshot">
        <div className="grid gap-2 sm:grid-cols-2">
          <StatusChip label="Google Analytics" ok={Boolean(gaSetting?.value)} value={gaSetting?.value || "Not set"} />
          <StatusChip label="Instagram profile link" ok={Boolean(igUrlSetting?.value)} value={igUrlSetting?.value || "Not set"} />
          <StatusChip label="Facebook page link" ok={Boolean(fbUrlSetting?.value)} value={fbUrlSetting?.value || "Not set"} />
          <StatusChip label="Meta social login" ok={Boolean(meta?.connected)} value={meta?.connected ? `@${meta.instagram.username || meta.page.name}` : meta?.configured ? "Ready — login pending" : "Setup pending"} />
        </div>
        <p className="mt-3 font-display text-[11px] text-charcoal-soft">
          GA ID / SEO fields edit karne ke liye <strong>Analytics &amp; SEO</strong> aur <strong>Site Settings</strong> tabs use karein. WhatsApp number <strong>Site Settings</strong> mein hai.
        </p>
      </Section>

      <Section icon={Megaphone} title="Marketing Shortcuts — baaki sab yahan se" tone="gold">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {SHORTCUTS.map((s) => (
            <button key={s.tab} onClick={() => jumpToTab(s.tab)} className="group rounded-xl border border-charcoal/10 bg-ivory-deep/30 p-3 text-left transition-all hover:border-teal/40 hover:bg-teal/5">
              <s.icon className="h-4 w-4 text-teal" />
              <p className="mt-1.5 font-serif text-sm font-semibold text-charcoal group-hover:text-teal">{s.label}</p>
              <p className="font-display text-[10px] text-charcoal-soft">{s.desc}</p>
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}

function PerfCard({ icon: Icon, label, value, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-charcoal/10 bg-ivory-deep/30 p-3.5">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-teal" />
        <p className="font-display text-[10px] uppercase tracking-wider text-charcoal-soft">{label}</p>
      </div>
      <p className="mt-1 font-serif text-xl font-bold text-charcoal">{value}</p>
      <p className="font-display text-[10px] text-charcoal-soft">{sub}</p>
    </div>
  );
}

function tokenExpiryLabel(iso: string): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const days = Math.round((t - Date.now()) / 86400000);
  if (days <= 0) return " · ⚠️ token expired — re-login karein";
  return ` · login ~${days} din tak valid (uske baad ek re-login)`;
}

function StatusChip({ label, ok, value }: { label: string; ok: boolean; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-charcoal/10 bg-ivory-deep/30 px-3 py-2.5">
      <div className="min-w-0">
        <p className="font-display text-[10px] uppercase tracking-wider text-charcoal-soft">{label}</p>
        <p className="truncate font-mono text-[11px] text-charcoal" title={value}>{value}</p>
      </div>
      <span className={`shrink-0 rounded-full px-2 py-0.5 font-display text-[9px] font-bold uppercase ${ok ? "bg-teal/15 text-teal" : "bg-gold/15 text-gold-deep"}`}>{ok ? "Active" : "Pending"}</span>
    </div>
  );
}
