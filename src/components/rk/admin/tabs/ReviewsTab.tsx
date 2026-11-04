"use client";
import { useEffect, useState, useCallback } from "react";
import { Star, Inbox, Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { adminApi, LoadingSpinner } from "./_shared";
import { ImageUploader } from "../ImageUploader";
import { refreshSiteContent } from "@/lib/site-content";
import { toast } from "sonner";

type ReviewRow = {
  id: string;
  guestName: string;
  guestLocation: string | null;
  rating: number;
  title: string;
  body: string;
  source: string;
  verified: boolean;
  approved: boolean;
  avatarUrl: string | null;
  createdAt: string;
};

type FormState = {
  guestName: string;
  guestLocation: string;
  rating: number;
  title: string;
  body: string;
  source: string;
  avatarUrl: string | null;
  verified: boolean;
};

const EMPTY_FORM: FormState = {
  guestName: "",
  guestLocation: "",
  rating: 5,
  title: "",
  body: "",
  source: "GOOGLE",
  avatarUrl: null,
  verified: true,
};

const SOURCE_OPTIONS = [
  { value: "GOOGLE", label: "Google" },
  { value: "DIRECT", label: "Direct guest" },
  { value: "TRIPADVISOR", label: "TripAdvisor" },
];

function Avatar({ r, size = 40 }: { r: { guestName: string; avatarUrl?: string | null }; size?: number }) {
  if (r.avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={r.avatarUrl}
        alt={r.guestName}
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full bg-teal/10 font-serif font-semibold text-teal"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {r.guestName.charAt(0).toUpperCase()}
    </div>
  );
}

function ReviewForm({
  initial,
  editingId,
  saving,
  onSave,
  onClose,
}: {
  initial: FormState;
  editingId: string | null;
  saving: boolean;
  onSave: (form: FormState, editingId: string | null) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((p) => ({ ...p, [k]: v }));
  const valid = form.guestName.trim().length >= 2 && form.title.trim().length >= 3 && form.body.trim().length >= 10;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-charcoal/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-charcoal/10 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-serif text-lg font-semibold text-charcoal">
            {editingId ? "Edit review" : "Add a review"}
          </h3>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-charcoal/15 text-charcoal-soft hover:bg-ivory-deep/40">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block font-display text-xs font-semibold text-charcoal">Guest name *</span>
              <input
                value={form.guestName}
                onChange={(e) => set("guestName", e.target.value)}
                placeholder="e.g. Rakesh Thakur"
                className="w-full rounded-lg border border-charcoal/15 bg-ivory-deep/30 px-3 py-2 font-display text-sm text-charcoal focus:border-teal focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-display text-xs font-semibold text-charcoal">Location (optional)</span>
              <input
                value={form.guestLocation}
                onChange={(e) => set("guestLocation", e.target.value)}
                placeholder="e.g. Delhi, India"
                className="w-full rounded-lg border border-charcoal/15 bg-ivory-deep/30 px-3 py-2 font-display text-sm text-charcoal focus:border-teal focus:outline-none"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="mb-1 block font-display text-xs font-semibold text-charcoal">Rating *</span>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button key={i} type="button" onClick={() => set("rating", i + 1)} aria-label={`${i + 1} star`}>
                    <Star className={`h-6 w-6 transition-transform hover:scale-110 ${i < form.rating ? "fill-gold text-gold" : "text-charcoal/25"}`} />
                  </button>
                ))}
              </div>
            </div>
            <label className="block">
              <span className="mb-1 block font-display text-xs font-semibold text-charcoal">Source</span>
              <select
                value={form.source}
                onChange={(e) => set("source", e.target.value)}
                className="w-full rounded-lg border border-charcoal/15 bg-ivory-deep/30 px-3 py-2 font-display text-sm text-charcoal focus:border-teal focus:outline-none"
              >
                {SOURCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block font-display text-xs font-semibold text-charcoal">Title *</span>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Clean rooms and warm staff"
              className="w-full rounded-lg border border-charcoal/15 bg-ivory-deep/30 px-3 py-2 font-display text-sm text-charcoal focus:border-teal focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1 block font-display text-xs font-semibold text-charcoal">Review text *</span>
            <textarea
              value={form.body}
              onChange={(e) => set("body", e.target.value)}
              rows={5}
              placeholder="Write the guest's review here…"
              className="w-full rounded-lg border border-charcoal/15 bg-ivory-deep/30 px-3 py-2 font-display text-sm text-charcoal focus:border-teal focus:outline-none"
            />
          </label>

          <div>
            <span className="mb-1 block font-display text-xs font-semibold text-charcoal">
              Guest photo (optional — shown beside the review on the website)
            </span>
            <ImageUploader
              value={form.avatarUrl}
              onChange={(v) => set("avatarUrl", (v as string) || null)}
              compact
              hint="Square photo works best. Leave empty to show the guest's initial."
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.verified}
              onChange={(e) => set("verified", e.target.checked)}
              className="h-4 w-4 accent-teal"
            />
            <span className="font-display text-xs text-charcoal">Verified stay (shows the teal badge on the website)</span>
          </label>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-full border border-charcoal/15 px-4 py-2 font-display text-xs font-semibold text-charcoal-soft hover:bg-ivory-deep/40">
            Cancel
          </button>
          <button
            onClick={() => onSave(form, editingId)}
            disabled={!valid || saving}
            className="flex items-center gap-1.5 rounded-full bg-teal px-5 py-2 font-display text-xs font-semibold text-ivory disabled:opacity-40 hover:bg-teal-deep"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {editingId ? "Save changes" : "Publish review"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ReviewsTab() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; editing: ReviewRow | null }>({ open: false, editing: null });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ReviewRow | null>(null);

  const reload = useCallback(() => {
    adminApi.get("reviews").then((d) => {
      if (d) setReviews(d.reviews || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let c = false;
    adminApi.get("reviews").then((d) => {
      if (c) return;
      if (d) setReviews(d.reviews || []);
      setLoading(false);
    }).catch(() => setLoading(false));
    return () => { c = true; };
  }, []);

  const toggle = async (id: string, action: "APPROVE" | "HIDE") => {
    try {
      const res = await adminApi.patch("review", { id, reviewAction: action });
      if (res) {
        toast.success(action === "APPROVE" ? "Review approved" : "Review hidden");
        refreshSiteContent();
        reload();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    }
  };

  const save = async (form: FormState, editingId: string | null) => {
    setSaving(true);
    try {
      const payload = {
        guestName: form.guestName,
        guestLocation: form.guestLocation,
        rating: form.rating,
        title: form.title,
        body: form.body,
        source: form.source,
        avatarUrl: form.avatarUrl || "",
        verified: form.verified,
      };
      const res = editingId
        ? await adminApi.patch("review_update", { id: editingId, ...payload })
        : await adminApi.patch("review_create", payload);
      if (res) {
        toast.success(editingId ? "Review updated — live on website" : "Review published — live on website");
        refreshSiteContent();
        setModal({ open: false, editing: null });
        reload();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async (r: ReviewRow) => {
    setSaving(true);
    try {
      const res = await adminApi.patch("review_delete", { id: r.id });
      if (res) {
        toast.success("Review deleted");
        refreshSiteContent();
        setConfirmDelete(null);
        reload();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      {/* Header + Add Review */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal/20 bg-teal/5 p-4">
        <p className="font-display text-sm text-charcoal-soft">
          <strong className="text-teal">{reviews.length} reviews</strong> — approved reviews appear on the
          website homepage. Google-source reviews show in the guest voices section.
        </p>
        <button
          onClick={() => setModal({ open: true, editing: null })}
          className="flex items-center gap-1.5 rounded-full bg-teal px-4 py-2 font-display text-xs font-semibold text-ivory hover:bg-teal-deep"
        >
          <Plus className="h-4 w-4" /> Add Review
        </button>
      </div>

      {reviews.length === 0 && (
        <div className="rounded-2xl border border-dashed border-charcoal/15 bg-white p-12 text-center">
          <Inbox className="mx-auto h-10 w-10 text-charcoal-soft/40" />
          <p className="mt-2 font-serif text-base font-semibold text-charcoal">No reviews yet</p>
          <p className="mt-1 font-display text-xs text-charcoal-soft">
            Use the Add Review button above, or approve guest submissions, to show reviews on the website.
          </p>
        </div>
      )}

      <div className="grid gap-3">
        {reviews.map((r) => (
          <div key={r.id} className={`rounded-2xl border bg-white p-4 ${r.approved ? "border-teal/30" : "border-marsala/30"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <Avatar r={r} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-gold text-gold" : "text-charcoal/20"}`} />)}</div>
                    <h4 className="font-serif text-sm font-semibold text-charcoal">{r.title}</h4>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.approved ? "bg-teal/10 text-teal" : "bg-marsala/10 text-marsala"}`}>{r.approved ? "Live" : "Pending"}</span>
                  </div>
                  <p className="mt-1.5 font-display text-xs leading-relaxed text-charcoal-soft">{r.body}</p>
                  <div className="mt-2 font-display text-[10px] text-charcoal-soft">
                    — {r.guestName} {r.guestLocation && `· ${r.guestLocation}`} · {r.source}
                    {r.verified && " · Verified"}
                    {r.avatarUrl && " · 📷 photo"}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                {r.approved
                  ? <button onClick={() => toggle(r.id, "HIDE")} className="rounded-full border border-marsala/30 px-3 py-1 text-[10px] font-semibold text-marsala hover:bg-marsala hover:text-ivory">Hide</button>
                  : <button onClick={() => toggle(r.id, "APPROVE")} className="rounded-full border border-teal/30 px-3 py-1 text-[10px] font-semibold text-teal hover:bg-teal hover:text-ivory">Approve</button>}
                <button onClick={() => setModal({ open: true, editing: r })} className="flex items-center justify-center gap-1 rounded-full border border-charcoal/15 px-3 py-1 text-[10px] font-semibold text-charcoal-soft hover:bg-ivory-deep/40">
                  <Pencil className="h-3 w-3" /> Edit
                </button>
                <button onClick={() => setConfirmDelete(r)} className="flex items-center justify-center gap-1 rounded-full border border-charcoal/15 px-3 py-1 text-[10px] font-semibold text-charcoal-soft hover:border-marsala hover:bg-marsala hover:text-ivory">
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit modal */}
      {modal.open && (
        <ReviewForm
          initial={modal.editing
            ? {
                guestName: modal.editing.guestName,
                guestLocation: modal.editing.guestLocation || "",
                rating: modal.editing.rating,
                title: modal.editing.title,
                body: modal.editing.body,
                source: modal.editing.source,
                avatarUrl: modal.editing.avatarUrl,
                verified: modal.editing.verified,
              }
            : EMPTY_FORM}
          editingId={modal.editing?.id || null}
          saving={saving}
          onSave={save}
          onClose={() => setModal({ open: false, editing: null })}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-charcoal/40 p-4 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-serif text-base font-semibold text-charcoal">Delete this review?</h3>
            <p className="mt-2 font-display text-xs leading-relaxed text-charcoal-soft">
              &ldquo;{confirmDelete.title}&rdquo; by {confirmDelete.guestName} will be removed from the website permanently.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)} className="rounded-full border border-charcoal/15 px-4 py-2 font-display text-xs font-semibold text-charcoal-soft hover:bg-ivory-deep/40">Cancel</button>
              <button disabled={saving} onClick={() => doDelete(confirmDelete)} className="flex items-center gap-1.5 rounded-full bg-marsala px-4 py-2 font-display text-xs font-semibold text-ivory hover:opacity-90 disabled:opacity-50">
                {saving && <Loader2 className="h-3 w-3 animate-spin" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
