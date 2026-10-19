# RK Residency — Heritage Luxury Hotel Website

A full-stack heritage-luxury hotel website for RK Residency, Vrindavan.

## Tech Stack
- **Framework:** Next.js 16 (Turbopack) + TypeScript + React 19
- **Styling:** Tailwind CSS 4 + shadcn/ui (curated subset) + Framer Motion
- **Database:** Prisma ORM + SQLite
- **Images:** `sharp` for upload processing, all site images are WebP
- **Auth:** Bearer-token session (httpOnly cookie + 8h expiry)

## Features
- Home page with hero, rooms, experiences, dining, gallery, offers, testimonials, FAQ
- Room detail pages with availability calendar
- Multi-step booking widget with live pricing (GST + service fee)
- Admin panel (12 tabs, grouped sidebar, ⌘K command palette):
  - Dashboard with real stats (occupancy, ADR, RevPAR, revenue trend)
  - Bookings — 15s auto-polling, status actions, search, pagination
  - Rooms / Offers / Blog — full CRUD with image upload
  - Media Library — upload, copy URL, delete
  - Reviews approval, Page Editor (live content), Theme & Colors, Settings
  - User Management, Leads & Messages, Audit Log, Analytics & SEO
- Image upload endpoint (`/api/admin/upload`) — converts to WebP, content-hashed
- Visitor tracking + SEO analytics
- Sitemap.xml, robots.txt, JSON-LD structured data

## Setup
```bash
bun install
bun run db:push        # Apply Prisma schema to SQLite
bun run seed           # Or run individual seeds in prisma/seed-*.ts
bun run dev
```

## Admin Access
- URL: `/admin`
- Default credentials are seeded by `prisma/seed-admin.ts`. Override by
  editing that file or setting `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars
  before seeding.

## Performance Notes
- All static images in `/public/images/` are WebP (~22% smaller than JPG originals).
- The shadcn/ui dependency was trimmed to only the 7 components actually used
  (button, input, label, select, textarea, calendar, sonner) — bundle size
  dropped significantly.
- 12 dead duplicate API routes were removed (consolidated into
  `/api/admin/all?action=...`).

## Project Structure
```
prisma/                  # Schema + seeds
public/images/           # WebP site images
public/uploads/          # Admin-uploaded images (created at runtime)
src/app/                 # Next.js routes (pages + API routes)
src/components/rk/       # Hotel-specific UI components
src/components/rk/admin/ # Admin panel (tabs, image uploader, login)
src/components/ui/       # shadcn/ui subset
src/lib/                 # Shared utils (db, auth, router, admin-client)
scripts/                 # Standalone scripts (dev launcher, image converter)
```

---

## Blog Automation (Phase 3)

Blog posts are stored in the **database** (Prisma `BlogPost` table) and written
in the admin panel's markdown editor (`Admin → Blog`). Nothing is auto-published:
every post goes through **Draft → (review) → Scheduled/Published**, and a human
always presses the publish button.

### Environment variables (required)

| Variable | Where | Purpose |
|---|---|---|
| `SITE_URL` | everywhere (already set) | Single source of truth for canonical / og:url / sitemap URLs — never hardcode the domain |
| `ANTHROPIC_API_KEY` | server only | Used by the AI draft generator (`/api/admin/generate-draft`, `/api/cron/monthly-drafts`). Never referenced in client code |
| `CRON_SECRET` | server only | Protects the two cron endpoints; Vercel Cron sends it as `Authorization: Bearer <CRON_SECRET>` |
| `ANTHROPIC_MODEL` | optional | Defaults to `claude-sonnet-4-6` |

### Content calendar (Admin → Content Calendar)

- **Add a row**: fill Month (YYYY-MM), Event/Festival, Target keywords
  (comma-separated), Category, Status (Planned / Drafted / Published), Notes.
- **One-click start**: press **“Load suggested Braj calendar”** to pre-fill the
  11 key Braj events (Janmashtami, Radhashtami, Holi & Lathmar Holi, Kartik
  month, Govardhan Puja, Diwali, Ram Navami, Guru Purnima, Sharad Purnima &
  Rasa Leela season, Vasant Panchami, Akshaya Tritiya) — all marked with
  `Date TODO` notes for the owner to confirm.
- Each row can be **linked to a post** (set automatically when you generate a
  draft from it). Row status moves Planned → Drafted → Published as work
  progresses.

### Generate an AI draft

1. In the Content Calendar, press **“Generate draft”** on a row
   (or let the monthly cron do it — see below).
2. The server calls Anthropic (`claude-sonnet-4-6`) and returns structured
   JSON: title, slug, excerpt, meta description, category, tags, reading time,
   900–1200-word markdown body with `##` headings and a closing FAQ, cover
   image title + 1600×900 composition brief, and 3 suggested internal links.
