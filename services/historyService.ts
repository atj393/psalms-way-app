import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'history';
const MAX_ITEMS = 50;

export type HistoryEntry = {
  chapter: number;
  verse: number;
  date: string; // ISO date string
};

async function load(): Promise<HistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

async function save(items: HistoryEntry[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}

export async function getHistory(): Promise<HistoryEntry[]> {
  return load();
}

export async function addHistory(chapter: number, verse: number): Promise<void> {
  const items = await load();
  // Remove existing entry for same chapter to avoid duplicates
  const filtered = items.filter(h => h.chapter !== chapter);
  const newEntry: HistoryEntry = {
    chapter,
    verse,
    date: new Date().toISOString(),
  };
  // Prepend and cap at MAX_ITEMS
  await save([newEntry, ...filtered].slice(0, MAX_ITEMS));
}

export async function clearHistory(): Promise<void> {
  await save([]);
}
