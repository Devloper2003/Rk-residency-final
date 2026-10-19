import { BlogDetailPage } from "@/components/rk/pages/BlogPages";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { absUrl, pageOpenGraph, pageTwitter, seoTitle, seoDescription } from "@/lib/seo";
import { blogPostingJsonLd, breadcrumbJsonLd } from "@/lib/schema-org";
import { tocFromBody, publicPostWhere } from "@/lib/blog-utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await db.blogPost.findUnique({ where: { slug } });

  // Drafts and scheduled (future) posts are not public — no metadata leaks.
  const isPublic = post
    ? post.published && (!post.publishedAt || post.publishedAt <= new Date())
    : false;
  if (!isPublic) {
    return { title: "Blog Post — RK Residency", robots: { index: false, follow: false } };
  }

  // Auto-SEO: the post's own metaTitle (≤60) and metaDescription (≤155) are
  // generated on save; legacy posts fall back to title/excerpt. A blog post
  // canonicals to ITSELF and OG tags are unique per post.
  const title = seoTitle(post?.metaTitle || (post ? post.title : "Blog Post — RK Residency"));
  const description = seoDescription(
    post?.metaDescription || post?.excerpt || "Braj Journal story from RK Residency, Vrindavan."
  );
  const image = post?.imageUrl || undefined;

  return {
    title,
    description,
    alternates: { canonical: post ? absUrl(`/blog/${post.slug}`) : absUrl("/blog") },
    openGraph: pageOpenGraph({
      path: post ? `/blog/${post.slug}` : "/blog",
      title,
      description,
      image,
      type: "article",
    }),
    twitter: pageTwitter({ title, description, image }),
  };
}

export default async function BlogDetailRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Drafts and scheduled posts must not render on the public site.
  const gate = await db.blogPost.findFirst({
    where: { ...publicPostWhere(), slug },
    select: { id: true },
  });
  if (!gate) notFound();

  // SSR: the post is fetched once on the server and used BOTH for JSON-LD
  // and for the rendered article body, so the full text is in the initial HTML.
  // Related posts (same category or shared tags first) are also fetched
  // server-side so the internal links are crawlable.
  const [post, allPublished] = await Promise.all([
    db.blogPost.findUnique({ where: { slug } }),
    db.blogPost.findMany({ where: publicPostWhere(), orderBy: [{ publishedAt: "desc" }] }),
  ]);

  const others = allPublished.filter((p) => p.slug !== slug);
  let related: typeof others = [];
  if (post) {
    const postTags: string[] = (() => { try { return JSON.parse(post.tags || "[]"); } catch { return []; } })();
    const sameCategory = others.filter((p) => p.category === post.category);
    const sharedTags = others.filter((p) => {
      if (sameCategory.includes(p)) return false;
      const t: string[] = (() => { try { return JSON.parse(p.tags || "[]"); } catch { return []; } })();
      return t.some((x) => postTags.includes(x));
    });
    const rest = others.filter((p) => !sameCategory.includes(p) && !sharedTags.includes(p));
    related = [...sameCategory, ...sharedTags, ...rest].slice(0, 3);
  }

  // Auto table of contents from the ## headings (stable across SSR/client).
  const toc = post ? tocFromBody(post.body) : [];

  return (
    <>
      {post && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(
                blogPostingJsonLd({
                  title: post.title,
                  excerpt: post.excerpt,
                  imageUrl: post.imageUrl,
                  publishedAt: post.publishedAt,
                  updatedAt: post.updatedAt,
                  slug: post.slug,
                })
              ),
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(
                breadcrumbJsonLd([
                  { name: "Home", path: "/" },
                  { name: "Blog", path: "/blog" },
                  { name: post.title, path: `/blog/${post.slug}` },
                ])
              ),
            }}
          />
        </>
      )}
      <BlogDetailPage slug={slug} initialPost={post} initialRelated={related} initialToc={toc} />
    </>
  );
}
