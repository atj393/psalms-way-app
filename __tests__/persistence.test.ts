/**
 * Round-trip and resilience tests for the personal-data services.
 *
 * Two classes of defect are covered:
 *
 *   - Lost updates. Each service used to do `load()` → mutate → `save()` with
 *     an await in the middle and no serialisation, so two overlapping calls
 *     both read the same starting array and the second write discarded the
 *     first. That is exactly what a double-tapped bookmark button produces.
 *
 *   - Untrusted stored JSON. `JSON.parse(raw) as Bookmark[]` asserted a shape
 *     nothing checked, so malformed or outdated rows reached the UI.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addBookmark,
  getBookmarks,
  isBookmarked,
  removeBookmark,
  toggleBookmark,
} from '../services/bookmarksService';
import {
  addFavorite,
  getFavorites,
  removeFavorite,
  toggleFavorite,
} from '../services/favoritesService';
import {
  clearHighlight,
  getHighlightForVerse,
  getHighlights,
  setHighlight,
} from '../services/highlightsService';
import {
  MAX_NOTE_LENGTH,
  deleteNote,
  getNoteForVerse,
  getNotes,
  saveNote,
} from '../services/notesService';
import {addHistory, clearHistory, getHistory} from '../services/historyService';

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ─── Bookmarks ────────────────────────────────────────────────────────────────

describe('bookmarks', () => {
  it('round-trips through storage', async () => {
    await addBookmark(23, 1);
    await addBookmark(91, 2);
    expect(await getBookmarks()).toEqual([
      {chapter: 91, verse: 2},
      {chapter: 23, verse: 1},
    ]);
    expect(await isBookmarked(23, 1)).toBe(true);
    expect(await isBookmarked(23, 2)).toBe(false);
  });

  it('does not duplicate the same verse', async () => {
    await addBookmark(23, 1);
    await addBookmark(23, 1);
    expect(await getBookmarks()).toHaveLength(1);
  });

  it('removes only the named verse', async () => {
    await addBookmark(23, 1);
    await addBookmark(23, 2);
    await removeBookmark(23, 1);
    expect(await getBookmarks()).toEqual([{chapter: 23, verse: 2}]);
  });

  it('toggles on and off', async () => {
    expect(await toggleBookmark(23, 1)).toBe(true);
    expect(await isBookmarked(23, 1)).toBe(true);
    expect(await toggleBookmark(23, 1)).toBe(false);
    expect(await isBookmarked(23, 1)).toBe(false);
  });

  it('survives concurrent adds without losing any', async () => {
    await Promise.all([
      addBookmark(1, 1),
      addBookmark(2, 1),
      addBookmark(3, 1),
      addBookmark(4, 1),
      addBookmark(5, 1),
    ]);
    expect(await getBookmarks()).toHaveLength(5);
  });

  it('resolves a double tap to a single consistent state', async () => {
    const [first, second] = await Promise.all([
      toggleBookmark(23, 1),
      toggleBookmark(23, 1),
    ]);
    // One toggle adds and the other removes; the order is not important but
    // the outcomes must disagree and the store must not end up with a
    // duplicate.
    expect(first).not.toBe(second);
    expect(await getBookmarks()).toHaveLength(0);
  });

  it('ignores malformed rows but keeps the valid ones', async () => {
    await AsyncStorage.setItem(
      'bookmarks',
      JSON.stringify([
        {chapter: 23, verse: 1},
        {chapter: 'not a number', verse: 1},
        {chapter: 0, verse: 1},
        {chapter: 151, verse: 1},
        {chapter: 24, verse: 0},
        null,
        'nonsense',
        {chapter: 25, verse: 3},
      ]),
    );
    expect(await getBookmarks()).toEqual([
      {chapter: 23, verse: 1},
      {chapter: 25, verse: 3},
    ]);
  });

  it('falls back to empty on unparseable JSON', async () => {
    await AsyncStorage.setItem('bookmarks', '{not json');
    expect(await getBookmarks()).toEqual([]);
  });

  it('falls back to empty when the stored value is not an array', async () => {
    await AsyncStorage.setItem('bookmarks', JSON.stringify({chapter: 23}));
    expect(await getBookmarks()).toEqual([]);
  });
});

// ─── Favourites ───────────────────────────────────────────────────────────────

describe('favorites', () => {
  it('round-trips and de-duplicates', async () => {
    await addFavorite(23);
    await addFavorite(23);
    await addFavorite(91);
    expect(await getFavorites()).toEqual([91, 23]);
  });

  it('removes and toggles', async () => {
    await addFavorite(23);
    await removeFavorite(23);
    expect(await getFavorites()).toEqual([]);
    expect(await toggleFavorite(42)).toBe(true);
    expect(await toggleFavorite(42)).toBe(false);
  });

  it('survives concurrent adds', async () => {
    await Promise.all([1, 2, 3, 4, 5].map(c => addFavorite(c)));
    expect(await getFavorites()).toHaveLength(5);
  });

  it('drops out-of-range chapters', async () => {
    await AsyncStorage.setItem('favorites', JSON.stringify([23, 0, 151, -1, 'x', null, 91]));
    expect(await getFavorites()).toEqual([23, 91]);
  });
});

// ─── Highlights ───────────────────────────────────────────────────────────────

describe('highlights', () => {
  it('sets, reads and clears', async () => {
    await setHighlight(23, 1, 'yellow');
    expect(await getHighlightForVerse(23, 1)).toEqual({
      chapter: 23,
      verse: 1,
      color: 'yellow',
    });
    await clearHighlight(23, 1);
    expect(await getHighlightForVerse(23, 1)).toBeNull();
  });

  it('replaces the colour rather than adding a second row', async () => {
    await setHighlight(23, 1, 'yellow');
    await setHighlight(23, 1, 'blue');
    const all = await getHighlights();
    expect(all).toHaveLength(1);
    expect(all[0].color).toBe('blue');
  });

  it('drops rows with an unknown colour', async () => {
    await AsyncStorage.setItem(
      'highlights',
      JSON.stringify([
        {chapter: 23, verse: 1, color: 'yellow'},
        {chapter: 24, verse: 1, color: 'chartreuse'},
        {chapter: 25, verse: 1},
      ]),
    );
    expect(await getHighlights()).toEqual([{chapter: 23, verse: 1, color: 'yellow'}]);
  });

  it('survives concurrent writes to different verses', async () => {
    await Promise.all([
      setHighlight(1, 1, 'yellow'),
      setHighlight(2, 1, 'green'),
      setHighlight(3, 1, 'blue'),
      setHighlight(4, 1, 'pink'),
    ]);
    expect(await getHighlights()).toHaveLength(4);
  });
});

// ─── Notes ────────────────────────────────────────────────────────────────────

describe('notes', () => {
  it('round-trips and stamps a date', async () => {
    await saveNote(23, 1, 'The Lord is my shepherd');
    const note = await getNoteForVerse(23, 1);
    expect(note?.text).toBe('The Lord is my shepherd');
    expect(Number.isNaN(new Date(note!.date).getTime())).toBe(false);
  });

  it('edits in place instead of appending a duplicate', async () => {
    await saveNote(23, 1, 'first');
    await saveNote(23, 1, 'second');
    const all = await getNotes();
    expect(all).toHaveLength(1);
    expect(all[0].text).toBe('second');
  });

  it('deletes only the named note', async () => {
    await saveNote(23, 1, 'keep');
    await saveNote(24, 1, 'remove');
    await deleteNote(24, 1);
    expect(await getNotes()).toHaveLength(1);
    expect(await getNoteForVerse(23, 1)).not.toBeNull();
  });

  it('never silently loses a note when saves overlap', async () => {
    await Promise.all([
      saveNote(1, 1, 'one'),
      saveNote(2, 1, 'two'),
      saveNote(3, 1, 'three'),
      saveNote(4, 1, 'four'),
    ]);
    const all = await getNotes();
    expect(all).toHaveLength(4);
    expect(all.map(n => n.text).sort()).toEqual(['four', 'one', 'three', 'two']);
  });

  it('applies the last write when the same note is saved twice concurrently', async () => {
    await Promise.all([saveNote(23, 1, 'a'), saveNote(23, 1, 'b')]);
    const all = await getNotes();
    expect(all).toHaveLength(1);
    expect(['a', 'b']).toContain(all[0].text);
  });

  it('preserves an empty note as a real value', async () => {
    await saveNote(23, 1, '');
    expect(await getNoteForVerse(23, 1)).not.toBeNull();
  });

  it('rejects a note beyond the maximum length', async () => {
    await expect(saveNote(23, 1, 'x'.repeat(MAX_NOTE_LENGTH + 1))).rejects.toThrow(
      /exceeds/,
    );
    expect(await getNotes()).toHaveLength(0);
  });

  it('substitutes a date for rows that are missing one', async () => {
    await AsyncStorage.setItem(
      'notes',
      JSON.stringify([{chapter: 23, verse: 1, text: 'legacy note'}]),
    );
    const all = await getNotes();
    expect(all).toHaveLength(1);
    expect(all[0].text).toBe('legacy note');
    expect(Number.isNaN(new Date(all[0].date).getTime())).toBe(false);
  });

  it('drops rows whose text is not a string', async () => {
    await AsyncStorage.setItem(
      'notes',
      JSON.stringify([
        {chapter: 23, verse: 1, text: 'ok', date: new Date().toISOString()},
        {chapter: 24, verse: 1, text: 42, date: new Date().toISOString()},
      ]),
    );
    expect(await getNotes()).toHaveLength(1);
  });
});

// ─── History ──────────────────────────────────────────────────────────────────

describe('history', () => {
  it('records most-recent-first', async () => {
    await addHistory(23, 1);
    await addHistory(91, 2);
    const all = await getHistory();
    expect(all[0].chapter).toBe(91);
    expect(all[1].chapter).toBe(23);
  });

  it('moves a revisited chapter to the top rather than duplicating it', async () => {
    await addHistory(23, 1);
    await addHistory(91, 1);
    await addHistory(23, 5);
    const all = await getHistory();
    expect(all).toHaveLength(2);
    expect(all[0]).toMatchObject({chapter: 23, verse: 5});
  });

  it('caps the list at 50 entries', async () => {
    for (let c = 1; c <= 60; c++) {
      await addHistory(c, 1);
    }
    const all = await getHistory();
    expect(all).toHaveLength(50);
    expect(all[0].chapter).toBe(60);
  });

  it('clears', async () => {
    await addHistory(23, 1);
    await clearHistory();
    expect(await getHistory()).toEqual([]);
  });

  it('drops entries with an unparseable date', async () => {
    await AsyncStorage.setItem(
      'history',
      JSON.stringify([
        {chapter: 23, verse: 1, date: new Date().toISOString()},
        {chapter: 24, verse: 1, date: 'not a date'},
        {chapter: 25, verse: 1},
      ]),
    );
    expect(await getHistory()).toHaveLength(1);
  });

  it('survives concurrent writes', async () => {
    await Promise.all([1, 2, 3, 4, 5].map(c => addHistory(c, 1)));
    expect(await getHistory()).toHaveLength(5);
  });
});
