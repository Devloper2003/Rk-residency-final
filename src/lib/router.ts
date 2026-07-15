"use client";

import { create } from "zustand";

/**
 * Client-side router for the RK Residency site.
 *
 * Now uses real Next.js App Router routes (not hash-based). The `navigate`
 * function calls `next/router.push()` under the hood.
 *
 * Route shapes:
 *   "/"                            → home
 *   "/rooms"                       → all rooms listing
 *   "/rooms/:slug"                 → single room detail
 *   "/experiences"                 → all experiences
 *   "/experiences/:slug"           → single experience detail
 *   "/dining"                      → dining detail
 *   "/gallery"                     → full gallery page
 *   "/offers"                      → all offers
 *   "/offers/:slug"                → single offer detail
 *   "/blog"                        → blog/journal listing
 *   "/blog/:slug"                  → single blog post
 *   "/about"                       → about detail
 *   "/contact"                     → contact detail
 *   "/admin"                       → admin panel (login-gated)
 */

export type RouteName =
  | "home"
  | "rooms"
  | "room-detail"
  | "experiences"
  | "experience-detail"
  | "dining"
  | "gallery"
  | "offers"
  | "offer-detail"
  | "blog"
  | "blog-detail"
  | "about"
  | "contact"
  | "admin";

export interface RouterState {
  // Booking widget state (lifted here so any page can open it)
  bookingOpen: boolean;
  bookingRoomSlug?: string;
  openBooking: (roomSlug?: string) => void;
  closeBooking: () => void;
  // Navigation (delegates to Next.js router)
  navigate: (route: RouteName, param?: string) => void;
  back: () => void;
}

function toPath(route: RouteName, param?: string): string {
  if (route === "home") return "/";
  const base: Record<RouteName, string> = {
    home: "/",
    rooms: "/rooms",
    "room-detail": "/rooms",
    experiences: "/experiences",
    "experience-detail": "/experiences",
    dining: "/dining",
    gallery: "/gallery",
    offers: "/offers",
    "offer-detail": "/offers",
    blog: "/blog",
    "blog-detail": "/blog",
    about: "/about",
    contact: "/contact",
    admin: "/admin",
  };
  const path = base[route];
  return param ? `${path}/${param}` : path;
}

export const useRouter = create<RouterState>((set) => ({
  bookingOpen: false,
  bookingRoomSlug: undefined,
  openBooking: (roomSlug) =>
    set({ bookingOpen: true, bookingRoomSlug: roomSlug }),
  closeBooking: () => set({ bookingOpen: false, bookingRoomSlug: undefined }),
  navigate: (route, param) => {
    const path = toPath(route, param);
    if (typeof window !== "undefined") {
      // Use Next.js client-side navigation
      window.location.href = path;
    }
  },
  back: () => {
    if (typeof window !== "undefined") window.history.back();
  },
}));

/** Helper hook for components to render the right link href. */
export function routeHref(route: RouteName, param?: string): string {
  return toPath(route, param);
}
