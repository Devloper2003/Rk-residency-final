"use client";

import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminApi, adminFetch, getAdmin } from "@/lib/admin-client";

export { adminApi, adminFetch, getAdmin };

export function LoadingSpinner() {
  return <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-teal" /></div>;
}

export function ErrorState({ title, message, onRetry }: { title: string; message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-marsala/30 bg-marsala/5 p-8 text-center">
      <p className="font-serif text-lg font-semibold text-marsala">{title}</p>
      <p className="mt-1 font-display text-sm text-charcoal-soft">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} className="mt-4 rounded-full bg-teal px-5 py-2 text-ivory hover:bg-teal-deep">
          <Loader2 className="mr-2 h-4 w-4" /> Retry
        </Button>
      )}
    </div>
  );
}

export function KpiCard({ icon: Icon, label, value, sub, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub?: string; accent: "teal" | "gold" | "marsala" }) {
  const color = accent === "gold" ? "bg-gold/10 text-gold-deep" : accent === "marsala" ? "bg-marsala/10 text-marsala" : "bg-teal/10 text-teal";
  return (
    <div className="rounded-2xl border border-charcoal/10 bg-white p-4">
      <div className="mb-2 flex items-center justify-between"><span className={`grid h-9 w-9 place-items-center rounded-full ${color}`}><Icon className="h-4 w-4" /></span></div>
      <div className="font-serif text-2xl font-bold text-charcoal">{value}</div>
      <div className="font-display text-[10px] uppercase tracking-wider text-charcoal-soft">{label}</div>
      {sub && <div className="mt-1 font-display text-[10px] text-charcoal-soft">{sub}</div>}
    </div>
  );
}

export function Field({ label, value, onChange, type = "text", textarea }: { label: string; value: any; onChange: (v: string) => void; type?: string; textarea?: boolean }) {
  return (
    <div>
      <Label className="mb-1 block font-display text-[10px] uppercase tracking-wider text-charcoal-soft">{label}</Label>
      {textarea ? <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full rounded-md border border-charcoal/15 bg-ivory-deep/30 px-3 py-2 font-display text-xs text-charcoal" /> : <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="bg-ivory-deep/30" />}
    </div>
  );
}

export function ActionBtn({ label, icon: Icon, onClick, color = "teal" }: { label: string; icon: React.ComponentType<{ className?: string }>; onClick: () => void; color?: "teal" | "marsala" }) {
  const c = color === "marsala" ? "border-marsala/30 text-marsala hover:bg-marsala hover:text-ivory" : "border-teal/30 text-teal hover:bg-teal hover:text-ivory";
  return <button onClick={onClick} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold transition-colors ${c}`} title={label}><Icon className="h-3 w-3" /><span className="hidden sm:inline">{label}</span></button>;
}
