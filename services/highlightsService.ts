import {
  asFilteredArray,
  isChapter,
  isRecord,
  isVerseNumber,
  readJson,
  withKeyLock,
  writeJson,
} from './storage';

const KEY = 'highlights';

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink';

export const HIGHLIGHT_COLORS: {color: HighlightColor; hex: string; darkHex: string}[] = [
  {color: 'yellow', hex: '#FFF176', darkHex: '#665A00'},
  {color: 'green', hex: '#C8E6C9', darkHex: '#1B5E20'},
  {color: 'blue', hex: '#BBDEFB', darkHex: '#0D47A1'},
  {color: 'pink', hex: '#F8BBD0', darkHex: '#880E4F'},
];

const VALID_COLORS: readonly string[] = HIGHLIGHT_COLORS.map(c => c.color);

export type Highlight = {
  chapter: number;
  verse: number;
  color: HighlightColor;
};

function parseHighlight(value: unknown): Highlight | null {
  if (!isRecord(value)) return null;
  if (!isChapter(value.chapter) || !isVerseNumber(value.verse)) return null;
  // An unknown colour would render as a transparent highlight the user cannot
  // see or clear, so drop the row instead.
  if (typeof value.color !== 'string' || !VALID_COLORS.includes(value.color)) return null;
  return {
    chapter: value.chapter,
    verse: value.verse,
    color: value.color as HighlightColor,
  };
}

function load(): Promise<Highlight[]> {
  return readJson(KEY, value => asFilteredArray(value, parseHighlight), []);
}

function save(items: Highlight[]): Promise<void> {
  return writeJson(KEY, items);
}

export async function getHighlights(): Promise<Highlight[]> {
  return load();
}

export async function getHighlightForVerse(
  chapter: number,
  verse: number,
): Promise<Highlight | null> {
  const items = await load();
  return items.find(h => h.chapter === chapter && h.verse === verse) ?? null;
}

export async function setHighlight(
  chapter: number,
  verse: number,
  color: HighlightColor,
): Promise<void> {
  return withKeyLock(KEY, async () => {
    const items = await load();
    const existing = items.findIndex(h => h.chapter === chapter && h.verse === verse);
    const highlight: Highlight = {chapter, verse, color};
    if (existing >= 0) {
      items[existing] = highlight;
      await save(items);
    } else {
      await save([...items, highlight]);
    }
  });
}

export async function clearHighlight(chapter: number, verse: number): Promise<void> {
  return withKeyLock(KEY, async () => {
    const items = await load();
    await save(items.filter(h => !(h.chapter === chapter && h.verse === verse)));
  });
}
