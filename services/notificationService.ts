import notifee, {
  AndroidImportance,
  EventType,
  RepeatFrequency,
  TriggerType,
} from '@notifee/react-native';
import type {TriggerNotification} from '@notifee/react-native';
import {getRandomVerse} from './psalmsService';
import type {BibleVersion} from '../context/AppSettingsContext';

const CHANNEL_ID = 'daily_verse';

export async function createNotificationChannel(): Promise<void> {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Daily Verse',
    importance: AndroidImportance.DEFAULT,
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  // authorizationStatus >= 1 means granted
  return settings.authorizationStatus >= 1;
}

export async function scheduleDailyNotification(
  hour: number,
  minute: number,
  version: BibleVersion = 'modern',
): Promise<void> {
  await createNotificationChannel();

  // Pick a random verse for the notification
  const chapter = Math.floor(Math.random() * 150) + 1;
  const result = getRandomVerse(chapter, version);
  if (!result) return;

  const {verse, verseNumber} = result;
  const body = verse.length > 120 ? verse.slice(0, 120) + '…' : verse;

  // Calculate the next trigger time
  const now = new Date();
  const trigger = new Date();
  trigger.setHours(hour, minute, 0, 0);
  if (trigger.getTime() <= now.getTime()) {
    // Time has already passed today — schedule for tomorrow
    trigger.setDate(trigger.getDate() + 1);
  }

  // Cancel any previously scheduled daily notifications
  await cancelDailyNotification();

  await notifee.createTriggerNotification(
    {
      title: `Psalm ${chapter}:${verseNumber}`,
      body,
      android: {
        channelId: CHANNEL_ID,
        pressAction: {id: 'default'},
        smallIcon: 'ic_launcher',
      },
      data: {
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
}

export async function cancelDailyNotification(): Promise<void> {
  const ids = await notifee.getTriggerNotificationIds();
  await Promise.all(ids.map(id => notifee.cancelTriggerNotification(id)));
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

  const body = verseText.length > 120 ? verseText.slice(0, 120) + '…' : verseText;

  const now = new Date();
  const trigger = new Date();
  trigger.setHours(hour, minute, 0, 0);
  if (trigger.getTime() <= now.getTime()) {
    trigger.setDate(trigger.getDate() + 1);
  }

  // Cancel any previous notification for this challenge
  await cancelChallengeNotification(challengeId);

  await notifee.createTriggerNotification(
    {
      id: `${CHALLENGE_NOTIF_PREFIX}${challengeId}`,
      title: challengeName,
      body,
      android: {
        channelId: CHALLENGE_CHANNEL_ID,
        pressAction: {id: 'default'},
        smallIcon: 'ic_launcher',
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
