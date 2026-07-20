#!/usr/bin/env node
// Adds refreshSiteContent import + call to every admin tab that saves data.
// Idempotent — skips files that already have it.

import { promises as fs } from "fs";
import path from "path";

const TABS_DIR = path.join(process.cwd(), "src/components/rk/admin/tabs");

const FILES = [
  "RoomsTab.tsx",
  "OffersTab.tsx",
  "BlogTab.tsx",
  "ReviewsTab.tsx",
  "ThemeTab.tsx",
  "UsersTab.tsx",
  "BookingsTab.tsx",
  "MediaTab.tsx",
];

async function patch(file) {
  const fullPath = path.join(TABS_DIR, file);
  let src = await fs.readFile(fullPath, "utf8");
  if (src.includes("refreshSiteContent")) {
    console.log(`SKIP  ${file} (already patched)`);
    return;
  }

  // 1) Add import after the first existing `from "./_shared"` import line.
  const sharedImport = 'import { adminApi, adminFetch, LoadingSpinner, Field } from "./_shared";';
  const sharedImportShort = 'import { adminApi, LoadingSpinner } from "./_shared";';
  const sharedImportAlt = 'import { adminApi, adminFetch, LoadingSpinner } from "./_shared";';
  const sharedImportVariant = 'import { adminApi, adminFetch } from "./_shared";';

  const importLine = src.match(/import\s+\{[^}]+\}\s+from\s+"\.\/_shared";/)?.[0];
  if (importLine) {
    src = src.replace(
      importLine,
      importLine + '\nimport { refreshSiteContent } from "@/lib/site-content";'
    );
  } else {
    console.log(`WARN  ${file} — could not find _shared import line, skipping`);
    return;
  }

  // 2) Inject refreshSiteContent() inside every toast.success("…") block
  //    that is followed by a reload() call. We look for the pattern:
  //      toast.success("…");
  //      (optional other lines)
  //      reload();
  //    and insert refreshSiteContent(); before the reload() call.
  const before = src;
  src = src.replace(
    /(toast\.success\([^)]+\);\s*\n(?:[^\n]*\n)*?)(reload\(\);)/g,
    "$1refreshSiteContent();\n      $2"
  );

  // Also handle patterns where toast.success is followed by setEditing(null)
  // (save handlers in Blog/Offer/Rooms).
  src = src.replace(
    /(toast\.success\([^)]+\);\s*\n\s*)(setEditing\(null\);)/g,
    "$1refreshSiteContent();\n      $2"
  );

  if (src === before) {
    console.log(`WARN  ${file} — import added but no save patterns found`);
  } else {
    console.log(`OK    ${file} — patched`);
  }

  await fs.writeFile(fullPath, src, "utf8");
}

(async () => {
  for (const f of FILES) {
    try { await patch(f); } catch (e) { console.error(`ERR  ${f}:`, e.message); }
  }
})();
