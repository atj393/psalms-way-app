# CLAUDE.md — Psalms Way App

This file is the primary reference for Claude Code when working on this project.
Read it fully before making any changes.

---

## Project Overview

**Psalms Way** is an Android-only spiritual/devotional React Native app.
It displays all 150 Psalms in 82 translations across 47 interface languages, with
bookmarks, favourites, highlights, notes, reading history, search, translation
comparison, prayers, reading challenges, streaks, badges, stats, daily reminders,
and optional Google Drive backup.

> This file drifted badly from the code (it described a 5-screen app with no
> i18n, notifications, bookmarks or challenges). Updated 2026-09-08. If you find
> it wrong again, fix it in the same change.

- **Package ID:** `com.psalmswayapp`
- **Platform:** Android only (no iOS support)
- **Entry point:** `index.js` → `App.tsx`

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | React Native | 0.84.1 |
| Language | TypeScript | ^5.8.3 |
| React | React | 19.2.3 |
| Navigation | React Navigation (Native Stack) | v7 |
| Storage | @react-native-async-storage/async-storage | ^2.2.0 |
| Icons | react-native-svg + inline SVG strings | ^15.x |
| Safe Area | react-native-safe-area-context | ^5.x |
| Screens | react-native-screens | ^4.x |
| Engine | Hermes | enabled |
| New Architecture | Enabled (forced in RN 0.82+) | true |

> **Important:** `@react-native-async-storage/async-storage` is pinned to **v2.x**.
> v3.x depends on a Maven artifact (`org.asyncstorage.shared_storage:storage-android`)
> that is not yet published — do NOT upgrade to v3.x until that is resolved.

---

## Directory Structure

```
App.tsx                      NavigationContainer + native stack (14 routes)
index.js                     AppRegistry entry; Notifee background handler
notificationEvents.ts        Shared event name/payload for notification taps
psalms-en.json               Bundled "modern" English psalms (string[][])
psalms_extracted/            81 further translation files (~26 MB)

context/
  AppSettingsContext.tsx     theme, font size, language, translation, reminders

theme/index.ts               M3 colour roles, typography, spacing, useTheme()

services/
  psalmsService.ts           getChapter / getVerse / getRandomVerse
  psalmsModules.ts           STATIC require map — Metro cannot do dynamic paths
  dateUtils.ts               local-calendar-day helpers (never use UTC)
  storage.ts                 validated reads + per-key write serialisation
  dailyVerseService.ts       deterministic verse-of-the-day selection
  notificationService.ts     rolling one-shot reminder window (Notifee)
  bookmarks/favorites/highlights/notes/history/streak/badges/challenges
  prayersService.ts          bundled prayers
  autoSetupService.ts        first-launch language + translation detection
  backup/
    schema.ts                versioned envelope + validation
    snapshotService.ts       collect / restore with rollback
    driveClient.ts           Drive v3 appDataFolder over fetch
    googleAuth.ts            OAuth seam — no implementation registered
    cloudBackupService.ts    orchestration + typed errors

screens/                     16 screens
components/                  Header, Navigation, Icons, M3 primitives, sheets
i18n/locales/                47 interface languages
__tests__/                   10 suites, 416 tests
docs/                        audit, overnight result, Drive setup
```

---

## Navigation Architecture

Uses **React Navigation Native Stack** — no custom boolean-state navigation.

```
RootStackParamList:
  Home          → HomeScreen       (initial route)
  ChapterSelect → ChapterSelectScreen  (modal, receives onSelect callback)
  Settings      → SettingsScreen   (modal)
```

All `screenOptions={{ headerShown: false }}` — headers are custom-built.

---

## State Management

**No Redux.** All state lives in `HomeScreen.tsx` via `useState`.

| State | Type | Purpose |
|---|---|---|
| `subScreen` | `'verse' \| 'chapter'` | Which content view is active |
| `chapter` | `number` (1–150) | Current psalm |
| `highlightVerse` | `number` | Verse to highlight in chapter view (0 = none) |

Global persistent state lives in `AppSettingsContext`:

