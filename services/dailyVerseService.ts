/**
 * Deterministic "verse of the day" selection.
 *
 * The daily reminder used to pick a verse with Math.random() at the moment the
 * reminder was scheduled, then hand that single payload to a
 * RepeatFrequency.DAILY trigger. Android replays a repeating trigger with its
 * ORIGINAL payload, so every subsequent morning delivered the very same verse
 * until something rescheduled it.
 *
 * The fix has two halves. The scheduler (notificationService) now enqueues a
 * rolling window of one-shot triggers instead of one repeating trigger, and
 * this module decides what each of those days says.
 *
 * Selection is a pure function of (date, translation) rather than random, which
 * buys three things:
 *   - Rescheduling is idempotent. Re-running the window on every app open
 *     recomputes identical content for days already queued, so refreshing can
 *     never produce a second, contradictory notification for the same day.
 *   - A given day reads the same whether it was queued a week ago or minutes
 *     ago, so the notification and any in-app "today's verse" surface agree.
 *   - It is testable without mocking randomness.
 */

import {getChapter} from './psalmsService';
import type {DateKey} from './dateUtils';

export const TOTAL_PSALMS = 150;

export type DailyVerse = {
  chapter: number;
  verseNumber: number;
  verse: string;
};

/**
 * FNV-1a, 32-bit. Chosen for good avalanche on short ASCII keys like
 * '2026-09-08|kjv' and for being a handful of lines with no dependency.
 * `>>> 0` keeps it an unsigned 32-bit value after the Math.imul multiply.
 */
export function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * Picks the verse for a given local day and translation.
 *
 * Chapter and verse are drawn from two different hashes so they vary
 * independently — hashing once and reusing the value for both would correlate
 * the verse number with the chapter number.
 *
 * Returns null only when the translation yields no readable text at all, which
 * the caller must treat as "do not schedule" rather than substituting silently.
 */
export function getVerseForDate(dateKey: DateKey, version: string): DailyVerse | null {
  const seed = hashString(`${dateKey}|${version}`);

  // Walk chapters from the seeded starting point so a translation with a few
  // empty chapters still resolves instead of returning null.
  for (let attempt = 0; attempt < TOTAL_PSALMS; attempt++) {
    const chapter = ((seed + attempt) % TOTAL_PSALMS) + 1;
    const verses = getChapter(chapter, version);
    if (verses.length === 0) continue;

    const verseSeed = hashString(`${dateKey}|${version}|${chapter}`);
    const verseNumber = (verseSeed % verses.length) + 1;
    const verse = verses[verseNumber - 1];
    if (typeof verse !== 'string' || verse.trim().length === 0) continue;

    return {chapter, verseNumber, verse};
  }

  return null;
}
