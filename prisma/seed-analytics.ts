// Seed initial analytics data so the admin analytics tab has content.
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  // Seed SEO keywords (representative of what the site targets)
  const keywords = [
    { keyword: "hotel near banke bihari temple", position: 3, clicks: 142, impressions: 1820, ctr: 7.8, country: "IN" },
    { keyword: "vrindavan luxury stay", position: 5, clicks: 98, impressions: 1340, ctr: 7.3, country: "IN" },
    { keyword: "hotel near iskcon vrindavan", position: 4, clicks: 87, impressions: 1150, ctr: 7.6, country: "IN" },
    { keyword: "vrindavan resort booking", position: 7, clicks: 65, impressions: 980, ctr: 6.6, country: "IN" },
    { keyword: "hotel in vrindavan", position: 8, clicks: 52, impressions: 1620, ctr: 3.2, country: "IN" },
    { keyword: "rk residency vrindavan", position: 1, clicks: 145, impressions: 510, ctr: 28.4, country: "IN" },
    { keyword: "janmashtami 2026 vrindavan", position: 6, clicks: 38, impressions: 720, ctr: 5.3, country: "IN" },
    { keyword: "vrindavan temple guide", position: 9, clicks: 22, impressions: 640, ctr: 3.4, country: "IN" },
    { keyword: "yamuna aarti vrindavan timings", position: 4, clicks: 31, impressions: 450, ctr: 6.9, country: "IN" },
    { keyword: "holi in vrindavan 2026", position: 5, clicks: 28, impressions: 410, ctr: 6.8, country: "IN" },
    { keyword: "satvik food vrindavan", position: 3, clicks: 19, impressions: 280, ctr: 6.8, country: "IN" },
    { keyword: "vrindavan hotel near prem mandir", position: 6, clicks: 24, impressions: 380, ctr: 6.3, country: "IN" },
  ];

  for (const k of keywords) {
    await db.sEOKeyword.create({ data: k });
  }
  console.log(`Seeded ${keywords.length} SEO keywords`);

  // Seed some page views for the last 7 days (realistic pattern)
  const now = new Date();
  const paths = ["/", "/rooms", "/rooms/yamuna-suite", "/experiences", "/experiences/banke-bihari-mandir", "/dining", "/gallery", "/offers", "/blog", "/about", "/contact"];
  const referrers = ["https://www.google.com/", "https://www.google.com/", "https://www.google.com/", null, "https://www.tripadvisor.in/", "https://instagram.com/", null, "https://www.facebook.com/", null];

  let total = 0;
  for (let d = 6; d >= 0; d--) {
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d);
    const viewsToday = 30 + Math.floor(Math.random() * 80); // 30-110 views/day

    for (let v = 0; v < viewsToday; v++) {
      const path = paths[Math.floor(Math.random() * paths.length)];
      const referrer = referrers[Math.floor(Math.random() * referrers.length)];
      const sessionId = `s_${dayStart.getTime()}_${Math.random().toString(36).slice(2, 8)}`;
      const hourAgo = Math.floor(Math.random() * 24);
      const createdAt = new Date(dayStart.getTime() + hourAgo * 60 * 60 * 1000 + Math.random() * 60 * 60 * 1000);

      await db.pageView.create({
        data: {
          path,
          referrer,
          sessionId,
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          ipAddress: null,
          isBot: false,
          createdAt,
        },
      });
      total++;
    }
  }
  console.log(`Seeded ${total} page views across last 7 days`);
}

main().catch(console.error).finally(() => db.$disconnect());
