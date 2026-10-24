import { NextRequest, NextResponse } from "next/server";

/**
 * SEO redirect middleware (Fix 3).
 *
 * All redirects are PERMANENT (301) and built from ONE source of truth:
 * the SITE_URL environment variable (see src/lib/site.config.ts).
 *
 *  1. Legacy domain (rkresidency.in / www.rkresidency.in) → SITE_URL
 *     (so the old domain never serves a duplicate copy of this site).
 *  2. Non-canonical variant of the final domain → canonical host
 *     (e.g. rkresidencyvrindavan.in → www.rkresidencyvrindavan.in when
 *     SITE_URL uses www; the reverse when it does not).
 *  3. http → https on the canonical host.
 *
 * Notes:
 *  - Skipped in development unless FORCE_SEO_REDIRECTS=1, so localhost,
 *    preview deployments and tests are never redirected.
 *  - /api/webhooks/* is excluded — webhook receivers must never be 301'd.
 *  - Vercel deployment step: attach ALL of these domains to the project so
 *    their DNS reaches this middleware: rkresidency.in, www.rkresidency.in,
 *    rkresidencyvrindavan.in, www.rkresidencyvrindavan.in (primary).
 */

const SITE_URL = (process.env.SITE_URL || "https://www.rkresidencyvrindavan.in").replace(/\/+$/, "");
const CANONICAL_HOST = new URL(SITE_URL).host; // e.g. www.rkresidencyvrindavan.in
const BARE_HOST = CANONICAL_HOST.replace(/^www\./, ""); // e.g. rkresidencyvrindavan.in

/** Legacy domains that must 301 to SITE_URL and never serve content. */
const LEGACY_HOSTS = new Set(["rkresidency.in", "www.rkresidency.in"]);

function normalizeHost(raw: string): string {
  return raw.toLowerCase().replace(/\.$/, "");
}

export function middleware(req: NextRequest) {
  if (process.env.NODE_ENV !== "production" && process.env.FORCE_SEO_REDIRECTS !== "1") {
    return NextResponse.next();
  }

  const host = normalizeHost(req.headers.get("host") || "");
  if (!host) return NextResponse.next();

  const isLegacy = LEGACY_HOSTS.has(host);
  const isBareVariant = host === BARE_HOST && CANONICAL_HOST !== BARE_HOST;
  const isCanonical = host === CANONICAL_HOST;

  // Only known hosts are redirected — preview/staging hosts pass through.
  const needsHostRedirect = (isLegacy || isBareVariant) && !isCanonical;

  const proto = (
    req.headers.get("x-forwarded-proto") || req.nextUrl.protocol.replace(":", "")
  ).toLowerCase();
  // http→https only matters on the canonical host; unknown/legacy hosts are
  // redirected to the https SITE_URL directly by the host rule above.
  const needsHttpsRedirect = isCanonical && proto !== "https";

  if (needsHostRedirect || needsHttpsRedirect) {
    const target = new URL(SITE_URL + req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(target, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|api/webhooks|favicon.ico).*)"],
};
