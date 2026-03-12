import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'highlights';

export type HighlightColor = 'yellow' | 'green' | 'blue' | 'pink';

export const HIGHLIGHT_COLORS: {color: HighlightColor; hex: string; darkHex: string}[] = [
  {color: 'yellow', hex: '#FFF176', darkHex: '#665A00'},
  {color: 'green', hex: '#C8E6C9', darkHex: '#1B5E20'},
  {color: 'blue', hex: '#BBDEFB', darkHex: '#0D47A1'},
  {color: 'pink', hex: '#F8BBD0', darkHex: '#880E4F'},
];

export type Highlight = {
  chapter: number;
  verse: number;
  color: HighlightColor;
};

async function load(): Promise<Highlight[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Highlight[]) : [];
  } catch {
    return [];
  }
}

async function save(items: Highlight[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
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
  const items = await load();
  const existing = items.findIndex(h => h.chapter === chapter && h.verse === verse);
  const highlight: Highlight = {chapter, verse, color};
  if (existing >= 0) {
    items[existing] = highlight;
    await save(items);
  } else {
    await save([...items, highlight]);
  }
}

export async function clearHighlight(chapter: number, verse: number): Promise<void> {
  const items = await load();
  await save(items.filter(h => !(h.chapter === chapter && h.verse === verse)));
}
