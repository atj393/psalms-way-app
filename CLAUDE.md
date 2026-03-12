# CLAUDE.md — Psalms Way App

This file is the primary reference for Claude Code when working on this project.
Read it fully before making any changes.

---

## Project Overview

**Psalms Way** is an Android-only spiritual/devotional React Native app.
It displays all 150 Psalms from the KJV Bible, supports random verse and full chapter browsing, and persists user preferences (theme, font size) across sessions.

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
psalm-way-new/
├── App.tsx                        # Root — NavigationContainer + Stack.Navigator
├── index.js                       # AppRegistry entry point
├── psalms-en.json                 # 150 chapters of KJV Psalms (string[][])
│
├── context/
│   └── AppSettingsContext.tsx     # Global theme + font size state (AsyncStorage)
│
├── theme/
│   └── index.ts                   # Colors, useTheme() hook, createVerseStyles()
│
├── services/
│   └── psalmsService.ts           # getChapter(), getRandomVerse()
│
├── components/
│   ├── Header.tsx                 # Top bar: app title, psalm location, settings btn
│   ├── Navigation.tsx             # Bottom bar: New Verse, New Chapter, Prev, Next, Chapters
│   └── Icons.tsx                  # SVG icon component (settings, close, bookmark, share)
│
├── screens/
│   ├── HomeScreen.tsx             # Main screen — holds all state and navigation logic
│   ├── ChapterScreen.tsx          # Full psalm view (FlatList of all verses)
│   ├── ChapterVerseScreen.tsx     # Single random verse view
│   ├── ChapterSelectScreen.tsx    # 5-column grid modal to pick psalm 1–150
│   └── SettingsScreen.tsx         # Font size and theme preference modal
│
└── android/
    ├── app/build.gradle           # applicationId, versionCode, signingConfigs
    └── gradle.properties          # newArchEnabled=true, hermesEnabled=true
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
| `minSdkVersion` | 21 (Android 5.0) |
| `targetSdkVersion` | 34 |
| `versionCode` | 1 |
| `versionName` | `1.0` |
| `newArchEnabled` | `true` |
| `hermesEnabled` | `true` |
| `edgeToEdgeEnabled` | `false` |
| Signing (debug) | `debug.keystore` (standard) |
| Signing (release) | **Uses debug keystore — must fix before Play Store** |

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

## What's Not Yet Implemented (add later)

- **Bookmarks** — save/remove verses per chapter, persist to AsyncStorage
- **Share verse** — `Share.share()` on single verse screen
- **Push notifications** — daily verse reminder
- **Splash screen** — `react-native-splash-screen`
- **Release keystore** — proper signing for Play Store upload

---

## Known Issues

- Release build still uses `debug.keystore` — must generate a proper upload key before Play Store submission
- `__tests__/App.test.tsx` references the old default RN template screen — update or remove before running `npm test`

---

## Git & Repo

- **Remote:** https://github.com/atj393/psalms-way-app.git
- **Branch:** `main`
- Commit messages follow: `type: short description` (feat, fix, chore, refactor)
