import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import sharp from "sharp";
import { createHash } from "crypto";
import { mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 12 * 1024 * 1024; // 12 MB upload cap (raised from 8MB for high-res photos)

/**
 * Allowlist of image MIME types we accept. We deliberately include every
 * common raster format (PNG, JPG, WebP, GIF, AVIF, BMP, TIFF, ICO) plus
 * SVG (vector). Anything else is rejected with an error message.
 *
 * The browser may sometimes send a generic `application/octet-stream` MIME
 * for files it doesn't recognize (e.g. some SVG exports). We fall back to
 * inspecting the file extension in those cases.
 */
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/bmp",
  "image/tiff",
  "image/x-tiff",
  "image/svg+xml",
  "image/svg",
  "image/vnd.microsoft.icon",
  "image/x-icon",
  "image/heic",
  "image/heif",
]);

/** MIME types that sharp cannot process (kept as-is, no conversion). */
const PASS_THROUGH_MIME = new Set([
  "image/svg+xml",
  "image/svg",
]);

/** File extensions considered images (for fallback when MIME is generic). */
const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif|avif|bmp|tiff?|svg|ico|heic|heif)$/i;

/** Extensions kept as-is (no sharp conversion) — typically vector formats. */
const PASS_THROUGH_EXTENSIONS = /\.(svg|ico)$/i;

/**
 * Derive a sensible file extension from the original filename. Falls back
 * to 'webp' if the original had no extension or a non-image one.
 */
function extFor(name: string, mime: string): string {
  const lower = name.toLowerCase();
  const match = lower.match(/\.([a-z0-9]+)$/);
  if (match && IMAGE_EXTENSIONS.test(lower)) return match[1];
  // Derive from MIME if filename had no extension.
  if (mime === "image/jpeg" || mime === "image/jpg" || mime === "image/pjpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  if (mime === "image/avif") return "avif";
  if (mime === "image/bmp") return "bmp";
  if (mime === "image/tiff" || mime === "image/x-tiff") return "tiff";
  if (mime === "image/svg+xml" || mime === "image/svg") return "svg";
  if (mime === "image/vnd.microsoft.icon" || mime === "image/x-icon") return "ico";
  if (mime === "image/heic") return "heic";
  if (mime === "image/heif") return "heif";
  return "webp";
}

/**
 * POST /api/admin/upload
 * Multipart form-data with field `file` (single) or `files` (multiple).
 * Returns: { urls: string[] }  (each url is /uploads/<hash>.<ext>)
 *
 * Behavior:
 * - PNG/JPG/WEBP/GIF/AVIF/BMP/TIFF/HEIC/HEIF → converted to optimized WebP
 *   via sharp (max 1920px wide, quality 82). Saves ~25% bandwidth vs JPG.
 * - SVG and ICO → kept as-is (sharp cannot process them reliably).
 * - Filenames are content-hashed so duplicate uploads dedupe naturally.
 */
export async function POST(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const incoming: File[] = [];
  const single = form.get("file");
  if (single && typeof single !== "string") incoming.push(single as File);
  const multi = form.getAll("files").filter((f): f is File => typeof f !== "string");
  incoming.push(...multi);

  if (incoming.length === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // Ensure upload directory exists
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const urls: string[] = [];
  const errors: string[] = [];

  for (const file of incoming) {
    // Validate type — accept either by MIME or by extension (some browsers
    // send generic application/octet-stream for SVGs).
    const isAllowedMime = ALLOWED_MIME.has(file.type);
    const isAllowedExt = IMAGE_EXTENSIONS.test(file.name);
    if (!isAllowedMime && !isAllowedExt) {
      errors.push(`${file.name}: unsupported type ${file.type || "(unknown)"}. Accepted: PNG, JPG, WebP, GIF, AVIF, BMP, TIFF, SVG, ICO, HEIC.`);
      continue;
    }
    if (file.size > MAX_BYTES) {
      errors.push(`${file.name}: exceeds 12 MB limit`);
      continue;
    }
    try {
      const buf = Buffer.from(await file.arrayBuffer());
      // Content-hash so duplicate uploads dedupe naturally.
      const hash = createHash("sha256").update(buf).digest("hex").slice(0, 16);

      const isPassThrough =
        PASS_THROUGH_MIME.has(file.type) || PASS_THROUGH_EXTENSIONS.test(file.name);

      if (isPassThrough) {
        // SVG / ICO — save as-is, no conversion.
        const ext = extFor(file.name, file.type);
        const outName = `${hash}.${ext}`;
        const outPath = path.join(uploadDir, outName);
        const { writeFile } = await import("fs/promises");
        await writeFile(outPath, buf);
        urls.push(`/uploads/${outName}`);
      } else {
        // Raster image — convert to optimized WebP.
        const outName = `${hash}.webp`;
        const outPath = path.join(uploadDir, outName);
        await sharp(buf, { animated: file.type === "image/gif" })
          .resize({ width: 1920, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toFile(outPath);
        urls.push(`/uploads/${outName}`);
      }
    } catch (e) {
      console.error("[/api/admin/upload] sharp error:", e);
      errors.push(`${file.name}: processing failed — ${e instanceof Error ? e.message : "unknown error"}`);
    }
  }

  return NextResponse.json({ urls, errors });
}

/**
 * GET /api/admin/upload
 * Lists every file in /public/uploads so the Media Library can render them.
 */
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { readdir, stat } = await import("fs/promises");
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  let files: string[] = [];
  try {
    files = await readdir(uploadDir);
  } catch {
    files = [];
  }
  const out = await Promise.all(
    files
      .filter((f) => /\.(webp|jpe?g|png|gif|avif|bmp|tiff?|svg|ico|heic|heif)$/i.test(f))
      .map(async (f) => {
        const full = path.join(uploadDir, f);
        const s = await stat(full);
        return { name: f, url: `/uploads/${f}`, size: s.size, mtime: s.mtimeMs };
      })
  );
  out.sort((a, b) => b.mtime - a.mtime);
  return NextResponse.json({ files: out });
}

/**
 * DELETE /api/admin/upload?name=<filename>
 * Removes a single file from /public/uploads. Only the basename is allowed —
 * no path traversal.
 */
export async function DELETE(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { unlink } = await import("fs/promises");
  const url = new URL(req.url);
  const name = url.searchParams.get("name") || "";
  if (!/^[\w.-]+\.(webp|jpe?g|png|gif|avif|bmp|tiff?|svg|ico|heic|heif)$/i.test(name)) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }
  const full = path.join(process.cwd(), "public", "uploads", name);
  try {
    await unlink(full);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
