# Cutting a Play Store release

## Before you ship this one — read this

**The current upload key must be treated as compromised.** Its store and key
passwords were committed in plaintext and are still recoverable from git
history (`git show 916faad`), on branches that are pushed to GitHub. See
`docs/OVERNIGHT_AUDIT.md` A-01.

Signing a new release with that key is what turns a latent leak into a live
risk: anyone who can read the history and obtain the keystore file can sign an
artifact that Play will accept as genuinely yours.

Do the key rotation in the next section **before** uploading, not after.

---

## Rotating the upload key

You only need this once. It does not affect users — Play re-signs everything
with the app signing key, which is separate and held by Google.

### If you use Play App Signing (most likely)

1. Generate a new upload key:

   ```bash
   keytool -genkeypair -v \
     -keystore upload-key-new.keystore \
     -alias psalmsway-upload \
     -keyalg RSA -keysize 4096 -validity 10000
   ```

   Store it outside the repository. `*.keystore` is gitignored, but do not rely
   on that — keep it in a password manager or an encrypted backup. Losing it is
   recoverable via Play support; leaking it is not.

2. Export the certificate:

   ```bash
   keytool -export -rfc \
     -keystore upload-key-new.keystore \
     -alias psalmsway-upload \
     -file upload_certificate.pem
   ```

3. In Play Console: **Release → Setup → App signing → Request upload key
   reset**, and attach `upload_certificate.pem`. Google usually applies this
   within a couple of days.

4. Register the new SHA-1 in the Google Cloud OAuth client if you have enabled
   Drive backup, or sign-in will fail for Play-installed builds:

   ```bash
   keytool -list -v -keystore upload-key-new.keystore -alias psalmsway-upload
   ```

### If you are NOT using Play App Signing

The upload key is the app signing key, and it cannot be rotated — the package
identity depends on it. In that case: enrol in Play App Signing first, which
lets you rotate from then on.

---

## Supplying credentials to the build

`android/app/build.gradle` reads four properties and falls back to environment
variables. **Nothing goes in the repository.**

User-level Gradle config, which is never committed:

```
# Windows: %USERPROFILE%\.gradle\gradle.properties
# macOS/Linux: ~/.gradle/gradle.properties

MYAPP_UPLOAD_STORE_FILE=C:\path\to\upload-key-new.keystore
MYAPP_UPLOAD_KEY_ALIAS=psalmsway-upload
MYAPP_UPLOAD_STORE_PASSWORD=...
MYAPP_UPLOAD_KEY_PASSWORD=...
```

Or as environment variables of the same four names, for CI.

> `MYAPP_UPLOAD_STORE_FILE` is resolved relative to `android/app/`, so an
> absolute path is the reliable choice.

If any of the four is missing, the release `signingConfig` silently applies
nothing and you get an **unsigned** bundle. Play rejects those, so check the
verification step below rather than discovering it at upload time.

---

## Windows: the release build fails from this checkout path

`bundleRelease` fails here with:

```
ninja: error: Stat(...RNCSafeAreaViewShadowNode.cpp.o): Filename longer than 260 characters
```

This is not a code problem and not a signing problem. The C++ object paths
embed the project path **twice** — once as the `.cxx` build root, once as the
mangled source path inside `CMakeFiles/<target>.dir/` — so the full path runs to
roughly 370 characters from:

```
C:\Alexis\Test\my projects\github-repos\psalms-way-app
```

`assembleDebug` succeeds from the same directory purely because its intermediate
folder is `Debug` (5 characters) where release uses `RelWithDebInfo` (14). Those
nine characters are the whole difference.

`LongPathsEnabled` is already `1` in the registry on this machine, which is not
enough: the ninja bundled with the Android SDK's CMake (1.10.2) is not
long-path aware and enforces MAX_PATH itself.

### What works

Build from a short directory. Copying rather than moving keeps the original
checkout untouched:

```powershell
robocopy "C:\Alexis\Test\my projects\github-repos\psalms-way-app" C:\psw /E /MT:16 `
  /XD "C:\Alexis\Test\my projects\github-repos\psalms-way-app\.git" `
      "C:\Alexis\Test\my projects\github-repos\psalms-way-appndroiduild" `
      "C:\Alexis\Test\my projects\github-repos\psalms-way-appndroidppuild" `
      "C:\Alexis\Test\my projects\github-repos\psalms-way-appndroidpp\.cxx"

cd C:\pswndroid
.\gradlew bundleRelease
```

Exclude those four by **full path**, not by name — `/XD build` matches any
directory called `build`, which silently strips the 70 `node_modules/*/build`
folders that packages ship real code in.

### What does not work

- **`subst`** to fake a short drive. The native build gets past the path limit,
  but Metro then fails with `Failed to get the SHA-1 for: ...`, because it
  resolves files through their real path while the project root is the virtual
  drive, so its haste map never matches.
- **Relying on `LongPathsEnabled`**, for the ninja reason above.

### The durable fix

Move the checkout somewhere short — `C:\dev\psalms-way-app` — and keep it
out of paths containing spaces. The old `CLAUDE.md` referenced
`C:\Alexis\Test\psalm-way-new`, which was short enough; the release build
most likely broke when the repository moved under `github-repos/`.

---

## Building

```bash
# Version numbers live in two places and must agree
#   android/app/build.gradle  versionCode / versionName
#   package.json              version  (used as the backup envelope's appVersion)

cd android
./gradlew clean bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

Play requires an **AAB**, not an APK. `assembleRelease` produces an APK, which
is useful for local install testing but cannot be uploaded.

### Verify it is actually signed

```bash
# From android/app/build/outputs/bundle/release/
jarsigner -verify -verbose -certs app-release.aab | head -20
```

An unsigned bundle reports "jar is unsigned". A signed one lists your
certificate. Do this every time — it is the failure mode that wastes the most
time.

To check which key signed it:

```bash
keytool -printcert -jarfile app-release.aab
```

---

## Release checklist

- [ ] Upload key rotated, or consciously accepted as compromised
- [ ] `versionCode` incremented (Play rejects a duplicate)
- [ ] `versionName` updated
- [ ] `package.json` version matches `versionName`
- [ ] `npm run lint`, `npm run typecheck`, `npm test` all pass
- [ ] `bundleRelease` succeeds
- [ ] `jarsigner -verify` confirms it is signed by the expected key
- [ ] Installed the release build on a real device and opened it
- [ ] Daily reminder enabled, and verified it fires the next morning
- [ ] If Drive backup is configured: connect, back up, restore, disconnect
- [ ] Data Safety form updated if the backup feature is now live

## Play Data Safety

Once optional Drive backup ships, the Data Safety declaration must change. The
app now *can* transmit user data, even though it does so only on explicit
opt-in and only to the user's own Drive.

Declare:

- **Data collected:** none by the developer. This project operates no server and
  receives nothing.
- **Data transferred off device:** app activity and user content — bookmarks,
  favourites, highlights, notes, reading history, streak, badges, challenge
  progress, preferences — **only** when the user connects Google Drive.
- **Destination:** the user's own Google Drive `appDataFolder`, via the
  `drive.appdata` scope.
- **Encrypted in transit:** yes (HTTPS to Google APIs).
- **User can request deletion:** yes — from Google Drive settings, without the
  app, or by disconnecting and deleting the file.
- **Required to use the app:** no. Reading is fully offline and requires no
  account.

Do not declare the app as making no network requests. That stopped being true
when the backup feature landed.
