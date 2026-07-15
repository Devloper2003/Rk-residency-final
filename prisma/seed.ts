// RK Residency — Seed script
// Populates the database with real hotel data reflecting Vrindavan heritage luxury.
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const rooms = [
  {
    slug: "yamuna-suite",
    name: "Yamuna Suite",
    tagline: "Riverside devotional luxury",
    description:
      "Our flagship suite overlooking the Yamuna, with a private jharokha balcony framed in hand-carved teak.",
    longDescription:
      "The Yamuna Suite is the crown of RK Residency — a 620 sq.ft. sanctuary with floor-to-ceiling arched windows that open to a private balcony overlooking the Yamuna ghats. At sunrise, the soft clanging of temple bells and the distant murmur of the aarti drift across the water. The bedroom is dressed in ivory and peacock-teal linens, with a hand-embroidered canopy above a king bed. A separate sitting alcove features two cushioned diwan seats and a writing desk for evening journaling. The bathroom is finished in Makrana marble with a deep soaking tub and brass lota-style fittings.",
    basePrice: 14500,
    maxGuests: 3,
    sizeSqft: 620,
    bedType: "King",
    view: "Yamuna River",
    imageUrls: JSON.stringify([
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1400&q=80",
    ]),
    amenities: JSON.stringify([
      "Private balcony with Yamuna view",
      "King bed with hand-embroidered canopy",
      "Makrana marble bathroom with soaking tub",
      "Satvik breakfast included",
      "Daily temple-visit assistance",
      "Brass diya turn-down ritual",
      "Complimentary Wi-Fi",
      "Air conditioning",
    ]),
    totalCount: 4,
    badge: "Signature",
    featured: true,
    sortOrder: 1,
  },
  {
    slug: "banke-bihari-deluxe",
    name: "Banke Bihari Deluxe",
    tagline: "Quiet comfort, steps from the temple",
    description:
      "A serene 380 sq.ft. room with a comfortable queen bed and a small balcony facing the inner courtyard.",
    longDescription:
      "The Banke Bihari Deluxe room is designed for the pilgrim who values quiet rest after a long day at the temples. The 380 sq.ft. interior is finished in warm ivory tones with marigold-gold accents. A plush queen bed sits beneath a hand-painted lotus medallion on the ceiling. The window opens to the inner courtyard where a small tulsi plant and a stone fountain provide a gentle acoustic backdrop. Modern conveniences — including a rain shower, espresso machine and high-speed Wi-Fi — sit unobtrusively alongside heritage brass fixtures.",
    basePrice: 7200,
    maxGuests: 2,
    sizeSqft: 380,
    bedType: "Queen",
    view: "Courtyard",
    imageUrls: JSON.stringify([
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1400&q=80",
    ]),
    amenities: JSON.stringify([
      "Queen bed with premium linen",
      "Rain shower with brass fittings",
      "Satvik breakfast included",
      "Espresso machine",
      "Complimentary Wi-Fi",
      "Air conditioning",
      "Daily housekeeping",
    ]),
    totalCount: 10,
    badge: "Most Popular",
    featured: true,
    sortOrder: 2,
  },
  {
    slug: "radha-rani-junior-suite",
    name: "Radha Rani Junior Suite",
    tagline: "Spacious suite for devotee families",
    description:
      "A 460 sq.ft. suite with a separate sitting area, ideal for families visiting Vrindavan together.",
    longDescription:
      "The Radha Rani Junior Suite is purpose-built for devotee families — a 460 sq.ft. suite with a king bedroom and a separate sitting area that converts to sleeping space for two children. The décor draws on Braj folk motifs: hand-block-printed fabrics in marigold and marsala, a small puja nook with a ready-made thaali, and a writing desk by the window. The bathroom offers both a rain shower and a deep soaking tub. A private corridor entrance makes early-morning temple departures discreet.",
    basePrice: 9800,
    maxGuests: 4,
    sizeSqft: 460,
    bedType: "King + Sofa Bed",
    view: "Temple skyline",
    imageUrls: JSON.stringify([
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1400&q=80",
    ]),
    amenities: JSON.stringify([
      "King bed + sofa bed for 2 children",
      "Separate sitting area",
      "Private puja nook with thaali",
      "Rain shower + soaking tub",
      "Satvik breakfast included",
      "Family temple-visit planning",
      "Complimentary Wi-Fi",
      "Air conditioning",
    ]),
    totalCount: 6,
    badge: "Family",
    featured: true,
    sortOrder: 3,
  },
  {
    slug: "bansuri-heritage-room",
    name: "Bansuri Heritage Room",
    tagline: "Intimate retreat with artisan detail",
    description:
      "A 280 sq.ft. cosy room featuring hand-carved woodwork and a private sit-out overlooking the gardens.",
    longDescription:
      "The Bansuri Heritage Room is our most intimate offering — a 280 sq.ft. retreat named after the bansuri (flute) of Krishna. The room is wrapped in hand-carved teak detailing, including a jharokha-style window seat that doubles as a reading nook. A queen bed is dressed in ivory linen with a marigold-embroidered throw. The bathroom features a walk-in rain shower with sandstone flooring. Outside, a private sit-out overlooks the marigold garden, where evening diya-light is delivered each night.",
    basePrice: 5800,
    maxGuests: 2,
    sizeSqft: 280,
    bedType: "Queen",
    view: "Garden",
    imageUrls: JSON.stringify([
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1590490359682-395d6510f6a2?auto=format&fit=crop&w=1400&q=80",
    ]),
    amenities: JSON.stringify([
      "Queen bed with hand-embroidered throw",
      "Jharokha-style window seat",
      "Walk-in rain shower",
      "Private sit-out overlooking garden",
      "Evening diya-light ritual",
      "Satvik breakfast included",
      "Complimentary Wi-Fi",
      "Air conditioning",
    ]),
    totalCount: 8,
    badge: null,
    featured: false,
    sortOrder: 4,
  },
  {
    slug: "gokul-royal-villa",
    name: "Gokul Royal Villa",
    tagline: "Private villa for satsang & small weddings",
    description:
      "A two-bedroom villa with a private courtyard, ideal for satsang groups and intimate celebrations.",
    longDescription:
      "The Gokul Royal Villa is our most private accommodation — a two-bedroom villa arranged around a stone-paved courtyard with a central tulsi shrine. Each bedroom has its own en-suite bathroom and private sit-out. The courtyard can host a small satsang (up to 20 guests) or an intimate havan ceremony, with our in-house pandit available on request. The villa comes with a dedicated butler, daily satvik breakfast, and round-trip transfers to the major temples.",
    basePrice: 28000,
    maxGuests: 6,
    sizeSqft: 1200,
    bedType: "2 King Beds",
    view: "Private courtyard",
    imageUrls: JSON.stringify([
      "https://images.unsplash.com/photo-1561501900-3701fa6a0864?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1400&q=80",
    ]),
    amenities: JSON.stringify([
      "Two king bedrooms with en-suite bathrooms",
      "Private courtyard with tulsi shrine",
      "Satsang / havan space for up to 20 guests",
      "Dedicated butler service",
      "Round-trip temple transfers",
      "Daily satvik breakfast",
      "In-house pandit on request",
      "Private kitchen available",
    ]),
    totalCount: 2,
    badge: "Villa",
    featured: true,
    sortOrder: 5,
  },
  {
    slug: "prem-mandir-view-room",
    name: "Prem Mandir View Room",
    tagline: "Panoramic views of illuminated Prem Mandir",
    description:
      "A 340 sq.ft. room with a private balcony offering uninterrupted views of Prem Mandir's illumination.",
    longDescription:
      "The Prem Mandir View Room places one of Vrindavan's most photographed sights at your window. The 340 sq.ft. interior is finished in soft ivory and gold, with a king bed positioned to face the balcony. Each evening, the room's smart lighting can be dimmed to enjoy Prem Mandir's nightly illumination show, which begins at 7:30 PM. A telescope is provided for guests who wish to observe the temple's marble carvings in detail. The bathroom features a deep soaking tub positioned beside a frosted window so you can soak while watching the temple glow.",
    basePrice: 11500,
    maxGuests: 3,
    sizeSqft: 340,
    bedType: "King",
    view: "Prem Mandir",
    imageUrls: JSON.stringify([
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1400&q=80",
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=80",
    ]),
    amenities: JSON.stringify([
      "King bed facing balcony",
      "Private balcony with Prem Mandir view",
      "Telescope for temple observation",
      "Deep soaking tub with temple view",
      "Smart lighting with sunset mode",
      "Satvik breakfast included",
      "Complimentary Wi-Fi",
      "Air conditioning",
    ]),
    totalCount: 5,
    badge: "View",
    featured: false,
    sortOrder: 6,
  },
];

