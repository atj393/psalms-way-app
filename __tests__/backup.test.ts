/**
 * Backup envelope validation, snapshot collection and transactional restore.
 *
 * Restore overwrites everything personal the user has, so the interesting
 * assertions are the refusals: a file that is not a backup, one written by a
 * newer schema, and a write that fails half way and must leave the previous
 * local state intact.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BACKUP_TYPE,
  SCHEMA_VERSION,
  parseBackup,
  summarise,
  validateBackup,
  type PsalmsWayBackup,
} from '../services/backup/schema';
import {
  BACKUP_KEYS,
  createSnapshot,
  restoreSnapshot,
  serialiseSnapshot,
} from '../services/backup/snapshotService';

/**
 * The async-storage jest mock keeps its data on the module object. Tests that
 * simulate a failing write reach for it directly, because delegating to the
 * real `setItem` from inside a spy on `setItem` re-enters the spy.
 */
function mockStore(): Record<string, string> {
  return (AsyncStorage as unknown as {__INTERNAL_MOCK_STORAGE__: Record<string, string>})
    .__INTERNAL_MOCK_STORAGE__;
}

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

function validBackup(overrides: Partial<PsalmsWayBackup> = {}): PsalmsWayBackup {
  return {
    type: BACKUP_TYPE,
    schemaVersion: SCHEMA_VERSION,
    appVersion: '2.0.0',
    createdAt: '2026-09-08T06:00:00.000Z',
    data: {
      bookmarks: [{chapter: 23, verse: 1}],
      favorites: [23, 91],
      highlights: [{chapter: 23, verse: 1, color: 'yellow'}],
      notes: [{chapter: 23, verse: 1, text: 'note', date: '2026-09-01T00:00:00.000Z'}],
      history: [{chapter: 23, verse: 1, date: '2026-09-01T00:00:00.000Z'}],
      streak: {lastDate: '2026-09-07', count: 3, longestStreak: 9},
      badges: {day1: '2026-09-01T00:00:00.000Z'},
      challenges: {},
      settings: {fontSize: 24, themeMode: 'dark', bibleVersion: 'kjv'},
    },
    ...overrides,
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

describe('validateBackup', () => {
  it('accepts a well-formed backup', () => {
    const result = validateBackup(validBackup());
    expect(result.ok).toBe(true);
  });

  it('rejects a non-object', () => {
    for (const value of [null, 42, 'text', []]) {
      const result = validateBackup(value);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe('not-a-backup');
    }
  });

  it('rejects an object that is not a Psalms Way backup', () => {
    // Guards against restoring some other app's export.
    const result = validateBackup({type: 'other-app-backup', schemaVersion: 1, data: {}});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('not-a-backup');
  });

  it('refuses a backup from a newer schema instead of guessing', () => {
    const result = validateBackup(validBackup({schemaVersion: SCHEMA_VERSION + 1}));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('future-version');
      expect(result.detail).toMatch(/newer than supported/);
    }
  });

  it('rejects a nonsensical schema version', () => {
    for (const version of [0, -1, 1.5, 'one', undefined]) {
      const result = validateBackup(validBackup({schemaVersion: version as never}));
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.code).toBe('malformed');
    }
  });

  it('rejects a backup with no data object', () => {
    const result = validateBackup({
      type: BACKUP_TYPE,
      schemaVersion: SCHEMA_VERSION,
      appVersion: '2.0.0',
      createdAt: 'now',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('malformed');
  });

  it('tolerates a partial older backup by defaulting missing collections', () => {
    // A backup written before highlights and notes existed must still restore
    // the bookmarks it does have.
    const result = validateBackup({
      type: BACKUP_TYPE,
      schemaVersion: 1,
      appVersion: '1.0.0',
      createdAt: '2025-01-01T00:00:00.000Z',
      data: {bookmarks: [{chapter: 23, verse: 1}]},
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.backup.data.bookmarks).toHaveLength(1);
      expect(result.backup.data.highlights).toEqual([]);
      expect(result.backup.data.notes).toEqual([]);
      expect(result.backup.data.settings).toEqual({});
    }
  });

  it('ignores unknown fields rather than failing', () => {
    const withExtras = {...validBackup(), somethingNew: 'from a later build'} as never;
    expect(validateBackup(withExtras).ok).toBe(true);
  });

  it('drops out-of-range setting values', () => {
    const result = validateBackup(
      validBackup({
        data: {
          ...validBackup().data,
          settings: {notificationHour: 99, notificationMinute: -5, fontSize: 'big'} as never,
        },
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.backup.data.settings.notificationHour).toBeUndefined();
      expect(result.backup.data.settings.notificationMinute).toBeUndefined();
      expect(result.backup.data.settings.fontSize).toBeUndefined();
    }
  });
});

describe('parseBackup', () => {
  it('parses valid JSON text', () => {
    expect(parseBackup(JSON.stringify(validBackup())).ok).toBe(true);
  });

  it('reports corrupt JSON distinctly from an invalid backup', () => {
    const result = parseBackup('{ this is not json');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('not-json');
  });

  it('reports an empty file as corrupt', () => {
    const result = parseBackup('');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('not-json');
  });
});

describe('summarise', () => {
  it('counts what the confirmation screen shows', () => {
    expect(summarise(validBackup())).toEqual({
      createdAt: '2026-09-08T06:00:00.000Z',
      appVersion: '2.0.0',
      bookmarks: 1,
      favorites: 2,
      highlights: 1,
      notes: 1,
      history: 1,
    });
  });
});

// ─── Snapshot ─────────────────────────────────────────────────────────────────

describe('createSnapshot', () => {
  it('produces a valid envelope from an empty install', async () => {
    const snapshot = await createSnapshot('2.0.0');
    expect(snapshot.type).toBe(BACKUP_TYPE);
    expect(snapshot.schemaVersion).toBe(SCHEMA_VERSION);
    expect(snapshot.appVersion).toBe('2.0.0');
    expect(validateBackup(snapshot).ok).toBe(true);
    expect(snapshot.data.bookmarks).toEqual([]);
  });

  it('collects everything the user created', async () => {
    await AsyncStorage.setItem(BACKUP_KEYS.bookmarks, JSON.stringify([{chapter: 23, verse: 1}]));
    await AsyncStorage.setItem(BACKUP_KEYS.favorites, JSON.stringify([91]));
    await AsyncStorage.setItem(BACKUP_KEYS.streak, JSON.stringify({lastDate: '2026-09-07', count: 4}));

    const snapshot = await createSnapshot('2.0.0');
    expect(snapshot.data.bookmarks).toEqual([{chapter: 23, verse: 1}]);
    expect(snapshot.data.favorites).toEqual([91]);
    expect(snapshot.data.streak).toEqual({lastDate: '2026-09-07', count: 4});
  });

  /** The developer must never receive the user's device-local first-run state. */
  it('excludes first-run flags and anything not user-created', async () => {
    await AsyncStorage.setItem('onboardingDone', 'true');
    await AsyncStorage.setItem('autoSetupDone_v1', 'true');
    await AsyncStorage.setItem('fallbackNotifPending', JSON.stringify({langFallback: true}));

    const serialised = await serialiseSnapshot('2.0.0');
    expect(serialised).not.toContain('onboardingDone');
    expect(serialised).not.toContain('autoSetupDone');
    expect(serialised).not.toContain('fallbackNotifPending');
  });

  it('carries only portable settings, not the whole settings row', async () => {
    await AsyncStorage.setItem(
      BACKUP_KEYS.settings,
      JSON.stringify({fontSize: 24, themeMode: 'dark', someDeviceOnlyField: 'local'}),
    );
    const snapshot = await createSnapshot('2.0.0');
    expect(snapshot.data.settings.fontSize).toBe(24);
    expect(snapshot.data.settings.themeMode).toBe('dark');
    expect(
      (snapshot.data.settings as Record<string, unknown>).someDeviceOnlyField,
    ).toBeUndefined();
  });

  it('does not include bundled psalm text', async () => {
    const serialised = await serialiseSnapshot('2.0.0');
    // A backup carries what the user made, never the 26 MB shipped with the app.
    expect(serialised.length).toBeLessThan(10000);
    expect(serialised).not.toMatch(/The LORD is my shepherd/i);
  });

  it('skips a locally corrupt value instead of failing the whole backup', async () => {
    await AsyncStorage.setItem(BACKUP_KEYS.bookmarks, '{corrupt');
    await AsyncStorage.setItem(BACKUP_KEYS.favorites, JSON.stringify([23]));
    const snapshot = await createSnapshot('2.0.0');
    expect(snapshot.data.bookmarks).toEqual([]);
    expect(snapshot.data.favorites).toEqual([23]);
  });

  it('round-trips through serialisation', async () => {
    await AsyncStorage.setItem(BACKUP_KEYS.bookmarks, JSON.stringify([{chapter: 23, verse: 1}]));
    const parsed = parseBackup(await serialiseSnapshot('2.0.0'));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.backup.data.bookmarks).toEqual([{chapter: 23, verse: 1}]);
  });
});

// ─── Restore ──────────────────────────────────────────────────────────────────

describe('restoreSnapshot', () => {
  it('writes the backup contents into storage', async () => {
    const result = await restoreSnapshot(validBackup());
    expect(result.ok).toBe(true);

    expect(JSON.parse((await AsyncStorage.getItem(BACKUP_KEYS.bookmarks))!)).toEqual([
      {chapter: 23, verse: 1},
    ]);
    expect(JSON.parse((await AsyncStorage.getItem(BACKUP_KEYS.favorites))!)).toEqual([23, 91]);
    expect(JSON.parse((await AsyncStorage.getItem(BACKUP_KEYS.streak))!)).toMatchObject({
      count: 3,
    });
  });

  it('replaces existing local data rather than merging it', async () => {
    await AsyncStorage.setItem(
      BACKUP_KEYS.bookmarks,
      JSON.stringify([{chapter: 100, verse: 1}]),
    );
    await restoreSnapshot(validBackup());
    expect(JSON.parse((await AsyncStorage.getItem(BACKUP_KEYS.bookmarks))!)).toEqual([
      {chapter: 23, verse: 1},
    ]);
  });

  it('merges settings so local-only preferences are not blanked', async () => {
    await AsyncStorage.setItem(
      BACKUP_KEYS.settings,
      JSON.stringify({fontSize: 16, themeColor: 'purple', language: 'de'}),
    );
    await restoreSnapshot(validBackup());
    const settings = JSON.parse((await AsyncStorage.getItem(BACKUP_KEYS.settings))!);
    expect(settings.fontSize).toBe(24); // from the backup
    expect(settings.themeMode).toBe('dark'); // from the backup
    expect(settings.themeColor).toBe('purple'); // preserved locally
  });

  it('leaves keys absent from the backup untouched', async () => {
    await AsyncStorage.setItem('onboardingDone', 'true');
    await restoreSnapshot(validBackup());
    expect(await AsyncStorage.getItem('onboardingDone')).toBe('true');
  });

  /**
   * The transactional guarantee: a restore that fails part way must not leave
   * the user with a mixture of two devices' data.
   */
  it('rolls back to the previous local state when a write fails', async () => {
    await AsyncStorage.setItem(
      BACKUP_KEYS.bookmarks,
      JSON.stringify([{chapter: 100, verse: 1}]),
    );
    await AsyncStorage.setItem(BACKUP_KEYS.favorites, JSON.stringify([100]));

    // Write straight into the mock's backing store rather than delegating to
    // the real setItem, which routes back through this same spy.
    const failOnWrite = (n: number, message: string) => {
      let writes = 0;
      jest.spyOn(AsyncStorage, 'setItem').mockImplementation(async (key, value) => {
        writes += 1;
        if (writes === n) throw new Error(message);
        mockStore()[key] = value as string;
      });
    };
    failOnWrite(3, 'disk full');

    const result = await restoreSnapshot(validBackup());

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.rolledBack).toBe(true);
      expect(result.error).toMatch(/disk full/);
    }

    jest.restoreAllMocks();

    // Everything must read as it did before the attempt.
    expect(JSON.parse((await AsyncStorage.getItem(BACKUP_KEYS.bookmarks))!)).toEqual([
      {chapter: 100, verse: 1},
    ]);
    expect(JSON.parse((await AsyncStorage.getItem(BACKUP_KEYS.favorites))!)).toEqual([100]);
  });

  it('removes keys that did not exist before a failed restore', async () => {
    // Nothing stored beforehand, so rollback must delete rather than restore.
    let writes = 0;
    jest.spyOn(AsyncStorage, 'setItem').mockImplementation(async (key, value) => {
      writes += 1;
      if (writes === 3) throw new Error('write failed');
      mockStore()[key] = value as string;
    });

    const result = await restoreSnapshot(validBackup());
    expect(result.ok).toBe(false);

    jest.restoreAllMocks();
    expect(await AsyncStorage.getItem(BACKUP_KEYS.bookmarks)).toBeNull();
    expect(await AsyncStorage.getItem(BACKUP_KEYS.favorites)).toBeNull();
  });

  it('restores an empty backup without error', async () => {
    const empty = validBackup({
      data: {
        bookmarks: [],
        favorites: [],
        highlights: [],
        notes: [],
        history: [],
        streak: null,
        badges: null,
        challenges: null,
        settings: {},
      },
    });
    const result = await restoreSnapshot(empty);
    expect(result.ok).toBe(true);
    expect(JSON.parse((await AsyncStorage.getItem(BACKUP_KEYS.bookmarks))!)).toEqual([]);
  });

  it('round-trips: snapshot, wipe, restore', async () => {
    await AsyncStorage.setItem(
      BACKUP_KEYS.bookmarks,
      JSON.stringify([{chapter: 23, verse: 1}]),
    );
    await AsyncStorage.setItem(BACKUP_KEYS.notes, JSON.stringify([
      {chapter: 23, verse: 1, text: 'my note', date: '2026-09-01T00:00:00.000Z'},
    ]));

    const snapshot = await createSnapshot('2.0.0');
    await AsyncStorage.clear();
    const result = await restoreSnapshot(snapshot);

    expect(result.ok).toBe(true);
    expect(JSON.parse((await AsyncStorage.getItem(BACKUP_KEYS.bookmarks))!)).toEqual([
      {chapter: 23, verse: 1},
    ]);
    expect(JSON.parse((await AsyncStorage.getItem(BACKUP_KEYS.notes))!)[0].text).toBe('my note');
  });
});
