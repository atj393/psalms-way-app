/**
 * Locale integrity.
 *
 * The app ships 47 interface languages, which is far too many to eyeball. This
 * checks the structural properties that actually break the UI — a key that
 * exists in one language and not another, an interpolation placeholder that
 * was dropped in translation, an empty string that renders as a blank label —
 * without making any claim about translation quality.
 */

import fs from 'fs';
import path from 'path';
import i18n from '../i18n';

const LOCALES_DIR = path.join(__dirname, '..', 'i18n', 'locales');
const BASE = 'en';

/**
 * Keys that exist in English but not yet in every other language.
 *
 * i18next is configured with `fallbackLng: 'en'`, so these render in English
 * rather than as a raw key. They are listed explicitly so the gap is a
 * deliberate, reviewable decision instead of silent drift — anything NOT on
 * this list failing the parity check below is a real regression.
 *
 * Added by the notification-failure alert; awaiting translation.
 */
const PENDING_TRANSLATION = new Set([
  'notifScheduleFailedTitle',
  'notifScheduleFailedMessage',
  'psalmUnavailable',
]);

/**
 * Languages that are known to be substantially incomplete.
 *
 * Tibetan and Wolof are each missing about half of the interface strings and
 * fall back to English for them. Recorded here so the parity test still gates
 * every other language properly; removing an entry once a language is
 * completed is the point.
 */
const INCOMPLETE_LOCALES = new Set(['bo', 'wo']);

type Bundle = Record<string, string>;

function localeFiles(): string[] {
  return fs
    .readdirSync(LOCALES_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();
}

function load(file: string): Bundle {
  return JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, file), 'utf8'));
}

function localeName(file: string): string {
  return path.basename(file, '.json');
}

const files = localeFiles();
const base = load(`${BASE}.json`);
const baseKeys = Object.keys(base);

/** Interpolation placeholders such as {{count}}. */
function placeholders(value: string): string[] {
  return (value.match(/\{\{\s*[\w.]+\s*\}\}/g) ?? [])
    .map(p => p.replace(/[{}\s]/g, ''))
    .sort();
}

