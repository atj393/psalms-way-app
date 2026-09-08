/**
 * Google Drive transport and backup orchestration.
 *
 * The OAuth token is the only part of this feature that needs a real Google
 * project, so it is behind a four-method interface and faked here. Everything
 * else — the Drive REST calls, error classification, and the review-then-
 * confirm restore flow — is exercised for real against a mocked fetch.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BACKUP_FILENAME,
  DRIVE_APPDATA_SCOPE,
  DriveError,
  deleteBackup,
  downloadBackup,
  findBackupFile,
  uploadBackup,
} from '../services/backup/driveClient';
import {
  getAuthProvider,
  isCloudBackupConfigured,
  setAuthProvider,
  type GoogleAuthProvider,
} from '../services/backup/googleAuth';
import {
  applyRestore,
  backupNow,
  connect,
  disconnect,
  fetchBackupForReview,
  getStatus,
} from '../services/backup/cloudBackupService';
import {BACKUP_KEYS} from '../services/backup/snapshotService';
import {BACKUP_TYPE, SCHEMA_VERSION} from '../services/backup/schema';

const TOKEN = 'ya29.test-access-token';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response;
}

function textResponse(body: string, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => JSON.parse(body),
    text: async () => body,
  } as Response;
}

const mockFetch = jest.fn();

/** A provider that behaves like a connected Google account. */
function connectedProvider(overrides: Partial<GoogleAuthProvider> = {}): GoogleAuthProvider {
  return {
    signIn: jest.fn(async () => ({email: 'reader@example.com', name: 'Reader'})),
    signOut: jest.fn(async () => {}),
    getCurrentAccount: jest.fn(async () => ({email: 'reader@example.com'})),
    getAccessToken: jest.fn(async () => TOKEN),
    ...overrides,
  };
}

function validBackupJson(): string {
  return JSON.stringify({
    type: BACKUP_TYPE,
    schemaVersion: SCHEMA_VERSION,
    appVersion: '2.0.0',
    createdAt: '2026-09-08T06:00:00.000Z',
    data: {
      bookmarks: [{chapter: 23, verse: 1}],
      favorites: [91],
      highlights: [],
      notes: [],
      history: [],
      streak: null,
      badges: null,
      challenges: null,
      settings: {},
    },
  });
}

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  setAuthProvider(null);
  (global as {fetch?: unknown}).fetch = mockFetch;
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  setAuthProvider(null);
  jest.restoreAllMocks();
});

// ─── Scope ────────────────────────────────────────────────────────────────────

describe('scope', () => {
  it('requests only the private app-data scope', () => {
    // Not drive.file and certainly not full drive: the app must never be able
    // to read the user's own documents.
    expect(DRIVE_APPDATA_SCOPE).toBe('https://www.googleapis.com/auth/drive.appdata');
  });
});

// ─── Drive client ─────────────────────────────────────────────────────────────

describe('findBackupFile', () => {
  it('searches only appDataFolder', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({files: []}));
    await findBackupFile(TOKEN);

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('spaces=appDataFolder');
    expect(url).toContain(encodeURIComponent(BACKUP_FILENAME));
  });

  it('sends the bearer token', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({files: []}));
    await findBackupFile(TOKEN);
    const init = mockFetch.mock.calls[0][1];
    expect(init.headers.Authorization).toBe(`Bearer ${TOKEN}`);
  });

  it('returns null when no backup exists', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({files: []}));
    await expect(findBackupFile(TOKEN)).resolves.toBeNull();
  });

  it('picks the most recent when duplicates exist', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        files: [
          {id: 'old', name: BACKUP_FILENAME, modifiedTime: '2026-01-01T00:00:00Z'},
          {id: 'new', name: BACKUP_FILENAME, modifiedTime: '2026-09-01T00:00:00Z'},
        ],
      }),
    );
    const file = await findBackupFile(TOKEN);
    expect(file?.id).toBe('new');
  });

  it('classifies 401 as an auth failure', async () => {
    mockFetch.mockResolvedValueOnce(textResponse('nope', 401));
    await expect(findBackupFile(TOKEN)).rejects.toMatchObject({
      name: 'DriveError',
      kind: 'auth',
    });
  });

  it('classifies a transport failure as network', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network request failed'));
    await expect(findBackupFile(TOKEN)).rejects.toMatchObject({kind: 'network'});
  });

  it('classifies 429 as quota and 5xx as server', async () => {
    mockFetch.mockResolvedValueOnce(textResponse('slow down', 429));
    await expect(findBackupFile(TOKEN)).rejects.toMatchObject({kind: 'quota'});

    mockFetch.mockResolvedValueOnce(textResponse('boom', 503));
    await expect(findBackupFile(TOKEN)).rejects.toMatchObject({kind: 'server'});
  });
});

