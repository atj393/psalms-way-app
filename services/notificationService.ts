import notifee, {
  AlarmType,
  AndroidImportance,
  AndroidStyle,
  AuthorizationStatus,
  EventType,
  TriggerType,
} from '@notifee/react-native';
import type {TriggerNotification} from '@notifee/react-native';
import {getVerseForDate} from './dailyVerseService';
import {getChapter} from './psalmsService';
import {
  addDays,
  isValidTime,
  occurrenceOn,
  todayKey,
  type DateKey,
} from './dateUtils';
import {
  CHALLENGE_DEFS,
  type ChallengeId,
  type ChallengeProgress,
} from './challengesService';

const CHANNEL_ID = 'daily_verse';
const CHALLENGE_CHANNEL_ID = 'challenge_reminder';

/** Prefix for the per-day daily-verse triggers, e.g. 'daily_verse_2026-09-08'. */
const DAILY_PREFIX = 'daily_verse_';
const CHALLENGE_PREFIX = 'challenge_';

/**
 * How many days of reminders are queued ahead.
 *
 * The old implementation used one RepeatFrequency.DAILY trigger, which Android
 * replays with its original payload — so the "daily verse" was frozen at
 * whatever was picked when the reminder was first enabled. A repeating trigger
 * fundamentally cannot carry changing content, so instead we queue a window of
 * one-shot triggers, each with its own verse.
 *
 * The window is refreshed every time the app opens, so in normal use it never
 * runs dry. Fourteen days is the buffer for a user who does not open the app at
 * all: long enough to cover a holiday, short enough that a translation change
 * does not leave months of stale queued text.
 */
export const DAILY_WINDOW_DAYS = 14;

/**
 * How the trigger is handed to Android.
 *
 * Notifee's default is WorkManager, which Doze can defer by a long way — a
 * reminder the user set for 07:00 arriving at 10:30 reads as broken. The exact
 * alarm types (SET_EXACT*) would fix that but require the SCHEDULE_EXACT_ALARM
 * permission, which Android 13+ restricts and Google Play makes you justify;
 * a devotional reminder does not meet that bar.
 *
 * SET_AND_ALLOW_WHILE_IDLE is the middle ground: it escapes Doze so the
 * reminder still arrives on a phone that sat untouched overnight, while
 * needing no restricted permission. It is inexact by a few minutes, which is
 * immaterial for a daily verse.
 */
const ALARM_TYPE = AlarmType.SET_AND_ALLOW_WHILE_IDLE;

// ─── Permission ───────────────────────────────────────────────────────────────

function isAuthorized(status: AuthorizationStatus): boolean {
  return (
    status === AuthorizationStatus.AUTHORIZED ||
    status === AuthorizationStatus.PROVISIONAL
  );
}

/**
 * Current permission state, without prompting.
 *
 * Used to render the reminder UI honestly: a user who revoked notifications in
 * Android settings should see that, not a toggle that silently does nothing.
 */
export async function hasNotificationPermission(): Promise<boolean> {
  const settings = await notifee.getNotificationSettings();
  return isAuthorized(settings.authorizationStatus);
}

/**
 * Prompts for notification permission.
 *
 * Called only when the user actually enables a reminder — never on startup.
 * Asking cold on first launch is the reliable way to get a permanent denial
 * from someone who has not yet seen why the app wants it.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  return isAuthorized(settings.authorizationStatus);
}

// ─── Channels ─────────────────────────────────────────────────────────────────

export async function createNotificationChannel(): Promise<void> {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Daily Verse',
    description: 'Your daily psalm verse reminder',
    importance: AndroidImportance.DEFAULT,
  });
}

export async function createChallengeChannel(): Promise<void> {
  await notifee.createChannel({
    id: CHALLENGE_CHANNEL_ID,
    name: 'Challenge Reminders',
    description: 'Reminders for reading challenges you have joined',
    importance: AndroidImportance.DEFAULT,
  });
}

// ─── Daily verse ──────────────────────────────────────────────────────────────

export function dailyNotificationId(key: DateKey): string {
  return `${DAILY_PREFIX}${key}`;
}

/** The local days the rolling window should currently cover. */
export function plannedDailyKeys(
  now: Date = new Date(),
  windowDays: number = DAILY_WINDOW_DAYS,
): DateKey[] {
  const start = todayKey(now);
  const keys: DateKey[] = [];
  for (let i = 0; i < windowDays; i++) {
    const key = addDays(start, i);
    if (key) keys.push(key);
  }
  return keys;
}

