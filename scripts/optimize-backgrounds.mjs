// Optimize Daily Wisdom background photos.
//
// Looks for source images named after each preset id, either directly in
// public/backgrounds/ or in public/backgrounds/_source/, and writes optimized
// landscape .webp files (max 1920px wide, quality 82) back into public/backgrounds/.
//
// Usage:  npm run backgrounds:optimize

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BG_DIR = path.join(__dirname, "..", "public", "backgrounds");
const SOURCE_DIR = path.join(BG_DIR, "_source");

const IDS = ["mountain", "ocean", "jellyfish", "forest", "aurora"];
const SOURCE_EXTS = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_WIDTH = 1920;

function findSource(id) {
  for (const dir of [SOURCE_DIR, BG_DIR]) {
    for (const ext of SOURCE_EXTS) {
      const file = path.join(dir, `${id}${ext}`);
      // Skip the already-optimized target so re-runs don't shrink it repeatedly.
      if (dir === BG_DIR && ext === ".webp") continue;
      if (fs.existsSync(file)) return file;
    }
  }
  return null;
}

async function run() {
  let done = 0;
  for (const id of IDS) {
    const src = findSource(id);
    if (!src) {
      console.log(`–  ${id}: no source found (skipping)`);
      continue;
    }
    const out = path.join(BG_DIR, `${id}.webp`);
    await sharp(src)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(out);
    const kb = (fs.statSync(out).size / 1024) | 0;
    console.log(`✓  ${id}.webp  (${kb}KB)  ← ${path.relative(BG_DIR, src)}`);
    done++;
  }
  console.log(`\nOptimized ${done}/${IDS.length} background(s).`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
