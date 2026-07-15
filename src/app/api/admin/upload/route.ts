import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import sharp from "sharp";
import { createHash } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB upload cap
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

/**
 * POST /api/admin/upload
 * Multipart form-data with field `file` (single) or `files` (multiple).
 * Returns: { urls: string[] }  (each url is /uploads/<id>.webp)
 *
 * Each image is normalized via sharp: max width 1600px, webp quality 80,
 * and stored under /public/uploads/. Filenames are content-hashed so the
 * same upload doesn't create duplicates.
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
    if (!ALLOWED.has(file.type)) {
      errors.push(`${file.name}: unsupported type ${file.type}`);
      continue;
    }
    if (file.size > MAX_BYTES) {
      errors.push(`${file.name}: exceeds 8 MB limit`);
      continue;
    }
    try {
      const buf = Buffer.from(await file.arrayBuffer());
      // Content-hash so duplicate uploads dedupe naturally.
      const hash = createHash("sha256").update(buf).digest("hex").slice(0, 16);
      const outName = `${hash}.webp`;
      const outPath = path.join(uploadDir, outName);
      await sharp(buf)
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outPath);
      urls.push(`/uploads/${outName}`);
    } catch (e) {
      console.error("[/api/admin/upload] sharp error:", e);
      errors.push(`${file.name}: processing failed`);
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
      .filter((f) => /\.(webp|jpg|jpeg|png|gif|avif)$/i.test(f))
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
  if (!/^[\w.-]+\.(webp|jpg|jpeg|png|gif|avif)$/i.test(name)) {
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