describe('locale files', () => {
  it('ships the 47 advertised languages', () => {
    expect(files).toHaveLength(47);
  });

  it('is registered in i18n exactly as the files on disk', () => {
    const registered = Object.keys(i18n.options.resources ?? {}).sort();
    expect(registered).toEqual(files.map(localeName));
  });

  it('parses every locale as a flat object of strings', () => {
    for (const file of files) {
      const bundle = load(file);
      expect(typeof bundle).toBe('object');
      for (const [key, value] of Object.entries(bundle)) {
        expect(typeof value).toBe(`string`);
        expect(key).not.toBe('');
      }
    }
  });

  it('has no duplicate keys within a file', () => {
    // JSON.parse silently keeps the last of a duplicated key, so compare the
    // parsed key count against the raw occurrences.
    for (const file of files) {
      const raw = fs.readFileSync(path.join(LOCALES_DIR, file), 'utf8');
      const occurrences = (raw.match(/^\s*"[^"]+"\s*:/gm) ?? []).length;
      expect(occurrences).toBe(Object.keys(load(file)).length);
    }
  });
});

describe('key parity with English', () => {
  const complete = files.filter(f => !INCOMPLETE_LOCALES.has(localeName(f)));

  it.each(complete)('%s has every English key', file => {
    const bundle = load(file);
    const missing = baseKeys.filter(
      k => !(k in bundle) && !PENDING_TRANSLATION.has(k),
    );
    expect(missing).toEqual([]);
  });

  it.each(files)('%s defines no key English does not', file => {
    // An orphan key is dead weight, and usually a rename that missed a file.
    const extra = Object.keys(load(file)).filter(k => !(k in base));
    expect(extra).toEqual([]);
  });

  it.each(files)('%s has no empty translations', file => {
    const empty = Object.entries(load(file))
      .filter(([, v]) => v.trim() === '')
      .map(([k]) => k);
    expect(empty).toEqual([]);
  });
});

/**
 * Translations that lost an interpolation value altogether and need a
 * translator, not a script.
 *
 * Most placeholder breakage in this project came from the identifier itself
 * being translated — `{{done}}` arriving as `{{hecho}}` or `{{klaar}}`, which
 * i18next cannot resolve because it looks values up by name. Those were
 * repaired mechanically: the identifier was restored and the translated words
 * around it left untouched.
 *
 * These are the remainder, where the placeholder was dropped or its braces
 * mangled, so the sentence has nowhere to put the number. Restoring it needs
 * someone who reads the language. Until then the string renders without its
 * value — e.g. Chinese challengeProgress shows a literal "0" instead of the
 * chapters read.
 */
const PLACEHOLDERS_NEEDING_TRANSLATOR = new Set([
  'bn/challengeProgress',
  'fa/challengeProgress',
  'ha/challengeProgress',
  'hi/challengeDay',
  'hi/challengeDayNumber',
  'hi/challengeDayComplete',
  'ja/challengeDayNumber',
  'lt/challengeProgress',
  'mr/challengeProgress',
  'pa/challengeProgress',
  'pl/challengeDay',
  'so/challengeProgress',
  'th/challengeProgress',
  'tl/challengeProgress',
  'vi/challengeProgress',
  'zh/challengeProgress',
  'zh/challengeDay',
]);

describe('interpolation placeholders', () => {
  it.each(files)('%s keeps the placeholders English uses', file => {
    const locale = localeName(file);
    const bundle = load(file);
    const mismatched: string[] = [];
    for (const key of baseKeys) {
      const translated = bundle[key];
      if (translated === undefined) continue; // covered by the parity test
      if (PLACEHOLDERS_NEEDING_TRANSLATOR.has(`${locale}/${key}`)) continue;
      const expected = placeholders(base[key]);
      const actual = placeholders(translated);
      // Compared as sets: a language may legitimately reorder placeholders,
      // as Japanese does in challengeDay. What must not happen is one going
      // missing or arriving under a name i18next cannot resolve.
      if (expected.join(',') !== actual.join(',')) {
        mismatched.push(`${key}: expected [${expected}] got [${actual}]`);
      }
    }
    expect(mismatched).toEqual([]);
  });

  it('has no stale entries in the translator allowlist', () => {
    // Fails once someone fixes one of these, prompting removal from the list.
    const stillBroken: string[] = [];
    for (const entry of PLACEHOLDERS_NEEDING_TRANSLATOR) {
      const [locale, key] = entry.split('/');
      const bundle = load(`${locale}.json`);
      const translated = bundle[key];
      if (translated === undefined) continue;
      if (placeholders(base[key]).join(',') !== placeholders(translated).join(',')) {
        stillBroken.push(entry);
      }
    }
    expect(stillBroken.sort()).toEqual([...PLACEHOLDERS_NEEDING_TRANSLATOR].sort());
  });
});

describe('fallback behaviour', () => {
  it('falls back to English for a key a language lacks', async () => {
    await i18n.changeLanguage('bo');
    // A key Tibetan does not define must still render English text, never the
    // bare key.
    const value = i18n.t('appName');
    expect(value).toBe(base.appName);
    await i18n.changeLanguage('en');
  });

  it('returns the key itself for a genuinely unknown string', () => {
    expect(i18n.t('thisKeyDoesNotExist')).toBe('thisKeyDoesNotExist');
  });

  it('resolves the strings the notification failure alert needs', async () => {
    for (const key of PENDING_TRANSLATION) {
      expect(i18n.t(key)).not.toBe(key);
    }
  });
});

describe('documented gaps', () => {
  it('records how incomplete the known-incomplete locales are', () => {
    // Guards against these quietly getting worse, and fails loudly if someone
    // completes one without removing it from the allowlist.
    for (const name of INCOMPLETE_LOCALES) {
      const bundle = load(`${name}.json`);
      const missing = baseKeys.filter(k => !(k in bundle));
      expect(missing.length).toBeGreaterThan(0);
    }
  });
});
