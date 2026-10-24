/**
 * blog-publish.ts — shared helpers for what happens when a post is
 * created/updated/published (manually or by the scheduler).
 *
 * Revalidation keeps the cached pages fresh after content changes:
 *   - /blog            (blog list)
 *   - /blog/[slug]     (the post page)
 *   - /                (homepage latest-posts section)
 *   - /sitemap.xml     (Next metadata route)
 *
 * No deprecated ping endpoints are used — the sitemap is simply regenerated
 * on demand and submitted via Search Console.
 */
import { revalidatePath } from "next/cache";

export function revalidatePostPaths(slug?: string) {
  revalidatePath("/blog");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/blog/${slug}`);
}
