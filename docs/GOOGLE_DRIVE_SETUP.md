# Enabling Google Drive backup

Everything in the Drive backup feature is implemented and tested **except
obtaining an OAuth access token**, which cannot be done from the repository. It
needs a Google Cloud project, an OAuth client bound to this app's package name
and signing certificate, and a native sign-in module.

Until that is done the app behaves correctly: `getAuthProvider()` returns
`null`, `isCloudBackupConfigured()` is `false`, and **Settings → Backup &
Restore** shows the feature as unavailable with the reason. No network call is
made. Nothing else about the app changes.

This document is the exact remaining work.

---

## What already exists

| Piece | File | State |
|---|---|---|
| Snapshot of user data | `services/backup/snapshotService.ts` | Done, 28 tests |
| Versioned envelope + validation | `services/backup/schema.ts` | Done |
| Transactional restore with rollback | `services/backup/snapshotService.ts` | Done |
| Drive REST calls (`appDataFolder`) | `services/backup/driveClient.ts` | Done, tested against mocked `fetch` |
| Orchestration + typed errors | `services/backup/cloudBackupService.ts` | Done, 37 tests |
| Settings UI, all three states | `screens/SettingsScreen.tsx` | Done |
| **OAuth token acquisition** | `services/backup/googleAuth.ts` | **Interface only — this is the gap** |

---

## Step 1 — Google Cloud Console

1. Create (or pick) a project at <https://console.cloud.google.com/>.
2. **APIs & Services → Library** → enable the **Google Drive API**.
3. **APIs & Services → OAuth consent screen**:
   - User type: **External**.
   - Add the scope `https://www.googleapis.com/auth/drive.appdata`.
     Do **not** add `drive`, `drive.file` or any broader scope. `drive.appdata`
     restricts the app to a hidden folder it creates itself; it cannot read the
     user's documents or photos. Broader scopes also trigger Google's annual
     security assessment.
   - While the app is in **Testing**, add each tester's Google account
     explicitly. Publishing requires verification, but `drive.appdata` is a
     non-sensitive scope, so this is normally light.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Android**
   - Package name: `com.psalmswayapp`
   - SHA-1: see step 2.
5. Create a **second** OAuth client of type **Web application**. The Android
   sign-in libraries need its client ID as `webClientId` to return an ID token —
   this is expected, not a mistake.

### Which SHA-1

You need one Android OAuth client per signing certificate.

```bash
# Debug builds
keytool -list -v -keystore android/app/debug.keystore \
  -alias androiddebugkey -storepass android -keypass android

# Your upload/release key
keytool -list -v -keystore <your-upload-key>.keystore -alias <your-alias>
```

If you use **Play App Signing**, also register the SHA-1 Google shows under
*Play Console → Release → Setup → App signing*. Without it, sign-in works in
your local release build and fails for everyone who installs from Play — a
failure mode that is easy to miss until after launch.

---

## Step 2 — Add a sign-in library

No sign-in dependency is installed. Adding one is deliberately left as its own
change, because **every npm version available in this environment rewrites the
whole committed `package-lock.json` (~11,600 lines) for a single package**. That
churn should land in a commit where it is the only thing happening, not buried
in a hardening PR.

The maintained option is
[`@react-native-google-signin/google-signin`](https://github.com/react-native-google-signin/google-signin).
Before committing to it, confirm it currently supports React Native 0.84 with
the New Architecture — that is the one compatibility question that matters here.

```bash
npm install @react-native-google-signin/google-signin
```

Keep the client ID out of the repository. An Android OAuth client ID is not a
secret in the way a client *secret* is — it is bound to your package name and
SHA-1, so it cannot be used from another app — but there is no reason to commit
it either. Supply it through a build config field or an untracked
`android/local.properties` entry.

---

## Step 3 — Implement the provider

`services/backup/googleAuth.ts` defines a four-method interface. Nothing else in
the codebase needs to change — this is the whole integration:

```ts
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {setAuthProvider} from './services/backup/googleAuth';
import {DRIVE_APPDATA_SCOPE} from './services/backup/driveClient';

GoogleSignin.configure({
  scopes: [DRIVE_APPDATA_SCOPE],
  webClientId: '<web-client-id>.apps.googleusercontent.com',
  offlineAccess: false,
});

setAuthProvider({
  async signIn() {
    await GoogleSignin.hasPlayServices();
    const user = await GoogleSignin.signIn();
    // The picker being dismissed is a choice, not an error.
    if (!user?.data?.user) return null;
    return {email: user.data.user.email, name: user.data.user.name ?? undefined};
  },
  async signOut() {
    await GoogleSignin.signOut();
  },
  async getCurrentAccount() {
    const current = await GoogleSignin.getCurrentUser();
    return current ? {email: current.user.email, name: current.user.name ?? undefined} : null;
  },
  async getAccessToken() {
    // Must return null — not throw — when the grant has been revoked from the
    // user's Google account settings. cloudBackupService maps null to
    // "reconnect required"; an exception would surface as a generic failure.
    try {
      const {accessToken} = await GoogleSignin.getTokens();
      return accessToken ?? null;
    } catch {
      return null;
    }
  },
});
```

Call this once at startup (from `index.js` or `App.tsx`). Guard it so a missing
client ID leaves the provider unregistered rather than crashing on launch — the
unconfigured path is already handled everywhere.

---

## Step 4 — Verify

Automated coverage already exists for the logic; these are the things only a
real account can prove.

- [ ] Connect an account — Settings shows the email
- [ ] **Back up now** — succeeds and the timestamp updates
- [ ] Confirm in <https://drive.google.com/drive/u/0/settings> → *Manage apps*
      that Psalms Way appears with hidden app data
- [ ] Change a bookmark, restore, confirm the change is reverted
- [ ] Restore shows the date and contents **before** overwriting anything
- [ ] Revoke access from Google account settings → the app says reconnect,
      rather than showing a generic error
- [ ] Airplane mode → the message says offline, not "backup corrupt"
- [ ] Disconnect → the Drive file is still there
- [ ] With no account connected, reading psalms still works fully offline

---

## Privacy properties to preserve

These are stated in the README and Play Data Safety, so changing the scope or
storage location means changing those too.

- Psalm text is bundled and read offline. The app makes **no** network request
  for reading.
- No account is required for any reading feature.
- Only user-created data is uploaded — bookmarks, favourites, highlights, notes,
  history, streak, badges, challenge progress and preferences. Never the bundled
  psalms, caches, or tokens.
- Data goes to the user's own Drive `appDataFolder`. **This project operates no
  server and the developer never receives it.**
- The user can delete it from Drive settings at any time, without the app.
- Disconnecting does not affect offline reading.
