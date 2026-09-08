/**
 * The backup envelope and its validator.
 *
 * A backup is untrusted input. It may come from a newer build of the app, from
 * a half-finished upload, or from a file a user hand-edited. Restoring it
 * overwrites everything personal the user has, so parsing is explicit and
 * failures are typed: the UI has to be able to say *why* a restore was refused,
 * and "corrupt file" and "made by a newer version" call for different advice.
 *
 * What is NOT in here is as deliberate as what is. The 26 MB of bundled psalm
 * translations ships with the app and never enters a backup, and neither do
 * caches, first-run flags, or OAuth tokens. A backup carries only what the user
 * created.
 */

import type {Bookmark} from '../bookmarksService';
import type {Highlight} from '../highlightsService';
import type {Note} from '../notesService';
import type {HistoryEntry} from '../historyService';
import {isRecord} from '../storage';

export const BACKUP_TYPE = 'psalms-way-backup';

/**
 * Bump when the shape of `data` changes incompatibly.
 *
 * Restores accept any version up to this one and migrate forward; anything
 * higher is refused rather than guessed at.
 */
export const SCHEMA_VERSION = 1;

/** User settings worth carrying to a new device. */
export type BackupSettings = {
  fontSize?: number;
  themeMode?: string;
  themeColor?: string;
  bibleVersion?: string;
  language?: string;
  /**
   * Reminder preferences travel as user intent. The scheduled notification ids
   * and trigger timestamps deliberately do not: they are device-local state,
   * and the destination device rebuilds its own schedule after a restore.
   */
  notificationEnabled?: boolean;
  notificationHour?: number;
  notificationMinute?: number;
};

export type BackupData = {
  bookmarks: Bookmark[];
  favorites: number[];
  highlights: Highlight[];
  notes: Note[];
  history: HistoryEntry[];
  streak: unknown;
  badges: unknown;
  challenges: unknown;
  settings: BackupSettings;
};

export type PsalmsWayBackup = {
  type: typeof BACKUP_TYPE;
  schemaVersion: number;
  appVersion: string;
  createdAt: string;
  data: BackupData;
};

/** Why a candidate backup was rejected. Each maps to its own user-facing message. */
export type BackupErrorCode =
  | 'not-json'
  | 'not-a-backup'
  | 'future-version'
  | 'malformed';

export type BackupValidation =
  | {ok: true; backup: PsalmsWayBackup}
  | {ok: false; code: BackupErrorCode; detail: string};

/** A human-readable summary shown on the confirmation screen before restoring. */
export type BackupSummary = {
  createdAt: string;
  appVersion: string;
  bookmarks: number;
  favorites: number;
  highlights: number;
  notes: number;
  history: number;
};

function arrayOr<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function parseSettings(value: unknown): BackupSettings {
  if (!isRecord(value)) return {};
  const out: BackupSettings = {};
  if (typeof value.fontSize === 'number' && Number.isFinite(value.fontSize)) {
    out.fontSize = value.fontSize;
  }
  if (typeof value.themeMode === 'string') out.themeMode = value.themeMode;
  if (typeof value.themeColor === 'string') out.themeColor = value.themeColor;
  if (typeof value.bibleVersion === 'string') out.bibleVersion = value.bibleVersion;
  if (typeof value.language === 'string') out.language = value.language;
  if (typeof value.notificationEnabled === 'boolean') {
    out.notificationEnabled = value.notificationEnabled;
  }
  if (Number.isInteger(value.notificationHour)) {
    const h = value.notificationHour as number;
    if (h >= 0 && h <= 23) out.notificationHour = h;
  }
  if (Number.isInteger(value.notificationMinute)) {
    const m = value.notificationMinute as number;
    if (m >= 0 && m <= 59) out.notificationMinute = m;
  }
  return out;
}

/**
 * Validates a parsed backup object.
 *
 * Tolerant about extra and missing fields inside `data` — a backup written by a
 * build that did not yet have highlights should still restore its bookmarks —
 * but strict about the envelope, which is what proves this is a Psalms Way
 * backup at all. Per-row validation is left to the individual services on the
 * way in, so one bad note cannot fail the whole restore.
 */
export function validateBackup(value: unknown): BackupValidation {
  if (!isRecord(value)) {
    return {ok: false, code: 'not-a-backup', detail: 'Backup is not an object'};
  }
  if (value.type !== BACKUP_TYPE) {
    return {
      ok: false,
      code: 'not-a-backup',
      detail: `Expected type "${BACKUP_TYPE}", got "${String(value.type)}"`,
    };
  }

  const schemaVersion = value.schemaVersion;
  if (!Number.isInteger(schemaVersion) || (schemaVersion as number) < 1) {
    return {
      ok: false,
      code: 'malformed',
      detail: `Invalid schemaVersion: ${String(schemaVersion)}`,
    };
  }
  if ((schemaVersion as number) > SCHEMA_VERSION) {
    // Newer builds may store fields this one would silently drop, and writing
    // the restored state back would then destroy them. Refuse instead.
    return {
      ok: false,
      code: 'future-version',
      detail: `Backup schema v${schemaVersion} is newer than supported v${SCHEMA_VERSION}`,
    };
  }

  if (!isRecord(value.data)) {
    return {ok: false, code: 'malformed', detail: 'Backup has no data object'};
  }

  const d = value.data;
  const backup: PsalmsWayBackup = {
    type: BACKUP_TYPE,
    schemaVersion: schemaVersion as number,
    appVersion: typeof value.appVersion === 'string' ? value.appVersion : 'unknown',
    createdAt:
      typeof value.createdAt === 'string' ? value.createdAt : new Date(0).toISOString(),
    data: {
      bookmarks: arrayOr<Bookmark>(d.bookmarks),
      favorites: arrayOr<number>(d.favorites),
      highlights: arrayOr<Highlight>(d.highlights),
      notes: arrayOr<Note>(d.notes),
      history: arrayOr<HistoryEntry>(d.history),
      streak: d.streak ?? null,
      badges: d.badges ?? null,
      challenges: d.challenges ?? null,
      settings: parseSettings(d.settings),
    },
  };

  return {ok: true, backup};
}

/** Parses raw backup text, mapping JSON failures to a typed error. */
export function parseBackup(raw: string): BackupValidation {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return {
      ok: false,
      code: 'not-json',
      detail: err instanceof Error ? err.message : 'Could not parse JSON',
    };
  }
  return validateBackup(parsed);
}

export function summarise(backup: PsalmsWayBackup): BackupSummary {
  return {
    createdAt: backup.createdAt,
    appVersion: backup.appVersion,
    bookmarks: backup.data.bookmarks.length,
    favorites: backup.data.favorites.length,
    highlights: backup.data.highlights.length,
    notes: backup.data.notes.length,
    history: backup.data.history.length,
  };
}
