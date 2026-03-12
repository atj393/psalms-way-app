import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'notes';

export type Note = {
  chapter: number;
  verse: number;
  text: string;
  date: string; // ISO date string
};

async function load(): Promise<Note[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Note[]) : [];
  } catch {
    return [];
  }
}

async function save(items: Note[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}

export async function getNotes(): Promise<Note[]> {
  return load();
}

export async function getNoteForVerse(
  chapter: number,
  verse: number,
): Promise<Note | null> {
  const items = await load();
  return items.find(n => n.chapter === chapter && n.verse === verse) ?? null;
}

export async function saveNote(
  chapter: number,
  verse: number,
  text: string,
): Promise<void> {
  const items = await load();
  const existing = items.findIndex(n => n.chapter === chapter && n.verse === verse);
  const note: Note = {chapter, verse, text, date: new Date().toISOString()};
  if (existing >= 0) {
    items[existing] = note;
    await save(items);
  } else {
    await save([note, ...items]);
  }
}

export async function deleteNote(chapter: number, verse: number): Promise<void> {
  const items = await load();
  await save(items.filter(n => !(n.chapter === chapter && n.verse === verse)));
}
