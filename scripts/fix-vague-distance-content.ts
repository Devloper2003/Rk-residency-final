/**
 * fix-vague-distance-content.ts — one-shot data patch for admin-authored copy
 * that carries the vague proximity claims the owner banned ("steps from",
 * "minutes from").
 *
 * Everything the site RENDERS is already corrected at display time by
 * src/lib/copy-normalize.ts (realDistanceCopy) — this script fixes the SOURCE
 * rows so Admin → Content / Admin → Rooms stop showing the old wording too.
 *
 * WHAT IT FIXES
 *   1. Room.tagline            — "…steps from the temple" (Suite row)
 *   2. SiteContent hero.subheadline + hero.slides[] .subheadline
 *                              — "…steps from Banke Bihari Mandir & ISKCON…"
 *                                → real site.config distances
 *   3. SiteContent experiences.items[] .distance/.walkTime
 *                              — old unverified figures → verified ones
 *
 * SAFETY (mirrors scripts/update-room-images-prod.ts):
 *   - Touches ONLY the rows/fields above. No bookings, no rates, no users.
 *   - Idempotent: re-running produces the same end state.
 *   - DATABASE_URL comes from the environment only — never hardcoded.
 *
 * Run: DATABASE_URL="postgresql://…" bun run scripts/fix-vague-distance-content.ts
 */
import { PrismaClient } from "@prisma/client";
import { BUSINESS } from "../src/lib/site.config";
import { realDistanceCopy } from "../src/lib/copy-normalize";

const db = new PrismaClient();

/** "8 min drive · 25 min walk" → "25 min walk" (same rule as Experiences.tsx). */
const walkOnly = (time: string) => time.match(/(\d+\s*min walk)/i)?.[1] || time;

const DISTANCE_MATCHERS: [RegExp, { km: string; time: string }][] = [
  [/banke\s*bihari/i, BUSINESS.distances.bankeBihari],
  [/iskcon|krishna balaram/i, BUSINESS.distances.iskcon],
  [/prem\s*mandir/i, BUSINESS.distances.premMandir],
  [/nidhivan/i, BUSINESS.distances.nidhivan],
  [/keshi\s*ghat|yamuna aarti/i, BUSINESS.distances.keshiGhat],
];

const VAGUE = /\b(?:steps|minutes?)\s+from\b/i;

async function main() {
  // 1 ─ Room taglines that carry the banned claim
  const rooms = await db.room.findMany({
    where: { tagline: { contains: "steps from" } },
    select: { id: true, name: true, tagline: true },
  });
  for (const r of rooms) {
    const fixed = realDistanceCopy(r.tagline);
    if (fixed !== r.tagline) {
      await db.room.update({ where: { id: r.id }, data: { tagline: fixed } });
      console.log(`room "${r.name}" tagline → "${fixed}"`);
    }
  }

  // 2 ─ Hero subheadline + slides (SiteContent)
  const hero = await db.siteContent.findUnique({ where: { key: "hero.subheadline" } });
  if (hero && VAGUE.test(hero.value)) {
    const fixed = realDistanceCopy(hero.value);
    await db.siteContent.update({ where: { key: "hero.subheadline" }, data: { value: fixed } });
    console.log(`hero.subheadline → "${fixed}"`);
  }

  const slides = await db.siteContent.findUnique({ where: { key: "hero.slides" } });
  if (slides && VAGUE.test(slides.value)) {
    try {
      const parsed = JSON.parse(slides.value) as { subheadline?: string }[];
      let changed = false;
      const next = parsed.map((s) => {
        if (s?.subheadline && VAGUE.test(s.subheadline)) {
          changed = true;
          return { ...s, subheadline: realDistanceCopy(s.subheadline) };
        }
        return s;
      });
      if (changed) {
        await db.siteContent.update({
          where: { key: "hero.slides" },
          data: { value: JSON.stringify(next) },
        });
        console.log("hero.slides → subheadlines rewritten with verified distances");
      }
    } catch {
      console.log("hero.slides: not valid JSON — skipped");
    }
  }

  // 3 ─ Experience items distances (SiteContent)
  const exp = await db.siteContent.findUnique({ where: { key: "experiences.items" } });
  if (exp) {
    try {
      const parsed = JSON.parse(exp.value) as {
        name: string; distance?: string; walkTime?: string;
      }[];
      let changed = false;
      const next = parsed.map((it) => {
        const hit = DISTANCE_MATCHERS.find(([re]) => re.test(it.name));
        if (!hit) return it;
        const distance = `${hit[1].km} km`;
        const walkTime = walkOnly(hit[1].time);
        if (it.distance !== distance || it.walkTime !== walkTime) changed = true;
        return { ...it, distance, walkTime };
      });
      if (changed) {
        await db.siteContent.update({
          where: { key: "experiences.items" },
          data: { value: JSON.stringify(next) },
        });
        console.log("experiences.items → distances rewritten from site.config");
      }
    } catch {
      console.log("experiences.items: not valid JSON — skipped");
    }
  }

  console.log("done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
