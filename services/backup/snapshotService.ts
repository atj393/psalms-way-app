/**
 * Collects and restores the user's personal data as a single portable snapshot.
 *
 * This is the seam between local persistence and any transport. It knows which
 * AsyncStorage keys are the user's own work and how to put them back safely; it
 * knows nothing about Google Drive, files, or networking. That separation is
 * what lets the whole restore path — including the rollback — be tested without
 * any cloud credentials.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BACKUP_TYPE,
  SCHEMA_VERSION,
  type BackupData,
  type BackupSettings,
  type PsalmsWayBackup,
} from './schema';
import {isRecord} from '../storage';

/**
 * The AsyncStorage keys that hold user-created content.
 *
 * Deliberately excluded: `autoSetupDone_v1`, `fallbackNotifPending` and
 * `onboardingDone`. Those describe what this particular install has already
 * shown the user, not anything they created — restoring them onto a new device
 * would suppress its first-run setup.
 */
export const BACKUP_KEYS = {
  bookmarks: 'bookmarks',
  favorites: 'favorites',
  highlights: 'highlights',
  notes: 'notes',
  history: 'history',
  streak: 'streak',
  badges: 'earnedBadges',
  challenges: 'challengeProgress_v2',
  settings: 'appSettings',
} as const;

type BackupKeyName = keyof typeof BACKUP_KEYS;

/** Settings fields that travel in a backup. */
const PORTABLE_SETTINGS: (keyof BackupSettings)[] = [
  'fontSize',
  'themeMode',
  'themeColor',
  'bibleVersion',
  'language',
  'notificationEnabled',
  'notificationHour',
  'notificationMinute',
];

async function readRaw(key: string): Promise<unknown> {
  const raw = await AsyncStorage.getItem(key);
  if (raw == null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    // A locally corrupt value should not abort the backup of everything else.
    console.warn(`[backup] Skipping unparseable local value at "${key}"`);
    return null;
  }
}

function pickPortableSettings(value: unknown): BackupSettings {
  if (!isRecord(value)) return {};
  const out: Record<string, unknown> = {};
  for (const field of PORTABLE_SETTINGS) {
    if (value[field] !== undefined) out[field] = value[field];
  }
  return out as BackupSettings;
}

/** Reads every backed-up key into a backup envelope. */
export async function createSnapshot(appVersion: string): Promise<PsalmsWayBackup> {
  const [bookmarks, favorites, highlights, notes, history, streak, badges, challenges, settings] =
    await Promise.all([
      readRaw(BACKUP_KEYS.bookmarks),
      readRaw(BACKUP_KEYS.favorites),
      readRaw(BACKUP_KEYS.highlights),
      readRaw(BACKUP_KEYS.notes),
      readRaw(BACKUP_KEYS.history),
      readRaw(BACKUP_KEYS.streak),
      readRaw(BACKUP_KEYS.badges),
      readRaw(BACKUP_KEYS.challenges),
      readRaw(BACKUP_KEYS.settings),
    ]);

  const data: BackupData = {
    bookmarks: Array.isArray(bookmarks) ? bookmarks : [],
    favorites: Array.isArray(favorites) ? favorites : [],
    highlights: Array.isArray(highlights) ? highlights : [],
    notes: Array.isArray(notes) ? notes : [],
    history: Array.isArray(history) ? history : [],
    streak: streak ?? null,
    badges: badges ?? null,
    challenges: challenges ?? null,
    settings: pickPortableSettings(settings),
  };

  return {
    type: BACKUP_TYPE,
    schemaVersion: SCHEMA_VERSION,
    appVersion,
    createdAt: new Date().toISOString(),
    data,
  };
}

export async function serialiseSnapshot(appVersion: string): Promise<string> {
  return JSON.stringify(await createSnapshot(appVersion));
}

/**
 * Maps a validated backup's `data` onto the raw values each storage key holds.
 *
 * Settings are merged rather than replaced: the local row may carry fields this
 * backup predates, and blanking them would reset preferences the user never
 * asked to change.
 */
async function toWrites(data: BackupData): Promise<Map<string, string>> {
  const writes = new Map<string, string>();
  writes.set(BACKUP_KEYS.bookmarks, JSON.stringify(data.bookmarks));
  writes.set(BACKUP_KEYS.favorites, JSON.stringify(data.favorites));
  writes.set(BACKUP_KEYS.highlights, JSON.stringify(data.highlights));
  writes.set(BACKUP_KEYS.notes, JSON.stringify(data.notes));
  writes.set(BACKUP_KEYS.history, JSON.stringify(data.history));
  if (data.streak !== null) writes.set(BACKUP_KEYS.streak, JSON.stringify(data.streak));
  if (data.badges !== null) writes.set(BACKUP_KEYS.badges, JSON.stringify(data.badges));
  if (data.challenges !== null) {
    writes.set(BACKUP_KEYS.challenges, JSON.stringify(data.challenges));
  }

  const currentSettings = await readRaw(BACKUP_KEYS.settings);
  const merged = {
    ...(isRecord(currentSettings) ? currentSettings : {}),
    ...data.settings,
  };
  writes.set(BACKUP_KEYS.settings, JSON.stringify(merged));

  return writes;
}

export type RestoreResult =
  | {ok: true; restoredKeys: string[]}
  | {ok: false; error: string; rolledBack: boolean};

/**
 * Replaces local data with the backup's contents.
 *
 * Transactional from the user's point of view: the previous values of every key
 * involved are captured first, and if any write fails the captured values are
 * put back. The alternative — a partial restore — is the worst outcome
 * available here, because it leaves a mix of two devices' data with no way for
 * the user to tell which rows came from where.
 *
 * Merging is intentionally not offered. Bookmarks, highlights and notes are
 * keyed only by (chapter, verse) with no stable id or edit timestamp, so a
 * merge could not reliably tell "edited on the other device" from "deleted
 * here" — and inventing that heuristic risks silently resurrecting notes the
 * user deleted. A validated full replace, shown and confirmed first, is
 * honest about what it does.
 */
export async function restoreSnapshot(backup: PsalmsWayBackup): Promise<RestoreResult> {
  const writes = await toWrites(backup.data);
  const keys = [...writes.keys()];

  // Capture the current state so a failure part-way can be undone.
  const previous = new Map<string, string | null>();
  try {
    for (const key of keys) {
      previous.set(key, await AsyncStorage.getItem(key));
    }
  } catch (err) {
    return {
      ok: false,
      error: `Could not read existing data before restore: ${describe(err)}`,
      rolledBack: false,
    };
  }

  const written: string[] = [];
  try {
    for (const [key, value] of writes) {
      await AsyncStorage.setItem(key, value);
      written.push(key);
    }
    return {ok: true, restoredKeys: keys};
  } catch (err) {
    const rolledBack = await rollback(previous, written);
    return {ok: false, error: describe(err), rolledBack};
  }
}

async function rollback(
  previous: Map<string, string | null>,
  written: string[],
): Promise<boolean> {
  try {
    for (const key of written) {
      const before = previous.get(key) ?? null;
      if (before === null) {
        await AsyncStorage.removeItem(key);
      } else {
        await AsyncStorage.setItem(key, before);
      }
    }
    return true;
  } catch (err) {
    // Rollback itself failing is the one case the user must be told about
    // plainly, because local data may now be mixed.
    console.error('[backup] Rollback failed — local data may be inconsistent:', err);
    return false;
  }
}

function describe(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Which backup key a name maps to, for tests and diagnostics. */
export function storageKeyFor(name: BackupKeyName): string {
  return BACKUP_KEYS[name];
}
