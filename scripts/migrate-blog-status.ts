/**
 * migrate-blog-status.ts — ONE-TIME idempotent backfill for scheduling (Task 3).
 *
 * Replaces the single "Published" checkbox with status: DRAFT / SCHEDULED /
 * PUBLISHED. Existing rows are migrated WITHOUT touching any content:
 *   - published=true  → status="PUBLISHED"  (publishedAt keeps its value)
 *   - published=false → status="DRAFT"
 *
 * HOW TO RUN (owner, against production):
 *   DATABASE_URL="postgresql://…" bun run scripts/migrate-blog-status.ts
 *
 * Safe to run any time and any number of times — it only fills the status
 * column and never modifies titles, bodies or dates. If it is never run,
 * the hourly cron also self-heals these rows automatically.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const posts = await db.blogPost.findMany({ select: { id: true, published: true, status: true } });
  let changed = 0;
  for (const p of posts) {
    const target = p.published ? "PUBLISHED" : "DRAFT";
    if (p.status !== target) {
      await db.blogPost.update({ where: { id: p.id }, data: { status: target } });
      changed++;
    }
  }
  console.log(`== migrate-blog-status: ${posts.length} row(s) checked, ${changed} updated ==`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
