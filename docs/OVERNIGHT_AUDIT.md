# Psalms Way — audit and execution backlog

Base commit `9529a85` on `main`. Branch `codex/overnight-product-hardening`.

Severity: **P0** crash, corruption, security/privacy · **P1** major broken
feature · **P2** important quality · **P3** polish.

Status is what actually happened, not what was planned. Items marked **Not
fixed** say why.

---

## Summary

| Severity | Found | Fixed | Remaining |
|---|---|---|---|
| P0 | 1 | 0 | 1 (needs your action — key rotation) |
| P1 | 7 | 7 | 0 |
| P2 | 9 | 7 | 2 (need a translator / source data) |
| P3 | 3 | 2 | 1 (deliberately deferred) |

Baseline → final: **1 test → 416 tests**, **6 lint errors → 0**, TypeScript
clean throughout, Android debug build passing.

---

## P0

### A-01 · Upload keystore passwords are in git history — **NOT FIXED, needs you**

**Feature** Release signing
**Evidence** Commit `916faad` ("remove committed release signing passwords from
gradle.properties") removed `MYAPP_UPLOAD_STORE_PASSWORD` and
`MYAPP_UPLOAD_KEY_PASSWORD` from the working tree. Its own message notes the
values were present on `main`, `ios` and 13 other commits. `git show` still
prints both, and the branches are pushed to GitHub.

**Cause** The file was tracked from the initial commit. Removing a secret in a
later commit does not remove it from history.

**Why it is not fixed here** Both remedies are irreversible and are yours to
make: rotating the upload key, or rewriting published history. The task brief
explicitly forbids touching production signing credentials.

**Next action** Treat both passwords as compromised.
1. If the repo is or was public, assume disclosure.
2. Generate a new upload key; if you use Play App Signing, request an upload key
   reset in Play Console.
3. Optionally purge history with `git filter-repo` — but only after rotating.
   Rotation is what actually protects you; purging only reduces exposure.

---

## P1

### B-01 · The daily verse was the same verse every day — **Fixed**

**Feature** Daily reminder · `services/notificationService.ts`

**Evidence** `scheduleDailyNotification` chose one random chapter and verse at
scheduling time, embedded it as the title/body, and registered the trigger with
`RepeatFrequency.DAILY`. Android replays a repeating trigger with its original
payload.

**Cause** A repeating trigger cannot carry changing content. The verse was
frozen at the moment the user enabled reminders, and only changed if something
happened to reschedule.

**Fix** Replaced with a rolling 14-day window of one-shot triggers, one per day,
each carrying its own verse. Refreshed on every app open and whenever reminder
settings change. Content comes from `dailyVerseService`, a pure function of
(date, translation) via FNV-1a rather than `Math.random`, which makes
re-scheduling idempotent — a refresh recomputes identical content for days
already queued and cannot produce a second, contradictory notification.

**Test** `notificationService.test.ts` — "gives each queued day its own distinct
verse", "never uses a repeating trigger", "is idempotent".

### B-02 · Challenge reminders repeated day one for the whole challenge — **Fixed**

**Feature** Challenges · `services/notificationService.ts`

**Evidence** `scheduleChallengeNotification` took a single `verseText` and used
`RepeatFrequency.DAILY`, while `ChallengeProgress.dayAssignments` already stored
a distinct chapter and verse for every day.

**Cause** Same repeating-payload defect. The data model is explicitly a
progression; the reminder ignored it.

**Fix** `syncChallengeNotifications` queues the remaining days in order, each
with its assigned verse, and is rebuilt when a day is marked read or the
challenge is reset.

**Test** "advances content with the challenge instead of repeating day one",
"starts from the next uncompleted day".

### B-03 · Concurrent writes silently discarded personal data — **Fixed**

**Feature** Bookmarks, favourites, highlights, notes, history

**Evidence** Every service was `load()` → mutate → `save()`: a read-modify-write
with an `await` in the middle and nothing serialising it. `toggleBookmark` was
worst — it called `isBookmarked` and then `addBookmark`/`removeBookmark`, each
re-reading storage, three reads across two awaits.

**Cause** Two overlapping calls both read the same starting array; the second
write discarded the first. A double-tapped bookmark button or a note autosave
racing a manual save loses data with no error.

**Fix** `services/storage.ts` adds a per-key promise chain (`withKeyLock`). Each
toggle now reads, decides and writes under one lock.

**Test** `persistence.test.ts` — "survives concurrent adds without losing any",
"resolves a double tap to a single consistent state", "never silently loses a
note when saves overlap".

### B-04 · Stored data was parsed with an unchecked type assertion — **Fixed**

**Feature** All persistence

**Evidence** `JSON.parse(raw) as Bookmark[]` in six services.

**Cause** The assertion tells the compiler a shape nothing verifies. A value
from an older schema, a truncated write, or a hand-edited store reached the UI
as `NaN` chapter numbers and invisible highlights.

**Fix** `readJson` validates through a caller-supplied narrowing function.
Malformed rows are dropped individually so one bad bookmark does not discard the
other forty-nine.

**Test** "ignores malformed rows but keeps the valid ones", "falls back to empty
on unparseable JSON", plus per-service shape tests.

### B-05 · Failed writes were silent — **Fixed**

**Feature** All persistence

**Evidence** `load()` had a `try/catch`; `save()` had none, and most callers did
not await or catch it.

**Cause** A rejected `setItem` became an unhandled rejection. The user was never
told their note had not persisted.

**Fix** Writes reject on failure. Settings surfaces scheduling failures rather
than flipping the toggle on regardless.

### B-06 · Day boundaries used UTC, not the reader's midnight — **Fixed**

**Feature** Streak, challenges, stats

**Evidence** `new Date().toISOString().split('T')[0]` in `streakService`,
`challengesService` and `StatsScreen`.

**Cause** That yields the **UTC** day. The streak advanced and the once-per-day
challenge gate opened at midnight UTC — mid-afternoon for a reader in UTC+13,
and still "yesterday" until late morning in UTC-8.

**Fix** `services/dateUtils.ts` provides local-calendar-day helpers with an
injectable clock. `daysBetween` normalises both ends to midnight so a 23- or
25-hour DST day still counts as exactly one.

**Test** `engagement.test.ts` — "uses the local calendar day for the boundary",
"counts a DST spring-forward day as one day", and the fall-back equivalent.

### B-07 · Stats chart mixed local labels with UTC buckets — **Fixed**

**Feature** Stats · `screens/StatsScreen.tsx`

**Evidence** Labels came from `d.getDay()` (local) while the read-set was keyed
by `h.date.split('T')[0]` (UTC).

**Cause** An evening reading session was filed under tomorrow for anyone west of
UTC, so the seven-day chart disagreed with the streak the user saw.

**Fix** Buckets by local day via `toDateKey`.

Also on this line: the `useMemo` omitted `t` from its dependencies, so day-name
labels kept the previous language after a language change. Both fixed together.

---

## P2

### C-01 · 83 translations had unusable interpolation — **Fixed**

**Feature** Localization

**Evidence** `challengeProgress` rendered as "/ chapters" instead of
"3 / 40 chapters" in 36 languages; `challengeDayNumber` as a bare "Day" in 29.

**Cause** The placeholder **identifier** had been translated along with the
sentence — `{{done}}` arrived as `{{hecho}}` (es), `{{klaar}}` (nl/af),
`{{完了}}` (ja). i18next binds values by name, so none ever resolved. A
machine-translation artifact.

**Fix** Repaired mechanically: the identifier is restored and the translated
words around it are untouched. A placeholder a language legitimately *reorders*
(Japanese `challengeDay`) is left alone, because the check compares sets.

**Test** `i18nIntegrity.test.ts` — "keeps the placeholders English uses", run per
locale.

### C-02 · 17 strings lost the placeholder itself — **NOT FIXED, needs a translator**

**Feature** Localization

**Evidence** `zh/challengeProgress` is `"已完成 / 共 0 章"` — a literal `0` where
the count belongs. `hi/challengeDayNumber` is `"दिन पर दिन}}"`, with mangled
braces. 17 entries across 15 languages.

**Why not fixed** The sentence has nowhere to put the number. Restoring it means
rewriting the sentence, which needs someone who reads the language. Guessing
would put a number in the wrong grammatical position.

**Next action** Send the list in `PLACEHOLDERS_NEEDING_TRANSLATOR`
(`__tests__/i18nIntegrity.test.ts`) to a translator. The test fails if one is
fixed without being removed from the list, so it cannot rot.

### C-03 · Tibetan and Wolof are half-translated — **Documented, not fixed**

**Evidence** `bo.json` and `wo.json` each define 107 of 245 keys.

**Impact** Roughly half the interface renders in English for those users.
i18next's `fallbackLng: 'en'` means it degrades to English rather than showing
raw keys, so it is untidy rather than broken.

**Why not fixed** 110 strings × 2 languages is translation work, not
engineering. Machine-translating them and presenting the result as reviewed is
exactly what the brief said not to do.

**Next action** Commission both languages. Pinned by `INCOMPLETE_LOCALES` so the
parity gate still protects the other 45.

### C-04 · 58% of translations had no language label — **Fixed**

**Feature** Settings → Bible translation picker

**Evidence** 47 of 81 bundled translation files carry `lang` as `""` or `null`
while having a valid `lang_short`.

**Cause** `getAllVersions()` sorts and groups by `lang`, and the picker shows it
as a subtitle guarded by `item.lang ? …`. More than half the list collapsed
under one blank heading with no language shown.

**Fix** `resolveLanguageName()` derives the name from the ISO code. Also
corrects the source data's misspelled "Afrikanns".

**Test** `psalmsData.test.ts` — "gives every translation a usable language
label", "never falls back to the generic label".

### C-05 · Two translations are incomplete; missing psalms rendered blank — **Half fixed**

**Evidence** `lt_heritage` contains 137 of 150 psalms, `ta_oitce` 148.
`ChapterScreen` had no `ListEmptyComponent`, so Psalm 138 in Lithuanian was a
completely blank screen.

**Fix (UI)** `ChapterScreen` now explains the psalm is unavailable in this
translation and points at the picker. A missing translation is now
distinguishable from a failed load.

**Not fixed (data)** The gaps are in the source texts. Scripture cannot be
invented to fill them. Pinned by `INCOMPLETE_TRANSLATIONS` so a regression that
truncates a currently-complete text fails loudly.

### C-06 · `SCHEDULE_EXACT_ALARM` declared but never used — **Partly fixed**

**Feature** Android manifest

**Evidence** Declared in `AndroidManifest.xml`; no `createTriggerNotification`
call passed an `alarmManager` option, and Notifee's default is WorkManager.

**Cause** Android 13+ restricts this permission behind a user grant and Google
Play requires a policy justification. Declaring it unused is a liability at
review time with no behavioural benefit.

**Fix** Removed from the app manifest, and reminders now schedule with
`AlarmType.SET_AND_ALLOW_WHILE_IDLE` — which escapes Doze (so a reminder still
arrives on a phone left untouched overnight) without needing a restricted
permission. Inexact by a few minutes, immaterial for a daily verse.

**Correction — it still ships.** Rebuilding and reading the merged manifest
shows `SCHEDULE_EXACT_ALARM` is still in the APK, now contributed by
`app.notifee:core` rather than by us
(`build/outputs/logs/manifest-merger-debug-report.txt`). The app no longer
*relies* on exact alarms and no longer declares the permission itself, but
**Play will still ask you to justify it.**

Suppressing it entirely needs `tools:node="remove"` in the app manifest. That
was not done here: Notifee may fall back to exact alarms internally, and
verifying that needs on-device testing that could not be run tonight. Breaking
reminder delivery would be worse than filling in a Play form.

**Next action (yours)** Either justify the permission in Play, or add
`tools:node="remove"` and verify on a device that reminders still fire under
Doze.

**Test** "uses a Doze-tolerant alarm that needs no restricted permission".

### C-07 · Permission was requested outside any context — **Fixed**

**Evidence** Reminder permission flow in `SettingsScreen`.

**Fix** Requested only when the user actually enables reminders. If scheduling
then fails, the toggle stays off and says so, rather than claiming reminders are
on when nothing was queued.

### C-08 · Unvalidated challenge day index — **Fixed**

**Evidence** `markDayComplete(id, dayIndex)` pushed any value into
`completedDays`.

**Cause** An out-of-range index would permanently inflate the completed count,
so a challenge could report itself finished with real days still unread.

**Fix** Bounds-checked; `CHALLENGE_DEFS.find(...)!` replaced with a real error.

### C-09 · Duplicate keys in `en.json` — **Fixed**

`themeAuto`, `themeLight` and `themeDark` were each defined twice. `JSON.parse`
silently keeps the last, so editing the first occurrence would appear to do
nothing. Values were identical, so no behaviour changed. Now guarded by a test.

---

## P3

### D-01 · CI did not gate — **Fixed**

Lint ran with `continue-on-error`, there was no typecheck, no Android build, and
Node 20 despite `engines` requiring >= 22.11.0. All four corrected; lint gates
now that the six errors are gone.

### D-02 · Stale project documentation — **Fixed**

`CLAUDE.md` described a 5-screen app with no i18n, notifications, bookmarks,
notes or challenges; the real app has 16 screens and 15 services. It also listed
`minSdk 21 / target 34` (actually 24/36) and "bookmarks — not yet implemented".
README claimed 81 translations; there are 82. Updated.

### D-03 · 113 eslint warnings — **Deliberately not fixed**

All are `react-native/no-inline-styles` (99) and
`react/no-unstable-nested-components` (14). Clearing them is a broad stylistic
refactor across most screens — high churn, no behaviour change, and it would
bury the correctness work in this PR. Lint gates on errors, which are at zero,
so a real regression still fails CI.

---

## Verified as *not* defects

Recorded because they look like bugs and cost time to rule out.

- **Notifications surviving reboot.** The app manifest declares no
  `RECEIVE_BOOT_COMPLETED` and no boot receiver, which reads as broken. The
  *merged* manifest shows Notifee contributing `RebootBroadcastReceiver` and
  `NotificationAlarmReceiver` (both with `BOOT_COMPLETED` filters) and
  WorkManager contributing `RescheduleReceiver`, which also handles `TIME_SET`
  and `TIMEZONE_CHANGED`. Reboot, clock and timezone recovery already work.
- **Orphaned translation file.** `psalms_index.json` sits in `psalms_extracted/`
  unreferenced by the require map. It is a manifest, not a translation.
- **Challenge day counts.** All six `CHALLENGE_DEFS` have `chapters.length ===
  days`. Now locked by a test.
- **`allowBackup="false"`.** Correct for privacy, and part of why an explicit
  backup feature is worth having.