| State | Type | Default | Stored in |
|---|---|---|---|
| `fontSize` | `number` | `20` | AsyncStorage `appSettings` |
| `themeMode` | `'auto' \| 'light' \| 'dark'` | `'auto'` | AsyncStorage `appSettings` |

---

## Theme System

Defined in `theme/index.ts`.

### Color Tokens

| Token | Light | Dark |
|---|---|---|
| `background` | `#FFFFFF` | `#0D0D0D` |
| `surface` | `#F5F5F5` | `#1C1C1E` |
| `surfaceAlt` | `#E8E8E8` | `#2C2C2E` |
| `text` | `#1A1A1A` | `#F2F2F7` |
| `textSecondary` | `#666666` | `#AEAEB2` |
| `border` | `#D0D0D0` | `#3A3A3C` |
| `primary` | `#4A7C9B` | `#5E9DC8` |

### `useTheme()` Hook
Returns `{ isDark, colors, fontSize }`. Uses `useColorScheme()` when mode is `'auto'`.

### `createVerseStyles(colors, fontSize)`
Factory that returns a StyleSheet for verse rows. Called inside `useMemo` in screens.

---

## Data Layer

### `psalms-en.json`
- Root-level file. 150-element array. Each element is a `string[]` of verse texts.
- Imported synchronously. Never fetched from network.
- `psalmsData[0]` = Psalm 1, `psalmsData[149]` = Psalm 150.

### `psalmsService.ts`
```ts
getChapter(chapter: number): string[]
// Returns all verses for psalm `chapter` (1-indexed). Returns [] if out of range.

getRandomVerse(chapter: number): { verse: string; verseNumber: number } | null
// Returns a random verse from the chapter. verseNumber is 1-indexed.
```

---

## Screens Reference

### HomeScreen
- Owns all navigation + content state
- Renders: `Header` → `ChapterScreen | ChapterVerseScreen` → `Navigation`
- Wraps `ChapterVerseScreen` in a `<ScrollView>` (ChapterScreen has its own FlatList)
- `onVerseLoaded(verseNumber)` callback updates `highlightVerse` for the header

### ChapterScreen
- `Props: { chapter, highlightVerse }`
- FlatList — odd rows use `surface`, even rows use `surfaceAlt`
- Highlighted verse gets `borderLeftWidth: 3, borderLeftColor: colors.primary`

### ChapterVerseScreen
- `Props: { chapter, onVerseLoaded }`
- Calls `getRandomVerse(chapter)` on every `chapter` change
- Displays: reference label (`Psalm X:Y`) + verse text

### ChapterSelectScreen
- Receives `onSelect: (chapter: number) => void` via route params
- 5-column FlatList of tiles 1–150
- On tap: calls `onSelect(chapter)` then `navigation.goBack()`

### SettingsScreen
- Font sizes: `16` (small), `20` (medium), `24` (large)
- Theme modes: `auto`, `light`, `dark`
- Active option: filled with `colors.text`, text in `colors.background`

---

## Components Reference

### Header
- Props: `{ chapter, highlightVerse, subScreen, onSettingsPress }`
- Shows `"Psalm X"` in chapter mode, `"Psalm X:Y"` in verse mode

### Navigation
- Props: `{ onNewVerse, onNewChapter, onPrevChapter, onNextChapter, onOpenChapterSelect }`
- Row 1: **New Verse** | **New Chapter**
- Row 2: **◀ Prev** | **Chapters** | **Next ▶**

### Icons
- Available names: `settings`, `close`, `bookmark`, `bookmark-outline`, `share`
- Usage: `<Icons name="settings" size={24} color={colors.text} />`
- Rendered via `react-native-svg` `SvgXml`

---

## Android Configuration

| Setting | Value |
|---|---|
| `applicationId` | `com.psalmswayapp` |
| `minSdkVersion` | 24 (Android 7.0) |
| `targetSdkVersion` | 36 |
| `versionCode` | 9 |
| `versionName` | `2.0.0` |
| `newArchEnabled` | `true` |
| `hermesEnabled` | `true` |
| `edgeToEdgeEnabled` | `false` |
| Signing (debug) | `debug.keystore` (standard) |
| Signing (release) | External properties or env vars; keystore never committed |

---

## Running the App

### Development (physical device)

