/**
 * Psalm translation data integrity.
 *
 * The 81 translations are wired up through a hand-maintained static require
 * map, because Metro cannot resolve dynamic require paths. That map is exactly
 * the kind of thing that rots silently: a renamed file, a typo'd key, or a
 * translation added to disk but never registered produces an empty reading
 * screen rather than a build error.
 *
 * These checks validate the wiring and the shape of the data. They deliberately
 * do not read all 26 MB verse by verse — the point is to make a malformed or
 * unreferenced module impossible to ship, not to proofread scripture.
 */

import fs from 'fs';
import path from 'path';
import {getAllVersions} from '../services/psalmsModules';
import {getChapter, getRandomVerse, getVerse} from '../services/psalmsService';

const EXTRACTED_DIR = path.join(__dirname, '..', 'psalms_extracted');
const MODULES_FILE = path.join(__dirname, '..', 'services', 'psalmsModules.ts');

const versions = getAllVersions();

/** Filenames referenced by the static require map. */
function referencedFiles(): string[] {
  const source = fs.readFileSync(MODULES_FILE, 'utf8');
  const matches = source.match(/psalms_extracted\/[\w-]+\.json/g) ?? [];
  return [...new Set(matches.map(m => m.replace('psalms_extracted/', '')))].sort();
}

describe('translation registry', () => {
  it('exposes every bundled translation', () => {
    // 81 extracted files plus the bundled modern English. The README and store
    // listing said 81; the app actually ships 82.
    expect(versions).toHaveLength(82);
  });

  it('always includes the default modern English translation first', () => {
    expect(versions[0].module).toBe('modern');
  });

  /**
   * 47 of the bundled files carry `lang` as "" or null. The picker sorts and
   * groups by it, so those all collapsed under one blank heading until
   * getAllVersions started deriving the name from lang_short.
   */
  it('gives every translation a usable language label', () => {
    for (const v of versions) {
      expect(typeof v.lang).toBe('string');
      expect(v.lang.trim().length).toBeGreaterThan(0);
    }
  });

  it('never falls back to the generic label', () => {
    // Every lang_short in the bundled data has a real name in the table.
    expect(versions.filter(v => v.lang === 'Other')).toEqual([]);
  });

  it('gives every translation the metadata the pickers rely on', () => {
    for (const v of versions) {
      expect(typeof v.module).toBe('string');
      expect(v.module.length).toBeGreaterThan(0);
      expect(typeof v.name).toBe('string');
      expect(v.name.length).toBeGreaterThan(0);
      expect(typeof v.lang_short).toBe('string');
      expect(v.lang_short.length).toBeGreaterThan(0);
    }
  });

  it('has no duplicate module keys', () => {
    const modules = versions.map(v => v.module);
    expect(new Set(modules).size).toBe(modules.length);
  });

  it('sorts by language then name for the settings picker', () => {
    const rest = versions.slice(1);
    const sorted = [...rest].sort(
      (a, b) => a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name),
    );
    expect(rest.map(v => v.module)).toEqual(sorted.map(v => v.module));
  });
});

describe('static require map', () => {
  it('references only files that exist on disk', () => {
    const onDisk = new Set(fs.readdirSync(EXTRACTED_DIR));
    const missing = referencedFiles().filter(f => !onDisk.has(f));
    expect(missing).toEqual([]);
  });

  it('registers every translation file that exists', () => {
    // A file added to the directory but never wired into the map is invisible
    // to the app — the failure mode this whole test file exists for.
    const referenced = new Set(referencedFiles());
    const orphans = fs
      .readdirSync(EXTRACTED_DIR)
      .filter(f => f.endsWith('.json'))
      // psalms_index.json is a manifest, not a translation module.
      .filter(f => f !== 'psalms_index.json')
      .filter(f => !referenced.has(f));
    expect(orphans).toEqual([]);
  });

  it('references one file per registered translation', () => {
    // 81 versions = 80 extracted files plus the bundled modern English.
    expect(referencedFiles()).toHaveLength(versions.length - 1);
  });
});

