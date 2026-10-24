import { db } from "@/lib/db";
import sharp from "sharp";

/**
 * brand-logo.ts — loads the owner's uploaded brand logo (SiteSetting
 * `logo_image_url`, e.g. /uploads/logo-transparent.webp) and converts it into
 * a transparent PNG.
 *
 * Why conversion: PDFKit only renders JPEG/PNG (no webp/SVG), and PNG is the
 * one raster format every email client renders. One helper serves both:
 *   - doc-pdf.ts  → invoice / voucher PDF headers (guest links + admin download)
 *   - booking-confirmation route → inline CID attachment in the guest email
 *
 * Result is cached per process, keyed by the source filename. Uploaded
 * filenames are content-hashes, so a fresh upload automatically gets a fresh
 * cache entry (new filename = cache miss).
 *
 * Returns null when the setting is empty, the asset is missing, or conversion
 * fails — callers fall back to the built-in RK monogram, so document
 * generation can never break because of a bad logo.
 */
const g = globalThis as any;
const CACHE_KEY = "__RK_BRAND_LOGO_CACHE__";

type Cfg = Record<string, string | undefined>;

export async function brandLogoPng(cfg: Cfg): Promise<Buffer | null> {
  const url = (cfg.logo_image_url || "").trim();
  if (!url) return null;

  // Relative /uploads/<name>.<ext> → stored in the MediaAsset table.
  // Absolute http(s) URLs are always fetched directly, even when their path
  // contains /uploads/ (that may be the same site over its public URL — the
  // DB row only answers reliably for same-process relative paths).
  const m = /^https?:\/\//i.test(url)
    ? null
    : url.match(/^\/uploads\/([\w.-]+\.(?:webp|png|jpe?g|avif|gif|bmp|tiff?))$/i);
  const key = (m ? m[1] : url).toLowerCase();
  const cache: { key: string; buf: Buffer | null } =
    g[CACHE_KEY] || (g[CACHE_KEY] = { key: "", buf: null });
  if (cache.key === key) return cache.buf;

  try {
    let raw: Buffer | null = null;

    if (m) {
      const asset = await db.mediaAsset.findUnique({
        where: { filename: m[1] },
        select: { data: true },
      });
      if (asset?.data) raw = Buffer.from(asset.data as unknown as Uint8Array);
    } else if (/^https?:\/\//i.test(url)) {
      // Absolute URL (external logo) — fetch it directly.
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (res.ok) raw = Buffer.from(await res.arrayBuffer());
    }

    if (!raw || raw.length === 0) {
      cache.key = key;
      cache.buf = null;
      return null;
    }

    const png = await sharp(raw)
      .resize(320, 320, { fit: "inside" })
      .png({ compressionLevel: 9 })
      .toBuffer();

    cache.key = key;
    cache.buf = png;
    return png;
  } catch (e) {
    console.error("[brand-logo] load/convert failed:", e);
    cache.key = key;
    cache.buf = null;
    return null;
  }
}
