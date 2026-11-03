/**
 * copy-normalize.ts — display-time guard against vague proximity claims.
 *
 * WHY THIS EXISTS
 *   Marketing copy like "steps from Banke Bihari Mandir" or "minutes from
 *   ISKCON" is stored in admin-authored content (DB SiteContent rows and
 *   room taglines imported from the old listing). The owner's standing
 *   rule: NO vague distance claims anywhere — only the REAL, Google-Maps-
 *   verified figures from site.config BUSINESS.distances (the single
 *   source of truth already used by the homepage "Distances from RK
 *   Residency" section).
 *
 *   Like fixCopyTypos (room-display.ts), the DB keeps the original text;
 *   the site renders the corrected wording. The matching DB rows can be
 *   corrected at the source any time via
 *   scripts/fix-vague-distance-content.ts (needs DATABASE_URL).
 */
import { BUSINESS } from "./site.config";

const D = BUSINESS.distances;

/** Verified figures, rendered exactly like the DistancesSection quotes them. */
export const BANKE_BIHARI_DISTANCE = `${D.bankeBihari.km} km from Banke Bihari Mandir`;
export const ISKCON_DISTANCE = `${D.iskcon.km} km from ISKCON Vrindavan`;

const RULES: [RegExp, string][] = [
  // Hero subheadline stored in Admin → Content ("…residency steps from
  // Banke Bihari Mandir & ISKCON Vrindavan…") and its older code-default
  // variant ("…minutes from…") both become the verified figures.
  [
    /\b(?:steps|minutes?|a stone'?s throw)\s+from\s+Banke Bihari Mandir\s*(?:&|and)\s*ISKCON(?: Vrindavan)?\b/gi,
    `${BANKE_BIHARI_DISTANCE} & ${ISKCON_DISTANCE}`,
  ],
  // Room tagline imported from the listing ("Quiet comfort, steps from
  // the temple") — positional wording, no fake proximity number.
  [/\bsteps from the temple\b/gi, "in the heart of Vrindavan"],
  [/\bminutes? from the temple\b/gi, "near the temple"],
  // Catch-all for any other "steps from X" leftover → honest "near X".
  [/\bsteps from\b/gi, "near"],
];

/**
 * Replace vague proximity claims with the verified distances from
 * site.config. Safe to run on already-correct text (idempotent).
 */
export function realDistanceCopy(text: string | null | undefined): string {
  let out = text || "";
  for (const [re, fix] of RULES) out = out.replace(re, fix);
  return out;
}