const reviews = [
  {
    guestName: "Anjali & Rohan Mehta",
    guestLocation: "Mumbai, India",
    rating: 5,
    title: "Felt like a pilgrimage and a five-star in one",
    body: "We brought my parents for Krishna Janmashtami. The Radha Rani Junior Suite gave the children their own space, and the staff arranged a 4 AM darshan at Banke Bihari with no queue. The satvik dinner on the rooftop was unforgettable.",
    source: "GOOGLE",
  },
  {
    guestName: "Suresh Iyer",
    guestLocation: "Chennai, India",
    rating: 5,
    title: "The Yamuna Suite is worth every rupee",
    body: "Waking up to the Yamuna and the sound of aarti is something I will not forget. The brass diya turn-down ritual each evening was a thoughtful touch. This is what spiritual luxury should feel like — calm, dignified, never ostentatious.",
    source: "DIRECT",
  },
  {
    guestName: "Priya Sharma",
    guestLocation: "London, UK (NRI)",
    rating: 5,
    title: "Best Vrindavan stay for international visitors",
    body: "As an NRI visiting with my British husband, I was worried about comfort. RK Residency struck the perfect balance — heritage aesthetics with Western-standard bathrooms and spotless rooms. The concierge arranged an English-speaking guide for ISKCON.",
    source: "TRIPADVISOR",
  },
  {
    guestName: "The Krishnamurthy Family",
    guestLocation: "Bengaluru, India",
    rating: 5,
    title: "Gokul Royal Villa for our parents' 50th anniversary",
    body: "We booked the villa for a 3-night satsang retreat with 14 family members. The courtyard was perfect for evening bhajans, and the in-house pandit conducted a beautiful havan. The butler service was impeccable. Worth every paisa.",
    source: "GOOGLE",
  },
  {
    guestName: "Dr. Anand Verma",
    guestLocation: "Toronto, Canada",
    rating: 5,
    title: "Prem Mandir view from the bathtub — magical",
    body: "I travel frequently for work and rarely write reviews. The Prem Mandir View Room deserves one. Watching the temple illuminate at sunset from a warm bath after a long day of darshan was the highlight of my India trip.",
    source: "DIRECT",
  },
  {
    guestName: "Meenakshi Reddy",
    guestLocation: "Hyderabad, India",
    rating: 4,
    title: "Heritage charm, excellent concierge",
    body: "The Bansuri Heritage Room is small but beautifully designed. What sets RK Residency apart is the concierge — they re-routed our entire day around a sudden rain shower and arranged an indoor kirtan instead. Lost half a star only for the slow Wi-Fi.",
    source: "GOOGLE",
  },
];