3. The result is saved **as a DRAFT linked to that calendar row**. It never
   publishes itself. Only one draft can be generated per calendar row (delete
   or unlink the post first to regenerate).
4. Retries: the API tries up to 3 times with backoff on network errors /
   rate limits / 5xx; failures surface as a visible admin error toast.
5. The **monthly cron** (`/api/cron/monthly-drafts`, runs 05:00 UTC on the 1st)
   auto-generates drafts for next month's calendar rows that have no linked post.

### Review a draft and clear [VERIFY] markers

- Any detail the AI could not verify (timings, prices, distances, quotes) is
  written as `**[VERIFY]** …` in the body.
- Unresolved markers are **highlighted in the editor** while you type.
- **Publish is blocked** while any `[VERIFY]` remains — confirm or rewrite each
  marked sentence, delete the marker, then publish.
- Fields the AI filled (slug, meta title/description, reading time) are fully
  editable; auto-SEO only fills EMPTY fields and never overwrites yours.

### Schedule a post

1. In Admin → Blog, replace the old Published checkbox with **Status**:
   Draft / Scheduled / Published.
2. Pick **“Publish on”** date+time for a Scheduled post.
3. The hourly cron (`/api/cron/publish-posts`, every hour) publishes due
   posts and revalidates the blog list, post page, homepage latest-posts
   section and sitemap. You can also trigger it manually from the editor
   (“Run scheduler now”).
4. Future-dated posts never appear in the blog list, sitemap or public HTML
   before their publish time.
5. Existing posts were migrated to `PUBLISHED` by
   `scripts/migrate-blog-status.ts` (legacy `published=true` rows are also
   self-healed by the first cron run — no post was lost).

### On-publish behaviour

Publishing (manual or by cron) revalidates: `/blog`, `/blog/[slug]`,
the homepage latest-posts section, and `/sitemap.xml` (correct `lastmod`).
No deprecated ping endpoints are called. Every publish/update is recorded in
the audit log.

### Quality guardrails (non-blocking warnings)

On save the API warns about:
- duplicate / near-duplicate **titles** across posts;
- **keyword cannibalization** — the same target keyword already used by
  another PUBLISHED post;
- exact duplicate **slugs** remain a hard error (409);
- publishing without a **cover image** warns first;
- only **one AI draft per calendar row** can exist.

### Cover image workflow

1. AI drafts store the **cover image title + composition brief** (1600×900)
   in visible editor fields — the owner designs/uploads the image.
2. On upload the filename is renamed to a descriptive slug and **alt text is
   required**.
3. Publishing without a cover shows a confirm warning (posts fall back to a
   generic marigold image).

### Cron deployment (Vercel)

`vercel.json` already defines:
```json
{ "path": "/api/cron/publish-posts",  "schedule": "0 * * * *" },
{ "path": "/api/cron/monthly-drafts", "schedule": "0 5 1 * *" }
```
Set `CRON_SECRET` in the Vercel project env vars. Vercel Cron calls include
the `Authorization: Bearer <CRON_SECRET>` header automatically; requests
without it are rejected with 401. On self-hosted servers, add two system
crontabs hitting the same URLs with the same header.

---

### TODO (owner action required)

- [ ] **Confirm exact festival dates** for all 11 preset calendar rows
      (lunar calendar — shift every year): Janmashtami, Radhashtami,
      Holi & Lathmar Holi, Kartik month, Govardhan Puja, Diwali, Ram Navami,
      Guru Purnima, Sharad Purnima & Rasa Leela season, Vasant Panchami,
      Akshaya Tritiya. Update the Month field of each row.
- [ ] Set `ANTHROPIC_API_KEY` and `CRON_SECRET` in production env vars.
- [ ] Verify the Vercel project has Vercel Cron enabled (Pro plan) or set up
      system cron for self-hosting.
- [ ] Review each generated draft and clear its `[VERIFY]` markers before
      publishing.
- [ ] Upload a real 1600×900 cover image for every post before publishing.

### Test checklist (run after deploy)

1. **Auto-SEO on save** — create a post with a title, an excerpt and `##`
   headings; save; confirm: slug is lowercase-hyphenated, meta title ≤ 60,
   meta description ≤ 155, canonical URL is self-referencing
   (`SITE_URL/blog/<slug>`), BlogPosting + BreadcrumbList JSON-LD render,
   reading time auto-filled, a TOC built from `##` headings appears,
   `dateModified` (updatedAt) changes after edits, and the post appears in
   `/sitemap.xml`.
