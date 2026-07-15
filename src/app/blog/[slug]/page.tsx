import { BlogDetailPage } from "@/components/rk/pages/BlogPages";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await db.blogPost.findUnique({ where: { slug } });
  return {
    title: post ? `${post.title} — RK Residency Blog` : "Blog Post — RK Residency",
    description: post?.excerpt || "Braj Journal story from RK Residency, Vrindavan.",
    openGraph: {
      title: post?.title || "RK Residency Blog",
      description: post?.excerpt || "",
      type: "article",
      images: post?.imageUrl ? [{ url: post.imageUrl }] : undefined,
    },
  };
}

export default async function BlogDetailRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Fetch the post for JSON-LD structured data
  const post = await db.blogPost.findUnique({ where: { slug } });

  return (
    <>
      {post && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: post.title,
              description: post.excerpt,
              image: post.imageUrl,
              datePublished: post.publishedAt?.toISOString(),
              author: {
                "@type": "Organization",
                name: "RK Residency",
              },
              publisher: {
                "@type": "Organization",
                name: "RK Residency",
                logo: {
                  "@type": "ImageObject",
                  url: "https://rkresidency.in/images/heritage-room.jpg",
                },
              },
              mainEntityOfPage: {
                "@type": "WebPage",
                "@id": `https://rkresidency.in/blog/${post.slug}`,
              },
            }),
          }}
        />
      )}
      <BlogDetailPage slug={slug} />
    </>
  );
}
