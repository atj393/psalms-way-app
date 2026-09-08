# Psalms Way — overnight result

Read this instead of the commit log.

---

## Executive summary

**Status: READY WITH EXTERNAL SETUP.**

Two correctness bugs that had been quietly degrading the product are fixed and
regression-tested: the "daily verse" reminder was delivering the **same verse
every day**, and every personal-data service could **silently lose writes** on
concurrent taps. A third — day boundaries computed in UTC rather than the
reader's own midnight — was shifting streaks, the once-per-day challenge gate
and the Stats chart by up to a day depending on timezone.

Optional Google Drive backup is implemented end to end apart from OAuth token
acquisition, which genuinely cannot be completed from a repository. It is behind
a four-method interface with nothing registered, so the app degrades honestly:
Settings shows Backup & Restore as unavailable with the reason, and no network
call is made.

The test suite went from **1 test to 416**. Lint errors from 6 to 0. TypeScript
was already clean and still is. The Android debug build passes.

**One item needs you and cannot be done safely from here:** the upload keystore
passwords are still in git history and pushed to GitHub. Rotate the key.

---

## Repository state

| | |
|---|---|
| Base commit | `9529a85` on `main` |
| Branch | `codex/overnight-product-hardening` |
| Commits | 8 |
| Merged to main | **No** — draft PR only |
| Release performed | **No** — versionCode and versionName untouched |

---

## What changed

### Notifications

The headline fix. `scheduleDailyNotification` picked one random verse at the
moment the user enabled reminders, embedded it in the notification, and
registered it with `RepeatFrequency.DAILY`. **Android replays a repeating
trigger with its original payload**, so the daily verse was frozen — the same
psalm every morning, indefinitely. Challenge reminders had the identical defect,
repeating day one's verse for a whole 40-day challenge even though
`dayAssignments` already stored a distinct verse per day.

A repeating trigger fundamentally cannot carry changing content, so it is
replaced with a rolling 14-day window of one-shot triggers, each with its own
verse, topped up on every app open and whenever settings change.

The verse for a day is now a pure function of (date, translation) — FNV-1a
rather than `Math.random`. That makes re-scheduling idempotent: refreshing the
window recomputes identical content for days already queued, so it cannot
produce a second, contradictory notification for the same day, and it is
testable without mocking randomness.

Also: permission is requested when the user enables reminders rather than at
startup; a scheduling failure now leaves the toggle off and says so instead of
claiming reminders are on; and reminders use
`AlarmType.SET_AND_ALLOW_WHILE_IDLE`, which survives Doze without needing a
restricted permission.

**Ruled out, not a bug:** reboot survival. The app manifest declares no boot
receiver, which looks broken, but the *merged* manifest shows Notifee's
`RebootBroadcastReceiver` and WorkManager's `RescheduleReceiver` handling
`BOOT_COMPLETED`, `TIME_SET` and `TIMEZONE_CHANGED`. That already worked.

### Persistence

Every service was `load()` → mutate → `save()`: a read-modify-write with an
`await` in the middle and nothing serialising it, so two overlapping calls both
read the same starting array and the second write discarded the first.
`toggleBookmark` did three reads across two awaits. A double-tapped bookmark
button or a note autosave racing a manual save lost data with no error.

`services/storage.ts` adds a per-key promise chain. It also replaces
`JSON.parse(raw) as Bookmark[]` — an assertion nothing verified — with real
validation, dropping malformed rows individually so one bad bookmark cannot
discard the other forty-nine. Writes now reject on failure instead of resolving
into an unhandled rejection.

### Dates

`new Date().toISOString().split('T')[0]` yields the **UTC** day. The streak
advanced and the challenge gate opened at midnight UTC — mid-afternoon in
UTC+13, still "yesterday" until late morning in UTC-8. `services/dateUtils.ts`
provides local-day helpers with an injectable clock, and normalises both ends
before subtracting so a 23- or 25-hour DST day still counts as exactly one.

