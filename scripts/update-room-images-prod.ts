/**
 * update-room-images-prod.ts — replace MakeMyTrip CDN hotlinks
 * (r1imghtlak.mmtcdn.com) in Room.imageUrls with the OWNER'S OWN uploaded
 * photos, served under descriptive filenames via the /uploads/[filename]
 * alias map (src/lib/image-aliases.ts).
 *
 * WHY: the legacy room rows hotlink third-party MakeMyTrip CDN images.
 * The owner asked to use their own uploaded images instead. The only
 * room/property photos uploaded so far (MediaAsset) are ONE room interior,
 * TWO reception shots and TWO exterior shots — so the same real property
 * photo set is used across the three room types as a stopgap until the
 * owner adds per-room photos in Admin → Rooms.
 *
 * ALSO: clears the placeholder view labels ("RoomView", "Room View",
 * "Room  View" — leftovers from the listing import) so the UI hides the
 * view chip instead of rendering the placeholder (mirrors
 * src/lib/room-display.ts).
 *
 * SAFETY:
 *   - Touches ONLY Room.imageUrls and Room.view. No rates, no descriptions,
 *     no bookings, no other tables.
 *   - Idempotent: re-running produces the same end state.
 *   - DATABASE_URL comes from the environment only — never hardcoded.
 *
 * Run: DATABASE_URL=... bun run scripts/update-room-images-prod.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

/** Descriptive self-hosted URLs (alias map serves the legacy hash rows). */
const PROPERTY_PHOTOS = [
  "/uploads/rk-residency-vrindavan-deluxe-room.webp",
  "/uploads/rk-residency-vrindavan-reception.webp",
  "/uploads/rk-residency-vrindavan-hotel-exterior-night.webp",
  "/uploads/rk-residency-vrindavan-hotel-exterior.webp",
];

function isPlaceholderView(view: string | null | undefined): boolean {
  const clean = (view || "").trim().replace(/\s+/g, " ").toLowerCase();
  return clean === "roomview" || clean === "room view";
}

async function main() {
  const rooms = await db.room.findMany({
    select: { id: true, name: true, imageUrls: true, view: true },
  });

  let updated = 0;
  for (const room of rooms) {
    const data: { imageUrls?: string; view?: string } = {};

    const urls: string[] = (() => {
      try {
        return JSON.parse(room.imageUrls || "[]");
      } catch {
        return [];
      }
    })();
    if (urls.some((u) => u.includes("mmtcdn.com"))) {
      data.imageUrls = JSON.stringify(PROPERTY_PHOTOS);
    }
    if (isPlaceholderView(room.view)) {
      data.view = "";
    }

    if (Object.keys(data).length) {
      await db.room.update({ where: { id: room.id }, data });
      updated++;
      console.log(
        `updated "${room.name}": imageUrls=${data.imageUrls ? "PROPERTY_PHOTOS" : "kept"} view=${data.view !== undefined ? '"" (was placeholder)' : "kept"}`
      );
    } else {
      console.log(`no change: "${room.name}"`);
    }
  }
  console.log(`\n${updated} room(s) updated, ${rooms.length} checked.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
