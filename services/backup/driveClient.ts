/**
 * Minimal Google Drive REST client, scoped to the app's private appDataFolder.
 *
 * Written against `fetch` rather than a Drive SDK on purpose. The four calls
 * this feature needs — list, create, update, download — are plain HTTPS, so a
 * client library would add a dependency and a native build surface to save
 * about sixty lines. Acquiring the OAuth access token is the part that genuinely
 * needs a native module; that is deliberately NOT this module's job (see
 * googleAuth.ts), which keeps everything here testable with a mocked fetch.
 *
 * Everything is confined to `appDataFolder`, Drive's per-application hidden
 * folder. With the drive.appdata scope the app can see only files it created
 * itself — it cannot read the user's documents, photos or other Drive content,
 * and the user can delete the data from their Drive settings at any time. The
 * developer never receives it: the request goes from the device straight to
 * Google, and this project operates no server.
 */

const DRIVE_FILES = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';

/** The narrowest scope that permits this feature. */
export const DRIVE_APPDATA_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

/** Fixed filename inside appDataFolder; one backup per account, overwritten. */
export const BACKUP_FILENAME = 'psalms-way-backup.json';

export type DriveFile = {
  id: string;
  name: string;
  modifiedTime?: string;
  size?: string;
};

/**
 * Failure modes the UI must distinguish.
 *
 * `auth` means the token is stale or was revoked and the user should reconnect;
 * `network` means try again later; `quota` and `server` are Google's problem,
 * not the user's, and should not read as "your backup is corrupt".
 */
export type DriveErrorKind = 'auth' | 'network' | 'quota' | 'server' | 'unknown';

export class DriveError extends Error {
  readonly kind: DriveErrorKind;
  readonly status?: number;

  constructor(kind: DriveErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'DriveError';
    this.kind = kind;
    this.status = status;
  }
}

function kindForStatus(status: number): DriveErrorKind {
  if (status === 401 || status === 403) return 'auth';
  if (status === 429) return 'quota';
  if (status >= 500) return 'server';
  return 'unknown';
}

async function request(
  url: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(init.headers ?? {}),
      },
    });
  } catch (err) {
    // fetch only rejects for transport failures, so this is genuinely offline
    // or DNS — never an API-level error.
    throw new DriveError(
      'network',
      err instanceof Error ? err.message : 'Network request failed',
    );
  }

  if (!response.ok) {
    // Drive's error body is useful for diagnosis but must not reach the user
    // verbatim; the UI renders a message chosen from `kind`.
    const detail = await response.text().catch(() => '');
    throw new DriveError(
      kindForStatus(response.status),
      `Drive request failed (${response.status})${detail ? `: ${detail.slice(0, 200)}` : ''}`,
      response.status,
    );
  }

  return response;
}

/** Finds the existing backup file in appDataFolder, if there is one. */
export async function findBackupFile(accessToken: string): Promise<DriveFile | null> {
  const params = new URLSearchParams({
    spaces: 'appDataFolder',
    q: `name = '${BACKUP_FILENAME}'`,
    fields: 'files(id,name,modifiedTime,size)',
    pageSize: '10',
  });
  const response = await request(`${DRIVE_FILES}?${params}`, accessToken);
  const body = (await response.json()) as {files?: DriveFile[]};
  const files = body.files ?? [];
  if (files.length === 0) return null;

  // Drive permits duplicate names. If an interrupted upload ever left two,
  // the most recently modified one is the real backup.
  return files.sort((a, b) =>
    (b.modifiedTime ?? '').localeCompare(a.modifiedTime ?? ''),
  )[0];
}

/**
 * Writes the backup to appDataFolder, replacing any previous one.
 *
 * Updating the existing file rather than always creating keeps exactly one
 * backup per account, so a user cannot accumulate dozens of near-identical
 * copies inside their Drive quota.
 */
export async function uploadBackup(
  accessToken: string,
  contents: string,
): Promise<DriveFile> {
  const existing = await findBackupFile(accessToken);

  if (existing) {
    const response = await request(
      `${DRIVE_UPLOAD}/${existing.id}?uploadType=media&fields=id,name,modifiedTime,size`,
      accessToken,
      {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: contents,
      },
    );
    return (await response.json()) as DriveFile;
  }

  // Multipart create: metadata part naming the parent folder, then the body.
  const boundary = `psalmsway-${Date.now()}`;
  const metadata = JSON.stringify({
    name: BACKUP_FILENAME,
    parents: ['appDataFolder'],
  });
  const body =
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    `${metadata}\r\n` +
    `--${boundary}\r\n` +
    'Content-Type: application/json\r\n\r\n' +
    `${contents}\r\n` +
    `--${boundary}--`;

  const response = await request(
    `${DRIVE_UPLOAD}?uploadType=multipart&fields=id,name,modifiedTime,size`,
    accessToken,
    {
      method: 'POST',
      headers: {'Content-Type': `multipart/related; boundary=${boundary}`},
      body,
    },
  );
  return (await response.json()) as DriveFile;
}

/** Downloads the backup file's raw contents. */
export async function downloadBackup(
  accessToken: string,
  fileId: string,
): Promise<string> {
  const response = await request(
    `${DRIVE_FILES}/${fileId}?alt=media`,
    accessToken,
  );
  return response.text();
}

/** Deletes the backup, for when a user disconnects and asks to remove it. */
export async function deleteBackup(accessToken: string, fileId: string): Promise<void> {
  await request(`${DRIVE_FILES}/${fileId}`, accessToken, {method: 'DELETE'});
}