The Stats seven-day chart had a matching defect: local day *labels* against UTC
day *buckets*, so evening reading was filed under tomorrow west of UTC and the
chart disagreed with the streak the user saw.

### Google Drive backup

Offline-first with an optional private backup, never cloud-first.

- **Snapshot layer** collects the nine keys holding user-created content into a
  versioned envelope. Bundled psalms, caches, tokens and first-run flags are
  excluded — those describe what this install has shown, not anything the user
  made, and restoring them would suppress a new device's setup.
- **Restore is transactional.** Previous values of every affected key are
  captured first and put back if any write fails, so a part-way failure cannot
  leave a mix of two devices' data.
- **Restore replaces rather than merges, deliberately.** Bookmarks, highlights
  and notes are keyed only by (chapter, verse) with no stable id or edit
  timestamp, so a merge could not distinguish "edited on the other device" from
  "deleted here" and risks resurrecting notes the user deleted. A validated full
  replace, summarised and confirmed first, is honest about what it does.
- **Drive access** uses `drive.appdata` — the app can see only files it created,
  never the user's documents or photos. Written against `fetch`; the four calls
  needed are plain HTTPS, so a Drive SDK would add a dependency and native build
  surface to save about sixty lines.
- **Failures are typed** so the UI can distinguish "reconnect your account" from
  "you are offline" from "that backup is from a newer version".

### Data and localization

Automated integrity suites found real defects:

- **83 translations across 39 languages had unusable interpolation.** The
  placeholder *identifier* had been translated with the sentence — `{{done}}`
  arriving as `{{hecho}}`, `{{klaar}}`, `{{完了}}`. i18next binds by name, so
  none resolved: users saw "/ chapters" instead of "3 / 40 chapters". Repaired
  mechanically, leaving the translated words untouched.
- **47 of 81 translations had no language label** (`lang` was `""` or `null`),
  and the Settings picker sorts and groups by it — so more than half the list
  collapsed under one blank heading. Now derived from the ISO code.
- **Two translations are incomplete** (`lt_heritage` 137/150, `ta_oitce`
  148/150) and missing psalms rendered a completely blank screen. Now an
  explanatory empty state.
- `en.json` defined three theme keys twice.

### Quality

Six eslint errors fixed — five unused bindings and one real defect (the Stats
`useMemo` omitted `t`, so day labels kept the previous language after a language
change). `npm run typecheck` added. CI now gates on lint and typecheck, runs the
Node 22 the `engines` field requires rather than 20, and builds a single-ABI
Android debug APK.

---

## Test evidence

Run on this branch at the final commit:

```text
npm run lint       PASS   0 errors, 113 warnings
npm run typecheck  PASS
npm test           PASS   416 tests, 10 suites
./gradlew assembleDebug   PASS   3m 10s (arm64-v8a)
./gradlew assembleDebug   PASS   35m 08s (all 4 ABIs, earlier in the session)
```

Baseline for comparison: 1 test, 6 lint errors, no typecheck script.

Coverage is concentrated where the brief asked — service and domain logic:

| Suite | Tests |
|---|---|
| `notificationService` | 34 |
| `cloudBackup` | 37 |
| `persistence` | 32 |
| `engagement` (streak, badges, challenges) | 35 |
| `backup` (schema, snapshot, restore) | 28 |
| `dateUtils` | 23 |
| `dailyVerseService` | 11 |
| `i18nIntegrity` | ~190 (per-locale) |
| `psalmsData` | 15 |
| `App` smoke | 1 |

---

## What was NOT tested

Being explicit, because the brief asked for real results only.

- **No emulator or device run.** No AVD was started, so nothing here was
  exercised as a running app. Every claim above rests on unit tests, the Gradle
  build, and reading the merged manifest.
- **No screenshots**, for the same reason.
- **Google Drive was never exercised against a real account.** There is no OAuth
  client. The Drive REST calls are tested against a mocked `fetch`, which proves
  the request shapes and error handling, not that Google accepts them.