describe('uploadBackup', () => {
  it('creates a new file parented to appDataFolder', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({files: []}))
      .mockResolvedValueOnce(jsonResponse({id: 'created', name: BACKUP_FILENAME}));

    await uploadBackup(TOKEN, '{"hello":"world"}');

    const [url, init] = mockFetch.mock.calls[1];
    expect(url).toContain('uploadType=multipart');
    expect(init.method).toBe('POST');
    expect(init.body).toContain('appDataFolder');
    expect(init.body).toContain('{"hello":"world"}');
  });

  it('updates in place when a backup already exists', async () => {
    mockFetch
      .mockResolvedValueOnce(
        jsonResponse({files: [{id: 'existing', name: BACKUP_FILENAME}]}),
      )
      .mockResolvedValueOnce(jsonResponse({id: 'existing', name: BACKUP_FILENAME}));

    await uploadBackup(TOKEN, '{"a":1}');

    const [url, init] = mockFetch.mock.calls[1];
    // Overwriting keeps one backup per account instead of accumulating copies.
    expect(url).toContain('/existing');
    expect(init.method).toBe('PATCH');
  });
});

describe('downloadBackup and deleteBackup', () => {
  it('downloads raw media', async () => {
    mockFetch.mockResolvedValueOnce(textResponse('{"backup":true}'));
    await expect(downloadBackup(TOKEN, 'abc')).resolves.toBe('{"backup":true}');
    expect(mockFetch.mock.calls[0][0]).toContain('alt=media');
  });

  it('deletes by id', async () => {
    mockFetch.mockResolvedValueOnce(textResponse('', 204));
    await deleteBackup(TOKEN, 'abc');
    expect(mockFetch.mock.calls[0][1].method).toBe('DELETE');
  });
});

// ─── Configuration seam ───────────────────────────────────────────────────────

describe('configuration', () => {
  it('reports cloud backup as unconfigured by default', () => {
    expect(isCloudBackupConfigured()).toBe(false);
    expect(getAuthProvider()).toBeNull();
  });

  it('reports it configured once a provider is registered', () => {
    setAuthProvider(connectedProvider());
    expect(isCloudBackupConfigured()).toBe(true);
  });
});

// ─── Orchestration ────────────────────────────────────────────────────────────

describe('when no provider is configured', () => {
  it('reports an unconfigured status rather than throwing', async () => {
    await expect(getStatus()).resolves.toEqual({
      configured: false,
      account: null,
      lastBackup: null,
    });
  });

  it('refuses to back up with a distinct reason', async () => {
    const result = await backupNow('2.0.0');
    expect(result).toMatchObject({ok: false, code: 'not-configured'});
  });

  it('refuses to connect with a distinct reason', async () => {
    expect(await connect()).toMatchObject({ok: false, code: 'not-configured'});
  });

  it('treats disconnect as a no-op success', async () => {
    expect(await disconnect()).toMatchObject({ok: true});
  });

  it('never touches the network', async () => {
    await backupNow('2.0.0');
    await fetchBackupForReview();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe('when configured but not signed in', () => {
  beforeEach(() => {
    setAuthProvider(connectedProvider({getCurrentAccount: jest.fn(async () => null)}));
  });

  it('distinguishes not-signed-in from not-configured', async () => {
    expect(await backupNow('2.0.0')).toMatchObject({ok: false, code: 'not-signed-in'});
  });

  it('reports a configured status with no account', async () => {
    await expect(getStatus()).resolves.toMatchObject({configured: true, account: null});
  });
});

describe('when access has been revoked', () => {
  beforeEach(() => {
    setAuthProvider(connectedProvider({getAccessToken: jest.fn(async () => null)}));
  });

  it('asks the user to reconnect rather than reporting a generic failure', async () => {
    const result = await backupNow('2.0.0');
    expect(result).toMatchObject({ok: false, code: 'auth-expired'});
    if (!result.ok) expect(result.detail).toMatch(/revoked/i);
  });
});

describe('backupNow', () => {
  beforeEach(() => setAuthProvider(connectedProvider()));

  it('uploads a snapshot of local data', async () => {
    await AsyncStorage.setItem(
      BACKUP_KEYS.bookmarks,
      JSON.stringify([{chapter: 23, verse: 1}]),
    );
    mockFetch
      .mockResolvedValueOnce(jsonResponse({files: []}))
      .mockResolvedValueOnce(jsonResponse({id: 'new', name: BACKUP_FILENAME}));

    const result = await backupNow('2.0.0');
    expect(result.ok).toBe(true);

    const uploaded = mockFetch.mock.calls[1][1].body as string;
    expect(uploaded).toContain('psalms-way-backup');
    expect(uploaded).toContain('"chapter":23');
  });

  it('never uploads bundled psalm text', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({files: []}))
      .mockResolvedValueOnce(jsonResponse({id: 'new'}));
    await backupNow('2.0.0');
    const uploaded = mockFetch.mock.calls[1][1].body as string;
    expect(uploaded.length).toBeLessThan(10000);
  });

  it('surfaces an expired token as auth-expired', async () => {
    mockFetch.mockResolvedValueOnce(textResponse('expired', 401));
    expect(await backupNow('2.0.0')).toMatchObject({ok: false, code: 'auth-expired'});
  });

  it('surfaces offline as network', async () => {
    mockFetch.mockRejectedValueOnce(new Error('offline'));
    expect(await backupNow('2.0.0')).toMatchObject({ok: false, code: 'network'});
  });
});

describe('fetchBackupForReview', () => {
  beforeEach(() => setAuthProvider(connectedProvider()));

  it('reports no-backup when the account has none', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({files: []}));
    expect(await fetchBackupForReview()).toMatchObject({ok: false, code: 'no-backup'});
  });

  it('returns a summary for confirmation without touching local data', async () => {
    await AsyncStorage.setItem(BACKUP_KEYS.bookmarks, JSON.stringify([{chapter: 1, verse: 1}]));
    mockFetch
      .mockResolvedValueOnce(jsonResponse({files: [{id: 'f1', name: BACKUP_FILENAME}]}))
      .mockResolvedValueOnce(textResponse(validBackupJson()));

    const result = await fetchBackupForReview();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.summary.bookmarks).toBe(1);
      expect(result.value.summary.createdAt).toBe('2026-09-08T06:00:00.000Z');
    }

    // Reviewing must not have overwritten anything yet.
    expect(JSON.parse((await AsyncStorage.getItem(BACKUP_KEYS.bookmarks))!)).toEqual([
      {chapter: 1, verse: 1},
    ]);
  });

  it('reports corrupt content distinctly', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({files: [{id: 'f1', name: BACKUP_FILENAME}]}))
      .mockResolvedValueOnce(textResponse('{ not json'));
    expect(await fetchBackupForReview()).toMatchObject({
      ok: false,
      code: 'corrupt-backup',
    });
  });

  it('reports a newer schema as incompatible, not corrupt', async () => {
    const future = JSON.parse(validBackupJson());
    future.schemaVersion = SCHEMA_VERSION + 1;
    mockFetch
      .mockResolvedValueOnce(jsonResponse({files: [{id: 'f1', name: BACKUP_FILENAME}]}))
      .mockResolvedValueOnce(textResponse(JSON.stringify(future)));

    const result = await fetchBackupForReview();
    expect(result).toMatchObject({ok: false, code: 'incompatible-backup'});
  });

  it('rejects a file that is not a Psalms Way backup', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({files: [{id: 'f1', name: BACKUP_FILENAME}]}))
      .mockResolvedValueOnce(textResponse('{"type":"someone-elses-app"}'));
    expect(await fetchBackupForReview()).toMatchObject({
      ok: false,
      code: 'corrupt-backup',
    });
  });
});

