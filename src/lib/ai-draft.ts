/**
 * ai-draft.ts — AI draft generation for the content calendar (Task 5).
 *
 * SECURITY / POLICY:
 *   - Runs on the SERVER only. ANTHROPIC_API_KEY is read from the
 *     environment and is never sent to the browser or referenced in any
 *     client component.
 *   - Model: "claude-sonnet-4-6" (override with ANTHROPIC_MODEL).
 *   - AI output is ALWAYS saved as a DRAFT. Nothing auto-publishes; a human
 *     reviews, fixes the [VERIFY] markers and presses Publish.
 *   - The prompt forbids invented facts — any unverifiable detail must be
 *     marked [VERIFY] so the owner can confirm or remove it.
 *
 * Reliability: up to 3 attempts with exponential backoff on network errors,
 * 429s and 5xx; clear errors are returned for the admin to display.
 */
import { clampText, slugifyTitle, calcReadingMins } from "@/lib/blog-utils";

export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MAX_ATTEMPTS = 3;

/** Internal-link targets the generator may suggest (all real site pages). */
const INTERNAL_LINK_MENU = [
  { url: "/rooms", title: "Rooms & Suites — RK Residency Vrindavan" },
  { url: "/offers", title: "Offers & Festival Packages" },
  { url: "/dining", title: "Satvik Dining" },
  { url: "/experiences", title: "Temple Experiences" },
  { url: "/experiences/banke-bihari-mandir", title: "Banke Bihari Mandir Darshan Guide" },
  { url: "/experiences/iskcon-krishna-balaram", title: "ISKCON Krishna Balaram Mandir" },
  { url: "/experiences/prem-mandir", title: "Prem Mandir" },
  { url: "/experiences/nidhivan", title: "Nidhivan" },
  { url: "/experiences/yamuna-aarti-keshi-ghat", title: "Yamuna Aarti at Keshi Ghat" },
  { url: "/festivals", title: "Braj Festival Calendar" },
  { url: "/gallery", title: "Gallery" },
  { url: "/about", title: "About RK Residency" },
  { url: "/contact", title: "Contact & Directions" },
  { url: "/blog", title: "The Braj Journal (blog)" },
];

export type DraftRequest = {
  event: string;
  month: string;
  category: string;
  keywords: string[];
  notes?: string | null;
};

export type DraftResult = {
  title: string;
  slug: string;
  excerpt: string;
  metaDescription: string;
  metaTitle: string;
  category: string;
  tags: string[];
  readingTime: number;
  body: string;
  coverImageTitle: string;
  coverImageBrief: string;
  internalLinks: { anchor: string; url: string }[];
};

/** Build the generation prompt — JSON-only output, strict fact policy. */
export function buildDraftPrompt(req: DraftRequest): string {
  const menu = INTERNAL_LINK_MENU.map((l) => `- ${l.url} — "${l.title}"`).join("\n");
  return `You are writing a blog post for the website of RK Residency, a small satvik (pure vegetarian, no onion/garlic/egg) hotel in Kailash Nagar, Vrindavan, Uttar Pradesh, India, near Banke Bihari Mandir.

EVENT TO WRITE ABOUT
- Event/festival: ${req.event}
- Month: ${req.month}
- Category (use exactly this): ${req.category}
- Target keywords (use naturally, no keyword stuffing): ${req.keywords.join("; ")}
${req.notes ? `- Notes: ${req.notes}` : ""}

AUDIENCE
Pilgrims, devotee families and first-time Vrindavan visitors planning a trip around this event. Warm, practical, respectful tone. Simple English.

STRICT FACTS POLICY
- Do NOT invent facts: no made-up temple timings, aarti times, prices, distances, dates, quotes or statistics.
- If a detail is useful but you cannot verify it, write the sentence and mark the uncertain part with [VERIFY] like: "The temple opens at [VERIFY] in the morning."
- Mention the hotel ONLY where genuinely relevant (e.g. staying near the temple, satvik meals) — the post must read as a helpful guide, not an ad.
- Never state a specific festival DATE as fact — dates shift yearly; refer to the month/season or mark [VERIFY].

OUTPUT FORMAT — return ONLY valid JSON, no markdown fences, no commentary:
{
  "title": "60 chars max, natural, includes the main target keyword",
  "slug": "lowercase-with-hyphens",
  "excerpt": "1-2 sentences shown on the blog list",
  "metaDescription": "max 155 chars, includes the main keyword and a soft call to action",
  "metaTitle": "max 60 chars, SEO title tag",
  "category": "${req.category}",
  "tags": ["3-6 short tags"],
  "readingTime": 6,
  "body": "markdown. Use ## headings (at least 4). 900 to 1200 words total. Short intro, practical sections (e.g. significance, what happens, how to plan, where to stay, what to eat, travel tips), and end with a short 'Frequently asked questions' ## section with 3-4 Q&A pairs written as **Q:** / **A:** lines. Mark unverifiable details with [VERIFY].",
  "coverImageTitle": "title for a 1600x900 cover image",
  "coverImageBrief": "description of the 1600x900 cover image: composition, subject, lighting and mood, so a designer can create it",
  "internalLinks": [{"anchor": "descriptive anchor text", "url": "/rooms"}]
}

AVAILABLE INTERNAL LINK TARGETS (use exactly these URLs; suggest exactly 3 in internalLinks):
${menu}`;
}

