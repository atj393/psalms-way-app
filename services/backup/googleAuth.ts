/**
 * The one piece of Google Drive backup that cannot be completed from the
 * repository alone.
 *
 * Uploading and downloading is plain HTTPS (see driveClient.ts). Obtaining an
 * OAuth access token on Android is not: it needs a native sign-in module, an
 * OAuth client registered in a Google Cloud project, and that client bound to
 * this app's package name and signing-certificate SHA-1. None of those can be
 * created from here, and none can be faked — an access token either came from
 * Google or it did not.
 *
 * So this module defines the seam rather than pretending to implement it.
 * Everything above it (snapshot, validation, transactional restore, the Drive
 * REST calls, the Settings UI) is complete and tested against this interface.
 * Wiring in a real provider is an additive change that touches nothing else.
 *
 * The app degrades honestly without it: `getAuthProvider()` returns null, and
 * Settings shows Backup & Restore as unavailable with the reason, instead of
 * offering a button that cannot work.
 *
 * See docs/GOOGLE_DRIVE_SETUP.md for the exact steps.
 */

export type GoogleAccount = {
  email: string;
  /** Display name, when Google supplies one. */
  name?: string;
};

/**
 * What the rest of the feature needs from a sign-in implementation.
 *
 * Deliberately small: four methods, no library types in the signature. That is
 * what lets the Drive and backup layers be tested without any Google
 * dependency, and what would let the sign-in library be swapped without
 * touching them.
 */
export type GoogleAuthProvider = {
  /**
   * Prompts the user to choose a Google account and grant the
   * DRIVE_APPDATA_SCOPE declared in driveClient.ts — the app-private folder
   * scope, never access to the rest of their Drive.
   *
   * Resolves null if they dismiss the picker, which is a choice rather than an
   * error and callers must not surface as a failure.
   */
  signIn(): Promise<GoogleAccount | null>;

  /** Forgets the account locally. Does not delete anything already in Drive. */
  signOut(): Promise<void>;

  /** The signed-in account, or null. Must not prompt. */
  getCurrentAccount(): Promise<GoogleAccount | null>;

  /**
   * A currently-valid access token, refreshing if needed.
   *
   * Returns null when the user is not signed in or the grant was revoked from
   * their Google account settings, which callers must treat as "reconnect
   * required" rather than as a transient failure.
   */
  getAccessToken(): Promise<string | null>;
};

let provider: GoogleAuthProvider | null = null;

/**
 * Registers the sign-in implementation.
 *
 * Intended to be called once at startup by whatever wires up the native
 * library; tests use it to install a fake.
 */
export function setAuthProvider(next: GoogleAuthProvider | null): void {
  provider = next;
}

/** The registered provider, or null when Drive backup is not configured. */
export function getAuthProvider(): GoogleAuthProvider | null {
  return provider;
}

/** Whether cloud backup can be offered at all on this build. */
export function isCloudBackupConfigured(): boolean {
  return provider !== null;
}