- **Notification delivery was not observed.** Scheduling is tested; whether
  Android actually fires the notification at 07:00 under Doze on a specific OEM
  is not something a unit test can establish.
- The **four-ABI** release-shaped build was run before the manifest change; the
  post-change build was single-ABI.

---

## Remaining issues

### Needs you — P0

**Upload keystore passwords are in git history.** Commit `916faad` removed them
from the working tree, but its own message records that they were present on
`main`, `ios` and 13 other commits. `git show 916faad` still prints both, and the
branches are on GitHub.

Treat them as compromised. Rotate the upload key (or request an upload key reset
in Play Console if you use Play App Signing). Optionally purge history with
`git filter-repo` afterwards — but rotation is what actually protects you.

Not fixed here because rotating signing credentials and rewriting published
history are both irreversible, and the brief explicitly ruled them out.

### Needs you — decisions

- **`SCHEDULE_EXACT_ALARM` still ships.** Removing it from the app manifest was
  correct, but the merged manifest shows `app.notifee:core` contributing it
  anyway. Play will still ask for a justification. Suppressing it needs
  `tools:node="remove"`, which risks Notifee's internal exact-alarm path and
  needs on-device verification — not something to do unattended.
- **17 interpolation strings need a translator** (listed in
  `PLACEHOLDERS_NEEDING_TRANSLATOR`). The placeholder is gone, not just
  misnamed, so the sentence must be rewritten by someone who reads the language.
- **Tibetan and Wolof are ~half translated.** Machine-translating 110 strings
  each and presenting them as reviewed is what the brief said not to do.

### Deferred deliberately

- **113 eslint warnings**, all `no-inline-styles` and
  `no-unstable-nested-components`. Clearing them is a broad stylistic refactor
  across most screens with no behaviour change — it would bury the correctness
  work in this PR. Lint gates on errors, which are at zero.
- **No new runtime dependency was added.** Every npm version available here
  rewrites the whole committed `package-lock.json` (~11,600 lines) for a single
  package. That churn belongs in a commit where it is the only thing happening.
  It is why the Google sign-in library is not installed.
- **`@types/node` is used transitively** rather than declared, for the same
  reason. `tsconfig.json` says so; if it ever disappears, `tsc` fails loudly.

---

## External configuration required

Google Drive backup needs, in order:

1. A Google Cloud project with the **Drive API** enabled.
2. An OAuth consent screen requesting **only** `drive.appdata`.
3. An **Android** OAuth client bound to `com.psalmswayapp` and your signing
   SHA-1 — including the Play App Signing SHA-1 if you use it, or sign-in works
   locally and fails for everyone who installs from Play.
4. A **Web** OAuth client, whose ID the Android sign-in libraries need as
   `webClientId`.
5. `npm install @react-native-google-signin/google-signin`.
6. About 25 lines implementing `GoogleAuthProvider` and calling
   `setAuthProvider(...)` at startup.

Step-by-step, with the provider implementation written out:
**[docs/GOOGLE_DRIVE_SETUP.md](GOOGLE_DRIVE_SETUP.md)**.

Nothing else in the codebase changes when you do this.

---

## Start here tomorrow

1. **Rotate the upload key.** The only thing on this list that is actively
   urgent, and the only one I could not do for you.
2. **Review the notification rewrite** — `services/notificationService.ts` and
   `services/dailyVerseService.ts`. It is the largest behavioural change: your
   users will start getting a different verse each day, which they have not been
   getting.
3. **Review the restore semantics** in `services/backup/snapshotService.ts`.
   Replace-not-merge is a product decision I made on your behalf; the reasoning
   is in the file header and it is the one call worth disagreeing with.
4. **Decide on `SCHEDULE_EXACT_ALARM`** — justify it in Play, or remove it and
   test reminders on a device.
5. **Run it on a device.** Nothing here has been seen running. The reminder flow
   and the Library/Stats screens are where I would look first.
