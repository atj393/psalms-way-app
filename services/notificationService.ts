import notifee, {
  AndroidImportance,
  AndroidStyle,
  EventType,
  RepeatFrequency,
  TriggerType,
} from '@notifee/react-native';
import type {TriggerNotification} from '@notifee/react-native';
import {getRandomVerse} from './psalmsService';
import type {BibleVersion} from '../context/AppSettingsContext';

const CHANNEL_ID = 'daily_verse';
const DAILY_NOTIF_ID = 'daily_verse_notif';

export async function createNotificationChannel(): Promise<void> {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Daily Verse',
    importance: AndroidImportance.DEFAULT,
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= 1;
}

export async function scheduleDailyNotification(
  hour: number,
  minute: number,
  version: BibleVersion = 'modern',
): Promise<void> {
  await createNotificationChannel();

  // Pick a random chapter and verse for the notification
  const chapter = Math.floor(Math.random() * 150) + 1;
  const result = getRandomVerse(chapter, version);
  if (!result) {
    console.warn('[NotifService] getRandomVerse returned null for chapter', chapter);
    return;
  }

  const {verse, verseNumber} = result;
  console.log(
    `[NotifService] Scheduling daily notif — Psalm ${chapter}:${verseNumber}`,
    `"${verse.slice(0, 60)}…"`,
  );

  // Calculate next trigger time
  const now = new Date();
  const trigger = new Date();
  trigger.setHours(hour, minute, 0, 0);
  if (trigger.getTime() <= now.getTime()) {
    trigger.setDate(trigger.getDate() + 1);
  }

  await cancelDailyNotification();

  await notifee.createTriggerNotification(
    {
      id: DAILY_NOTIF_ID,
      title: `Psalm ${chapter}:${verseNumber}`,
      // Show full verse text in compact mode; Android truncates automatically.
      body: verse,
      android: {
        channelId: CHANNEL_ID,
        // launchActivity: 'default' is REQUIRED for getInitialNotification()
        // to work on cold-start (Notifee needs to tag the Android Intent).
        pressAction: {id: 'default', launchActivity: 'default'},
        smallIcon: 'ic_launcher',
        // BigText style lets the notification expand to show the full verse.
        style: {type: AndroidStyle.BIGTEXT, text: verse},
      },
      data: {
        // Store as strings — notification data values must be strings.
        chapter: String(chapter),
        verse: String(verseNumber),
      },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: trigger.getTime(),
      repeatFrequency: RepeatFrequency.DAILY,
    },
  );

  console.log(
    `[NotifService] Scheduled for ${trigger.toLocaleTimeString()} — data: chapter=${chapter} verse=${verseNumber}`,
  );
}

export async function cancelDailyNotification(): Promise<void> {
  // Only cancel the daily verse notification — do NOT touch challenge notifications.
  await notifee.cancelTriggerNotification(DAILY_NOTIF_ID);
}

export async function getScheduledNotifications(): Promise<TriggerNotification[]> {
  return notifee.getTriggerNotifications();
}

// ─── Challenge Notifications ──────────────────────────────────────────────────

const CHALLENGE_CHANNEL_ID = 'challenge_reminder';
const CHALLENGE_NOTIF_PREFIX = 'challenge_';

export async function createChallengeChannel(): Promise<void> {
  await notifee.createChannel({
    id: CHALLENGE_CHANNEL_ID,
    name: 'Challenge Reminders',
    importance: AndroidImportance.DEFAULT,
  });
}

export async function scheduleChallengeNotification(
  challengeId: string,
  challengeName: string,
  hour: number,
  minute: number,
  verseText: string,
): Promise<void> {
  await createChallengeChannel();

  const now = new Date();
  const trigger = new Date();
  trigger.setHours(hour, minute, 0, 0);
  if (trigger.getTime() <= now.getTime()) {
    trigger.setDate(trigger.getDate() + 1);
  }

  await cancelChallengeNotification(challengeId);

  await notifee.createTriggerNotification(
    {
      id: `${CHALLENGE_NOTIF_PREFIX}${challengeId}`,
      title: challengeName,
      body: verseText,
      android: {
        channelId: CHALLENGE_CHANNEL_ID,
        // launchActivity required for getInitialNotification() on cold-start.
        pressAction: {id: 'default', launchActivity: 'default'},
        smallIcon: 'ic_launcher',
        style: {type: AndroidStyle.BIGTEXT, text: verseText},
      },
      data: {
        challengeId,
      },
    },
    {
      type: TriggerType.TIMESTAMP,
      timestamp: trigger.getTime(),
      repeatFrequency: RepeatFrequency.DAILY,
    },
  );
}

export async function cancelChallengeNotification(challengeId: string): Promise<void> {
  await notifee.cancelTriggerNotification(`${CHALLENGE_NOTIF_PREFIX}${challengeId}`);
}

// Re-export EventType for use in App.tsx
export {EventType};
export default notifee;
