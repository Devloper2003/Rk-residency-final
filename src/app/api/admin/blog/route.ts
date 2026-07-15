import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyAdmin } from "@/lib/admin-auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

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
});

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
    const post = await db.blogPost.create({
      data: {
        slug: d.slug, title: d.title, excerpt: d.excerpt, body: d.body,
        category: d.category, tags: d.tags, imageUrl: d.imageUrl,
        published: d.published, publishedAt: d.publishedAt ? new Date(d.publishedAt) : null,
        readingMins: d.readingMins,
      },
    });
    await db.auditLog.create({
      data: { adminId: admin.id, action: "BLOG_CREATED", entity: "BlogPost", entityId: post.id, details: `Created post ${post.title}` },
    });
    return NextResponse.json({ ok: true, post });
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

    const post = await db.blogPost.update({
      where: { id: d.id },
      data: {
        slug: d.slug, title: d.title, excerpt: d.excerpt, body: d.body,
        category: d.category, tags: d.tags, imageUrl: d.imageUrl,
        published: d.published, publishedAt: d.publishedAt ? new Date(d.publishedAt) : null,
        readingMins: d.readingMins,
      },
    });
    await db.auditLog.create({
      data: { adminId: admin.id, action: "BLOG_UPDATED", entity: "BlogPost", entityId: post.id, details: `Updated post ${post.title}` },
    });
    return NextResponse.json({ ok: true, post });
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

    await db.blogPost.delete({ where: { id } });
    await db.auditLog.create({
      data: { adminId: admin.id, action: "BLOG_DELETED", entity: "BlogPost", entityId: id, details: `Deleted post ${id}` },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[/api/admin/blog DELETE] error:", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
