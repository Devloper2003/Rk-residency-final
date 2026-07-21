"use client";

import { BookingWidget } from "./BookingWidget";
import { useRouter } from "@/lib/router";
import { useEffect, useState } from "react";
import type { Room } from "./Rooms";

/**
 * Global booking widget — mounted once in the root layout so the booking
 * modal is available on EVERY page (room detail, room list, contact, etc.).
 *
 * Previously the BookingWidget was only rendered on the homepage, so when
 * users clicked "Check availability & book" on a room detail page the
 * Zustand store updated (`bookingOpen: true`) but no <BookingWidget open={…}/>
 * was mounted to actually render the modal. Result: silent no-op.
 *
 * This component reads `bookingOpen` + `bookingRoomSlug` from the global
 * router store and forwards them to the BookingWidget. When the user
 * closes the modal, the store is reset.
 */
export function GlobalBookingWidget() {
  const bookingOpen = useRouter((s) => s.bookingOpen);
  const bookingRoomSlug = useRouter((s) => s.bookingRoomSlug);
  const closeBooking = useRouter((s) => s.closeBooking);
  const [preselectRoom, setPreselectRoom] = useState<Room | null>(null);

  // When a room slug is provided alongside openBooking(), fetch the room
  // details so the BookingWidget can preselect it.
  useEffect(() => {
    if (!bookingOpen || !bookingRoomSlug) {
      setPreselectRoom(null);
      return;
    }
    fetch(`/api/rooms`)
      .then((r) => r.json())
      .then((data) => {
        const room = (data.rooms || []).find((r: any) => r.slug === bookingRoomSlug);
        if (room) setPreselectRoom(room as Room);
      })
      .catch(() => {});
  }, [bookingOpen, bookingRoomSlug]);

  if (!bookingOpen) return null;

  return (
    <BookingWidget
      open={bookingOpen}
      onOpenChange={(o) => { if (!o) closeBooking(); }}
      preselectRoom={preselectRoom}
    />
  );
}
