#!/usr/bin/env node
/**
 * check-admin-routes.mjs — deployment guard for the admin console.
 *
 * Why this exists: in commit 1db5681 the file
 *   src/app/api/admin/upload/route.ts
 * was accidentally deleted during a bulk cleanup. Nothing failed at build or
 * deploy time — the ONLY symptom was the live Media Library showing
 * "Could not load media" forever (fetch → 404). This script makes that class
 * of bug impossible to ship silently: it extracts every API path the admin
 * UI fetches and verifies a matching route file exists in the repo.
 *
 * Usage: node scripts/check-admin-routes.mjs   (exit 1 on missing route)
 * Wired as: bun run check:routes
 */
import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const adminDir = join(root, "src", "components", "rk", "admin");
const apiDir = join(root, "src", "app", "api");

// Recursively collect every .ts/.tsx file under a directory
function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, files);
    else if (/\.(tsx?|mjs)$/.test(entry)) files.push(full);
  }
  return files;
}

// Does an API route exist for /api/...path (with dynamic segments wildcarded)?
function routeExists(apiPath) {
  const rel = apiPath.replace(/^\/api\//, "");
  const parts = rel.split("/").filter(Boolean);
  // Try exact directory chain; each level may also exist as [param].
  // A template-literal segment like ${encodeURIComponent(id)} or ${x} is
  // dynamic → match it against [param] folders too.
  let candidates = [apiDir];
  for (const part of parts) {
    const dynamic = part.includes("${");
    const next = [];
    for (const dir of candidates) {
      if (!dynamic) next.push(join(dir, part));
      try {
        for (const entry of readdirSync(dir)) {
          if (/^\[.*\]$/.test(entry)) next.push(join(dir, entry));
        }
      } catch { /* dir gone */ }
    }
    candidates = next;
  }
  return candidates.some((dir) => existsSync(join(dir, "route.ts")));
}

const files = walk(adminDir);
const referenced = new Map(); // apiPath -> [files]
// Quote strings: fetch("/api/x") / fetch('/api/x')
const pathRe = /(?:adminFetch|fetch)\(\s*['"](\/api\/[^'"\s]+)['"]/g;
// Template literals: capture the WHOLE backtick content — `${...}` segments
// are treated as dynamic by routeExists().
const templateRe = /(?:adminFetch|fetch)\(\s*`(\/api\/[^`]*)`/g;

for (const file of files) {
  const src = readFileSync(file, "utf8");
  for (const re of [pathRe, templateRe]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(src))) {
      const path = m[1];
      if (!referenced.has(path)) referenced.set(path, []);
      referenced.get(path).push(file.replace(root + "/", ""));
    }
  }
}

let missing = 0;
console.log(`Scanning ${files.length} admin files → ${referenced.size} referenced API routes\n`);
for (const [apiPath, from] of [...referenced.entries()].sort()) {
  const base = apiPath.split("?")[0];
  const ok = routeExists(base);
  if (!ok) missing++;
  console.log(`  ${ok ? "✓" : "✗ MISSING"} ${base}   ${ok ? "" : `← used by ${[...new Set(from)].join(", ")}`}`);
}

console.log(missing === 0 ? "\nAll admin API routes exist. Safe to build & deploy." : `\n${missing} MISSING route(s) — the affected tab(s) would 404 on live. Fix before deploying.`);
process.exit(missing === 0 ? 0 : 1);