2. **Scheduling** — schedule a post 5 minutes ahead; confirm it is absent
   from `/blog`, the sitemap and public HTML, then wait for the hourly cron
   (or press “Run scheduler now”) and confirm it goes live and appears
   everywhere.
3. **AI draft stays Draft** — press “Generate draft” on a calendar row;
   confirm the post is saved as Draft, `Publish` is blocked while `[VERIFY]`
   markers remain, and the editor highlights them; clear the markers and
   publish successfully.
4. **Guardrails** — try saving a second post with the same title (warning),
   set the same target keyword on two published posts (warning), use an
   existing slug (hard 409 error).

---

## Phase 4 — Contact data, GTM, content fixes & day-by-day inventory

### Contact details are settings-driven

There are **no hardcoded phone numbers, emails or social links** anywhere.
Every WhatsApp / Call / Email / social button reads the matching setting and
**hides itself when the value is empty** — the site never shows placeholder
numbers or dead links.

- **Fill real details:** Admin → Settings → set `phone_primary`,
  `phone_primary_tel`, `phone_reservations`, `whatsapp_number` (country code,
  no +), `email_primary`, `email_events`, `instagram_url`, `facebook_url`,
  `youtube_url`, `tripadvisor_url`, `google_reviews_url`. Buttons reappear
  automatically the moment a value is saved.
- **Get directions** always points to a real Google Maps directions link
  built from the business address (Kailash Nagar, Vrindavan). When the
  Google Business Profile is claimed, paste the exact place link into the
  `map_directions_url` setting to upgrade it.
- Old placeholder rows (sample numbers, generic instagram.com links,
  Parikrama Marg address) were cleared from seeds; existing databases can be
  cleaned with `bun scripts/clear-placeholder-contact.ts` (idempotent).

### Day-by-day inventory (Admin → Inventory)

- The **“Open / Close inventory by day”** grid shows 14 days × room types.
  - **Click a cell** → close that room type for that calendar day (red lock).
    Click again to reopen. Closed days are blocked for bookings instantly —
    a stay that includes a closed night cannot be booked (public check,
    public write and admin manual booking all enforce it).
  - **Shift+click a cell** → set a custom sellable limit for that day
    (e.g. sell only 2 of 4 rooms), leave empty to reset to default.
  - Cells show **rooms left** (sellable − booked); gold dot = custom limit.
- Public room calendars render closed days as “Not accepting bookings this
  day”. Schema: additive `RoomInventoryDay` table (unique per room + date);
  **no row = exactly the old behaviour**, so nothing changes until you use it.
- Deploy note: run `prisma db push` (or the equivalent migration) once, then
  optionally run `bun scripts/fix-content-mismatches.ts` to clean legacy FAQ
  text and unverified rating claims from existing databases.

### Google Tag Manager

Container `GTM-KSSWNL9K` is installed in `src/app/layout.tsx`:
`<noscript>` iframe is the first element inside `<body>`, and the `gtm.js`
loader fires before any Next.js code (`strategy="beforeInteractive"` — the
earliest position Next.js App Router supports, equivalent to Google's
"as high as possible" requirement). Tags/conversions are managed inside the
GTM container — no code change needed for new tags.

### Unverified claims policy

“4.9 · 1,240+ verified stays” and the testimonials 4.9 aggregate are **hidden
until the owner provides a verifiable source** (real Google/TripAdvisor
listing link). They are never emitted in JSON-LD schema. To restore them:
set `hero.rating_text` / `testimonials.aggregate_rating` in Admin → Page
editor AND fill `google_reviews_url` / `tripadvisor_url` with the real
listing URLs.

### Phase 4 TODO (owner action required)

- [ ] Fill REAL phone / WhatsApp / email / social profile values in
      Admin → Settings (buttons appear automatically).
- [ ] Upload real hotel photos for every room (WebP, descriptive filenames
      e.g. `rk-residency-vrindavan-deluxe-room.webp`) via Admin → Media and
      set them on each room — current images are Unsplash placeholders
      (no MakeMyTrip assets exist in the repo). Alt texts are already
      descriptive and include the location.
- [ ] Claim + verify the **Google Business Profile** (same phone & address:
      Kailash Nagar, Vrindavan), then paste the exact place link into
      `map_directions_url`.
- [ ] Confirm the 11 festival dates in the blog content calendar (Phase 3).
- [ ] After deploy: **purge the CDN/cache**, then in Search Console
      “Request indexing” for the homepage, `/rooms`, `/contact` and one blog
      post; submit `/sitemap.xml`; validate Hotel + FAQ schema in the
      Rich Results Test; check mobile score in PageSpeed Insights.
