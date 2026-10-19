import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { publicPostWhere } from "@/lib/blog-utils";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");

    if (slug) {
      const post = await db.blogPost.findUnique({ where: { slug } });
      if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
      return NextResponse.json({ post });
    }

    // Public list — scheduled/future posts never appear (publicPostWhere).
    const posts = await db.blogPost.findMany({
      where: publicPostWhere(),
      orderBy: [{ publishedAt: "desc" }],
    });
    return NextResponse.json({ posts });
  } catch (e) {
    console.error("[/api/blog] error:", e);
    return NextResponse.json({ posts: [], error: "Failed to load blog" }, { status: 500 });
  }
}
