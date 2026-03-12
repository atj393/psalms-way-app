import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'favorites';

async function load(): Promise<number[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

async function save(items: number[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}

export async function getFavorites(): Promise<number[]> {
  return load();
}

export async function isFavorite(chapter: number): Promise<boolean> {
  const items = await load();
  return items.includes(chapter);
}

export async function addFavorite(chapter: number): Promise<void> {
  const items = await load();
  if (!items.includes(chapter)) {
    await save([chapter, ...items]);
  }
}

export async function removeFavorite(chapter: number): Promise<void> {
  const items = await load();
  await save(items.filter(c => c !== chapter));
}

export async function toggleFavorite(chapter: number): Promise<boolean> {
  const fav = await isFavorite(chapter);
  if (fav) {
    await removeFavorite(chapter);
    return false;
  } else {
    await addFavorite(chapter);
    return true;
  }
}
