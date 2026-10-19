import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import { z } from "zod";
import {
  slugifyTitle,
  clampText,
  calcReadingMins,
} from "@/lib/blog-utils";
import { revalidatePostPaths } from "@/lib/blog-publish";

export const dynamic = "force-dynamic";

/**
 * Blog admin API — POST (create) / PATCH (update) / DELETE / GET.
 *
 * Phase 3 auto-SEO on save:
 *   - slug is normalized to a lowercase-hyphen slug (unique, enforced by DB);
 *   - metaTitle (≤60) auto-generated from the title when empty;
 *   - metaDescription (≤155) auto-generated from the excerpt when empty;
 *   - readingMins auto-calculated from the body when readingMinsAuto is true
 *     (manual override keeps the author's value);
 *   - coverAlt stored for the cover image (SEO + accessibility);
 *   - updatedAt (dateModified) is maintained automatically by Prisma.
 *
 * Nothing here deletes or rewrites existing content — every field the owner
 * filled keeps its value; automation only fills the EMPTY fields.
 */

const blogSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(1),
  title: z.string().min(1),
  excerpt: z.string().min(1),
  body: z.string().min(1),
  category: z.string().min(1),
  tags: z.string(),
  imageUrl: z.string().nullable(),
  published: z.boolean(),
  publishedAt: z.string().nullable(),
  readingMins: z.number().int().min(1),
  // Phase 3 fields — all optional for backward compatibility with older clients
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  coverAlt: z.string().nullable().optional(),
  targetKeyword: z.string().nullable().optional(),
  readingMinsAuto: z.boolean().optional(),
});

/** Normalize any incoming slug into a safe, URL-friendly form. */
function normalizeSlug(raw: string, title: string): string {
  const fromSlug = slugifyTitle(raw);
  if (fromSlug) return fromSlug;
  // Slug was empty or only symbols — derive from the title instead.
  return slugifyTitle(title) || `post-${Date.now()}`;
}

/** Shared save-time automation: fills empty SEO fields, never overwrites. */
function applyAutoSeo(d: z.infer<typeof blogSchema>) {
  const metaTitle = (d.metaTitle || "").trim() || clampText(d.title, 60);
  const metaDescription =
    (d.metaDescription || "").trim() || clampText(d.excerpt, 155);
  const readingMins = d.readingMinsAuto === false ? d.readingMins : calcReadingMins(d.body);
  return {
    metaTitle: clampText(metaTitle, 60),
    metaDescription: clampText(metaDescription, 155),
    readingMins,
    coverAlt: (d.coverAlt || "").trim() || null,
    targetKeyword: (d.targetKeyword || "").trim() || null,
  };
}

/** Flatten a Prisma duplicate-slug error into a clear message. */
function slugConflict(e: unknown): boolean {
  return (
    typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "P2002"
  );
}

export async function GET(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const posts = await db.blogPost.findMany({ orderBy: [{ publishedAt: "desc" }] });
  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = blogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid post data", details: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;
    const auto = applyAutoSeo(d);
    try {
      const post = await db.blogPost.create({
        data: {
          slug: normalizeSlug(d.slug, d.title), title: d.title, excerpt: d.excerpt, body: d.body,
          category: d.category, tags: d.tags, imageUrl: d.imageUrl,
          published: d.published, publishedAt: d.publishedAt ? new Date(d.publishedAt) : null,
          metaTitle: auto.metaTitle, metaDescription: auto.metaDescription,
          coverAlt: auto.coverAlt, targetKeyword: auto.targetKeyword,
          readingMins: auto.readingMins,
          readingMinsAuto: d.readingMinsAuto !== false,
        },
      });
      await db.auditLog.create({
        data: { adminId: admin.id, action: "BLOG_CREATED", entity: "BlogPost", entityId: post.id, details: `Created post ${post.title}` },
      });
      revalidatePostPaths(post.slug);
      return NextResponse.json({ ok: true, post });
    } catch (e) {
      if (slugConflict(e)) {
        return NextResponse.json({ error: `The slug "${normalizeSlug(d.slug, d.title)}" is already used by another post. Choose a different slug.` }, { status: 409 });
      }
      throw e;
    }
  } catch (e) {
    console.error("[/api/admin/blog POST] error:", e);
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = blogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid post data", details: parsed.error.flatten() }, { status: 400 });
    }
    const d = parsed.data;
    if (!d.id) return NextResponse.json({ error: "Post id required for update" }, { status: 400 });

    const auto = applyAutoSeo(d);
    try {
      const post = await db.blogPost.update({
        where: { id: d.id },
        data: {
          slug: normalizeSlug(d.slug, d.title), title: d.title, excerpt: d.excerpt, body: d.body,
          category: d.category, tags: d.tags, imageUrl: d.imageUrl,
          published: d.published, publishedAt: d.publishedAt ? new Date(d.publishedAt) : null,
          metaTitle: auto.metaTitle, metaDescription: auto.metaDescription,
          coverAlt: auto.coverAlt, targetKeyword: auto.targetKeyword,
          readingMins: auto.readingMins,
          readingMinsAuto: d.readingMinsAuto !== false,
        },
      });
      await db.auditLog.create({
        data: { adminId: admin.id, action: "BLOG_UPDATED", entity: "BlogPost", entityId: post.id, details: `Updated post ${post.title}` },
      });
      revalidatePostPaths(post.slug);
      return NextResponse.json({ ok: true, post });
    } catch (e) {
      if (slugConflict(e)) {
        return NextResponse.json({ error: `The slug "${normalizeSlug(d.slug, d.title)}" is already used by another post. Choose a different slug.` }, { status: 409 });
      }
      throw e;
    }
  } catch (e) {
    console.error("[/api/admin/blog PATCH] error:", e);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const admin = await verifyAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Post id required" }, { status: 400 });

    const existing = await db.blogPost.findUnique({ where: { id } });
    await db.blogPost.delete({ where: { id } });
    await db.auditLog.create({
      data: { adminId: admin.id, action: "BLOG_DELETED", entity: "BlogPost", entityId: id, details: `Deleted post ${existing?.title || id}` },
    });
    if (existing) revalidatePostPaths(existing.slug);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[/api/admin/blog DELETE] error:", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