/**
 * Brings the queued daily-verse notifications in line with the current
 * settings. Safe to call on every app open, on settings change, and after a
 * restore.
 *
 * Idempotent by construction: ids are derived from the date and content is a
 * pure function of (date, translation), so re-running never double-schedules a
 * day. Days whose time has already passed today are skipped rather than fired
 * immediately.
 */
export async function syncDailyNotifications(
  hour: number,
  minute: number,
  version: string = 'modern',
  now: Date = new Date(),
): Promise<{scheduled: DateKey[]; skipped: DateKey[]}> {
  if (!isValidTime(hour, minute)) {
    throw new Error(`Invalid reminder time ${hour}:${minute}`);
  }

  await createNotificationChannel();

  const wanted = plannedDailyKeys(now);
  const wantedIds = new Set(wanted.map(dailyNotificationId));

  // Drop any daily trigger outside the current window — stale days left over
  // from an earlier time setting, or from a window that has since moved on.
  const existing = await notifee.getTriggerNotificationIds();
  const stale = existing.filter(id => id.startsWith(DAILY_PREFIX) && !wantedIds.has(id));
  if (stale.length > 0) {
    await notifee.cancelTriggerNotifications(stale);
  }

  const scheduled: DateKey[] = [];
  const skipped: DateKey[] = [];

  for (const key of wanted) {
    const fireAt = occurrenceOn(key, hour, minute);
    if (!fireAt || fireAt.getTime() <= now.getTime()) {
      // Today's slot has already passed; the window starts tomorrow.
      skipped.push(key);
      continue;
    }

    const daily = getVerseForDate(key, version);
    if (!daily) {
      // No readable text in this translation — surface rather than schedule a
      // blank notification.
      skipped.push(key);
      continue;
    }

    await notifee.createTriggerNotification(
      {
        id: dailyNotificationId(key),
        title: `Psalm ${daily.chapter}:${daily.verseNumber}`,
        body: daily.verse,
        android: {
          channelId: CHANNEL_ID,
          // launchActivity is REQUIRED for getInitialNotification() to resolve
          // on cold start — Notifee uses it to tag the Android Intent.
          pressAction: {id: 'default', launchActivity: 'default'},
          smallIcon: 'ic_launcher',
          style: {type: AndroidStyle.BIGTEXT, text: daily.verse},
        },
        data: {
          // Notification data values must be strings.
          type: 'daily',
          chapter: String(daily.chapter),
          verse: String(daily.verseNumber),
          date: key,
        },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: fireAt.getTime(),
        // Deliberately no repeatFrequency: each day is its own one-shot so it
        // can carry that day's verse.
        alarmManager: {type: ALARM_TYPE},
      },
    );

    scheduled.push(key);
  }

  return {scheduled, skipped};
}

/** Cancels every queued daily-verse notification. */
export async function cancelDailyNotifications(): Promise<void> {
  const existing = await notifee.getTriggerNotificationIds();
  const ours = existing.filter(id => id.startsWith(DAILY_PREFIX));
  if (ours.length > 0) {
    await notifee.cancelTriggerNotifications(ours);
  }
}

export async function getScheduledNotifications(): Promise<TriggerNotification[]> {
  return notifee.getTriggerNotifications();
}

/** The next queued daily reminder, for display in Settings. */
export async function getNextDailyReminder(
  now: Date = new Date(),
): Promise<Date | null> {
  const all = await notifee.getTriggerNotifications();
  const times = all
    .filter(n => (n.notification.id ?? '').startsWith(DAILY_PREFIX))
    .map(n => (n.trigger as {timestamp?: number}).timestamp ?? 0)
    .filter(ts => ts > now.getTime())
    .sort((a, b) => a - b);
  return times.length > 0 ? new Date(times[0]) : null;
}

