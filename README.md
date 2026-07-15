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
