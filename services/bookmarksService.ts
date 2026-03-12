import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'bookmarks';

export type Bookmark = {chapter: number; verse: number};

async function load(): Promise<Bookmark[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Bookmark[]) : [];
  } catch {
    return [];
  }
}

async function save(items: Bookmark[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
}

export async function getBookmarks(): Promise<Bookmark[]> {
  return load();
}

export async function isBookmarked(chapter: number, verse: number): Promise<boolean> {
  const items = await load();
  return items.some(b => b.chapter === chapter && b.verse === verse);
}

export async function addBookmark(chapter: number, verse: number): Promise<void> {
  const items = await load();
  if (!items.some(b => b.chapter === chapter && b.verse === verse)) {
    await save([{chapter, verse}, ...items]);
  }
}

export async function removeBookmark(chapter: number, verse: number): Promise<void> {
  const items = await load();
  await save(items.filter(b => !(b.chapter === chapter && b.verse === verse)));
}

export async function toggleBookmark(chapter: number, verse: number): Promise<boolean> {
  const bookmarked = await isBookmarked(chapter, verse);
  if (bookmarked) {
    await removeBookmark(chapter, verse);
    return false;
  } else {
    await addBookmark(chapter, verse);
    return true;
  }
}