describe('applyRestore', () => {
  beforeEach(() => setAuthProvider(connectedProvider()));

  it('writes the reviewed backup to local storage', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({files: [{id: 'f1', name: BACKUP_FILENAME}]}))
      .mockResolvedValueOnce(textResponse(validBackupJson()));

    const review = await fetchBackupForReview();
    expect(review.ok).toBe(true);
    if (!review.ok) return;

    const result = await applyRestore(review.value.backup);
    expect(result.ok).toBe(true);
    expect(JSON.parse((await AsyncStorage.getItem(BACKUP_KEYS.bookmarks))!)).toEqual([
      {chapter: 23, verse: 1},
    ]);
  });

  it('reports that existing data survived a failed restore', async () => {
    await AsyncStorage.setItem(BACKUP_KEYS.bookmarks, JSON.stringify([{chapter: 9, verse: 9}]));
    const store = (
      AsyncStorage as unknown as {__INTERNAL_MOCK_STORAGE__: Record<string, string>}
    ).__INTERNAL_MOCK_STORAGE__;
    let writes = 0;
    jest.spyOn(AsyncStorage, 'setItem').mockImplementation(async (key, value) => {
      writes += 1;
      if (writes === 3) throw new Error('disk full');
      store[key] = value as string;
    });

    const result = await applyRestore(JSON.parse(validBackupJson()));
    expect(result).toMatchObject({ok: false, code: 'restore-failed'});
    if (!result.ok) expect(result.detail).toMatch(/left unchanged/);

    jest.restoreAllMocks();
    expect(JSON.parse((await AsyncStorage.getItem(BACKUP_KEYS.bookmarks))!)).toEqual([
      {chapter: 9, verse: 9},
    ]);
  });
});

describe('connect and disconnect', () => {
  it('reports the connected account', async () => {
    setAuthProvider(connectedProvider());
    expect(await connect()).toMatchObject({ok: true, value: {email: 'reader@example.com'}});
  });

  it('treats a cancelled picker as not-signed-in rather than an error', async () => {
    setAuthProvider(connectedProvider({signIn: jest.fn(async () => null)}));
    expect(await connect()).toMatchObject({ok: false, code: 'not-signed-in'});
  });

  it('does not delete the Drive backup when disconnecting', async () => {
    const provider = connectedProvider();
    setAuthProvider(provider);
    await disconnect();
    expect(provider.signOut).toHaveBeenCalled();
    // The user's data stays in their own Drive; signing out of one device must
    // not destroy their only backup.
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

describe('DriveError', () => {
  it('carries kind and status for the UI to branch on', () => {
    const err = new DriveError('auth', 'nope', 401);
    expect(err.kind).toBe('auth');
    expect(err.status).toBe(401);
    expect(err).toBeInstanceOf(Error);
  });
});