const offers = [
  {
    slug: "janmashtami-devotional-package",
    title: "Janmashtami Devotional Package",
    tagline: "Celebrate Krishna's birth at the heart of Braj",
    description:
      "Two nights in a Yamuna Suite or Prem Mandir View Room, midnight abhishek at Banke Bihari, reserved maha-aarti seating, and a satvik Janmashtami feast on the rooftop. Includes round-trip transfers to all major temples.",
    perks: JSON.stringify([
      "Midnight abhishek darshan at Banke Bihari",
      "Reserved maha-aarti seating",
      "Satvik Janmashtami feast on rooftop",
      "Round-trip temple transfers",
      "Complimentary floral rangoli in room",
    ]),
    discountPct: 12,
    validFrom: new Date("2026-08-20"),
    validUntil: new Date("2026-08-30"),
    imageUrl: "https://images.unsplash.com/photo-1604608672516-f1b9b1d37076?auto=format&fit=crop&w=1400&q=80",
    badge: "Janmashtami",
    featured: true,
  },
  {
    slug: "holi-braj-experience",
    title: "Holi Braj Experience",
    tagline: "Five days of Phoolon ki Holi & Lathmar Holi",
    description:
      "Five nights with curated access to Phoolon ki Holi at Banke Bihari, Lathmar Holi in Barsana, and a private gulal celebration on the residency rooftop. Includes traditional white attire, herbal colours, and skin-care kit.",
    perks: JSON.stringify([
      "Curated Phoolon ki Holi access at Banke Bihari",
      "Lathmar Holi day-trip to Barsana",
      "Private rooftop gulal celebration",
      "Traditional white attire provided",
      "Herbal colours & skin-care kit",
      "Satvik gujiya & thandai tasting",
    ]),
    discountPct: 15,
    validFrom: new Date("2026-03-08"),
    validUntil: new Date("2026-03-15"),
    imageUrl: "https://images.unsplash.com/photo-1583077874344-53b0e8a7b9ee?auto=format&fit=crop&w=1400&q=80",
    badge: "Holi",
    featured: true,
  },
  {
    slug: "stay-3-pay-2-pilgrim",
    title: "Stay 3, Pay 2 — Pilgrim Saver",
    tagline: "A longer Braj immersion, on us",
    description:
      "Book three consecutive nights in any room and pay for only two. Valid Sunday through Thursday, includes daily satvik breakfast and one complimentary guided temple walk with our resident Vrindavan scholar.",
    perks: JSON.stringify([
      "3 nights, pay for 2",
      "Daily satvik breakfast",
      "Complimentary guided temple walk",
      "Sunday–Thursday validity",
    ]),
    discountPct: 33,
    validFrom: new Date("2026-01-01"),
    validUntil: new Date("2026-12-31"),
    imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=80",
    badge: "Year-round",
    featured: false,
  },
];

