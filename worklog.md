# RK Residency — Heritage Luxury Hotel Website — Worklog

## Project Overview
Building a full-stack, production-grade website for **RK Residency**, a heritage-luxury
residency in Vrindavan, Uttar Pradesh, India. Positioning: "Spiritual luxury" for pilgrims,
devotee families and cultural travellers.

## Architecture (real Next.js App Router routes)
- **Real Next.js App Router routes**:
  - `/` — home (marketing sections + FAQ + FestivalCalendar + TempleTour + ReviewForm + Weather + LiveChat)
  - `/rooms`, `/rooms/[slug]` — rooms listing + detail (with availability calendar)
  - `/experiences`, `/experiences/[slug]` — experiences listing + detail
  - `/dining` — satvik dining detail
  - `/gallery` — full gallery
  - `/offers`, `/offers/[slug]` — offers listing + detail
  - `/blog`, `/blog/[slug]` — blog listing + detail (with Article JSON-LD)
  - `/about` — our story
  - `/contact` — contact & location
  - `/festivals` — Braj festival calendar
  - `/admin` — admin panel (login-gated, 10 tabs, full CRUD + analytics)
- **SEO**: sitemap.xml, robots.txt, Open Graph images, Twitter cards, JSON-LD
  (Hotel, FAQPage, BreadcrumbList, Article).
- **Visitor tracking**: Every page view tracked via `POST /api/track`.
- **Admin analytics**: `/api/admin/analytics` returns today's KPIs, 7-day traffic, monthly
  trend, top pages, top referrers, booking funnel, SEO keywords.

## Current project status (this session)
- **Lint: PASS** (0 errors)
- **New features added**:
  1. **Room availability calendar** — 2-month calendar on room detail page showing which
     dates are available (teal), low-availability (gold dot), or sold out (marsala strikethrough).
     Fetches booking data from new `/api/rooms/availability` endpoint. Includes month
     navigation, legend, and "Check availability & book" CTA.
  2. **Live chat widget** — Front-desk style floating chat (bottom-right, teal button).
     Opens a 480px chat panel with bot greetings, quick-reply buttons (Check availability,
     Temple tour, Dining, Nearby temples, Call me back), message input. Bot responds with
     contextual answers. Unread badge pulse animation.
  3. **Sticky mobile booking bar** — On room detail pages (mobile only), a fixed bottom
     bar shows price + "Book Now" button for instant booking without scrolling back up.
     Respects iOS safe area inset.
  4. **Room card "Details" button** — Each room card on home page now has both "Details"
     (navigates to room detail page) and "Book Now" (opens booking widget) buttons.
  5. **Article JSON-LD** — Blog post detail pages now include Article structured data
     (headline, description, image, datePublished, author, publisher) for Google rich
     snippets.
- **New API endpoints**:
  - `GET /api/rooms/availability?roomId=&startDate=&endDate=` — returns a map of
    `{"YYYY-MM-DD": bookedCount}` for dates with bookings in the range.

## Bugs fixed this session
1. **Lint: `setLoading(true)` in effect** — Removed the synchronous `setLoading(true)`
   call from `AvailabilityCalendar`'s `useEffect` (loading state is already `true` by
   default).
2. **Lint: `CalendarDays` not defined** — Added missing import for `CalendarDays` icon
   in `AvailabilityCalendar`.

## Files of interest (this session)
- `src/components/rk/AvailabilityCalendar.tsx` — NEW: 2-month availability calendar
- `src/components/rk/LiveChat.tsx` — NEW: floating live chat with quick replies
- `src/app/api/rooms/availability/route.ts` — NEW: room availability API
- `src/components/rk/pages/RoomDetailPage.tsx` — updated: availability calendar + mobile booking bar
- `src/components/rk/Rooms.tsx` — updated: "Details" + "Book Now" buttons on cards
- `src/app/blog/[slug]/page.tsx` — updated: Article JSON-LD + dynamic OG metadata
- `src/app/page.tsx` — updated: LiveChat added

## Verification results (this session)
- **Lint**: 0 errors
- **Home page**: HTTP 200, 281KB. All key content present: Temple Tour, FAQ JSON-LD,
  BreadcrumbList, Open Graph, room card Details/Book buttons.
- **Availability API**: GET `/api/rooms/availability?roomId=...` returns
  `{"2026-09-15": 1, "2026-09-16": 1, "2026-09-17": 1}` (the test booking).
- **Admin APIs**: All return 200 with auth token.
- **Server**: Alive and stable after warm-up (888MB RSS).

## Unresolved issues / risks
- **Sandbox memory (3.9GB RAM)**: Server can OOM-kill when compiling multiple new routes
  in quick succession. Each route works when tested individually.
- **Admin auth is sandbox-grade**: Plain text password hash. Production needs bcrypt + NextAuth.
- **No real payment gateway**: Razorpay/Stripe stubbed.
- **Live chat is bot-based**: Uses pre-programmed responses. Production should integrate
  with a real live chat service (Intercom, Tawk.to, or WhatsApp Business API).

## Priority recommendations for next phase
1. Wire up real Razorpay/Stripe webhook handlers.
2. Add NextAuth.js for proper admin auth.
3. Add SMTP email for booking/tour confirmations.
4. Integrate real live chat (Tawk.to or WhatsApp Business API).
5. Add Open Graph images per page (dynamic OG image generation).
6. Implement `DailyAnalytics` aggregation job.
7. Add Google Search Console integration for real SEO keyword data.
8. Add multi-language (Hindi/English) content.
9. Add Review JSON-LD to testimonials section.
10. Add a "Book a Temple Tour" confirmation email.
