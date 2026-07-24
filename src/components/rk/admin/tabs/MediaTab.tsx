"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Trash2, Copy, ImageIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminFetch, LoadingSpinner, ErrorState } from "./_shared";
import { refreshSiteContent } from "@/lib/site-content";
import { ImageUploader } from "../ImageUploader";
import { getAdminToken } from "@/lib/admin-client";
import { toast } from "sonner";

type MediaFile = { name: string; url: string; size: number; mtime: number };

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function MediaTab() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setRefreshing(true);
    setError(false);
    const token = getAdminToken();
    try {
      const res = await fetch("/api/admin/upload", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setFiles(data.files || []);
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const del = async (name: string) => {
    const token = getAdminToken();
    try {
      const res = await fetch(`/api/admin/upload?name=${encodeURIComponent(name)}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success("File deleted");
      setConfirmDel(null);
      refreshSiteContent();
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const copy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(url);
    toast.success("URL copied");
    setTimeout(() => setCopied(null), 1500);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState title="Could not load media" message="Try again." onRetry={reload} />;

  const totalSize = files.reduce((s, f) => s + f.size, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-teal/20 bg-teal/5 p-4">
        <p className="font-display text-sm text-charcoal-soft">
          <strong className="text-teal">Media Library.</strong> All uploaded images live here. Copy the URL to embed anywhere — room galleries, blog covers, offers, or page content.
        </p>
      </div>

      <ImageUploader
        label="Upload new images"
        multiple
        value={[]}
        onChange={() => reload()}
        hint="Images are converted to WebP (max 1600px wide) and content-hashed so duplicates dedupe automatically."
      />

      <div className="flex items-center justify-between">
        <p className="font-display text-sm text-charcoal-soft">
          {files.length} file{files.length === 1 ? "" : "s"} · {fmtSize(totalSize)} total
        </p>
        <Button onClick={() => reload()} disabled={refreshing} variant="outline" size="sm" className="rounded-lg">
          <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {files.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-charcoal/15 bg-white p-12 text-center">
          <ImageIcon className="mx-auto h-10 w-10 text-charcoal-soft/40" />
          <p className="mt-2 font-serif text-base font-semibold text-charcoal">No uploads yet</p>
          <p className="mt-1 font-display text-xs text-charcoal-soft">Use the uploader above to add your first image.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {files.map((f) => (
            <div key={f.name} className="overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-sm transition-shadow hover:shadow-md">
              <div className="relative aspect-square bg-ivory-deep">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.url} alt={f.name} className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-charcoal/70 to-transparent p-2 opacity-0 transition-opacity hover:opacity-100">
                  <div className="flex gap-1.5">
                    <button onClick={() => copy(f.url)} className="grid h-7 w-7 place-items-center rounded-lg bg-ivory/90 text-charcoal hover:bg-ivory" title="Copy URL">
                      {copied === f.url ? <Check className="h-3.5 w-3.5 text-teal" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => setConfirmDel(f.name)} className="grid h-7 w-7 place-items-center rounded-lg bg-ivory/90 text-marsala hover:bg-marsala hover:text-ivory" title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-2">
                <div className="truncate font-mono text-[10px] text-charcoal-soft" title={f.name}>{f.name}</div>
                <div className="mt-0.5 flex items-center justify-between font-display text-[10px] text-charcoal-soft/70">
                  <span>{fmtSize(f.size)}</span>
                  <span>{fmtDate(f.mtime).split(",")[0]}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDel && (
        <div className="fixed inset-0 z-[95] grid place-items-center bg-charcoal/70 p-4 backdrop-blur-sm" onClick={() => setConfirmDel(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-ivory p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-marsala/10 text-marsala"><Trash2 className="h-4 w-4" /></span>
              <h3 className="font-serif text-base font-semibold text-charcoal">Delete this file?</h3>
            </div>
            <p className="mb-1 font-display text-xs text-charcoal-soft">This will permanently delete:</p>
            <p className="mb-4 break-all rounded-md bg-ivory-deep px-2 py-1.5 font-mono text-[11px] text-charcoal">{confirmDel}</p>
            <p className="mb-4 font-display text-[11px] text-charcoal-soft">Any page, room, offer, or blog post still using this URL will show a broken image.</p>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setConfirmDel(null)} variant="outline" size="sm" className="rounded-full">Cancel</Button>
              <Button onClick={() => del(confirmDel)} size="sm" className="rounded-full bg-marsala text-ivory hover:bg-marsala-deep">Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
