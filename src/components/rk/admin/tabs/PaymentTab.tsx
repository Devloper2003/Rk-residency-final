"use client";
import { useEffect, useState } from "react";
import { Check, Loader2, CreditCard, Shield, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminApi, LoadingSpinner } from "./_shared";
import { refreshSiteContent } from "@/lib/site-content";
import { toast } from "sonner";

const PAYMENT_KEYS = [
  // Razorpay
  { key: "razorpay_enabled", label: "Enable Razorpay", category: "razorpay", type: "boolean" },
  { key: "razorpay_key_id", label: "Razorpay Key ID", category: "razorpay", type: "text" },
  { key: "razorpay_key_secret", label: "Razorpay Key Secret", category: "razorpay", type: "secret" },
  { key: "razorpay_webhook_secret", label: "Razorpay Webhook Secret", category: "razorpay", type: "secret" },
  { key: "razorpay_mode", label: "Mode (sandbox/live)", category: "razorpay", type: "text" },
  { key: "razorpay_success_url", label: "Success URL", category: "razorpay", type: "text" },
  { key: "razorpay_failure_url", label: "Failure URL", category: "razorpay", type: "text" },
  // Stripe
  { key: "stripe_enabled", label: "Enable Stripe", category: "stripe", type: "boolean" },
  { key: "stripe_publishable_key", label: "Stripe Publishable Key", category: "stripe", type: "text" },
  { key: "stripe_secret_key", label: "Stripe Secret Key", category: "stripe", type: "secret" },
  { key: "stripe_webhook_secret", label: "Stripe Webhook Secret", category: "stripe", type: "secret" },
  { key: "stripe_mode", label: "Mode (sandbox/live)", category: "stripe", type: "text" },
  { key: "stripe_success_url", label: "Success URL", category: "stripe", type: "text" },
  { key: "stripe_failure_url", label: "Failure URL", category: "stripe", type: "text" },
];

const DEFAULTS: Record<string, string> = {
  razorpay_enabled: "false",
  razorpay_key_id: "",
  razorpay_key_secret: "",
  razorpay_webhook_secret: "",
  razorpay_mode: "sandbox",
  razorpay_success_url: "/booking/success",
  razorpay_failure_url: "/booking/failure",
  stripe_enabled: "false",
  stripe_publishable_key: "",
  stripe_secret_key: "",
  stripe_webhook_secret: "",
  stripe_mode: "sandbox",
  stripe_success_url: "/booking/success",
  stripe_failure_url: "/booking/failure",
};

