import {
  asFilteredArray,
  isChapter,
  isRecord,
  isVerseNumber,
  readJson,
  withKeyLock,
  writeJson,
} from './storage';

const KEY = 'bookmarks';

export type Bookmark = {chapter: number; verse: number};

function parseBookmark(value: unknown): Bookmark | null {
  if (!isRecord(value)) return null;
  if (!isChapter(value.chapter) || !isVerseNumber(value.verse)) return null;
  return {chapter: value.chapter, verse: value.verse};
}

function load(): Promise<Bookmark[]> {
  return readJson(KEY, value => asFilteredArray(value, parseBookmark), []);
}

function save(items: Bookmark[]): Promise<void> {
  return writeJson(KEY, items);
}

export async function getBookmarks(): Promise<Bookmark[]> {
  return load();
}

export async function isBookmarked(chapter: number, verse: number): Promise<boolean> {
  const items = await load();
  return items.some(b => b.chapter === chapter && b.verse === verse);
}

export async function addBookmark(chapter: number, verse: number): Promise<void> {
  return withKeyLock(KEY, async () => {
    const items = await load();
    if (!items.some(b => b.chapter === chapter && b.verse === verse)) {
      await save([{chapter, verse}, ...items]);
    }
  });
}

export async function removeBookmark(chapter: number, verse: number): Promise<void> {
  return withKeyLock(KEY, async () => {
    const items = await load();
    await save(items.filter(b => !(b.chapter === chapter && b.verse === verse)));
  });
}

/**
 * Toggles a bookmark and reports the resulting state.
 *
 * The whole read-decide-write runs under one lock: previously this called
 * `isBookmarked` and then `addBookmark`/`removeBookmark`, each of which re-read
 * storage, so a double tap could read "not bookmarked" twice and add the same
 * verse twice, or add and remove in an order that left the wrong final state.
 */
export async function toggleBookmark(chapter: number, verse: number): Promise<boolean> {
  return withKeyLock(KEY, async () => {
    const items = await load();
    const exists = items.some(b => b.chapter === chapter && b.verse === verse);
    if (exists) {
      await save(items.filter(b => !(b.chapter === chapter && b.verse === verse)));
      return false;
    }
    await save([{chapter, verse}, ...items]);
    return true;
  });
}