/**
 * Bundled translations that do not contain all 150 psalms.
 *
 * These are limitations of the source texts, not defects this project can fix
 * by editing data — scripture cannot be invented to fill the gap. They are
 * pinned here so the completeness check still gates the other 80 translations,
 * and so a regression that truncates a currently-complete text fails loudly.
 *
 * ChapterScreen renders an explanatory empty state for these chapters; before
 * that they were a silent blank screen.
 */
const INCOMPLETE_TRANSLATIONS: Record<string, number> = {
  lt_heritage: 137,
  ta_oitce: 148,
};

describe('psalm structure', () => {
  it('gives every complete translation all 150 psalms', () => {
    const short: string[] = [];
    for (const v of versions) {
      if (v.module in INCOMPLETE_TRANSLATIONS) continue;
      // Psalm 150 resolving proves the array reaches full length.
      if (getChapter(150, v.module).length === 0) short.push(v.module);
    }
    expect(short).toEqual([]);
  });

  it('documents exactly how far the incomplete translations reach', () => {
    for (const [module, lastPsalm] of Object.entries(INCOMPLETE_TRANSLATIONS)) {
      expect(getChapter(lastPsalm, module).length).toBeGreaterThan(0);
      expect(getChapter(lastPsalm + 1, module)).toEqual([]);
    }
  });

  it('returns an empty chapter — never a crash — for a missing psalm', () => {
    // This is what ChapterScreen's empty state renders from.
    expect(getChapter(150, 'lt_heritage')).toEqual([]);
    expect(getChapter(150, 'ta_oitce')).toEqual([]);
  });

  it('returns verses as non-empty strings across a sample of every translation', () => {
    const broken: string[] = [];
    for (const v of versions) {
      for (const chapter of [1, 23, 119, 150]) {
        if (
          v.module in INCOMPLETE_TRANSLATIONS &&
          chapter > INCOMPLETE_TRANSLATIONS[v.module]
        ) {
          continue;
        }
        const verses = getChapter(chapter, v.module);
        if (verses.length === 0) {
          broken.push(`${v.module} psalm ${chapter}: empty`);
          continue;
        }
        if (verses.some(text => typeof text !== 'string')) {
          broken.push(`${v.module} psalm ${chapter}: non-string verse`);
        }
      }
    }
    expect(broken).toEqual([]);
  });

  it('rejects chapters outside 1-150', () => {
    expect(getChapter(0)).toEqual([]);
    expect(getChapter(151)).toEqual([]);
    expect(getChapter(-1)).toEqual([]);
  });

  it('returns an empty chapter for an unknown translation rather than throwing', () => {
    expect(getChapter(23, 'no-such-translation')).toEqual([]);
  });
});

describe('verse access', () => {
  it('is 1-indexed', () => {
    const verses = getChapter(23, 'kjv');
    expect(getVerse(23, 1, 'kjv')?.verse).toBe(verses[0]);
    expect(getVerse(23, verses.length, 'kjv')?.verse).toBe(verses[verses.length - 1]);
  });

  it('returns null outside the verse range', () => {
    const verses = getChapter(23, 'kjv');
    expect(getVerse(23, 0, 'kjv')).toBeNull();
    expect(getVerse(23, verses.length + 1, 'kjv')).toBeNull();
  });

  it('returns a verse inside the chapter for getRandomVerse', () => {
    for (let i = 0; i < 25; i++) {
      const result = getRandomVerse(23, 'kjv')!;
      expect(result.verseNumber).toBeGreaterThanOrEqual(1);
      expect(result.verseNumber).toBeLessThanOrEqual(getChapter(23, 'kjv').length);
    }
  });

  it('returns null for a chapter that does not exist', () => {
    expect(getRandomVerse(151, 'kjv')).toBeNull();
  });
});