// ─── Challenge reminders ──────────────────────────────────────────────────────

export function challengeNotificationId(challengeId: string, key: DateKey): string {
  return `${CHALLENGE_PREFIX}${challengeId}_${key}`;
}

/**
 * Queues reminders for the remaining days of a challenge.
 *
 * The old implementation scheduled a single repeating trigger holding one fixed
 * verse, so every day of a 40-day challenge nagged with identical text even
 * though `progress.dayAssignments` already stores a distinct chapter/verse per
 * day. The challenge data model is explicitly a progression, so the reminders
 * now follow it: day N's reminder carries day N's assigned verse.
 */
export async function syncChallengeNotifications(
  challengeId: ChallengeId,
  challengeName: string,
  progress: ChallengeProgress,
  version: string = 'modern',
  now: Date = new Date(),
): Promise<{scheduled: DateKey[]}> {
  await createChallengeChannel();

  const prefix = `${CHALLENGE_PREFIX}${challengeId}_`;
  const existing = await notifee.getTriggerNotificationIds();
  const mine = existing.filter(id => id.startsWith(prefix));
  if (mine.length > 0) {
    await notifee.cancelTriggerNotifications(mine);
  }

  if (progress.completed) {
    return {scheduled: []};
  }
  if (!isValidTime(progress.notifHour, progress.notifMinute)) {
    throw new Error('Challenge reminder time is invalid');
  }

  const def = CHALLENGE_DEFS.find(d => d.id === challengeId);
  if (!def) {
    throw new Error(`Unknown challenge: ${challengeId}`);
  }

  // Remaining days, in order, starting from the next uncompleted one.
  const remaining: number[] = [];
  for (let i = 0; i < progress.dayAssignments.length; i++) {
    if (!progress.completedDays.includes(i)) remaining.push(i);
  }

  const scheduled: DateKey[] = [];
  const start = todayKey(now);

  // Queue at most DAILY_WINDOW_DAYS ahead, same reasoning as the daily verse.
  const count = Math.min(remaining.length, DAILY_WINDOW_DAYS);
  for (let offset = 0; offset < count; offset++) {
    const key = addDays(start, offset);
    if (!key) continue;
    const fireAt = occurrenceOn(key, progress.notifHour, progress.notifMinute);
    if (!fireAt || fireAt.getTime() <= now.getTime()) continue;

    const dayIndex = remaining[offset];
    const assignment = progress.dayAssignments[dayIndex];
    if (!assignment) continue;

    const verses = getChapter(assignment.chapter, version);
    const text = verses[assignment.verseNumber - 1];
    if (typeof text !== 'string' || text.trim().length === 0) continue;

    await notifee.createTriggerNotification(
      {
        id: challengeNotificationId(challengeId, key),
        title: `${challengeName} — Day ${dayIndex + 1}`,
        body: text,
        android: {
          channelId: CHALLENGE_CHANNEL_ID,
          pressAction: {id: 'default', launchActivity: 'default'},
          smallIcon: 'ic_launcher',
          style: {type: AndroidStyle.BIGTEXT, text},
        },
        data: {
          type: 'challenge',
          challengeId,
          dayIndex: String(dayIndex),
          chapter: String(assignment.chapter),
          verse: String(assignment.verseNumber),
          date: key,
        },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: fireAt.getTime(),
      },
    );

    scheduled.push(key);
  }

  return {scheduled};
}

/** Cancels every queued reminder for one challenge. */
export async function cancelChallengeNotifications(challengeId: string): Promise<void> {
  const prefix = `${CHALLENGE_PREFIX}${challengeId}_`;
  const existing = await notifee.getTriggerNotificationIds();
  const mine = existing.filter(id => id.startsWith(prefix));
  if (mine.length > 0) {
    await notifee.cancelTriggerNotifications(mine);
  }
}

export {EventType, AuthorizationStatus};
export default notifee;
