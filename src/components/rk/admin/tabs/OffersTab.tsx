"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, X, Save, Tag, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminApi, adminFetch, LoadingSpinner, Field } from "./_shared";
import { refreshSiteContent } from "@/lib/site-content";
import { ImageUploader } from "../ImageUploader";
import { toast } from "sonner";

const EMPTY = {
  slug: "", title: "", tagline: "", description: "", perks: "[]",
  discountPct: null as number | null,
  validFrom: new Date().toISOString().slice(0, 10),
  validUntil: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
  imageUrl: null as string | null, badge: null as string | null, featured: false,
};

export function OffersTab() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);

  const reload = useCallback(() => {
    adminApi.get("offers").then((d) => {
      if (d) setOffers(d.offers || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let c = false;
    adminApi.get("offers").then((d) => {
      if (c) return;
      if (d) setOffers(d.offers || []);
      setLoading(false);
    });
    return () => { c = true; };
  }, []);

  const save = async (o: any) => {
    if (!o.slug.trim()) return toast.error("Slug is required");
    if (!o.title.trim()) return toast.error("Title is required");
    const method = o.id ? "PATCH" : "POST";
    const payload = {
      ...o,
      validFrom: new Date(o.validFrom).toISOString(),
      validUntil: new Date(o.validUntil).toISOString(),
    };
    const r = await adminFetch("/api/admin/offers", { method, body: JSON.stringify(payload) });
    if (r) {
      toast.success(o.id ? "Offer updated" : "Offer created");
      refreshSiteContent();
      setEditing(null);
      reload();
    }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this offer?")) return;
    try {
      const r = await adminFetch(`/api/admin/offers?id=${id}`, { method: "DELETE" });
      if (r) { toast.success("Offer deleted"); reload(); }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const toggleFeatured = async (o: any) => {
    const r = await adminFetch("/api/admin/offers", {
      method: "PATCH",
      body: JSON.stringify({ ...o, featured: !o.featured, validFrom: new Date(o.validFrom).toISOString(), validUntil: new Date(o.validUntil).toISOString() }),
    });
    if (r) { toast.success(o.featured ? "Unfeatured" : "Featured"); reload(); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-display text-sm text-charcoal-soft">{offers.length} offer{offers.length === 1 ? "" : "s"} · {offers.filter((o) => o.featured).length} featured</p>
        <Button onClick={() => setEditing({ ...EMPTY })} className="rounded-full bg-teal px-4 py-2 text-sm text-ivory hover:bg-teal-deep">
          <Plus className="mr-1 h-4 w-4" /> New offer
        </Button>
      </div>

      {offers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-charcoal/15 bg-white p-12 text-center">
          <Tag className="mx-auto h-8 w-8 text-charcoal-soft/40" />
          <p className="mt-2 font-serif text-base font-semibold text-charcoal">No offers yet</p>
          <p className="mt-1 font-display text-xs text-charcoal-soft">Create your first offer to attract more bookings.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((o) => {
            const isExpired = new Date(o.validUntil) < new Date();
            const isActive = new Date(o.validFrom) <= new Date() && !isExpired;
            return (
              <div key={o.id} className="overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-sm transition-shadow hover:shadow-md">
                <div className="relative h-36 overflow-hidden bg-ivory-deep">
                  {o.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={o.imageUrl} alt={o.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-charcoal-soft/40"><Tag className="h-8 w-8" /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent" />
                  {o.featured && (
                    <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold text-charcoal">
                      <Star className="h-3 w-3 fill-charcoal" /> Featured
                    </span>
                  )}
                  {o.discountPct && (
                    <span className="absolute left-2 top-2 rounded-full bg-marsala px-2 py-0.5 text-[10px] font-bold text-ivory">{o.discountPct}% OFF</span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <div className="font-serif text-base font-semibold text-ivory">{o.title}</div>
                    {o.tagline && <div className="font-display text-[10px] text-ivory/80">{o.tagline}</div>}
                  </div>
                </div>
                <div className="space-y-2 p-3">
                  <div className="flex items-center justify-between">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isActive ? "bg-teal/10 text-teal" : isExpired ? "bg-marsala/10 text-marsala" : "bg-gold/15 text-gold-deep"}`}>
                      {isActive ? "Active" : isExpired ? "Expired" : "Upcoming"}
                    </span>
                    {o.badge && <span className="font-display text-[10px] text-charcoal-soft">{o.badge}</span>}
                  </div>
                  <div className="font-display text-[10px] text-charcoal-soft">
                    {new Date(o.validFrom).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} — {new Date(o.validUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                  <div className="flex gap-1 border-t border-charcoal/10 pt-2">
                    <button onClick={() => setEditing(o)} className="flex-1 rounded-lg border border-charcoal/15 py-1.5 font-display text-[11px] font-semibold text-charcoal-soft hover:bg-teal hover:text-ivory">Edit</button>
                    <button onClick={() => toggleFeatured(o)} className={`grid h-7 w-7 place-items-center rounded-lg border border-charcoal/15 hover:bg-gold hover:text-charcoal ${o.featured ? "text-gold-deep" : "text-charcoal-soft"}`} title={o.featured ? "Unfeature" : "Feature"}>
                      <Star className={`h-3 w-3 ${o.featured ? "fill-current" : ""}`} />
                    </button>
                    <button onClick={() => del(o.id)} className="grid h-7 w-7 place-items-center rounded-lg border border-charcoal/15 text-charcoal-soft hover:bg-marsala hover:text-ivory" title="Delete">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && <OfferEditor offer={editing} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  );
}

function OfferEditor({ offer, onClose, onSave }: { offer: any; onClose: () => void; onSave: (o: any) => void }) {
  const [form, setForm] = useState({ ...offer, validFrom: offer.validFrom?.slice(0, 10) || "", validUntil: offer.validUntil?.slice(0, 10) || "" });
  const [saving, setSaving] = useState(false);
  const [perksText, setPerksText] = useState(() => {
    try { return JSON.parse(form.perks || "[]").join("\n"); } catch { return form.perks; }
  });
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const perks = JSON.stringify(perksText.split("\n").map((t) => t.trim()).filter(Boolean));
      await onSave({ ...form, perks });
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-charcoal/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="scrollbar-thin max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-ivory shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-charcoal/10 bg-ivory/95 px-6 py-4 backdrop-blur">
          <div>
            <h3 className="font-serif text-lg font-semibold text-charcoal">{offer.id ? "Edit offer" : "New offer"}</h3>
            <p className="font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Offer editor</p>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-charcoal/15 text-charcoal-soft hover:bg-charcoal hover:text-ivory">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title" value={form.title} onChange={(v) => set("title", v)} />
            <Field label="Slug" value={form.slug} onChange={(v) => set("slug", v)} hint="URL-safe, lowercase, hyphen-separated" />
            <Field label="Tagline" value={form.tagline} onChange={(v) => set("tagline", v)} />
            <Field label="Badge (e.g. Janmashtami)" value={form.badge || ""} onChange={(v) => set("badge", v || null)} />
            <Field label="Discount %" type="number" value={form.discountPct || ""} onChange={(v) => set("discountPct", v ? parseInt(v) : null)} />
            <div className="flex items-center gap-3 rounded-xl border border-charcoal/10 bg-white p-3">
              <input type="checkbox" id="featured" checked={!!form.featured} onChange={(e) => set("featured", e.target.checked)} className="h-4 w-4 rounded border-charcoal/30" />
              <label htmlFor="featured" className="cursor-pointer font-display text-sm text-charcoal">Featured <span className="block font-display text-[10px] font-normal text-charcoal-soft">Show on home page</span></label>
            </div>
            <Field label="Valid from" type="date" value={form.validFrom} onChange={(v) => set("validFrom", v)} />
            <Field label="Valid until" type="date" value={form.validUntil} onChange={(v) => set("validUntil", v)} />
          </div>

          <ImageUploader
            label="Offer image"
            value={form.imageUrl}
            onChange={(v) => set("imageUrl", v)}
            hint="Recommended: 1200×800px, landscape"
          />

          <Field label="Description" textarea rows={4} value={form.description} onChange={(v) => set("description", v)} />

          <div>
            <label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Perks (one per line)</label>
            <textarea
              value={perksText}
              onChange={(e) => setPerksText(e.target.value)}
              rows={4}
              placeholder={"Free breakfast\nLate checkout\nAirport pickup"}
              className="w-full rounded-md border border-charcoal/15 bg-ivory-deep/30 px-3 py-2 font-display text-xs text-charcoal focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal/30"
            />
          </div>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-charcoal/10 bg-ivory/95 px-6 py-4 backdrop-blur">
          <Button onClick={onClose} variant="outline" className="rounded-full">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="rounded-full bg-teal px-6 py-2 text-ivory hover:bg-teal-deep">
            {saving ? <><Save className="mr-2 h-4 w-4 animate-pulse" /> Saving…</> : <><Save className="mr-2 h-4 w-4" /> Save offer</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
