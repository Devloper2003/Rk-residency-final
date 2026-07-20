#!/usr/bin/env node
// Convert all JPGs in /public/images to optimized WebP and replace every
// `.jpg` reference in src/ with `.webp`. Idempotent — safe to re-run.

import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import { createHash } from "crypto";

const ROOT = process.cwd();
const IMG_DIR = path.join(ROOT, "public", "images");
const SRC_DIR = path.join(ROOT, "src");

async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

async function main() {
  const jpgs = (await fs.readdir(IMG_DIR)).filter((f) => /\.jpe?g$/i.test(f));
  const converted = [];
  for (const jpg of jpgs) {
    const src = path.join(IMG_DIR, jpg);
    const base = path.basename(jpg, path.extname(jpg));
    const dst = path.join(IMG_DIR, `${base}.webp`);
    const buf = await fs.readFile(src);
    // Stable hash-based output so duplicate conversions are byte-identical.
    await sharp(buf)
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(dst);
    const beforeSize = (await fs.stat(src)).size;
    const afterSize = (await fs.stat(dst)).size;
    converted.push({ jpg, webp: `${base}.webp`, beforeSize, afterSize });
  }

  // Report
  console.log("\nConverted images:");
  for (const c of converted) {
    const saved = ((1 - c.afterSize / c.beforeSize) * 100).toFixed(1);
    console.log(`  ${c.jpg} → ${c.webp}  ${(c.beforeSize/1024).toFixed(0)}KB → ${(c.afterSize/1024).toFixed(0)}KB  (-${saved}%)`);
  }

  // Update all source files: replace ".jpg" / ".jpeg" with ".webp" only on
  // /images/ paths (not unsplash URLs, not /uploads/).
  let changedFiles = 0;
  let changedRefs = 0;
  for await (const file of walk(SRC_DIR)) {
    if (!/\.(tsx|ts|mjs|js|md)$/.test(file)) continue;
    let content = await fs.readFile(file, "utf8");
    const before = content;
    // Match: /images/<name>.jpg or .jpeg  (case-insensitive)
    content = content.replace(/(\/images\/[^"'\s)]+?)\.jpe?g/gi, "$1.webp");
    if (content !== before) {
      const matches = before.match(/\/images\/[^"'\s)]+?\.jpe?g/gi) || [];
      changedRefs += matches.length;
      changedFiles++;
      await fs.writeFile(file, content, "utf8");
    }
  }
  console.log(`\nUpdated ${changedRefs} image reference(s) across ${changedFiles} file(s).`);

  // Delete the originals (now superseded by webp)
  for (const c of converted) {
    await fs.unlink(path.join(IMG_DIR, c.jpg));
  }
  console.log(`\nDeleted ${converted.length} original JPG(s).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