const blogPosts = [
  {
    slug: "banke-bihari-darshan-guide",
    title: "Banke Bihari Darshan: A First-Timer's Guide",
    excerpt:
      "Timings, queues, the mangala aarti, and what to wear — everything you need before your first visit to Vrindavan's most beloved temple.",
    body: "Banke Bihari Mandir is the spiritual heart of Vrindavan...",
    category: "TEMPLE_GUIDE",
    tags: JSON.stringify(["banke-bihari", "vrindavan", "first-visit"]),
    imageUrl: "https://images.unsplash.com/photo-1605649461784-3a8a14f5a7e7?auto=format&fit=crop&w=1400&q=80",
    published: true,
    publishedAt: new Date("2026-06-10"),
    readingMins: 6,
  },
  {
    slug: "yamuna-aarti-timings-vrindavan",
    title: "Yamuna Aarti at Keshi Ghat: Timings & What to Expect",
    excerpt:
      "The evening Yamuna aarti at Keshi Ghat is the most moving free experience in Vrindavan. Here are the timings and the best vantage points.",
    body: "Each evening at sunset...",
    category: "EXPERIENCE",
    tags: JSON.stringify(["yamuna", "aarti", "keshi-ghat"]),
    imageUrl: "https://images.unsplash.com/photo-1604608672516-f1b9b1d37076?auto=format&fit=crop&w=1400&q=80",
    published: true,
    publishedAt: new Date("2026-05-22"),
    readingMins: 4,
  },
  {
    slug: "janmashtami-2026-vrindavan-calendar",
    title: "Janmashtami 2026 in Vrindavan: The Complete Calendar",
    excerpt:
      "From the midnight abhishek to the Dahi Handi celebrations, here is the hour-by-hour calendar for Janmashtami 2026 in Vrindavan.",
    body: "Janmashtami, the celebration of Krishna's birth...",
    category: "FESTIVAL",
    tags: JSON.stringify(["janmashtami", "festival", "2026"]),
    imageUrl: "https://images.unsplash.com/photo-1567510297787-d5e2a5d63e0f?auto=format&fit=crop&w=1400&q=80",
    published: true,
    publishedAt: new Date("2026-07-01"),
    readingMins: 8,
  },
];

async function main() {
  console.log("Seeding RK Residency database...");

  // Reset (idempotent)
  await db.review.deleteMany();
  await db.offer.deleteMany();
  await db.blogPost.deleteMany();
  await db.contactMessage.deleteMany();
  await db.newsletterSubscriber.deleteMany();
  await db.booking.deleteMany();
  await db.rateOverride.deleteMany();
  await db.room.deleteMany();
  await db.guest.deleteMany();

  for (const r of rooms) {
    await db.room.create({ data: r });
  }

  for (const rv of reviews) {
    await db.review.create({ data: rv });
  }

  for (const o of offers) {
    await db.offer.create({ data: o });
  }

  for (const b of blogPosts) {
    await db.blogPost.create({ data: b });
  }

  // Festival rate overrides for Yamuna Suite (Janmashtami surge)
  const yamuna = await db.room.findUnique({ where: { slug: "yamuna-suite" } });
  if (yamuna) {
    await db.rateOverride.create({
      data: {
        roomId: yamuna.id,
        name: "Janmashtami Surge",
        startDate: new Date("2026-08-24"),
        endDate: new Date("2026-08-27"),
        pricePerNight: 22500,
      },
    });
    await db.rateOverride.create({
      data: {
        roomId: yamuna.id,
        name: "Holi Weekend",
        startDate: new Date("2026-03-12"),
        endDate: new Date("2026-03-15"),
        pricePerNight: 19500,
      },
    });
  }

  console.log("Seed complete.");
  console.log(`  - Rooms: ${await db.room.count()}`);
  console.log(`  - Reviews: ${await db.review.count()}`);
  console.log(`  - Offers: ${await db.offer.count()}`);
  console.log(`  - Blog posts: ${await db.blogPost.count()}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
