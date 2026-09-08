import {asFilteredArray, isChapter, readJson, withKeyLock, writeJson} from './storage';

const KEY = 'favorites';

function parseChapter(value: unknown): number | null {
  return isChapter(value) ? value : null;
}

function load(): Promise<number[]> {
  return readJson(KEY, value => asFilteredArray(value, parseChapter), []);
}

function save(items: number[]): Promise<void> {
  return writeJson(KEY, items);
}

export async function getFavorites(): Promise<number[]> {
  return load();
}

export async function isFavorite(chapter: number): Promise<boolean> {
  const items = await load();
  return items.includes(chapter);
}

export async function addFavorite(chapter: number): Promise<void> {
  return withKeyLock(KEY, async () => {
    const items = await load();
    if (!items.includes(chapter)) {
      await save([chapter, ...items]);
    }
  });
}

export async function removeFavorite(chapter: number): Promise<void> {
  return withKeyLock(KEY, async () => {
    const items = await load();
    await save(items.filter(c => c !== chapter));
  });
}

/** Toggles a favourite under a single lock — see toggleBookmark for why. */
export async function toggleFavorite(chapter: number): Promise<boolean> {
  return withKeyLock(KEY, async () => {
    const items = await load();
    if (items.includes(chapter)) {
      await save(items.filter(c => c !== chapter));
      return false;
    }
    await save([chapter, ...items]);
    return true;
  });
}
