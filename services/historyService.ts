import {
  asFilteredArray,
  isChapter,
  isRecord,
  isVerseNumber,
  readJson,
  withKeyLock,
  writeJson,
} from './storage';

const KEY = 'history';
const MAX_ITEMS = 50;

export type HistoryEntry = {
  chapter: number;
  verse: number;
  date: string; // ISO date string
};

function parseEntry(value: unknown): HistoryEntry | null {
  if (!isRecord(value)) return null;
  if (!isChapter(value.chapter) || !isVerseNumber(value.verse)) return null;
  if (typeof value.date !== 'string') return null;
  // Reading stats bucket entries by date, so an unparseable one would silently
  // vanish from the chart rather than being counted on the wrong day.
  if (Number.isNaN(new Date(value.date).getTime())) return null;
  return {chapter: value.chapter, verse: value.verse, date: value.date};
}

function load(): Promise<HistoryEntry[]> {
  return readJson(KEY, value => asFilteredArray(value, parseEntry), []);
}

function save(items: HistoryEntry[]): Promise<void> {
  return writeJson(KEY, items);
}

export async function getHistory(): Promise<HistoryEntry[]> {
  return load();
}

export async function addHistory(chapter: number, verse: number): Promise<void> {
  return withKeyLock(KEY, async () => {
    const items = await load();
    // One entry per chapter: revisiting a psalm moves it to the top rather than
    // filling the list with repeats of the same chapter.
    const filtered = items.filter(h => h.chapter !== chapter);
    const newEntry: HistoryEntry = {
      chapter,
      verse,
      date: new Date().toISOString(),
    };
    await save([newEntry, ...filtered].slice(0, MAX_ITEMS));
  });
}

export async function clearHistory(): Promise<void> {
  return withKeyLock(KEY, () => save([]));
}
