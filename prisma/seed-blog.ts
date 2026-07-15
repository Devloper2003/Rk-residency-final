// Add full body content to existing blog posts so the blog detail page has substance.
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const bodies: Record<string, string> = {
  "banke-bihari-darshan-guide": `## Why Banke Bihari is the spiritual heart of Vrindavan

Banke Bihari Mandir is, for most pilgrims, the single most important stop on a Braj yatra. The temple houses the original idol of Banke Bihari — Krishna in his three-fold bent form (Tribhanga) — which was discovered by Swami Haridas in Nidhivan in the 16th century. The idol was moved to its current location in 1864 by Swami Haridas's grandson.

## Timings

The temple opens at 7:45 AM with the Mangala aarti (the only temple in Vrindavan where the morning aarti is held late, because it is believed the Lord sleeps in after his night-long Raas Leela). Darshan continues till noon, then closes for the afternoon. The temple reopens at 5:30 PM and the evening aarti is at 7:00 PM. The temple closes by 9:30 PM.

- Morning darshan: 7:45 AM – 12:00 PM
- Evening darshan: 5:30 PM – 9:30 PM
- Sandhya aarti: 7:00 PM

## The curtain tradition

What makes Banke Bihari unique among Krishna temples is the curtain. The idol's eyes are believed to be so powerful that gazing at them too long would cause a devotee to faint with bhava (spiritual ecstasy). To protect devotees, the pujaris pull a curtain across the sanctum every few minutes — and then pull it aside again for a brief darshan. Do not be alarmed; this is the temple's central ritual.

## What to wear

Dress modestly. Shoulders and knees should be covered for both men and women. Saris, kurtas, salwar-kameez are all appropriate. Avoid shorts, sleeveless tops and revealing clothing — you will be turned away at the entrance.

## Avoiding the crowds

Saturday is the busiest day of the week. Janmashtami week (August/September) sees queues of 8+ hours — avoid unless you have a reserved pass. The quietest darshan is on weekday mornings between 8:00 AM and 9:30 AM, after the initial rush has passed.

## Our concierge's tip

RK Residency arranges a reserved morning darshan pass for our guests. With the pass, you skip the general queue and enter through the VIP gate — your wait drops from 90 minutes to under 10. Request the pass at check-in; we need 24 hours' notice.

## What not to bring

Mobile phones, cameras, bags, leather items (wallets are fine if there's no leather) and food are not allowed inside. Free lockers are available at the temple entrance — but the line for lockers can be long. We recommend leaving everything except a small cloth purse with your offering at RK Residency.`,

  "yamuna-aarti-timings-vrindavan": `## What is the Yamuna Aarti?

Each evening at sunset, priests at Keshi Ghat perform the Yamuna Aarti — a centuries-old ritual of large brass lamps, conch shells, and the ancient Yami-Krishna stotram chanted to the river goddess Yamuna Devi. The aarti is not a tourist performance; it is a daily act of devotion that has been conducted here for over 400 years.

## Timings (they shift with the seasons)

The Yamuna Aarti happens at sunset, which means the exact time changes through the year. Our concierge confirms each morning's exact time, but as a general guide:

- Winter (Nov – Feb): 5:15 PM – 5:45 PM
- Spring (Mar – Apr): 6:00 PM – 6:30 PM
- Summer (May – Jun): 7:00 PM – 7:30 PM
- Monsoon (Jul – Sep): 6:30 PM – 7:00 PM

Arrive 30 minutes early to find a good spot.

## Where to watch

There are three vantage points:

- **The ghat steps** — free, but crowded. You will be standing. Best for the close-up view of the lamps.
- **A boat on the Yamuna** — the most atmospheric option. RK Residency arranges private rowboats for our guests, which position you on the water with an unobstructed view. The boat also lets you float your own diya offering.
- **The RK Residency rooftop** — for guests who cannot walk to the ghat. We pipe the aarti audio to the rooftop during the season.

## What to expect

The aarti itself lasts about 25 minutes. The priests begin with a conch-shell invocation, then perform the aarti with seven large brass lamps. The crowd sings along with the Yami-Krishna stotram — most locals know it by heart. At the end, pilgrims float small leaf-boats (dona) with marigold petals and a lit diya onto the river as an offering.

## The diya offering

Floating a diya on the Yamuna is one of the most moving small rituals of a Braj yatra. RK Residency provides the leaf-boat, marigold and diya free of charge to any guest who asks at the front desk. The boatmen at Keshi Ghat also sell them for ₹50.

## What to wear

The ghat can be breezy after sunset, especially in winter. Carry a shawl or light jacket. Footwear is allowed on the ghat (unlike inside temples), but you may want to remove your shoes if you plan to step down to the water's edge.`,

  "janmashtami-2026-vrindavan-calendar": `## Janmashtami 2026 — the most sacred night in Braj

Janmashtami, the celebration of Krishna's birth, is the single most important festival in Vrindavan. In 2026, Janmashtami falls on **August 25** (Monday). The celebrations span five days, from August 23 to August 27 — and the entire Braj region transforms.

This is the busiest week of the year. If you are planning to visit, you must book accommodation 4–6 months in advance. RK Residency opens Janmashtami bookings on April 1 each year.

## The hour-by-hour calendar

### August 23 — Devotthan Ekadashi (Sunday)

The festival begins on Ekadashi, the eleventh day of the lunar fortnight. Devotees begin a 48-hour fast. Most temples begin special kirtans from 4:00 AM. Banke Bihari Mandir begins the Banke Bihari Saptah, a week of continuous kirtan.

### August 24 — Rohini Nakshatra begins (Monday)

The Rohini nakshatra (the star under which Krishna was born) begins at 5:23 PM. This is when Janmashtami technically begins. Most temples perform the first abhishek (ceremonial bath of the deity) in the late afternoon. ISKCON holds an all-night kirtan from 6:00 PM onwards.

### August 25 — Krishna Janmashtami (Tuesday)

The central day. Krishna was born at midnight, so the celebrations peak at 12:00 AM (the night of Aug 25–26).

- 4:00 AM: Mangala aarti at ISKCON (one of the few times non-VIPs can attend)
- 7:00 AM: Banke Bihari Mangala darshan (queue: 4+ hours without a pass)
- 12:00 PM: Abhishek at ISKCON — the deity is bathed in panchamrit
- 6:00 PM: Sandhya aarti at all major temples
- 11:30 PM: The midnight abhishek at Banke Bihari — the high point of the entire festival
- 12:00 AM: Krishna's birth is announced with conch shells, bells and a thunderous kirtan that rolls across Vrindavan

### August 26 — Nandotsav (Wednesday)

The day after Krishna's birth, when Nanda Maharaj celebrated the naming ceremony. The mood shifts from solemn to celebratory. Temples distribute maha-prasadam. Gokul and Mahavan (across the Yamuna) hold large processions.

### August 27 — Festival close (Thursday)

The final day of the official celebrations. Most pilgrims begin their journey home. Temples return to regular darshan timings. RK Residency hosts a closing satsang on the rooftop at 7:00 PM.

## Booking the abhishek

The midnight abhishek at Banke Bihari is the most sought-after darshan of the year. The temple releases 500 VIP passes (₹2,500 each) one month before the festival — they sell out in hours. RK Residency reserves a small allocation for our staying guests as part of the Janmashtami Devotional Package.

## What to expect at the crowds

Vrindavan's normal population is around 65,000. During Janmashtami week, it swells to over 500,000. Be prepared for:

- 2–4 hour waits at all major temples (without a pass)
- Road closures and restricted vehicle access within 2 km of Banke Bihari
- Limited mobile network due to congestion
- Higher prices on everything from rickshaws to marigold garlands

## Our Janmashtami advice

Book the Janmashtami Devotional Package at RK Residency. We secure your abhishek pass, your temple transfers, your rooftop feast seat, and your festival-rate room — all in one. You arrive, you participate, you go home with memories of a Braj Janmashtami without the logistical exhaustion. Write to stay@rkresidency.in to book.`,
};

async function main() {
  for (const [slug, body] of Object.entries(bodies)) {
    await db.blogPost.update({ where: { slug }, data: { body } });
    console.log(`Updated: ${slug}`);
  }
}
main().catch(console.error).finally(() => db.$disconnect());
