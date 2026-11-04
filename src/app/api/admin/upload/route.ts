import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import sharp from "sharp";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * SEO: turn the original filename into a descriptive slug, e.g.
 * "Deluxe Room Interior.jpg" -> "deluxe-room-interior.webp".
 * Uploads are renamed so image URLs describe their content instead of
 * being random content hashes.
 */
function slugifyFilename(originalName: string): string {
  const base = originalName.replace(/\.[^.]+$/, ""); // strip extension
  const slug = base
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  // Guarantee a meaningful name even for gibberish originals like "IMG_0001"
  // — prefix keeps every upload tied to the site (nice in Google Images).
  const safe = slug || "image";
  return `rk-residency-vrindavan-${safe}.webp`;
}

/** Find a unique filename in the DB, appending -2, -3… on collisions. */
async function uniqueFilename(candidate: string): Promise<string> {
  const dot = candidate.lastIndexOf(".");
  const stem = dot === -1 ? candidate : candidate.slice(0, dot);
  const ext = dot === -1 ? "" : candidate.slice(dot);
  let name = candidate;
  let n = 2;
  while (await db.mediaAsset.findUnique({ where: { filename: name } })) {
    name = `${stem}-${n}${ext}`;
    n++;
  }
  return name;
}

// GET: List all media assets
export async function GET(req: Request) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assets = await db.mediaAsset.findMany({
      select: { filename: true, mimeType: true, size: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    const files = assets.map((a) => ({
      name: a.filename,
      url: `/uploads/${a.filename}`,
      size: a.size,
      mtime: a.createdAt.getTime(),
    }));

    return NextResponse.json({ files });
  } catch (e) {
    console.error("[/api/admin/upload GET] error:", e);
    return NextResponse.json({ error: "Failed to list media" }, { status: 500 });
  }
}

// POST: Upload images
export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const rawFiles = formData.getAll("files");
    // SEO/accessibility: alt text is REQUIRED for every uploaded image.
    const alt = (formData.get("alt") || "").toString().trim();

    if (!rawFiles.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    if (!alt) {
      return NextResponse.json(
        { error: "Alt text is required for every image — describe what the image shows (SEO + accessibility)." },
        { status: 400 }
      );
    }
    if (alt.length > 300) {
      return NextResponse.json(
        { error: "Alt text is too long (max 300 characters)." },
        { status: 400 }
      );
    }

    const urls: string[] = [];
    const errors: string[] = [];

    for (const file of rawFiles) {
      if (!(file instanceof File)) {
        errors.push(`${String(file)} is not a file`);
        continue;
      }

      if (!file.type.startsWith("image/")) {
        errors.push(`${file.name}: Not an image`);
        continue;
      }

      if (file.size > 12 * 1024 * 1024) {
        errors.push(`${file.name}: Too large (max 12 MB)`);
        continue;
      }

      try {
        const buffer = Buffer.from(await file.arrayBuffer());

        const processed = await sharp(buffer)
          .resize(1600, null, { withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();

        // Identical content keeps reusing the SAME URL (dedupe), regardless
        // of what the admin called the file this time.
        const hash = crypto.createHash("sha256").update(processed).digest("hex");
        const existingByHash = await db.mediaAsset.findUnique({
          where: { contentHash: hash },
        });
        if (existingByHash) {
          urls.push(`/uploads/${existingByHash.filename}`);
          continue;
        }

        // Descriptive slug filename (+ suffix on collisions) instead of a
        // random hash — image URLs become keyword-relevant.
        const candidate = slugifyFilename(file.name || "image");
        const filename = await uniqueFilename(candidate);

        await db.mediaAsset.create({
          data: {
            filename,
            alt,
            contentHash: hash,
            mimeType: "image/webp",
            data: new Uint8Array(processed),
            size: processed.length,
          },
        });

        urls.push(`/uploads/${filename}`);
      } catch (imgErr) {
        console.error(`[upload] Failed to process ${file.name}:`, imgErr);
        errors.push(`${file.name}: Processing failed`);
      }
    }

    return NextResponse.json({ urls, errors });
  } catch (e) {
    console.error("[/api/admin/upload POST] error:", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

// DELETE: Remove a media asset
export async function DELETE(req: Request) {
  try {
    const admin = await verifyAdmin(req);
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const name = url.searchParams.get("name");
    if (!name) {
      return NextResponse.json({ error: "File name required" }, { status: 400 });
    }

    if (name.includes("..") || name.includes("/") || name.includes("\\")) {
      return NextResponse.json({ error: "Invalid file name" }, { status: 400 });
    }

    const asset = await db.mediaAsset.findUnique({ where: { filename: name } });
    if (!asset) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    await db.mediaAsset.delete({ where: { filename: name } });

    return NextResponse.json({ ok: true, deleted: name });
  } catch (e) {
    console.error("[/api/admin/upload DELETE] error:", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
