import { BlogDetailPage } from "@/components/rk/pages/BlogPages";
import { db } from "@/lib/db";
import { absUrl, pageOpenGraph, pageTwitter, seoTitle, seoDescription } from "@/lib/seo";
import { blogPostingJsonLd } from "@/lib/schema-org";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await db.blogPost.findUnique({ where: { slug } });

  // Blog posts use THEIR OWN title, excerpt and cover image for OG.
  const title = seoTitle(post ? post.title : "Blog Post — RK Residency");
  const description = seoDescription(
    post?.excerpt || "Braj Journal story from RK Residency, Vrindavan."
  );
  const image = post?.imageUrl || undefined;

  return {
    title,
    description,
    // A blog post canonicals to ITSELF (never to the homepage or the blog list).
    // Unknown slugs canonical to the blog index.
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

  // SSR: the post is fetched once on the server and used BOTH for JSON-LD
  // and for the rendered article body, so the full text is in the initial HTML.
  // Related posts (same category first, then latest) are also fetched
  // server-side so the internal links are crawlable.
  const [post, allPublished] = await Promise.all([
    db.blogPost.findUnique({ where: { slug } }),
    db.blogPost.findMany({ where: { published: true }, orderBy: [{ publishedAt: "desc" }] }),
  ]);

  const others = allPublished.filter((p) => p.slug !== slug);
  const sameCategory = post ? others.filter((p) => p.category === post.category) : [];
  const rest = others.filter((p) => !sameCategory.includes(p));
  const related = [...sameCategory, ...rest].slice(0, 3);

  return (
    <>
      {post && (
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
      )}
      <BlogDetailPage slug={slug} initialPost={post} initialRelated={related} />
    </>
  );
}
