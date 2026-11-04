import { db } from "@/lib/db";

/**
 * ONE-TIME REVIEWS REPLACE (owner instruction, Nov 2026):
 * "Reviews tab ke demo reviews hata do — mere screenshots wale REAL Google
 * reviews daalo." This module performs the swap exactly once, guarded by a
 * SiteSetting version flag, so it never repeats and never touches anything
 * outside the Review table.
 *
 * Safety design:
 * - Creates are idempotent: a real review is only inserted when no GOOGLE
 *   review with the same guest name exists, so a partially-completed run
 *   can never duplicate rows.
 * - The delete is TARGETED: only the six known fabricated demo authors are
 *   removed. Any other review (real guest submissions, owner-added rows)
 *   is never touched.
 * - The whole routine is best-effort: any failure is logged and skipped so
 *   public pages keep rendering, and the next request retries cleanly.
 */

const IMPORT_FLAG_KEY = "reviews_import_version";
const IMPORT_FLAG_VALUE = "2026-11-v1";

/** The six fabricated placeholder reviews currently in the DB (verified live). */
const DEMO_AUTHORS = [
  "Meenakshi Reddy",
  "Dr. Anand Verma",
  "The Krishnamurthy Family",
  "Priya Sharma",
  "Suresh Iyer",
  "Anjali & Rohan Mehta",
];

type RealReview = {
  guestName: string;
  rating: number;
  title: string;
  body: string;
  avatarUrl?: string;
  /** Relative age as shown on the real Google review screenshot. */
  weeksAgo: number;
};

/** The owner's real Google reviews, transcribed from his screenshots. */
const REAL_REVIEWS: RealReview[] = [
  {
    guestName: "Priya Balhara",
    rating: 5,
    title: "A peaceful and comfortable stay in Vrindavan",
    body:
      "Had a wonderful stay in Vrindavan. The hotel is clean, comfortable and well maintained. The staff is polite, helpful and welcoming. The location is convenient for visiting the temples. The overall atmosphere is peaceful, the rooms are comfortable and the service is prompt. Overall a delightful and relaxing experience — highly recommended for anyone visiting Vrindavan.",
    weeksAgo: 9,
  },
  {
    guestName: "Rahul",
    rating: 5,
    title: "Great value family stay near Prem Mandir",
    body:
      "A nice, budget-friendly and family-friendly place to stay. The location is very convenient — close to Prem Mandir, and most attractions are within 2 km, making it easy to explore Vrindavan. The rooms are clean and the surroundings are quiet. A great choice for family trips.",
    weeksAgo: 9,
  },
  {
    guestName: "Rakesh Thakur",
    rating: 5,
    title: "Clean rooms, warm staff, perfect location",
    body:
      "I had a wonderful stay at Hotel RK Residency. The rooms were clean, spacious and very comfortable. The staff was polite, helpful and always greeted us with a smile. The location was perfect — close to major attractions yet peaceful. The food service was good and the staff is helpful — specially Balkishan Singh, a really good man. I would definitely recommend this residency to anyone looking for a pleasant and relaxing stay. Looking forward to visiting again.",
    avatarUrl: "/images/reviews/rakesh-thakur.webp",
    weeksAgo: 23,
  },
  {
    guestName: "Garima Singh",
    rating: 5,
    title: "Comfortable rooms, tasty food, convenient location",
    body:
      "The rooms are clean, spacious and well maintained with all the needed facilities. The staff is polite and helpful. The location is convenient for visiting Banke Bihari Mandir and the other temples. The food is tasty and the atmosphere is comfortable and relaxing. Highly recommended — we would love to stay here again.",
    weeksAgo: 26,
  },
  {
    guestName: "Vamshi Krishna Reddy",
    rating: 5,
    title: "Great stay — definitely worth the money",
    body:
      "Had a great stay at this hotel. The rooms are clean and the washrooms are tidy and well maintained. The location is convenient — Prem Mandir and ISKCON temple are around 2.5 km away. The price is very reasonable and definitely worth the money.",
    weeksAgo: 18,
  },
  {
    guestName: "Vivek Kumar Tiwari",
    rating: 5,
    title: "Excellent service and courteous staff",
    body:
      "Good rooms and services. Staff behaviour was very nice and polite. My trip was awesome — thanks to the hotel staff, and special thanks to Mr. Bal Krishna ji, manager of the hotel.",
    avatarUrl: "/images/reviews/vivek-tiwari.webp",
    weeksAgo: 16,
  },
  {
    guestName: "shanti kumbhar",
    rating: 5,
    title: "Pleasant and comfortable stay",
    body:
      "Rooms are clean, comfortable and well maintained. Overall a pleasant stay with courteous staff. Bathroom toiletries could be provided or improved, which would take the guest experience one notch higher. Overall a good stay.",
    weeksAgo: 18,
  },
];

function weeksAgoToDate(w: number): Date {
  return new Date(Date.now() - w * 7 * 24 * 60 * 60 * 1000);
}

let inFlight: Promise<void> | null = null;

/** Runs the one-time replace at most once per process; safe to await anywhere. */
export async function ensureRealReviews(): Promise<void> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    try {
      const flag = await db.siteSetting.findUnique({ where: { key: IMPORT_FLAG_KEY } });
      if (flag?.value === IMPORT_FLAG_VALUE) return;

      // 1) Idempotent insert of the real reviews (skip any name that already
      //    exists as a GOOGLE review — protects against partial prior runs).
      const existing = await db.review.findMany({
        where: { source: "GOOGLE" },
        select: { guestName: true },
      });
      const have = new Set(existing.map((e) => e.guestName.trim().toLowerCase()));
      let created = 0;
      for (const r of REAL_REVIEWS) {
        if (have.has(r.guestName.trim().toLowerCase())) continue;
        await db.review.create({
          data: {
            guestName: r.guestName,
            rating: r.rating,
            title: r.title,
            body: r.body,
            avatarUrl: r.avatarUrl ?? null,
            source: "GOOGLE",
            verified: true,
            approved: true,
            createdAt: weeksAgoToDate(r.weeksAgo),
          },
        });
        created++;
      }

      // 2) Targeted demo removal — ONLY the six fabricated authors.
      const deleted = await db.review.deleteMany({
        where: { guestName: { in: DEMO_AUTHORS } },
      });

      // 3) Version flag — never runs again.
      await db.siteSetting.upsert({
        where: { key: IMPORT_FLAG_KEY },
        create: { key: IMPORT_FLAG_KEY, value: IMPORT_FLAG_VALUE, label: "Reviews import version", category: "general" },
        update: { value: IMPORT_FLAG_VALUE },
      });

      if (created || deleted.count) {
        console.log(`[reviews-import] done: ${created} real reviews added, ${deleted.count} demo reviews removed`);
      }
    } catch (e) {
      console.error("[reviews-import] skipped (will retry on next request):", e);
      inFlight = null; // allow a clean retry on the next request
    }
  })();
  return inFlight;
}
