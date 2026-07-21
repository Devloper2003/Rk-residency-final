import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /uploads/[filename]
 * Serves a media asset from the PostgreSQL database.
 *
 * This replaces static file serving from /public/uploads/ (which doesn't
 * work on Vercel's read-only filesystem). The URL scheme is identical
 * (/uploads/abc.webp) so all existing references in settings, rooms,
 * offers, blog posts, etc. continue to work without any changes.
 *
 * Sets aggressive cache headers (1 year) since the filename is a
 * content-hash — if the file changes, the hash changes, so the URL
 * changes, so the browser fetches the new version automatically.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Validate filename — no path traversal, image extensions only.
  if (!/^[\w.-]+\.(webp|jpe?g|png|gif|avif|bmp|tiff?|svg|ico|heic|heif)$/i.test(filename)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const asset = await db.mediaAsset.findUnique({
      where: { filename },
      select: { data: true, mimeType: true, size: true },
    });

    if (!asset) {
      return new Response("Not found", { status: 404 });
    }

    // Content-hash filenames mean the image never changes for a given URL,
    // so we can cache aggressively (1 year). This makes repeated page loads
    // nearly instant.
    const res = new Response(asset.data, {
      status: 200,
      headers: {
        "Content-Type": asset.mimeType,
        "Content-Length": String(asset.size),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
    return res;
  } catch (e) {
    console.error("[/uploads/" + filename + "] error:", e);
    return new Response("Internal error", { status: 500 });
  }
}
