/**
 * The daily verse must differ from day to day — that was the whole defect in
 * the previous notification implementation — while staying stable for any given
 * day so that rescheduling is idempotent.
 *
 * psalmsService is mocked so these tests describe the selection logic rather
 * than the contents of the bundled translations, and so they do not have to
 * load 26 MB of JSON.
 */

jest.mock('../services/psalmsService', () => ({
  getChapter: jest.fn(),
}));

import {getChapter} from '../services/psalmsService';
import {getVerseForDate, hashString, TOTAL_PSALMS} from '../services/dailyVerseService';

const mockGetChapter = getChapter as jest.MockedFunction<typeof getChapter>;

/** Every chapter has 10 identifiable verses. */
function fullBible() {
  mockGetChapter.mockImplementation((chapter: number) =>
    Array.from({length: 10}, (_, i) => `Psalm ${chapter} verse ${i + 1}`),
  );
}

beforeEach(() => {
  mockGetChapter.mockReset();
});

describe('hashString', () => {
  it('is deterministic', () => {
    expect(hashString('2026-09-08|kjv')).toBe(hashString('2026-09-08|kjv'));
  });

  it('separates keys that differ by one character', () => {
    expect(hashString('2026-09-08|kjv')).not.toBe(hashString('2026-09-09|kjv'));
  });

  it('returns an unsigned 32-bit integer', () => {
    for (const input of ['', 'a', '2026-09-08|modern', 'x'.repeat(200)]) {
      const h = hashString(input);
      expect(Number.isInteger(h)).toBe(true);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThanOrEqual(0xffffffff);
    }
  });
});

describe('getVerseForDate', () => {
  it('returns the same verse for the same day and translation', () => {
    fullBible();
    const a = getVerseForDate('2026-09-08', 'kjv');
    const b = getVerseForDate('2026-09-08', 'kjv');
    expect(a).toEqual(b);
    expect(a).not.toBeNull();
  });

  it('returns a verse within the chapter it names', () => {
    fullBible();
    const result = getVerseForDate('2026-09-08', 'kjv')!;
    expect(result.chapter).toBeGreaterThanOrEqual(1);
    expect(result.chapter).toBeLessThanOrEqual(TOTAL_PSALMS);
    expect(result.verseNumber).toBeGreaterThanOrEqual(1);
    expect(result.verseNumber).toBeLessThanOrEqual(10);
    expect(result.verse).toBe(`Psalm ${result.chapter} verse ${result.verseNumber}`);
  });

  it('gives different translations different verses for the same day', () => {
    fullBible();
    const kjv = getVerseForDate('2026-09-08', 'kjv')!;
    const web = getVerseForDate('2026-09-08', 'web')!;
    expect(`${kjv.chapter}:${kjv.verseNumber}`).not.toBe(`${web.chapter}:${web.verseNumber}`);
  });

  /**
   * The regression guard for the original bug: a repeating trigger delivered
   * one frozen payload, so every morning showed the same verse.
   */
  it('varies across consecutive days', () => {
    fullBible();
    const refs = new Set<string>();
    for (let day = 1; day <= 28; day++) {
      const key = `2026-09-${String(day).padStart(2, '0')}`;
      const v = getVerseForDate(key, 'kjv')!;
      refs.add(`${v.chapter}:${v.verseNumber}`);
    }
    // 28 independent draws from 1500 verses; allowing a couple of collisions
    // keeps this from being a flaky birthday-paradox assertion while still
    // failing loudly if the value were constant.
    expect(refs.size).toBeGreaterThanOrEqual(26);
  });

  it('spreads across many different chapters over a year', () => {
    fullBible();
    const chapters = new Set<number>();
    let d = new Date(2026, 0, 1);
    for (let i = 0; i < 365; i++) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate(),
      ).padStart(2, '0')}`;
      chapters.add(getVerseForDate(key, 'kjv')!.chapter);
      d = new Date(d.getTime() + 86400000);
    }
    expect(chapters.size).toBeGreaterThan(100);
  });

  it('skips empty chapters instead of returning a blank verse', () => {
    // Only chapter 42 has text; every other chapter is missing from this
    // translation. Selection must still resolve rather than give up.
    mockGetChapter.mockImplementation((chapter: number) =>
      chapter === 42 ? ['The one available verse'] : [],
    );
    const result = getVerseForDate('2026-09-08', 'sparse');
    expect(result).toEqual({
      chapter: 42,
      verseNumber: 1,
      verse: 'The one available verse',
    });
  });

  it('skips chapters whose verses are blank strings', () => {
    mockGetChapter.mockImplementation((chapter: number) =>
      chapter === 7 ? ['Real text'] : ['   '],
    );
    const result = getVerseForDate('2026-09-08', 'whitespace');
    expect(result?.chapter).toBe(7);
    expect(result?.verse).toBe('Real text');
  });

  it('returns null when the translation has no readable text at all', () => {
    mockGetChapter.mockImplementation(() => []);
    expect(getVerseForDate('2026-09-08', 'empty')).toBeNull();
  });
});
