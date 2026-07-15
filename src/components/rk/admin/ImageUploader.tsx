"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, X, Image as ImageIcon, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getAdminToken } from "@/lib/admin-client";

type Props = {
  /** Single-image mode: value is a string (URL or null). multiple mode: value is string[]. */
  value?: string | string[] | null;
  multiple?: boolean;
  onChange: (v: string | string[] | null) => void;
  /** Optional label above the dropzone. */
  label?: string;
  /** Optional hint text under the dropzone. */
  hint?: string;
  /** Compact mode renders smaller thumbnails (for cards / inline pickers). */
  compact?: boolean;
};

/**
 * ImageUploader — drag-and-drop image picker wired to /api/admin/upload.
 *
 * - In single mode: shows one preview + "Replace" + "Remove" buttons.
 * - In multiple mode: shows a thumbnail grid with reordering via remove + add.
 * - Falls back to a URL text input if the admin wants to paste an external URL.
 *
 * Auth: sends the admin bearer token (same as adminFetch) so the upload
 * endpoint can verifyAdmin().
 */
export function ImageUploader({ value, multiple = false, onChange, label, hint, compact }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");

  const list: string[] = Array.isArray(value)
    ? value
    : value
    ? [value]
    : [];

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (arr.length === 0) return;
    setUploading(true);
    try {
      const fd = new FormData();
      arr.forEach((f) => fd.append("files", f, f.name));
      const token = getAdminToken();
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      const got: string[] = data.urls || [];
      if (got.length === 0) throw new Error("No files uploaded");
      if (multiple) {
        onChange([...list, ...got]);
      } else {
        onChange(got[0]);
      }
      if (data.errors?.length) toast.warning(data.errors.join("; "));
      else toast.success(`${got.length} image${got.length === 1 ? "" : "s"} uploaded`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }, [list, multiple, onChange]);

  const removeAt = (idx: number) => {
    if (multiple) {
      const next = list.filter((_, i) => i !== idx);
      onChange(next);
    } else {
      onChange(null);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  };

  const size = compact ? "h-20 w-20" : "h-28 w-28";
  const dropHeight = compact ? "py-3" : "py-8";

  return (
    <div>
      {label && (
        <div className="mb-1.5 flex items-center justify-between">
          <label className="font-display text-[10px] uppercase tracking-wider text-charcoal-soft">{label}</label>
          <button
            type="button"
            onClick={() => setShowUrlInput((s) => !s)}
            className="font-display text-[10px] uppercase tracking-wider text-teal hover:underline"
          >
            {showUrlInput ? "Hide URL input" : "Paste URL instead"}
          </button>
        </div>
      )}

      {showUrlInput && (
        <div className="mb-2 flex gap-2">
          <input
            type="url"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="https://images.unsplash.com/…"
            className="flex-1 rounded-md border border-charcoal/15 bg-ivory-deep/30 px-3 py-2 font-display text-xs text-charcoal"
          />
          <button
            type="button"
            onClick={() => {
              if (!urlDraft.trim()) return;
              if (multiple) onChange([...list, urlDraft.trim()]);
              else onChange(urlDraft.trim());
              setUrlDraft("");
              setShowUrlInput(false);
            }}
            className="rounded-md bg-teal px-3 py-1.5 font-display text-xs font-semibold text-ivory hover:bg-teal-deep"
          >
            Add
          </button>
        </div>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition-colors",
          dragging ? "border-teal bg-teal/5" : "border-charcoal/15 bg-ivory-deep/20 hover:border-teal/40 hover:bg-teal/5",
          dropHeight,
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {uploading ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-teal" />
            <p className="mt-1 font-display text-[10px] uppercase tracking-wider text-charcoal-soft">Uploading…</p>
          </>
        ) : (
          <>
            <Upload className={cn("text-charcoal-soft", compact ? "h-4 w-4" : "h-5 w-5")} />
            <p className="mt-1 font-display text-[10px] uppercase tracking-wider text-charcoal-soft">
              {multiple ? "Drop images or click to upload" : "Drop image or click to upload"}
            </p>
            {!compact && <p className="font-display text-[10px] text-charcoal-soft/70">PNG · JPG · WebP · max 8 MB · converted to WebP</p>}
          </>
        )}
      </div>

      {list.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {list.map((url, idx) => (
            <div key={url + idx} className={cn("group relative overflow-hidden rounded-xl border border-charcoal/15 bg-white", size)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeAt(idx); }}
                className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-charcoal/70 text-ivory opacity-0 transition-opacity hover:bg-marsala group-hover:opacity-100"
                title="Remove"
              >
                <X className="h-3 w-3" />
              </button>
              {multiple && (
                <span className="absolute bottom-1 left-1 rounded bg-charcoal/70 px-1 font-mono text-[9px] text-ivory">
                  {idx + 1}
                </span>
              )}
            </div>
          ))}
          {multiple && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className={cn("grid place-items-center rounded-xl border-2 border-dashed border-charcoal/15 text-charcoal-soft hover:border-teal/40 hover:text-teal", size)}
              title="Add more"
            >
              <Plus className="h-5 w-5" />
            </button>
          )}
        </div>
      )}

      {list.length === 0 && !uploading && (
        <div className={cn("mt-2 flex items-center gap-1.5 font-display text-[10px] text-charcoal-soft/70", compact && "hidden")}>
          <ImageIcon className="h-3 w-3" />
          <span>{hint || (multiple ? "No images selected yet." : "No image selected.")}</span>
        </div>
      )}
    </div>
  );
}