/** Parse the model's JSON output (tolerates markdown fences). */
export function parseDraftJson(raw: string): DraftResult {
  let text = (raw || "").trim();
  // Strip ```json ... ``` fences if the model adds them despite instructions.
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("AI response did not contain JSON");
  const obj = JSON.parse(text.slice(start, end + 1));

  const required = ["title", "body", "excerpt", "category"];
  for (const k of required) {
    if (!obj[k] || typeof obj[k] !== "string") throw new Error(`AI response missing "${k}"`);
  }

  const keywordsArr: string[] = Array.isArray(obj.tags)
    ? obj.tags.filter((t: unknown) => typeof t === "string")
    : [];

  const links = Array.isArray(obj.internalLinks)
    ? obj.internalLinks
        .filter((l: any) => l && typeof l.url === "string" && l.url.startsWith("/"))
        .slice(0, 3)
        .map((l: any) => ({ anchor: String(l.anchor || l.title || "Read more"), url: l.url }))
    : [];

  const body: string = obj.body;
  return {
    title: String(obj.title).slice(0, 120),
    slug: slugifyTitle(String(obj.slug || obj.title)),
    excerpt: String(obj.excerpt),
    metaTitle: clampText(String(obj.metaTitle || obj.title), 60),
    metaDescription: clampText(String(obj.metaDescription || obj.excerpt), 155),
    category: String(obj.category),
    tags: keywordsArr,
    readingTime: Number.isFinite(obj.readingTime) ? Math.max(1, Math.round(obj.readingTime)) : calcReadingMins(body),
    body,
    coverImageTitle: String(obj.coverImageTitle || "").slice(0, 200),
    coverImageBrief: String(obj.coverImageBrief || "").slice(0, 600),
    internalLinks: links,
  };
}

/** Call the Anthropic Messages API with retries + backoff. Server-side only. */
export async function callAnthropic(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured. Add it to the environment variables (Vercel → Settings → Environment Variables) and try again.");
  }

  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(ANTHROPIC_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: 8000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (res.status === 429 || res.status >= 500) {
        lastError = new Error(`Anthropic API returned ${res.status} — retrying`);
        await sleep(attempt * 1500);
        continue;
      }
      if (!res.ok) {
        const bodyText = await res.text().catch(() => "");
        throw new Error(`Anthropic API error ${res.status}: ${bodyText.slice(0, 300)}`);
      }

      const data = await res.json();
      const text = data?.content?.map((c: any) => c?.text || "").join("") || "";
      if (!text) throw new Error("Anthropic API returned an empty response");
      return text;
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      // Network-level failures: back off and retry.
      if (attempt < MAX_ATTEMPTS) await sleep(attempt * 1500);
    }
  }
  throw new Error(`AI generation failed after ${MAX_ATTEMPTS} attempts: ${lastError?.message || "unknown error"}`);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
