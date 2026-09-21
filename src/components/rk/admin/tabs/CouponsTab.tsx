"use client";
import { useEffect, useState, useCallback } from "react";
import { Ticket, Plus, Trash2, Power, PowerOff, Copy, Loader2, Search, Mail } from "lucide-react";
import { adminApi } from "./_shared";
import { LoadingSpinner, ErrorState } from "./_shared";

type Coupon = {
  id: string;
  code: string;
  discountPct: number;
  createdByGuest: string;
  usedAt: string | null;
  usedByBooking: string | null;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  createdAt: string;
  createdByBookingRel?: { id: string; referenceCode: string; guestName: string };
};

type Stats = { total: number; active: number; used: number; expired: number };

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function daysLeft(until: string) {
  const diff = new Date(until).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getStatus(c: Coupon) {
  if (c.usedAt) return "used";
  if (!c.isActive) return "inactive";
  if (new Date(c.validUntil) < new Date()) return "expired";
  return "active";
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-teal/10 text-teal",
  used: "bg-gold/10 text-gold-deep",
  expired: "bg-marsala/10 text-marsala",
  inactive: "bg-charcoal/10 text-charcoal-soft",
};

const couponsApi = adminApi.crud("coupons");

export function CouponsTab() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, used: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "used" | "expired">("all");
  const [search, setSearch] = useState("");

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    code: "",
    discountPct: 5,
    guestEmail: "",
    validDays: 10,
  });

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    const params = filter !== "all" ? { status: filter } : undefined;
    couponsApi.list(params).then((data: any) => {
      if (cancelled) return;
      if (!data) { setError(true); setLoading(false); return; }
      setCoupons(data.coupons || []);
      setStats(data.stats || { total: 0, active: 0, used: 0, expired: 0 });
      setLoading(false);
    }).catch(() => { if (!cancelled) { setError(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, [filter]);

  useEffect(() => { const c = load(); return c; }, [load]);
  const retry = () => { setError(false); load(); };

  const createCoupon = async () => {
    setCreating(true);
    setFormError("");
    try {
      const res: any = await couponsApi.create({
        code: form.code || undefined,
        discountPct: form.discountPct,
        guestEmail: form.guestEmail,
        validDays: form.validDays,
      });
      if (res?.error) {
        setFormError(res.error);
      } else {
        setShowCreate(false);
        setForm({ code: "", discountPct: 5, guestEmail: "", validDays: 10 });
        load();
      }
    } catch (e: any) {
      setFormError(e?.message || "Create failed");
    }
    setCreating(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await couponsApi.update({ id, isActive: !current });
      load();
    } catch {}
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      await couponsApi.remove(id);
      load();
    } catch {}
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
  };

  const filtered = search
    ? coupons.filter((c) => c.code.toLowerCase().includes(search.toLowerCase()) || c.createdByGuest.toLowerCase().includes(search.toLowerCase()))
    : coupons;

  if (error) return <ErrorState title="Unable to load coupons" message="Please retry." onRetry={retry} />;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: stats.total },
          { label: "Active", value: stats.active },
          { label: "Used", value: stats.used },
          { label: "Expired", value: stats.expired },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-charcoal/10 bg-white p-4">
            <div className="font-serif text-2xl font-bold text-charcoal">{s.value}</div>
            <div className="font-display text-[10px] uppercase tracking-wider text-charcoal-soft">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Header row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {(["all", "active", "used", "expired"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 font-display text-xs font-semibold capitalize transition-colors ${
                filter === f
                  ? "bg-teal text-ivory"
                  : "border border-charcoal/10 text-charcoal-soft hover:border-teal/30 hover:text-teal"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-charcoal-soft/50" />
            <input
              type="text"
              placeholder="Search code or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-charcoal/10 bg-white py-2 pl-8 pr-3 font-display text-xs text-charcoal placeholder:text-charcoal-soft/50 focus:border-teal/40 focus:outline-none sm:w-56"
            />
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-teal px-4 py-2 font-display text-xs font-semibold text-ivory hover:bg-teal-deep"
          >
            <Plus className="h-3.5 w-3.5" /> Create Coupon
          </button>
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 p-4 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-2xl border border-charcoal/10 bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 font-serif text-lg font-semibold text-charcoal">Create Coupon</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Discount %</label>
                <select
                  value={form.discountPct}
                  onChange={(e) => setForm((f) => ({ ...f, discountPct: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-charcoal/10 bg-ivory-deep/30 px-3 py-2 font-display text-sm text-charcoal focus:border-teal focus:outline-none"
                >
                  {[5, 10, 15, 20, 25, 30, 50].map((p) => (
                    <option key={p} value={p}>{p}% off</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Guest Email (required)</label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-charcoal-soft/50" />
                  <input
                    type="email"
                    value={form.guestEmail}
                    onChange={(e) => setForm((f) => ({ ...f, guestEmail: e.target.value }))}
                    placeholder="guest@email.com"
                    className="w-full rounded-lg border border-charcoal/10 bg-ivory-deep/30 py-2 pl-8 pr-3 font-display text-sm text-charcoal placeholder:text-charcoal-soft/50 focus:border-teal focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Custom Code (optional — auto-generate if empty)</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. RK10OFF-SPECIAL"
                  className="w-full rounded-lg border border-charcoal/10 bg-ivory-deep/30 px-3 py-2 font-display text-sm text-charcoal placeholder:text-charcoal-soft/50 focus:border-teal focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Valid for (days)</label>
                <input
                  type="number"
                  value={form.validDays}
                  onChange={(e) => setForm((f) => ({ ...f, validDays: Number(e.target.value) }))}
                  min={1}
                  max={365}
                  className="w-full rounded-lg border border-charcoal/10 bg-ivory-deep/30 px-3 py-2 font-display text-sm text-charcoal focus:border-teal focus:outline-none"
                />
              </div>
              {formError && <p className="rounded-lg bg-marsala/10 px-3 py-2 font-display text-xs text-marsala">{formError}</p>}
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowCreate(false)} className="flex-1 rounded-full border border-charcoal/15 py-2 font-display text-xs font-semibold text-charcoal-soft hover:bg-charcoal/5">Cancel</button>
                <button onClick={createCoupon} disabled={creating || !form.guestEmail} className="flex-1 rounded-full bg-teal py-2 font-display text-xs font-semibold text-ivory hover:bg-teal-deep disabled:opacity-50">
                  {creating ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-charcoal/10 bg-white p-4">
        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center">
            <Ticket className="mx-auto h-10 w-10 text-charcoal-soft/20" />
            <p className="mt-2 font-display text-sm text-charcoal-soft">No coupons found</p>
            <p className="font-display text-xs text-charcoal-soft/60">Coupons are auto-generated on booking confirmation, or create one manually above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-display text-xs">
              <thead className="border-b border-charcoal/10 text-[10px] uppercase tracking-wider text-charcoal-soft">
                <tr>
                  <th className="py-2 pr-3">Code</th>
                  <th className="py-2 pr-3">Discount</th>
                  <th className="py-2 pr-3">Guest</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Valid Until</th>
                  <th className="py-2 pr-3">Booking</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/8">
                {filtered.map((c) => {
                  const status = getStatus(c);
                  return (
                    <tr key={c.id} className="group">
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-sm font-bold text-charcoal">{c.code}</span>
                          <button onClick={() => copyCode(c.code)} className="opacity-0 transition-opacity group-hover:opacity-100" title="Copy code">
                            <Copy className="h-3 w-3 text-charcoal-soft" />
                          </button>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 font-semibold text-teal">{c.discountPct}%</td>
                      <td className="py-2.5 pr-3 text-charcoal-soft">{c.createdByGuest}</td>
                      <td className="py-2.5 pr-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_STYLES[status]}`}>
                          {status}
                        </span>
                        {status === "active" && <span className="ml-1 text-[10px] text-charcoal-soft/60">({daysLeft(c.validUntil)}d left)</span>}
                      </td>
                      <td className="py-2.5 pr-3 text-charcoal-soft">{fmtDate(c.validUntil)}</td>
                      <td className="py-2.5 pr-3">
                        {c.createdByBookingRel ? (
                          <span className="font-mono text-[10px] text-charcoal-soft">{c.createdByBookingRel.referenceCode}</span>
                        ) : (
                          <span className="text-charcoal-soft/40">—</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => toggleActive(c.id, c.isActive)}
                            title={c.isActive ? "Deactivate" : "Activate"}
                            className={`rounded-full p-1.5 transition-colors ${c.isActive ? "text-teal hover:bg-teal/10" : "text-charcoal-soft/40 hover:bg-charcoal/5"}`}
                          >
                            {c.isActive ? <Power className="h-3.5 w-3.5" /> : <PowerOff className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={() => deleteCoupon(c.id)}
                            title="Delete"
                            className="rounded-full p-1.5 text-charcoal-soft/40 transition-colors hover:bg-marsala/10 hover:text-marsala"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
