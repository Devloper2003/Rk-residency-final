"use client";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { adminApi, LoadingSpinner } from "./_shared";

export function AuditTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let c = false;
    adminApi.get("data").then((data) => {
      if (c || !data) { setLoading(false); return; }
      setLogs(data.auditLogs || []);
      setLoading(false);
    });
    return () => { c = true; };
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="rounded-2xl border border-charcoal/10 bg-white p-5">
      <div className="mb-4 flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-teal" /><h3 className="font-serif text-base font-semibold text-charcoal">{logs.length} recent actions</h3></div>
      <div className="scrollbar-thin max-h-[65vh] space-y-1 overflow-y-auto font-mono text-[11px]">
        {logs.map((l) => (
          <div key={l.id} className="flex items-start gap-3 border-b border-charcoal/5 py-2 last:border-0">
            <span className="shrink-0 text-charcoal-soft">{new Date(l.createdAt).toLocaleString("en-IN",{dateStyle:"short",timeStyle:"short"})}</span>
            <span className="shrink-0 rounded bg-gold/15 px-1.5 py-0.5 font-semibold text-gold-deep">{l.action}</span>
            <span className="flex-1 text-charcoal">{l.details}{l.admin&&<span className="text-charcoal-soft"> · by {l.admin.name}</span>}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
