// Seed editable site content + settings
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

const contentItems = [
  // ===================== HERO =====================
  { key: "hero.background_image", value: "/images/hero-vrindavan.webp", section: "hero", type: "image", label: "Background image" },
  { key: "hero.location_badge", value: "Vrindavan · On the banks of the Yamuna", section: "hero", type: "text", label: "Location badge" },
  { key: "hero.headline_line1", value: "Where the spirit of Braj", section: "hero", type: "text", label: "Headline line 1" },
  { key: "hero.headline_line2", value: "finds its rest", section: "hero", type: "text", label: "Headline line 2" },
  { key: "hero.subheadline", value: "A heritage-luxury residency steps from Banke Bihari Mandir & ISKCON Vrindavan. Calm, dignified comfort for pilgrims, devotee families and cultural travellers.", section: "hero", type: "textarea", label: "Sub-headline" },
  { key: "hero.cta_primary", value: "Check Availability", section: "hero", type: "text", label: "Primary CTA" },
  { key: "hero.cta_secondary", value: "Explore Rooms", section: "hero", type: "text", label: "Secondary CTA" },
  { key: "hero.rating_text", value: "4.9 · 1,240+ verified stays", section: "hero", type: "text", label: "Rating text" },
  { key: "hero.featured_on_text", value: "Featured on Google · TripAdvisor", section: "hero", type: "text", label: "Featured-on text" },

  // ===================== TRUST BADGES =====================
  { key: "trust.badge1_title", value: "Best Price Guarantee", section: "trust", type: "text", label: "Badge 1 title" },
  { key: "trust.badge1_sub", value: "Direct booking, no OTA commission", section: "trust", type: "text", label: "Badge 1 subtitle" },
  { key: "trust.badge2_title", value: "Free Cancellation", section: "trust", type: "text", label: "Badge 2 title" },
  { key: "trust.badge2_sub", value: "Up to 72 hours before check-in", section: "trust", type: "text", label: "Badge 2 subtitle" },
  { key: "trust.badge3_title", value: "Late Check-out", section: "trust", type: "text", label: "Badge 3 title" },
  { key: "trust.badge3_sub", value: "Complimentary till 2 PM on request", section: "trust", type: "text", label: "Badge 3 subtitle" },
  { key: "trust.badge4_title", value: "Satvik Breakfast", section: "trust", type: "text", label: "Badge 4 title" },
  { key: "trust.badge4_sub", value: "Pure vegetarian, daily included", section: "trust", type: "text", label: "Badge 4 subtitle" },

  // ===================== ABOUT (homepage) =====================
  { key: "about.label", value: "Our Story", section: "about", type: "text", label: "Section label" },
  { key: "about.title_line1", value: "A heritage home on the", section: "about", type: "text", label: "Title line 1" },
  { key: "about.title_line2", value: "banks of the Yamuna", section: "about", type: "text", label: "Title line 2" },
  { key: "about.image", value: "/images/heritage-room.webp", section: "about", type: "image", label: "Image" },
  { key: "about.image_alt", value: "Heritage luxury room with jharokha window at RK Residency", section: "about", type: "text", label: "Image alt text" },
  { key: "about.image_caption_label", value: "Heritage Wing · Est. 2014", section: "about", type: "text", label: "Image caption label" },
  { key: "about.image_caption_sub", value: "Hand-carved teak · Makrana marble", section: "about", type: "text", label: "Image caption subtext" },
  { key: "about.stat_card_label", value: "Since 2014", section: "about", type: "text", label: "Stat card label" },
  { key: "about.stat_card_title", value: "Welcoming devotees", section: "about", type: "text", label: "Stat card title" },
  { key: "about.stat_card_sub", value: "from 42 countries", section: "about", type: "text", label: "Stat card subtitle" },
  { key: "about.body_p1", value: "RK Residency began as a small family guesthouse in 2014, when Shyam Khandelwal returned to his hometown of Vrindavan after two decades in hospitality abroad. The vision was simple: to offer visiting devotees a place that felt less like a hotel and more like a well-kept Braj home — where the morning begins with the sound of temple bells and the day ends with the scent of marigold.", section: "about", type: "textarea", label: "Body paragraph 1" },
  { key: "about.body_p2", value: "Over the years we have grown to 35 rooms across three wings — the Heritage Wing with hand-carved teak jharokhas, the Garden Wing overlooking our private courtyard, and the Yamuna Suite with a private balcony overlooking the river. Every piece of furniture has been commissioned from local Braj artisans; every meal is cooked in our satvik kitchen; every member of our staff lives within walking distance of the property.", section: "about", type: "textarea", label: "Body paragraph 2" },
  { key: "about.founder_quote", value: "We do not run a hotel. We run a home that happens to welcome guests. The day we forget that is the day we should close our doors.", section: "about", type: "textarea", label: "Founder quote" },
  { key: "about.founder_name", value: "— Shyam Khandelwal, Founder", section: "about", type: "text", label: "Founder attribution" },
  { key: "about.cta_text", value: "Discover the Braj region", section: "about", type: "text", label: "CTA text" },
  { key: "about.stats", value: JSON.stringify([
    { value: "12", suffix: " yrs", label: "Welcoming guests" },
    { value: "35", suffix: "", label: "Rooms & suites" },
    { value: "48,000", suffix: "+", label: "Devotee stays" },
    { value: "4", suffix: "", label: "Temples within 1 km" },
  ]), section: "about", type: "json", label: "Stats array (JSON)" },

  // ===================== ROOMS SECTION HEADER =====================
  { key: "rooms.label", value: "Accommodation", section: "rooms", type: "text", label: "Section label" },
  { key: "rooms.title", value: "Rooms, suites & a private villa", section: "rooms", type: "text", label: "Section title" },
  { key: "rooms.subtitle", value: "Each room is named after a sacred Braj leela and dressed in ivory, peacock-teal and warm gold. Makrana marble bathrooms, hand-embroidered canopies and river or garden views come as standard.", section: "rooms", type: "textarea", label: "Subtitle" },
  { key: "rooms.note", value: "All rates include satvik breakfast, complimentary Wi-Fi and daily temple-visit assistance. Taxes (12% GST) and ₹250 service fee are extra.", section: "rooms", type: "textarea", label: "Bottom note" },

  // ===================== EXPERIENCES SECTION =====================
  { key: "experiences.label", value: "Beyond the temple", section: "experiences", type: "text", label: "Section label" },
  { key: "experiences.title", value: "Sacred walks from your doorstep", section: "experiences", type: "text", label: "Section title" },
  { key: "experiences.subtitle", value: "Five Braj experiences within walking distance. Our concierge can arrange guided visits, aarti seating and special darshan.", section: "experiences", type: "textarea", label: "Subtitle" },
  { key: "experiences.note", value: "Guided Braj walks ₹2,500/day · Photography sessions ₹1,200/session · Book at the front desk.", section: "experiences", type: "textarea", label: "Bottom note" },
  { key: "experiences.items", value: JSON.stringify([
    { name: "Banke Bihari Mandir", distance: "450 m", walkTime: "6 min", bestTime: "Mangala 7 AM", timings: "Summer 7 AM – 12 PM, 5:30 – 9:30 PM · Winter 7:30 AM – 1 PM, 4 – 8:30 PM", description: "Vrindavan's most beloved temple. Home to Sri Banke Bihari — Krishna in tribhanga posture. We arrange special morning darshan passes for our guests.", image: "https://images.unsplash.com/photo-1604608672516-f1b9b1d37076?auto=format&fit=crop&w=1400&q=80", accent: "gold" },
    { name: "ISKCON Sri Krishna Balaram", distance: "1.2 km", walkTime: "15 min", bestTime: "Sandhya 6:30 PM", timings: "Morning 4:30 AM – 12:30 PM · Evening 4 – 8:30 PM", description: "The International Society for Krishna Consciousness temple. Kirtan and aarti are soul-stirring, especially during sandhya aarti.", image: "https://images.unsplash.com/photo-1567510297787-d5e2a5d63e0f?auto=format&fit=crop&w=1400&q=80", accent: "teal" },
    { name: "Prem Mandir", distance: "2 km", walkTime: "25 min", bestTime: "Evening 7 PM", timings: "5:30 AM – 12 PM · 4 – 8:30 PM (light show 7 – 7:30 PM)", description: "Sprawling white marble temple complex built by Jagadguru Kripalu Maharaj. The evening light-and-sound show is a must-see.", image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1400&q=80", accent: "marsala" },
    { name: "Nidhivan", distance: "800 m", walkTime: "10 min", bestTime: "Before sunset", timings: "Morning 8 AM – 5 PM (closed after sunset)", description: "Mystical tulsi forest where Krishna is believed to perform raas-leela every night. The sealed doors and sacred silence after sunset are unforgettable.", image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=80", accent: "gold" },
    { name: "Yamuna Aarti at Keshi Ghat", distance: "650 m", walkTime: "8 min", bestTime: "Sunrise 5:30 AM & Sunset 6:30 PM", timings: "Year-round, weather permitting", description: "Dawn and dusk aarti at Keshi Ghat — lamps floating on the Yamuna, devotees singing. We arrange a private boat for the sunrise aarti.", image: "/images/yamuna-aarti.webp", accent: "teal" },
  ]), section: "experiences", type: "json", label: "Experiences array (JSON)" },

  // ===================== DINING SECTION =====================
  { key: "dining.label", value: "Satvik Dining", section: "dining", type: "text", label: "Section label" },
  { key: "dining.title", value: "Pure food, prepared with intention", section: "dining", type: "text", label: "Section title" },
  { key: "dining.subtitle", value: "Our rooftop Yamuna Pavilion serves a satvik thali — no onion, no garlic, no overnight storage. Sourced from Braj farms, cooked in pure desi ghee.", section: "dining", type: "textarea", label: "Subtitle" },
  { key: "dining.image", value: "/images/satvik-dining.webp", section: "dining", type: "image", label: "Image" },
  { key: "dining.image_caption_label", value: "Rooftop Yamuna Pavilion", section: "dining", type: "text", label: "Image caption label" },
  { key: "dining.image_caption_sub", value: "Dinner under candlelight, 7 PM – 10 PM", section: "dining", type: "text", label: "Image caption subtext" },
  { key: "dining.principles", value: JSON.stringify([
    { icon: "Leaf", title: "Satvik", body: "No onion, no garlic, no overnight storage. Pure vegetarian, prasad-grade." },
    { icon: "Wheat", title: "Local", body: "Grains from Braj farms, dairy from Gaushala, vegetables from our kitchen garden." },
    { icon: "Flame", title: "Slow-cooked", body: "Hand-ground spices, copper-utensil cooking, no microwave. Ever." },
    { icon: "Heart", title: "Prasad", body: "Every meal is offered to Thakur-ji before serving. Food as blessing." },
  ]), section: "dining", type: "json", label: "Satvik principles (JSON)" },
  { key: "dining.signature_dishes", value: JSON.stringify([
    { name: "Braj Thali", desc: "9-piece vegetarian thali on brass plate — seasonal sabzi, dal, rice, roti, papad, chutney, salad, sweet, chaas.", price: "₹450", veg: true },
    { name: "Makhan-Mishri Poha", desc: "Poha flattened rice with fresh white butter and rock sugar — Krishna's favourite.", price: "₹180", veg: true },
    { name: "Yamuna Fish Curry", desc: "River fish in mild tomato-yogurt gravy (only on prior request, satvik rules relaxed).", price: "₹680", veg: false },
    { name: "Thandai", desc: "Chilled almond-saffron milk with rose petals. Famous Braj refreshment.", price: "₹120", veg: true },
  ]), section: "dining", type: "json", label: "Signature dishes (JSON)" },
  { key: "dining.amenities", value: JSON.stringify([
    { icon: "Utensils", label: "Rooftop dining", group: "Dining" },
    { icon: "Users", label: "Private dining", group: "Dining" },
    { icon: "Cake", label: "Custom cake orders", group: "Dining" },
    { icon: "Coffee", label: "Tea & filter coffee", group: "Dining" },
    { icon: "Leaf", label: "Veg-only kitchen", group: "Dining" },
    { icon: "Beer", label: "No alcohol policy", group: "Dining" },
    { icon: "Wine", label: "Sommelier on request", group: "Beverages" },
    { icon: "Pizza", label: "Continental on order", group: "Dining" },
    { icon: "Soup", label: "Soup & salad bar", group: "Dining" },
    { icon: "IceCream", label: "Braj mithai counter", group: "Desserts" },
    { icon: "Croissant", label: "Bakery items", group: "Desserts" },
    { icon: "Apple", label: "Fresh fruit platter", group: "Desserts" },
  ]), section: "dining", type: "json", label: "Dining amenities (JSON)" },
  { key: "dining.amenities_label", value: "Dining & Pavilion", section: "dining", type: "text", label: "Amenities label" },
  { key: "dining.amenities_title", value: "Everything that comes with your table", section: "dining", type: "text", label: "Amenities title" },

  // ===================== GALLERY SECTION =====================
  { key: "gallery.label", value: "Braj in frames", section: "gallery", type: "text", label: "Section label" },
  { key: "gallery.title", value: "A glimpse of life at RK Residency", section: "gallery", type: "text", label: "Section title" },
  { key: "gallery.subtitle", value: "Sunrise over the Yamuna, hand-embroidered canopies, marigold garlands at dawn. Moments from our home.", section: "gallery", type: "textarea", label: "Subtitle" },
  { key: "gallery.items", value: JSON.stringify([
    { src: "/images/hero-vrindavan.webp", alt: "Sunrise over Vrindavan temple skyline", caption: "Sunrise over the temple skyline", span: "lg" },
    { src: "/images/heritage-room.webp", alt: "Heritage luxury room with jharokha window", caption: "Yamuna Suite — jharokha window", span: "sm" },
    { src: "/images/yamuna-aarti.webp", alt: "Yamuna aarti at dusk", caption: "Yamuna aarti at Keshi Ghat", span: "sm" },
    { src: "/images/satvik-dining.webp", alt: "Satvik thali on brass plate", caption: "Braj Thali — rooftop dining", span: "sm" },
    { src: "https://images.unsplash.com/photo-1604608672516-f1b9b1d37076?auto=format&fit=crop&w=1400&q=80", alt: "Banke Bihari Mandir interior", caption: "Banke Bihari Mandir", span: "sm" },
    { src: "https://images.unsplash.com/photo-1567510297787-d5e2a5d63e0f?auto=format&fit=crop&w=1400&q=80", alt: "ISKCON temple exterior", caption: "ISKCON Vrindavan", span: "sm" },
    { src: "https://images.unsplash.com/photo-1605538883669-8b8004d33295?auto=format&fit=crop&w=1400&q=80", alt: "Marigold garlands at temple", caption: "Marigold garlands", span: "sm" },
    { src: "https://images.unsplash.com/photo-1609205807107-454f1c1aed12?auto=format&fit=crop&w=1400&q=80", alt: "Krishna idol decoration", caption: "Thakur-ji shringar", span: "lg" },
  ]), section: "gallery", type: "json", label: "Gallery items (JSON)" },

  // ===================== OFFERS SECTION HEADER =====================
  { key: "offers.label", value: "Offers & Packages", section: "offers", type: "text", label: "Section label" },
  { key: "offers.title", value: "Sacred seasons, thoughtfully packaged", section: "offers", type: "text", label: "Section title" },
  { key: "offers.subtitle", value: "Festival-season packages, extended-stay saver rates, and pilgrimage group discounts. All rates include breakfast and temple-visit assistance.", section: "offers", type: "textarea", label: "Subtitle" },
  { key: "offers.note", value: "All offers are subject to availability and may be combined with direct-booking discounts. Festival surcharges apply during Janmashtami, Holi and Radhashtami.", section: "offers", type: "textarea", label: "Bottom note" },

  // ===================== TESTIMONIALS SECTION HEADER =====================
  { key: "testimonials.label", value: "Guests & devotees", section: "testimonials", type: "text", label: "Section label" },
  { key: "testimonials.title", value: "Voices from our Braj family", section: "testimonials", type: "text", label: "Section title" },
  { key: "testimonials.aggregate_rating", value: "4.9", section: "testimonials", type: "text", label: "Aggregate rating" },
  { key: "testimonials.google_review_count", value: "840+ reviews", section: "testimonials", type: "text", label: "Google review count" },
  { key: "testimonials.tripadvisor_review_count", value: "400+ reviews · Travellers' Choice 2025", section: "testimonials", type: "text", label: "TripAdvisor review count" },

  // ===================== FAQ =====================
  { key: "faq.label", value: "Questions & answers", section: "faq", type: "text", label: "Section label" },
  { key: "faq.title", value: "Everything a Braj pilgrim asks us", section: "faq", type: "text", label: "Section title" },
  { key: "faq.items", value: JSON.stringify([
    { category: "Booking", q: "How do I book a room at RK Residency?", a: "You can book directly through our website using the booking widget on any room page, or call our front desk at +91 565 234 5678. Direct bookings get our best-price guarantee — no OTA commission, no hidden fees." },
    { category: "Booking", q: "What is your cancellation policy?", a: "Free cancellation up to 72 hours before check-in. Within 72 hours, the first night's charge applies. No-shows are charged the full booking amount." },
    { category: "Booking", q: "Do you offer airport pickup?", a: "Yes, we arrange pickup from Agra (Kheria) airport, Mathura Junction railway station, and Delhi (IGI) airport. Charges: Agra ₹2,500 · Mathura ₹800 · Delhi ₹8,500. Please book at least 24 hours in advance." },
    { category: "Stay", q: "Is the property vegetarian-only?", a: "The kitchen is strictly satvik vegetarian — no onion, no garlic, no meat, no eggs, no alcohol on premises. Guests may bring outside food but we request it be vegetarian out of respect for the Braj tradition." },
    { category: "Stay", q: "What are the check-in and check-out times?", a: "Check-in is from 2:00 PM and check-out is by 11:00 AM. Early check-in and late check-out are subject to availability — please request at the front desk. Late check-out till 2 PM is complimentary on request." },
    { category: "Stay", q: "Do you have Wi-Fi and AC?", a: "Yes, complimentary high-speed Wi-Fi throughout the property, and every room has individually controlled air-conditioning. We also have a backup generator for power cuts (common in summer)." },
    { category: "Temple", q: "Can you arrange Banke Bihari darshan?", a: "Yes, our concierge arranges special morning darshan passes for Banke Bihari Mandir (subject to temple availability). During peak festivals like Janmashtami and Holi, darshan passes must be booked at least 2 weeks in advance." },
    { category: "Temple", q: "What are the aarti timings at Keshi Ghat?", a: "Yamuna aarti happens twice daily at Keshi Ghat — sunrise (around 5:30 AM in summer, 6:30 AM in winter) and sunset (around 6:30 PM in summer, 5:30 PM in winter). We arrange a private boat for the sunrise aarti at ₹1,200 per boat (up to 4 guests)." },
    { category: "Temple", q: "Do you organize guided temple tours?", a: "Yes, our Braj-trained guides lead half-day (₹2,500) and full-day (₹4,500) tours covering the 7 main temples — Banke Bihari, ISKCON, Prem Mandir, Nidhivan, Radha Raman, Madan Mohan, and Keshi Ghat. Tours include transportation by car or e-rickshaw." },
    { category: "Festivals", q: "When is Janmashtami celebrated in Vrindavan?", a: "Janmashtami falls in August/September (Krishna Janmashtami). Vrindavan celebrates for 3 days — the main midnight celebration at Banke Bihari is once-in-a-lifetime. Book 3+ months in advance; we offer a special Janmashtami Package with temple passes and reserved seating." },
    { category: "Festivals", q: "What is Holi like in Vrindavan?", a: "Vrindavan Holi is world-famous — Phulen ki Holi (flower Holi) at Banke Bihari on the morning of Aanola Ekadashi, then rang (color) Holi the next day. We provide organic colors, white kurtas, and a private rooftop viewing spot. Book 2+ months in advance." },
    { category: "Festivals", q: "Are there other festivals worth visiting for?", a: "Yes — Radhashtami (September), Kartik Purnima (November), Sharad Purnima (October), and Gaura Purnima (March) are all major Braj festivals. Each has a unique character. Our festival calendar page has the full schedule." },
    { category: "Facilities", q: "Do you have a swimming pool?", a: "No, we do not have a swimming pool — Braj tradition considers the Yamuna the sacred river for bathing, and our property is built as a heritage home rather than a resort. We do have a rooftop yoga pavilion and an ayurvedic massage room." },
    { category: "Facilities", q: "Is parking available?", a: "Yes, complimentary covered parking for up to 12 cars. Two-wheelers also welcome. The property is in a no-traffic zone during aarti hours (5-7 AM and 6-8 PM); guests receive a pass for access." },
    { category: "Payments", q: "What payment methods do you accept?", a: "We accept all major credit/debit cards, UPI (Google Pay, PhonePe, Paytm), bank transfers, and cash. For international guests, we also accept PayPal. GST invoice provided on request." },
  ]), section: "faq", type: "json", label: "FAQ items (JSON)" },

  // ===================== FESTIVAL CALENDAR =====================
  { key: "festivals.label", value: "Braj Calendar", section: "festivals", type: "text", label: "Section label" },
  { key: "festivals.title", value: "Braj Festival Calendar 2026", section: "festivals", type: "text", label: "Section title" },
  { key: "festivals.subtitle", value: "Vrindavan's year revolves around Krishna's leelas. Plan your visit around these sacred days for the deepest experience.", section: "festivals", type: "textarea", label: "Subtitle" },
  { key: "festivals.items", value: JSON.stringify([
    { date: "2026-03-14", name: "Holi at Banke Bihari", nameHi: "होली", description: "Phulen wali Holi — flower petals showered on devotees at Banke Bihari Mandir. The original Vrindavan Holi.", significance: "Most iconic Braj festival", where: "Banke Bihari Mandir", bestFor: "Cultural travellers", accent: "marsala" },
    { date: "2026-08-26", name: "Janmashtami", nameHi: "जन्माष्टमी", description: "Krishna's birthday celebration. Midnight aarti, abhishek, and cradle darshan across all Vrindavan temples.", significance: "Krishna's appearance day", where: "All major temples", bestFor: "Devotee families", accent: "gold" },
    { date: "2026-09-12", name: "Radhashtami", nameHi: "राधाष्टमी", description: "Radha Rani's appearance day — celebrated grandly at Barsana (her village) and at Radha Raman Temple in Vrindavan.", significance: "Radha's appearance day", where: "Barsana & Radha Raman", bestFor: "Deep devotees", accent: "teal" },
    { date: "2026-10-27", name: "Sharad Purnima", nameHi: "शरद पूर्णिमा", description: "Ras-leela under the full moon. Kheer is left overnight in moonlight as prasad. Prem Mandir hosts special kirtan.", significance: "Krishna's maharaas", where: "Prem Mandir & Seva Kunj", bestFor: "Spiritual seekers", accent: "gold" },
    { date: "2026-11-15", name: "Kartik Purnima", nameHi: "कार्तिक पूर्णिमा", description: "End of Kartik month — the holiest month for Braj vaas. Yamuna deep-daan at Keshi Ghat with thousands of lamps.", significance: "Damodar month close", where: "Keshi Ghat", bestFor: "Devotee families", accent: "teal" },
    { date: "2026-03-04", name: "Gaura Purnima", nameHi: "गौरा पूर्णिमा", description: "Chaitanya Mahaprabhu's appearance day. ISKCON temple leads a grand procession through Vrindavan's parikrama path.", significance: "Gauranga's appearance", where: "ISKCON temple", bestFor: "ISKCON devotees", accent: "marsala" },
  ]), section: "festivals", type: "json", label: "Festivals array (JSON)" },

  // ===================== CONTACT SECTION =====================
  { key: "contact.phone", value: "+91 565 234 5678", section: "contact", type: "text", label: "Primary phone (display)" },
  { key: "contact.phone_tel", value: "+915652345678", section: "contact", type: "text", label: "Primary phone (tel: format)" },
  { key: "contact.phone_reservations", value: "+91 98765 43210", section: "contact", type: "text", label: "Reservations phone" },
  { key: "contact.email", value: "stay@rkresidency.in", section: "contact", type: "text", label: "Primary email" },
  { key: "contact.email_events", value: "events@rkresidency.in", section: "contact", type: "text", label: "Events email" },
  { key: "contact.address_line1", value: "RK Residency, Parikrama Marg", section: "contact", type: "text", label: "Address line 1" },
  { key: "contact.address_line2", value: "Vrindavan, Mathura", section: "contact", type: "text", label: "Address line 2" },
  { key: "contact.address_line3", value: "Uttar Pradesh 281121, India", section: "contact", type: "text", label: "Address line 3" },
  { key: "contact.address_full", value: "RK Residency, Parikrama Marg, Vrindavan, Mathura, UP 281121", section: "contact", type: "text", label: "Full address (one line)" },
  { key: "contact.map_embed_url", value: "https://www.openstreetmap.org/export/embed.html?bbox=77.6950%2C27.5650%2C77.7250%2C27.5850&layer=mapnik&marker=27.5756%2C77.7100", section: "contact", type: "text", label: "Map embed URL (iframe src)" },
  { key: "contact.map_directions_url", value: "https://www.google.com/maps/dir/?api=1&destination=Vrindavan%20Uttar%20Pradesh", section: "contact", type: "text", label: "Google Maps directions URL" },
  { key: "contact.geo_latitude", value: "27.5756", section: "contact", type: "text", label: "Latitude" },
  { key: "contact.geo_longitude", value: "77.7100", section: "contact", type: "text", label: "Longitude" },
  { key: "contact.whatsapp_prefill_text", value: "I would like to enquire about availability at RK Residency", section: "contact", type: "textarea", label: "WhatsApp default message text" },
  { key: "contact.nearby", value: JSON.stringify([
    { name: "Banke Bihari Mandir", distance: "450 m", time: "6 min walk", time2: "6 min" },
    { name: "ISKCON Vrindavan", distance: "1.2 km", time: "15 min walk", time2: "15 min" },
    { name: "Prem Mandir", distance: "2 km", time: "25 min walk", time2: "25 min" },
    { name: "Keshi Ghat (Yamuna)", distance: "650 m", time: "8 min walk", time2: "8 min" },
    { name: "Mathura Junction", distance: "12 km", time: "30 min drive", time2: "30 min" },
    { name: "Agra Airport", distance: "65 km", time: "90 min drive", time2: "90 min" },
  ]), section: "contact", type: "json", label: "Nearby places (JSON)" },

  // ===================== FOOTER =====================
  { key: "footer.brand_name", value: "RK Residency", section: "footer", type: "text", label: "Brand name" },
  { key: "footer.brand_tagline", value: "Vrindavan · Braj", section: "footer", type: "text", label: "Brand tagline" },
  { key: "footer.description", value: "A heritage-luxury residency on the banks of the Yamuna, welcoming pilgrims and devotee families since 2014. A guest is a visiting deity.", section: "footer", type: "textarea", label: "Footer description" },
  { key: "footer.copyright", value: "© {year} RK Residency, Vrindavan. All rights reserved.", section: "footer", type: "text", label: "Copyright text" },
  { key: "footer.newsletter_heading", value: "Stay in the circle", section: "footer", type: "text", label: "Newsletter heading" },
  { key: "footer.newsletter_title", value: "Festival calendars, member offers & Braj stories", section: "footer", type: "text", label: "Newsletter title" },
  { key: "footer.newsletter_body", value: "One email a fortnight. No spam, no sharing — we treat your inbox like our guestbook.", section: "footer", type: "textarea", label: "Newsletter body" },
  { key: "footer.privacy_url", value: "/privacy-policy", section: "footer", type: "text", label: "Privacy link" },
  { key: "footer.terms_url", value: "/terms-and-conditions", section: "footer", type: "text", label: "Terms link" },
  { key: "footer.cancellation_url", value: "/cancellation-policy", section: "footer", type: "text", label: "Cancellation policy link" },

  // ===================== EXIT MODAL (FloatingActions) =====================
  { key: "exit_modal.image", value: "/images/marigold-garland.webp", section: "exit_modal", type: "image", label: "Image" },
  { key: "exit_modal.title", value: "15% off your first Braj stay", section: "exit_modal", type: "text", label: "Headline" },
  { key: "exit_modal.body", value: "Subscribe to our Braj journal and receive an exclusive promo code for your first direct booking. No spam — just festival calendars, seasonal offers, and stories from the Yamuna.", section: "exit_modal", type: "textarea", label: "Body copy" },
  { key: "exit_modal.cta_text", value: "Send me the code", section: "exit_modal", type: "text", label: "CTA button text" },
  { key: "exit_modal.perks", value: JSON.stringify([
    "15% off your first 2-night stay",
    "Complimentary satvik breakfast upgrade",
    "Early check-in / late check-out on request",
    "Festival calendar delivered before Janmashtami",
  ]), section: "exit_modal", type: "json", label: "Perks list (JSON)" },
];

const settings = [
  // ===== GENERAL =====
  { key: "site_name", value: "RK Residency", label: "Site name (used in browser title, footer, etc.)", category: "general" },
  { key: "site_tagline", value: "Heritage Luxury Stay in Vrindavan", label: "Site tagline / subtitle", category: "general" },
  { key: "brand_name", value: "RK Residency", label: "Brand name (used in navbar, footer)", category: "general" },
  { key: "brand_tagline", value: "Vrindavan · Braj", label: "Brand tagline (under the logo)", category: "general" },
  { key: "logo_image_url", value: "", label: "Custom logo image URL (leave empty to use default SVG)", category: "general" },
  { key: "favicon_url", value: "/favicon.ico", label: "Favicon URL", category: "general" },
  { key: "checkin_time", value: "2:00 PM", label: "Check-in time", category: "general" },
  { key: "checkout_time", value: "11:00 AM", label: "Check-out time", category: "general" },
  { key: "gstin", value: "09AAACK1234R1Z5", label: "GSTIN (shown in footer)", category: "general" },
  { key: "concierge_hours", value: "7 AM – 11 PM IST", label: "Concierge active hours", category: "general" },
  { key: "concierge_reply_window", value: "Replies in ~5 min", label: "Concierge reply window text", category: "general" },

  // ===== CONTACT =====
  { key: "phone_primary", value: "+91 565 234 5678", label: "Primary phone (display)", category: "contact" },
  { key: "phone_primary_tel", value: "+915652345678", label: "Primary phone (tel: format, no spaces)", category: "contact" },
  { key: "phone_reservations", value: "+91 98765 43210", label: "Reservations phone (display)", category: "contact" },
  { key: "email_primary", value: "stay@rkresidency.in", label: "Primary email", category: "contact" },
  { key: "email_events", value: "events@rkresidency.in", label: "Events email", category: "contact" },
  { key: "whatsapp_number", value: "919876543210", label: "WhatsApp number (with country code, no +)", category: "contact" },
  { key: "address_line1", value: "RK Residency, Parikrama Marg", label: "Address line 1", category: "contact" },
  { key: "address_line2", value: "Vrindavan, Mathura", label: "Address line 2", category: "contact" },
  { key: "address_line3", value: "Uttar Pradesh 281121, India", label: "Address line 3", category: "contact" },
  { key: "address_full", value: "RK Residency, Parikrama Marg, Vrindavan, Mathura, UP 281121", label: "Full address (one line)", category: "contact" },
  { key: "map_embed_url", value: "https://www.openstreetmap.org/export/embed.html?bbox=77.6950%2C27.5650%2C77.7250%2C27.5850&layer=mapnik&marker=27.5756%2C77.7100", label: "Map embed URL (iframe src)", category: "contact" },
  { key: "map_directions_url", value: "https://www.google.com/maps/dir/?api=1&destination=Vrindavan%20Uttar%20Pradesh", label: "Google Maps directions URL", category: "contact" },
  { key: "geo_latitude", value: "27.5756", label: "Latitude (for JSON-LD)", category: "contact" },
  { key: "geo_longitude", value: "77.7100", label: "Longitude (for JSON-LD)", category: "contact" },

  // ===== SOCIAL =====
  { key: "instagram_url", value: "https://instagram.com", label: "Instagram URL", category: "social" },
  { key: "facebook_url", value: "https://facebook.com", label: "Facebook URL", category: "social" },
  { key: "youtube_url", value: "https://youtube.com", label: "YouTube URL", category: "social" },
  { key: "twitter_url", value: "", label: "Twitter/X URL", category: "social" },
  { key: "tripadvisor_url", value: "https://www.tripadvisor.in", label: "TripAdvisor URL", category: "social" },
  { key: "google_reviews_url", value: "https://www.google.com/travel/hotels", label: "Google reviews URL", category: "social" },

  // ===== SEO =====
  { key: "meta_title", value: "RK Residency — Heritage Luxury Stay in Vrindavan | Hotel near Banke Bihari Temple", label: "Meta title", category: "seo" },
  { key: "meta_description", value: "RK Residency is a heritage-luxury residency in Vrindavan on the banks of the Yamuna. Spiritual luxury for pilgrims, devotee families and cultural travellers. Steps from Banke Bihari Mandir, ISKCON, Prem Mandir. Direct booking best-price guarantee.", label: "Meta description", category: "seo" },
  { key: "canonical_base_url", value: "https://rkresidency.in", label: "Canonical base URL (no trailing slash)", category: "seo" },
  { key: "og_image_url", value: "/images/hero-vrindavan.webp", label: "Default Open Graph image", category: "seo" },

  // ===== ANALYTICS =====
  { key: "ga_measurement_id", value: "", label: "Google Analytics 4 Measurement ID (e.g. G-XXXXXXXXXX)", category: "analytics" },
];

async function main() {
  console.log("Seeding site content...");
  for (const item of contentItems) {
    await db.siteContent.upsert({
      where: { key: item.key },
      create: item,
      update: { value: item.value, label: item.label, section: item.section, type: item.type },
    });
  }
  console.log(`Seeded ${contentItems.length} content items`);

  console.log("Seeding site settings...");
  for (const s of settings) {
    await db.siteSetting.upsert({
      where: { key: s.key },
      create: s,
      update: { label: s.label, category: s.category },
    });
  }
  console.log(`Seeded ${settings.length} settings`);
}
main().catch(console.error).finally(() => db.$disconnect());
