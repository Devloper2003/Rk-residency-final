/**
 * blog-utils.ts — pure helpers shared by the admin editor (client), the
 * admin API (server) and the public blog pages. No Prisma, no DOM:
 * everything here must run in both runtimes.
 *
 * Covers: slug generation, word/reading-time calculation, table-of-contents
 * extraction, internal-link detection, [VERIFY] marker counting and the
 * SEO checklist evaluation used by the editor panel.
 */

/** Lowercase, hyphen-separated, URL-safe slug from a title. */
export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** Stable DOM/anchor id for a heading (same rules as slugifyTitle). */
export function headingId(text: string): string {
  return slugifyTitle(text) || `section`;
}

/** Strip markdown-lite syntax so word counts reflect real prose. */
function stripMarkdown(body: string): string {
  return body
    .replace(/\[([^\]]*)\]\(([^)]*)\)/g, "$1") // links -> anchor text
    .replace(/^#{1,6}\s+/gm, "") // headings
    .replace(/^-\s+/gm, "") // list bullets
    .replace(/[*_`>]/g, ""); // emphasis / quotes
}

/** Real word count of a markdown body. */
export function countWords(body: string): number {
  const clean = stripMarkdown(body || "").trim();
  if (!clean) return 0;
  return clean.split(/\s+/).length;
}

/** First N words of a body (keyword-in-intro check). */
export function firstWords(body: string, n: number): string {
  return stripMarkdown(body || "").trim().split(/\s+/).slice(0, n).join(" ");
}

/**
 * Reading time at ~200 wpm, minimum 1 minute.
 * Used by the auto reading-time feature (manual override allowed).
 */
export function calcReadingMins(body: string): number {
  return Math.max(1, Math.round(countWords(body) / 200));
}

/** All `## ` headings in order. */
export function headingsFromBody(body: string): string[] {
  return (body || "")
    .split("\n")
    .filter((l) => /^##\s+/.test(l.trim()))
    .map((l) => l.trim().replace(/^##\s+/, ""))
    .filter(Boolean);
}

/**
 * Table of contents entries from `## ` headings, with unique anchor ids.
 * Used to render the auto-TOC on the public post page.
 */
export function tocFromBody(body: string): { id: string; text: string }[] {
  const used = new Map<string, number>();
  return headingsFromBody(body).map((text) => {
    const base = headingId(text);
    const n = used.get(base) || 0;
    used.set(base, n + 1);
    return { id: n === 0 ? base : `${base}-${n + 1}`, text };
  });
}

/** Internal links in the body, as markdown `[text](/path)`. */
export function internalLinksInBody(body: string): string[] {
  const out: string[] = [];
  const re = /\[[^\]]*\]\((\/[^)\s]*)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body || ""))) out.push(m[1]);
  return out;
}

/** Number of [VERIFY] markers left in the body (blocks publishing). */
export function countVerifyMarkers(body: string): number {
  return ((body || "").match(/\[VERIFY\]/g) || []).length;
}

/** Lines containing [VERIFY] (1-based, for the editor's review panel). */
export function verifyMarkerLines(body: string): { line: number; text: string }[] {
  const out: { line: number; text: string }[] = [];
  (body || "").split("\n").forEach((l, i) => {
    if (l.includes("[VERIFY]")) out.push({ line: i + 1, text: l.trim().slice(0, 160) });
  });
  return out;
}

/** Trim to a max length without cutting mid-word, appending "…" when cut. */
export function clampText(text: string, max: number): string {
  const clean = (text || "").trim().replace(/\s+/g, " ");
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.5 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

/**
 * Public visibility filter (Task 3 / scheduling).
 *
 * A post is PUBLIC only when it is actually live:
 *   - status is PUBLISHED (or, for rows written before the status column
 *     existed, the legacy `published` boolean is true), AND
 *   - its publishedAt is not in the future (a scheduled post must never
 *     appear in the blog list, the sitemap or the public HTML).
 *
 * `status` stays in sync with `published` on every write, so filtering on
 * `published` keeps legacy rows visible with zero regression window while
 * the status column is the UI/scheduler source of truth.
 */
export function publicPostWhere(now: Date = new Date()) {
  return {
    published: true,
    OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
  };
}

/** UI-facing status of a row, tolerating pre-migration rows. */
export function effectiveStatus(post: { status?: string | null; published: boolean }): "DRAFT" | "SCHEDULED" | "PUBLISHED" {
  if (post.status === "SCHEDULED") return "SCHEDULED";
  if (post.status === "PUBLISHED") return "PUBLISHED";
  return post.published ? "PUBLISHED" : "DRAFT";
}

// ---------------------------------------------------------------------------
// SEO checklist (Task 2) — evaluated live in the editor, pure function.
// ---------------------------------------------------------------------------

export type ChecklistItem = {
  id: string;
  label: string;
  pass: boolean;
  info: string; // human-readable detail, e.g. "842 words"
};

export type ChecklistInput = {
  title: string;
  targetKeyword: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  body: string;
  imageUrl: string | null;
  coverAlt: string;
  coverWidth?: number | null;
  coverHeight?: number | null;
};

/** Validate that a cover image is (approximately) 1600×900. */
export function coverIs1600x900(w?: number | null, h?: number | null): boolean {
  if (!w || !h) return false;
  // Allow a small tolerance (±40px) — designers deliver 1600×900 but a few
  // pixels of cropping should not fail the checklist.
  return Math.abs(w - 1600) <= 40 && Math.abs(h - 900) <= 40;
}

export function evaluateChecklist(input: ChecklistInput): ChecklistItem[] {
  const kw = (input.targetKeyword || "").trim().toLowerCase();
  const title = (input.title || "").toLowerCase();
  const words = countWords(input.body);
  const headings = headingsFromBody(input.body).length;
  const links = internalLinksInBody(input.body).length;
  const metaTitleLen = (input.metaTitle || "").trim().length;
  const metaDescLen = (input.metaDescription || "").trim().length;

  return [
    {
      id: "kw-title",
      label: "Target keyword in the title",
      pass: !!kw && title.includes(kw),
      info: kw ? (title.includes(kw) ? `found "${input.targetKeyword.trim()}"` : `missing "${input.targetKeyword.trim()}"`) : "no keyword set",
    },
    {
      id: "kw-intro",
      label: "Target keyword in the first 100 words",
      pass: !!kw && firstWords(input.body, 100).toLowerCase().includes(kw),
      info: kw
        ? firstWords(input.body, 100).toLowerCase().includes(kw)
          ? "found in intro"
          : "not in first 100 words"
        : "no keyword set",
    },
    {
      id: "meta-title",
      label: "Meta title within 60 chars",
      pass: metaTitleLen > 0 && metaTitleLen <= 60,
      info: `${metaTitleLen}/60 chars`,
    },
    {
      id: "meta-desc",
      label: "Meta description within 155 chars",
      pass: metaDescLen > 0 && metaDescLen <= 155,
      info: `${metaDescLen}/155 chars`,
    },
    {
      id: "internal-links",
      label: "At least 2 internal links in the body",
      pass: links >= 2,
      info: `${links} internal link${links === 1 ? "" : "s"}`,
    },
    {
      id: "cover",
      label: "Cover image with alt text, 1600×900",
      pass: !!input.imageUrl && !!input.coverAlt.trim() && coverIs1600x900(input.coverWidth, input.coverHeight),
      info: [
        input.imageUrl ? "image set" : "no image",
        input.coverAlt.trim() ? "alt set" : "no alt",
        coverIs1600x900(input.coverWidth, input.coverHeight) ? "1600×900" : input.coverWidth ? `${input.coverWidth}×${input.coverHeight}` : "size unknown",
      ].join(" · "),
    },
    {
      id: "word-count",
      label: "Word count above 800",
      pass: words > 800,
      info: `${words} words`,
    },
    {
      id: "headings",
      label: "At least 3 ## headings",
      pass: headings >= 3,
      info: `${headings} heading${headings === 1 ? "" : "s"}`,
    },
    {
      id: "excerpt",
      label: "Excerpt present",
      pass: !!input.excerpt.trim(),
      info: input.excerpt.trim() ? `${input.excerpt.trim().length} chars` : "empty",
    },
  ];
}
