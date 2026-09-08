import {
  asFilteredArray,
  isChapter,
  isRecord,
  isVerseNumber,
  readJson,
  withKeyLock,
  writeJson,
} from './storage';

const KEY = 'notes';

/**
 * Upper bound on a single note.
 *
 * Notes are free text in an app that keeps everything in one AsyncStorage row,
 * so an unbounded note degrades every read of the notes list. 20k characters is
 * far beyond any realistic devotional note while still being a limit.
 */
export const MAX_NOTE_LENGTH = 20000;

export type Note = {
  chapter: number;
  verse: number;
  text: string;
  date: string; // ISO date string
};

function parseNote(value: unknown): Note | null {
  if (!isRecord(value)) return null;
  if (!isChapter(value.chapter) || !isVerseNumber(value.verse)) return null;
  if (typeof value.text !== 'string') return null;
  const date = typeof value.date === 'string' ? value.date : new Date(0).toISOString();
  return {chapter: value.chapter, verse: value.verse, text: value.text, date};
}

function load(): Promise<Note[]> {
  return readJson(KEY, value => asFilteredArray(value, parseNote), []);
}

function save(items: Note[]): Promise<void> {
  return writeJson(KEY, items);
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

/**
 * Creates or replaces the note on a verse.
 *
 * Locked because the note editor can fire a save while an autosave from the
 * previous keystroke is still in flight; without serialisation the two would
 * read the same list and the later write would drop the earlier note entirely.
 */
export async function saveNote(
  chapter: number,
  verse: number,
  text: string,
): Promise<void> {
  if (text.length > MAX_NOTE_LENGTH) {
    throw new Error(`Note exceeds ${MAX_NOTE_LENGTH} characters`);
  }
  return withKeyLock(KEY, async () => {
    const items = await load();
    const existing = items.findIndex(n => n.chapter === chapter && n.verse === verse);
    const note: Note = {chapter, verse, text, date: new Date().toISOString()};
    if (existing >= 0) {
      items[existing] = note;
      await save(items);
    } else {
      await save([note, ...items]);
    }
  });
}

export async function deleteNote(chapter: number, verse: number): Promise<void> {
  return withKeyLock(KEY, async () => {
    const items = await load();
    await save(items.filter(n => !(n.chapter === chapter && n.verse === verse)));
  });
}
