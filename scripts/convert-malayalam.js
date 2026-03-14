/**
 * Converts psalms-malayalam-to be formatted.json
 * from the chapters/verses nested format into the flat psalms[][] format
 * used by all other files in psalms_extracted/.
 *
 * Also appends the entry to psalms_index.json (creates it if missing).
 *
 * Usage: node scripts/convert-malayalam.js
 */

const fs = require('fs');
const path = require('path');

const INPUT = path.join(
  __dirname,
  '../psalms_extracted/psalms-malayalam-to be formatted.json',
);
const OUTPUT = path.join(
  __dirname,
  '../psalms_extracted/psalms-malayalam.json',
);
const INDEX = path.join(__dirname, '../psalms_extracted/psalms_index.json');

// ── 1. Read & parse source ────────────────────────────────────────────────────
const raw = JSON.parse(fs.readFileSync(INPUT, 'utf8'));

// ── 2. Build psalms[][] ───────────────────────────────────────────────────────
// raw.chapters is an array of { chapter, verses: [{verse, text}] }
const psalms = raw.chapters.map(chapterObj => {
  // Sort by verse number just in case
  const sorted = [...chapterObj.verses].sort((a, b) => a.verse - b.verse);
  return sorted.map(v => v.text.trim());
});

// ── 3. Build output object ────────────────────────────────────────────────────
const output = {
  metadata: {
    name: raw.metadata.name,
    module: raw.metadata.module,
    year: raw.metadata.year,
    lang: raw.metadata.lang,
    lang_short: raw.metadata.lang_short,
    book_name: raw.metadata.book_name,
    copyright: raw.metadata.copyright,
    copyright_statement: raw.metadata.copyright_statement,
  },
  psalms,
};

// ── 4. Write converted file ───────────────────────────────────────────────────
fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 4), 'utf8');
console.log(`✓ Written: ${OUTPUT}`);
console.log(`  Chapters: ${psalms.length}`);
console.log(`  Verses in Psalm 1: ${psalms[0].length}`);

// ── 5. Update / create psalms_index.json ─────────────────────────────────────
let index = [];
if (fs.existsSync(INDEX)) {
  index = JSON.parse(fs.readFileSync(INDEX, 'utf8'));
}

const entry = {
  module: raw.metadata.module,
  name: raw.metadata.name,
  year: raw.metadata.year,
  lang: raw.metadata.lang,
  lang_short: raw.metadata.lang_short,
};

const alreadyExists = index.some(e => e.module === entry.module);
if (alreadyExists) {
  console.log(`ℹ  psalms_index.json already has entry for "${entry.module}", skipping.`);
} else {
  index.push(entry);
  // Sort alphabetically by module for consistency
  index.sort((a, b) => a.module.localeCompare(b.module));
  fs.writeFileSync(INDEX, JSON.stringify(index, null, 2), 'utf8');
  console.log(`✓ psalms_index.json updated with "${entry.module}"`);
}