```powershell
# Step 1 — Forward Metro port to device
"C:\Users\johnson\AppData\Local\Android\Sdk\platform-tools\adb.exe" reverse tcp:8081 tcp:8081

# Step 2 — Start Metro bundler (keep running)
cd C:\Alexis\Test\psalm-way-new
npm start

# Step 3 — Install and launch (new terminal)
npx react-native run-android --no-packager
```

### Development (emulator)
```powershell
npm run android          # auto-detects
npm run android:pick     # interactive device selector
```

### Common Build Errors

| Error | Cause | Fix |
|---|---|---|
| `INSTALL_FAILED_VERSION_DOWNGRADE` | Device has newer versionCode | Bump `versionCode` in `build.gradle` or run `adb uninstall com.psalmswayapp` |
| `No apps connected` in Metro | Device not port-forwarded | Run `adb reverse tcp:8081 tcp:8081` |
| `gradlew.bat not recognized` | Wrong working directory | Run from `C:\Alexis\Test\psalm-way-new` |
| `Could not find org.asyncstorage...` | async-storage v3 | Keep on v2.x (see note above) |
| `adb not found` | Not in PATH | Full path: `C:\Users\johnson\AppData\Local\Android\Sdk\platform-tools\adb.exe` |

---

## Conventions worth knowing

**Dates are local, never UTC.** Use `services/dateUtils.ts`. Writing
`new Date().toISOString().split('T')[0]` gives the *UTC* day and shifts the
streak and the once-per-day challenge gate by up to a day depending on the
user's timezone. That bug has been fixed once already.

**Personal data goes through `services/storage.ts`.** `readJson` validates
untrusted stored JSON; `withKeyLock` serialises read-modify-write so concurrent
taps cannot lose writes. Do not add a service that calls AsyncStorage directly
for user data.

**Reminders are one-shot triggers, never repeating.** Android replays a
repeating trigger with its original payload, so `RepeatFrequency.DAILY` can only
ever deliver one frozen verse. `syncDailyNotifications` maintains a rolling
14-day window instead, and content is a pure function of (date, translation) so
re-syncing is idempotent.

**New UI strings go in `i18n/locales/en.json`.** Other languages fall back to
English until translated; add the key to `PENDING_TRANSLATION` in
`__tests__/i18nIntegrity.test.ts`. Never translate a `{{placeholder}}`
identifier — i18next binds values by name, and translating them broke 83
strings across 39 languages.

**Adding a translation file** means adding it to the static require map in
`services/psalmsModules.ts`. Metro cannot resolve dynamic requires, and
`psalmsData.test.ts` fails if a file on disk is unreferenced.

---

## Testing

```bash
npm test          # 416 tests across 10 suites
npm run lint      # 0 errors, 113 style warnings
npm run typecheck # clean
cd android && ./gradlew assembleDebug
```

Business logic is tested directly rather than through the UI. Notifee,
AsyncStorage and `react-native-localize` are mocked in `jest.setup.js`.

---

## Known Issues

- **Upload keystore passwords are in git history.** Commit `916faad` removed
  them from HEAD only; `git show` still prints them and the branches are
  pushed. Rotate the key — see `docs/OVERNIGHT_AUDIT.md` A-01.
- `SCHEDULE_EXACT_ALARM` still merges into the APK from `app.notifee:core`,
  even though the app manifest no longer declares it and reminders do not rely
  on exact alarms.
- Google Drive backup needs a Cloud Console OAuth client and a sign-in library
  before it can run; see `docs/GOOGLE_DRIVE_SETUP.md`. Unconfigured, Settings
  shows it as unavailable and nothing else is affected.
- Tibetan (`bo`) and Wolof (`wo`) define about half the interface strings and
  fall back to English for the rest.
- `lt_heritage` contains 137 of 150 psalms; `ta_oitce` contains 148. Missing
  psalms render an explanatory empty state.
- 113 eslint warnings remain, all `no-inline-styles` and
  `no-unstable-nested-components`.

---


## Git & Repo

- **Remote:** https://github.com/atj393/psalms-way-app.git
- **Branch:** `main`
- Commit messages follow: `type: short description` (feat, fix, chore, refactor)