export function PaymentTab() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let c = false;
    adminApi.get("settings").then((data) => {
      if (c || !data) { setLoading(false); return; }
      const allSettings = data.settings || [];
      setSettings(allSettings);
      const m: Record<string, string> = {};
      allSettings.forEach((s: any) => { m[s.id] = s.value; });
      // Fill defaults for missing payment keys
      PAYMENT_KEYS.forEach((pk) => {
        const existing = allSettings.find((s: any) => s.key === pk.key);
        if (!existing) m[pk.key] = DEFAULTS[pk.key] || "";
        else m[existing.id] = existing.value;
      });
      setEditing(m);
      setLoading(false);
    });
    return () => { c = true; };
  }, []);

  const findSettingId = (key: string): string | null => {
    const s = settings.find((s: any) => s.key === key);
    return s?.id || null;
  };

  const getValue = (key: string): string => {
    // New (unsaved) settings are stored in `editing` keyed by setting key name,
    // not by setting id. Check both branches so the UI reflects what the admin
    // typed even before the setting row exists in the DB.
    if (editing[key] !== undefined) return editing[key];
    const s = settings.find((s: any) => s.key === key);
    if (s && editing[s.id] !== undefined) return editing[s.id];
    if (s) return s.value;
    return DEFAULTS[key] || "";
  };

  const setValue = (key: string, value: string) => {
    const id = findSettingId(key);
    if (id) {
      setEditing((p) => ({ ...p, [id]: value }));
    } else {
      // Key doesn't exist yet — store by key name temporarily
      setEditing((p) => ({ ...p, [key]: value }));
    }
  };

  const save = async (key: string) => {
    const id = findSettingId(key);
    const value = id ? editing[id] : editing[key];
    if (value === undefined) return;

    setSaving((s) => ({ ...s, [key]: true }));
    try {
      if (id) {
        // Update existing setting
        const res = await adminApi.patch("setting", { id, value });
        if (res) {
          toast.success("Payment setting saved");
          setSettings((prev) => prev.map((s) => s.id === id ? { ...s, value } : s));
          refreshSiteContent();
        }
      } else {
        // Create new setting via the consolidated API
        // We need to create it — use the admin API directly
        const res = await fetch("/api/admin/all", {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("rk_admin_token")}` },
          body: JSON.stringify({ action: "setting_create", key, value, label: PAYMENT_KEYS.find(p => p.key === key)?.label || key, category: "payment" }),
        });
        const data = await res.json();
        if (res.ok) {
          toast.success("Payment setting created");
          // Reload settings to get the new ID
          adminApi.get("settings").then((d) => {
            if (d) {
              setSettings(d.settings || []);
              const m: Record<string, string> = {};
              (d.settings || []).forEach((s: any) => { m[s.id] = s.value; });
              setEditing(m);
            }
          });
          refreshSiteContent();
        } else {
          throw new Error(data.error || "Failed");
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
    setSaving((s) => ({ ...s, [key]: false }));
  };

  if (loading) return <LoadingSpinner />;

  const renderField = (pk: typeof PAYMENT_KEYS[0]) => {
    const value = getValue(pk.key);
    const isSecret = pk.type === "secret";
    const isBool = pk.type === "boolean";
    const showThis = showSecrets[pk.key];

    return (
      <div key={pk.key} className="rounded-2xl border border-charcoal/10 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <span className="font-serif text-sm font-semibold text-charcoal">{pk.label}</span>
            <div className="mt-0.5 font-mono text-[10px] text-charcoal-soft">{pk.key}</div>
          </div>
          {isSecret && (
            <button
              onClick={() => setShowSecrets((p) => ({ ...p, [pk.key]: !p[pk.key] }))}
              className="grid h-7 w-7 place-items-center rounded-lg border border-charcoal/15 text-charcoal-soft hover:bg-teal hover:text-ivory"
            >
              {showThis ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
        {isBool ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setValue(pk.key, value === "true" ? "false" : "true")}
              className={`relative h-7 w-12 rounded-full transition-colors ${value === "true" ? "bg-teal" : "bg-charcoal/20"}`}
            >
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${value === "true" ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <span className="font-display text-xs text-charcoal-soft">{value === "true" ? "Enabled" : "Disabled"}</span>
          </div>
        ) : (
          <Input
            type={isSecret && !showThis ? "password" : "text"}
            value={value}
            onChange={(e) => setValue(pk.key, e.target.value)}
            className="bg-ivory-deep/30 font-mono text-xs focus-visible:ring-teal/30"
            placeholder={isSecret ? "••••••••••••" : ""}
          />
        )}
        <div className="mt-2 flex items-center justify-between">
          {isSecret && (
            <span className="flex items-center gap-1 font-display text-[10px] text-teal">
              <Shield className="h-3 w-3" /> Stored securely
            </span>
          )}
          <Button
            onClick={() => save(pk.key)}
            disabled={saving[pk.key]}
            className="ml-auto rounded-full bg-teal px-4 py-1.5 text-xs text-ivory disabled:opacity-40 hover:bg-teal-deep"
          >
            {saving[pk.key] ? <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Saving…</> : <><Check className="mr-1 h-3 w-3" /> Save</>}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-teal/20 bg-teal/5 p-4">
        <p className="font-display text-sm text-charcoal-soft">
          <strong className="text-teal">Payment Gateway Settings.</strong> Configure Razorpay and Stripe API keys, webhooks, and mode. All secret keys are stored in the database and served only from backend API routes — they are never exposed in frontend source code.
        </p>
      </div>

      {/* Razorpay */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-teal" />
          <h3 className="font-serif text-lg font-semibold text-charcoal">Razorpay</h3>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getValue("razorpay_enabled") === "true" ? "bg-teal/10 text-teal" : "bg-marsala/10 text-marsala"}`}>
            {getValue("razorpay_enabled") === "true" ? "Active" : "Inactive"}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {PAYMENT_KEYS.filter((k) => k.category === "razorpay").map(renderField)}
        </div>
      </div>

      {/* Stripe */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-indigo" />
          <h3 className="font-serif text-lg font-semibold text-charcoal">Stripe</h3>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getValue("stripe_enabled") === "true" ? "bg-teal/10 text-teal" : "bg-marsala/10 text-marsala"}`}>
            {getValue("stripe_enabled") === "true" ? "Active" : "Inactive"}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {PAYMENT_KEYS.filter((k) => k.category === "stripe").map(renderField)}
        </div>
      </div>

      <div className="rounded-xl border border-gold/30 bg-gold/5 px-4 py-3">
        <p className="font-display text-xs text-charcoal-soft">
          <strong className="text-gold-deep">Security note:</strong> Secret keys and webhook secrets are stored as site settings in the database. They are only accessible via authenticated admin API routes. The frontend booking widget only receives the publishable key (Razorpay Key ID / Stripe Publishable Key) — never the secret key.
        </p>
      </div>
    </div>
  );
}
