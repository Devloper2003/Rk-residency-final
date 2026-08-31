import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import sharp from "sharp";
import crypto from "crypto";

export const dynamic = "force-dynamic";

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

    if (!rawFiles.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
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

        const hash = crypto.createHash("sha256").update(processed).digest("hex").slice(0, 16);
        const filename = `${hash}.webp`;

        const existing = await db.mediaAsset.findUnique({ where: { filename } });
        if (existing) {
          urls.push(`/uploads/${filename}`);
          continue;
        }

        await db.mediaAsset.create({
          data: {
            filename,
            mimeType: "image/webp",
            data: processed,
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
