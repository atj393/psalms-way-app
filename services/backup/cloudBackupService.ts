/**
 * Orchestrates optional Google Drive backup and restore.
 *
 * Sits above three separable pieces: the snapshot layer (what to save),
 * driveClient (how to move it), and googleAuth (who the user is). Its own job
 * is the order of operations and turning every failure into something the UI
 * can explain.
 *
 * Nothing here runs unless the user has explicitly connected an account.
 * Reading psalms never calls into this file, and the app is fully functional
 * with cloud backup permanently unconfigured.
 */

import {
  DriveError,
  downloadBackup,
  findBackupFile,
  uploadBackup,
  type DriveFile,
} from './driveClient';
import {getAuthProvider} from './googleAuth';
import {parseBackup, summarise, type BackupSummary, type PsalmsWayBackup} from './schema';
import {createSnapshot, restoreSnapshot} from './snapshotService';

/**
 * Every way these operations can fail, as a closed set.
 *
 * The UI maps each to its own message. Collapsing them into one "backup
 * failed" would leave the user unable to tell "reconnect your account" from
 * "you have no backup yet" from "that backup is from a newer version".
 */
export type CloudErrorCode =
  | 'not-configured'
  | 'not-signed-in'
  | 'auth-expired'
  | 'network'
  | 'quota'
  | 'server'
  | 'no-backup'
  | 'corrupt-backup'
  | 'incompatible-backup'
  | 'restore-failed'
  | 'unknown';

export type CloudResult<T> =
  | {ok: true; value: T}
  | {ok: false; code: CloudErrorCode; detail: string};

function fail(code: CloudErrorCode, detail: string): CloudResult<never> {
  return {ok: false, code, detail};
}

/** Maps a DriveError onto the closed error set. */
function fromDriveError(err: DriveError): CloudResult<never> {
  switch (err.kind) {
    case 'auth':
      return fail('auth-expired', err.message);
    case 'network':
      return fail('network', err.message);
    case 'quota':
      return fail('quota', err.message);
    case 'server':
      return fail('server', err.message);
    default:
      return fail('unknown', err.message);
  }
}

function describe(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Resolves an access token, distinguishing "feature not built in" from "user
 * not connected" from "grant revoked".
 */
async function requireToken(): Promise<CloudResult<string>> {
  const provider = getAuthProvider();
  if (!provider) {
    return fail('not-configured', 'Google Drive backup is not configured in this build');
  }

  let account;
  try {
    account = await provider.getCurrentAccount();
  } catch (err) {
    return fail('unknown', describe(err));
  }
  if (!account) {
    return fail('not-signed-in', 'No Google account is connected');
  }

  let token: string | null;
  try {
    token = await provider.getAccessToken();
  } catch (err) {
    return fail('auth-expired', describe(err));
  }
  if (!token) {
    // Signed in locally but Google will not issue a token — the user revoked
    // access from their account settings.
    return fail('auth-expired', 'Google access has been revoked; reconnect to continue');
  }

  return {ok: true, value: token};
}

export type BackupStatus = {
  configured: boolean;
  account: {email: string; name?: string} | null;
  lastBackup: DriveFile | null;
};

/** What the Settings screen renders. Never throws. */
export async function getStatus(): Promise<BackupStatus> {
  const provider = getAuthProvider();
  if (!provider) return {configured: false, account: null, lastBackup: null};

  const account = await provider.getCurrentAccount().catch(() => null);
  if (!account) return {configured: true, account: null, lastBackup: null};

  const token = await provider.getAccessToken().catch(() => null);
  if (!token) return {configured: true, account, lastBackup: null};

  // A failure here means the status line shows no timestamp; it must not stop
  // the screen rendering.
  const lastBackup = await findBackupFile(token).catch(() => null);
  return {configured: true, account, lastBackup};
}

export async function connect(): Promise<CloudResult<{email: string}>> {
  const provider = getAuthProvider();
  if (!provider) {
    return fail('not-configured', 'Google Drive backup is not configured in this build');
  }
  try {
    const account = await provider.signIn();
    if (!account) return fail('not-signed-in', 'Sign-in was cancelled');
    return {ok: true, value: {email: account.email}};
  } catch (err) {
    return fail('unknown', describe(err));
  }
}

/**
 * Disconnects the account.
 *
 * Deliberately leaves the Drive file in place: the data belongs to the user,
 * and silently deleting their only backup because they signed out of one
 * device would be the worst possible reading of "disconnect".
 */
export async function disconnect(): Promise<CloudResult<null>> {
  const provider = getAuthProvider();
  if (!provider) return {ok: true, value: null};
  try {
    await provider.signOut();
    return {ok: true, value: null};
  } catch (err) {
    return fail('unknown', describe(err));
  }
}

/** Uploads a fresh snapshot of local data. */
export async function backupNow(appVersion: string): Promise<CloudResult<DriveFile>> {
  const token = await requireToken();
  if (!token.ok) return token;

  let contents: string;
  try {
    contents = JSON.stringify(await createSnapshot(appVersion));
  } catch (err) {
    return fail('unknown', `Could not read local data: ${describe(err)}`);
  }

  try {
    return {ok: true, value: await uploadBackup(token.value, contents)};
  } catch (err) {
    if (err instanceof DriveError) return fromDriveError(err);
    return fail('unknown', describe(err));
  }
}

/**
 * Fetches and validates the cloud backup WITHOUT applying it.
 *
 * Split from `applyRestore` on purpose: the user is shown what the backup
 * contains and when it was made, and confirms, before anything local is
 * touched. Restore replaces local data, so it must never be one tap away.
 */
export async function fetchBackupForReview(): Promise<
  CloudResult<{backup: PsalmsWayBackup; summary: BackupSummary}>
> {
  const token = await requireToken();
  if (!token.ok) return token;

  let file: DriveFile | null;
  try {
    file = await findBackupFile(token.value);
  } catch (err) {
    if (err instanceof DriveError) return fromDriveError(err);
    return fail('unknown', describe(err));
  }
  if (!file) return fail('no-backup', 'No backup was found in this Google account');

  let raw: string;
  try {
    raw = await downloadBackup(token.value, file.id);
  } catch (err) {
    if (err instanceof DriveError) return fromDriveError(err);
    return fail('unknown', describe(err));
  }

  const parsed = parseBackup(raw);
  if (!parsed.ok) {
    if (parsed.code === 'future-version') {
      return fail('incompatible-backup', parsed.detail);
    }
    return fail('corrupt-backup', parsed.detail);
  }

  return {ok: true, value: {backup: parsed.backup, summary: summarise(parsed.backup)}};
}

/**
 * Applies a backup the user has reviewed and confirmed.
 *
 * Takes an already-validated backup rather than re-fetching, so what the user
 * saw in the confirmation summary is exactly what gets written.
 */
export async function applyRestore(
  backup: PsalmsWayBackup,
): Promise<CloudResult<{restoredKeys: string[]}>> {
  const result = await restoreSnapshot(backup);
  if (result.ok) return {ok: true, value: {restoredKeys: result.restoredKeys}};

  return fail(
    'restore-failed',
    result.rolledBack
      ? `${result.error} — your existing data was left unchanged.`
      : `${result.error} — and the previous data could not be fully restored.`,
  );
}
