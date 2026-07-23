import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import sharp from "sharp";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 12 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg","image/jpg","image/pjpeg","image/png","image/webp",
  "image/gif","image/avif","image/bmp","image/tiff","image/x-tiff",
  "image/svg+xml","image/svg","image/vnd.microsoft.icon","image/x-icon",
  "image/heic","image/heif",
]);
const PASS_THROUGH_MIME = new Set(["image/svg+xml","image/svg"]);
const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif|avif|bmp|tiff?|svg|ico|heic|heif)$/i;
const PASS_THROUGH_EXTENSIONS = /\.(svg|ico)$/i;

function extFor(name: string, mime: string): string {
  const lower = name.toLowerCase();
  const match = lower.match(/\.([a-z0-9]+)$/);
  if (match && IMAGE_EXTENSIONS.test(lower)) return match[1];
  if (mime === "image/svg+xml" || mime === "image/svg") return "svg";
  if (mime === "image/vnd.microsoft.icon" || mime === "image/x-icon") return "ico";
  return "webp";
}

export async function POST(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let form: FormData;
  try { form = await req.formData(); }
  catch { return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 }); }

  const incoming: File[] = [];
  const single = form.get("file");
  if (single && typeof single !== "string") incoming.push(single as File);
  const multi = form.getAll("files").filter((f): f is File => typeof f !== "string");
  incoming.push(...multi);

  if (incoming.length === 0) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const urls: string[] = [];
  const errors: string[] = [];

  for (const file of incoming) {
    const isAllowedMime = ALLOWED_MIME.has(file.type);
    const isAllowedExt = IMAGE_EXTENSIONS.test(file.name);
    if (!isAllowedMime && !isAllowedExt) {
      errors.push(`${file.name}: unsupported type. Accepted: PNG, JPG, WebP, GIF, SVG, etc.`);
      continue;
    }
    if (file.size > MAX_BYTES) {
      errors.push(`${file.name}: exceeds 12 MB limit`);
      continue;
    }
    try {
      const buf = Buffer.from(await file.arrayBuffer());
      const hash = createHash("sha256").update(buf).digest("hex").slice(0, 16);
      const isPassThrough = PASS_THROUGH_MIME.has(file.type) || PASS_THROUGH_EXTENSIONS.test(file.name);

      let finalBuf: Buffer;
      let ext: string;
      let mimeType: string;

      if (isPassThrough) {
        finalBuf = buf;
        ext = extFor(file.name, file.type);
        mimeType = file.type || "image/svg+xml";
      } else {
        try {
          finalBuf = await sharp(buf, { animated: file.type === "image/gif" })
            .resize({ width: 1920, withoutEnlargement: true })
            .webp({ quality: 82 })
            .toBuffer();
          ext = "webp";
          mimeType = "image/webp";
        } catch {
          finalBuf = buf;
          ext = extFor(file.name, file.type);
          mimeType = file.type || "image/jpeg";
          errors.push(`${file.name}: conversion failed, saved original.`);
        }
      }

      const filename = `${hash}.${ext}`;
      const existing = await db.mediaAsset.findUnique({ where: { filename }, select: { id: true } });
      if (!existing) {
        await db.mediaAsset.create({ data: { filename, mimeType, data: new Uint8Array(finalBuf), size: finalBuf.length } });
      }
      urls.push(`/uploads/${filename}`);
    } catch (e) {
      console.error("[/api/admin/upload] error:", e);
      errors.push(`${file.name}: ${e instanceof Error ? e.message : "processing failed"}`);
    }
  }

  return NextResponse.json({ urls, errors });
}

export async function GET(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const assets = await db.mediaAsset.findMany({
    select: { filename: true, size: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  const files = assets.map((a) => ({
    name: a.filename, url: `/uploads/${a.filename}`, size: a.size, mtime: a.createdAt.getTime(),
  }));
  return NextResponse.json({ files });
}

export async function DELETE(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const name = url.searchParams.get("name") || "";
  if (!/^[\w.-]+\.(webp|jpe?g|png|gif|avif|bmp|tiff?|svg|ico|heic|heif)$/i.test(name)) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }
  try {
    await db.mediaAsset.delete({ where: { filename: name } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
