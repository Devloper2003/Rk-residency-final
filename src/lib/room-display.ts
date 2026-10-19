/**
 * room-display.ts — display helpers for Room rows.
 *
 * WHY THIS EXISTS
 *   The legacy room data imported from the MakeMyTrip listing carries the
 *   placeholder view labels "RoomView", "Room View" and "Room  View". These
 *   are not real view descriptors (like "Temple View" or "Street View"), so
 *   per the site's "never render placeholder business data" policy they are
 *   treated as EMPTY:
 *     - image alt text falls back to "<Room name> at RK Residency, Kailash
 *       Nagar, Vrindavan" (natural text with room type + brand + location)
 *     - the "view" eyebrow chip and the "View" spec row are hidden instead
 *       of printing the placeholder
 *   The owner can set a real view (e.g. "Temple View") per room in
 *   Admin → Rooms and it will appear automatically.
 */

/** Placeholder view labels left over from the listing import. */
const PLACEHOLDER_VIEWS = new Set(["roomview", "room view"]);

/**
 * Normalise a view label: collapse whitespace; return "" for blank or
 * placeholder values so the UI can hide it.
 */
export function sanitizeRoomView(view: string | null | undefined): string {
  const clean = (view || "").trim().replace(/\s+/g, " ");
  if (!clean || PLACEHOLDER_VIEWS.has(clean.toLowerCase())) return "";
  return clean;
}

/**
 * Natural, descriptive image alt text for a room photo: includes the room
 * type, "RK Residency" and "Vrindavan"; appends the view only when it is a
 * real descriptor.
 */
export function roomImageAlt(name: string, view?: string | null): string {
  const v = sanitizeRoomView(view);
  return v
    ? `${name} — ${v} at RK Residency, Kailash Nagar, Vrindavan`
    : `${name} at RK Residency, Kailash Nagar, Vrindavan`;
}
