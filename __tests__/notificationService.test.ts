/**
 * Scheduling behaviour for the daily verse and challenge reminders.
 *
 * The bug these tests exist to prevent: the old implementation registered ONE
 * notification with `RepeatFrequency.DAILY`, and Android replays a repeating
 * trigger with its original payload. The "daily verse" was therefore frozen at
 * whatever was picked when the reminder was switched on.
 *
 * The replacement queues a rolling window of one-shot triggers, so the
 * assertions below are mostly about that window: distinct content per day, no
 * repeatFrequency, idempotent re-syncs, and correct cleanup.
 */

jest.mock('../services/psalmsService', () => ({
  getChapter: jest.fn(),
}));

import notifee, {AlarmType, AuthorizationStatus} from '@notifee/react-native';
import {getChapter} from '../services/psalmsService';
import {
  DAILY_WINDOW_DAYS,
  cancelChallengeNotifications,
  cancelDailyNotifications,
  dailyNotificationId,
  getNextDailyReminder,
  hasNotificationPermission,
  plannedDailyKeys,
  requestNotificationPermission,
  syncChallengeNotifications,
  syncDailyNotifications,
} from '../services/notificationService';
import type {ChallengeProgress} from '../services/challengesService';

const mockNotifee = notifee as jest.Mocked<typeof notifee>;

/** Trigger notifications the fake Notifee currently holds. */
let queued: {id: string; timestamp: number; data: Record<string, string>; body: string}[] = [];

beforeEach(() => {
  jest.clearAllMocks();
  queued = [];

  // Re-established every test: clearAllMocks() resets recorded calls but keeps
  // implementations, so a test that stubs an empty translation would otherwise
  // leak that into every test after it.
  (getChapter as jest.Mock).mockImplementation((chapter: number) =>
    Array.from({length: 10}, (_, i) => `Psalm ${chapter} verse ${i + 1}`),
  );

  (mockNotifee.createChannel as jest.Mock).mockResolvedValue('channel');
  (mockNotifee.getTriggerNotificationIds as jest.Mock).mockImplementation(async () =>
    queued.map(q => q.id),
  );
  (mockNotifee.createTriggerNotification as jest.Mock).mockImplementation(
    async (notification: any, trigger: any) => {
      queued = queued.filter(q => q.id !== notification.id);
      queued.push({
        id: notification.id,
        timestamp: trigger.timestamp,
        data: notification.data,
        body: notification.body,
      });
      return notification.id;
    },
  );
  (mockNotifee.cancelTriggerNotifications as jest.Mock).mockImplementation(
    async (ids: string[]) => {
      queued = queued.filter(q => !ids.includes(q.id));
    },
  );
  (mockNotifee.getTriggerNotifications as jest.Mock).mockImplementation(async () =>
    queued.map(q => ({
      notification: {id: q.id, body: q.body, data: q.data},
      trigger: {type: 0, timestamp: q.timestamp},
    })),
  );
});

// ─── Permission ───────────────────────────────────────────────────────────────

describe('permission', () => {
  it('reports granted for AUTHORIZED', async () => {
    (mockNotifee.getNotificationSettings as jest.Mock).mockResolvedValue({
      authorizationStatus: AuthorizationStatus.AUTHORIZED,
    });
    await expect(hasNotificationPermission()).resolves.toBe(true);
  });

  it('reports denied for DENIED', async () => {
    (mockNotifee.getNotificationSettings as jest.Mock).mockResolvedValue({
      authorizationStatus: AuthorizationStatus.DENIED,
    });
    await expect(hasNotificationPermission()).resolves.toBe(false);
  });

  it('treats NOT_DETERMINED as not granted', async () => {
    (mockNotifee.getNotificationSettings as jest.Mock).mockResolvedValue({
      authorizationStatus: AuthorizationStatus.NOT_DETERMINED,
    });
    await expect(hasNotificationPermission()).resolves.toBe(false);
  });

  it('returns true when the user accepts the prompt', async () => {
    (mockNotifee.requestPermission as jest.Mock).mockResolvedValue({
      authorizationStatus: AuthorizationStatus.AUTHORIZED,
    });
    await expect(requestNotificationPermission()).resolves.toBe(true);
  });

  it('returns false when the user declines the prompt', async () => {
    (mockNotifee.requestPermission as jest.Mock).mockResolvedValue({
      authorizationStatus: AuthorizationStatus.DENIED,
    });
    await expect(requestNotificationPermission()).resolves.toBe(false);
  });
});

// ─── Window planning ──────────────────────────────────────────────────────────

describe('plannedDailyKeys', () => {
  it('starts today and covers the whole window', () => {
    const keys = plannedDailyKeys(new Date(2026, 5, 10, 6, 0));
    expect(keys).toHaveLength(DAILY_WINDOW_DAYS);
    expect(keys[0]).toBe('2026-06-10');
    expect(keys[1]).toBe('2026-06-11');
  });

  it('crosses a month boundary', () => {
    const keys = plannedDailyKeys(new Date(2026, 0, 30, 6, 0), 4);
    expect(keys).toEqual(['2026-01-30', '2026-01-31', '2026-02-01', '2026-02-02']);
  });
});

// ─── Daily scheduling ─────────────────────────────────────────────────────────

describe('syncDailyNotifications', () => {
  it('rejects an invalid reminder time', async () => {
    await expect(syncDailyNotifications(25, 0, 'kjv')).rejects.toThrow(/Invalid reminder time/);
    await expect(syncDailyNotifications(8, 99, 'kjv')).rejects.toThrow(/Invalid reminder time/);
    expect(mockNotifee.createTriggerNotification).not.toHaveBeenCalled();
  });

  it('schedules today when the reminder time is still ahead', async () => {
    const now = new Date(2026, 5, 10, 6, 0);
    const {scheduled, skipped} = await syncDailyNotifications(9, 0, 'kjv', now);
    expect(scheduled[0]).toBe('2026-06-10');
    expect(skipped).toHaveLength(0);
    expect(scheduled).toHaveLength(DAILY_WINDOW_DAYS);
  });

  it('skips today when the reminder time has already passed', async () => {
    const now = new Date(2026, 5, 10, 21, 0);
    const {scheduled, skipped} = await syncDailyNotifications(9, 0, 'kjv', now);
    expect(skipped).toEqual(['2026-06-10']);
    expect(scheduled[0]).toBe('2026-06-11');
    expect(queued.find(q => q.id === dailyNotificationId('2026-06-10'))).toBeUndefined();
  });

  /** The core regression test for the original defect. */
  it('gives each queued day its own distinct verse', async () => {
    await syncDailyNotifications(9, 0, 'kjv', new Date(2026, 5, 10, 6, 0));
    const bodies = queued.map(q => q.body);
    expect(bodies).toHaveLength(DAILY_WINDOW_DAYS);
    // If the repeating-payload bug came back, every body would be identical.
    expect(new Set(bodies).size).toBeGreaterThan(1);
  });

  it('never uses a repeating trigger', async () => {
    await syncDailyNotifications(9, 0, 'kjv', new Date(2026, 5, 10, 6, 0));
    for (const call of (mockNotifee.createTriggerNotification as jest.Mock).mock.calls) {
      expect(call[1].repeatFrequency).toBeUndefined();
    }
  });

  it('uses a Doze-tolerant alarm that needs no restricted permission', async () => {
    // SET_AND_ALLOW_WHILE_IDLE (1) survives Doze; the SET_EXACT variants (2, 3)
    // would drag in SCHEDULE_EXACT_ALARM, which Play makes you justify.
    await syncDailyNotifications(9, 0, 'kjv', new Date(2026, 5, 10, 6, 0));
    for (const call of (mockNotifee.createTriggerNotification as jest.Mock).mock.calls) {
      expect(call[1].alarmManager).toEqual({type: AlarmType.SET_AND_ALLOW_WHILE_IDLE});
    }
  });

  it('fires each notification at the requested local wall-clock time', async () => {
    await syncDailyNotifications(7, 45, 'kjv', new Date(2026, 5, 10, 6, 0));
    for (const q of queued) {
      const d = new Date(q.timestamp);
      expect(d.getHours()).toBe(7);
      expect(d.getMinutes()).toBe(45);
    }
  });

  it('carries chapter and verse so a tap can route to the right psalm', async () => {
    await syncDailyNotifications(9, 0, 'kjv', new Date(2026, 5, 10, 6, 0));
    for (const q of queued) {
      expect(q.data.type).toBe('daily');
      const chapter = Number(q.data.chapter);
      const verse = Number(q.data.verse);
      expect(chapter).toBeGreaterThanOrEqual(1);
      expect(chapter).toBeLessThanOrEqual(150);
      expect(verse).toBeGreaterThanOrEqual(1);
    }
  });

  it('is idempotent — re-syncing does not duplicate a day', async () => {
    const now = new Date(2026, 5, 10, 6, 0);
    await syncDailyNotifications(9, 0, 'kjv', now);
    const first = queued.map(q => ({id: q.id, body: q.body, timestamp: q.timestamp}));

    await syncDailyNotifications(9, 0, 'kjv', now);
    const second = queued.map(q => ({id: q.id, body: q.body, timestamp: q.timestamp}));

    expect(second).toHaveLength(first.length);
    expect(new Set(second.map(q => q.id)).size).toBe(second.length);
    expect(second).toEqual(first);
  });

  it('drops triggers outside the window when the day advances', async () => {
    await syncDailyNotifications(9, 0, 'kjv', new Date(2026, 5, 10, 6, 0));
    expect(queued.some(q => q.id === dailyNotificationId('2026-06-10'))).toBe(true);

    // Three days later the old days are no longer in the window.
    await syncDailyNotifications(9, 0, 'kjv', new Date(2026, 5, 13, 6, 0));
    expect(queued.some(q => q.id === dailyNotificationId('2026-06-10'))).toBe(false);
    expect(queued.some(q => q.id === dailyNotificationId('2026-06-13'))).toBe(true);
    expect(queued).toHaveLength(DAILY_WINDOW_DAYS);
  });

  it('rebuilds the queue at the new time when the user changes it', async () => {
    const now = new Date(2026, 5, 10, 6, 0);
    await syncDailyNotifications(9, 0, 'kjv', now);
    await syncDailyNotifications(18, 30, 'kjv', now);

    expect(queued).toHaveLength(DAILY_WINDOW_DAYS);
    for (const q of queued) {
      const d = new Date(q.timestamp);
      expect(d.getHours()).toBe(18);
      expect(d.getMinutes()).toBe(30);
    }
  });

  it('changes content when the translation changes', async () => {
    const now = new Date(2026, 5, 10, 6, 0);
    await syncDailyNotifications(9, 0, 'kjv', now);
    const kjvFirst = queued.find(q => q.id === dailyNotificationId('2026-06-10'))!.data;

    await syncDailyNotifications(9, 0, 'web', now);
    const webFirst = queued.find(q => q.id === dailyNotificationId('2026-06-10'))!.data;

    expect(`${webFirst.chapter}:${webFirst.verse}`).not.toBe(
      `${kjvFirst.chapter}:${kjvFirst.verse}`,
    );
  });

  it('leaves challenge notifications alone', async () => {
    queued.push({
      id: 'challenge_fasting_2026-06-10',
      timestamp: Date.now() + 10000,
      data: {challengeId: 'fasting'},
      body: 'challenge',
    });
    await syncDailyNotifications(9, 0, 'kjv', new Date(2026, 5, 10, 6, 0));
    expect(queued.some(q => q.id === 'challenge_fasting_2026-06-10')).toBe(true);
  });

  it('skips days with no readable text rather than sending a blank notification', async () => {
    (getChapter as jest.Mock).mockImplementation(() => []);
    const {scheduled, skipped} = await syncDailyNotifications(
      9,
      0,
      'empty',
      new Date(2026, 5, 10, 6, 0),
    );
    expect(scheduled).toHaveLength(0);
    expect(skipped).toHaveLength(DAILY_WINDOW_DAYS);
    expect(mockNotifee.createTriggerNotification).not.toHaveBeenCalled();
  });
});

describe('cancelDailyNotifications', () => {
  it('removes every daily trigger and nothing else', async () => {
    await syncDailyNotifications(9, 0, 'kjv', new Date(2026, 5, 10, 6, 0));
    queued.push({
      id: 'challenge_fasting_2026-06-10',
      timestamp: Date.now() + 1000,
      data: {},
      body: 'x',
    });

    await cancelDailyNotifications();

    expect(queued.filter(q => q.id.startsWith('daily_verse_'))).toHaveLength(0);
    expect(queued.some(q => q.id === 'challenge_fasting_2026-06-10')).toBe(true);
  });

  it('is safe when nothing is scheduled', async () => {
    await expect(cancelDailyNotifications()).resolves.toBeUndefined();
    expect(mockNotifee.cancelTriggerNotifications).not.toHaveBeenCalled();
  });
});

describe('getNextDailyReminder', () => {
  it('returns the soonest future daily trigger', async () => {
    const now = new Date(2026, 5, 10, 6, 0);
    await syncDailyNotifications(9, 0, 'kjv', now);
    const next = await getNextDailyReminder(now);
    expect(next).not.toBeNull();
    expect(next!.getHours()).toBe(9);
    expect(next!.getDate()).toBe(10);
  });

  it('returns null when nothing is queued', async () => {
    await expect(getNextDailyReminder(new Date())).resolves.toBeNull();
  });
});

// ─── Challenge reminders ──────────────────────────────────────────────────────

function progressFor(overrides: Partial<ChallengeProgress> = {}): ChallengeProgress {
  return {
    startDate: '2026-06-10',
    notifHour: 8,
    notifMinute: 0,
    dayAssignments: [
      {chapter: 57, verseNumber: 1},
      {chapter: 142, verseNumber: 2},
      {chapter: 54, verseNumber: 3},
      {chapter: 52, verseNumber: 4},
      {chapter: 34, verseNumber: 5},
      {chapter: 56, verseNumber: 6},
      {chapter: 63, verseNumber: 7},
    ],
    completedDays: [],
    completed: false,
    ...overrides,
  };
}

describe('syncChallengeNotifications', () => {
  it('advances content with the challenge instead of repeating day one', async () => {
    const now = new Date(2026, 5, 10, 6, 0);
    await syncChallengeNotifications('david_hiding', 'David in Hiding', progressFor(), 'kjv', now);

    const bodies = queued.map(q => q.body);
    expect(bodies.length).toBeGreaterThan(1);
    // The old behaviour sent the identical verse every day of the challenge.
    expect(new Set(bodies).size).toBe(bodies.length);
  });

  it('starts from the next uncompleted day', async () => {
    const now = new Date(2026, 5, 10, 6, 0);
    await syncChallengeNotifications(
      'david_hiding',
      'David in Hiding',
      progressFor({completedDays: [0, 1]}),
      'kjv',
      now,
    );
    const first = queued.sort((a, b) => a.timestamp - b.timestamp)[0];
    expect(first.data.dayIndex).toBe('2');
    expect(first.data.chapter).toBe('54');
  });

  it('schedules nothing for a completed challenge', async () => {
    const now = new Date(2026, 5, 10, 6, 0);
    const {scheduled} = await syncChallengeNotifications(
      'david_hiding',
      'David in Hiding',
      progressFor({completed: true}),
      'kjv',
      now,
    );
    expect(scheduled).toHaveLength(0);
    expect(queued).toHaveLength(0);
  });

  it('carries the challenge id so a tap opens the right challenge', async () => {
    const now = new Date(2026, 5, 10, 6, 0);
    await syncChallengeNotifications('david_hiding', 'David in Hiding', progressFor(), 'kjv', now);
    for (const q of queued) {
      expect(q.data.type).toBe('challenge');
      expect(q.data.challengeId).toBe('david_hiding');
    }
  });

  it('rejects an unknown challenge id', async () => {
    await expect(
      syncChallengeNotifications('nope' as any, 'Nope', progressFor(), 'kjv'),
    ).rejects.toThrow(/Unknown challenge/);
  });

  it('rejects an invalid reminder time', async () => {
    await expect(
      syncChallengeNotifications(
        'david_hiding',
        'David in Hiding',
        progressFor({notifHour: 30}),
        'kjv',
      ),
    ).rejects.toThrow(/invalid/i);
  });

  it('replaces its own previous queue without duplicating', async () => {
    const now = new Date(2026, 5, 10, 6, 0);
    await syncChallengeNotifications('david_hiding', 'David in Hiding', progressFor(), 'kjv', now);
    const firstCount = queued.length;
    await syncChallengeNotifications('david_hiding', 'David in Hiding', progressFor(), 'kjv', now);
    expect(queued).toHaveLength(firstCount);
    expect(new Set(queued.map(q => q.id)).size).toBe(queued.length);
  });

  it('does not disturb another challenge', async () => {
    const now = new Date(2026, 5, 10, 6, 0);
    queued.push({
      id: 'challenge_fasting_2026-06-10',
      timestamp: now.getTime() + 100000,
      data: {},
      body: 'other',
    });
    await syncChallengeNotifications('david_hiding', 'David in Hiding', progressFor(), 'kjv', now);
    expect(queued.some(q => q.id === 'challenge_fasting_2026-06-10')).toBe(true);
  });
});

describe('cancelChallengeNotifications', () => {
  it('removes only the named challenge', async () => {
    const now = new Date(2026, 5, 10, 6, 0);
    await syncChallengeNotifications('david_hiding', 'David in Hiding', progressFor(), 'kjv', now);
    queued.push({
      id: 'challenge_fasting_2026-06-10',
      timestamp: now.getTime() + 100000,
      data: {},
      body: 'other',
    });

    await cancelChallengeNotifications('david_hiding');

    expect(queued.some(q => q.id.startsWith('challenge_david_hiding_'))).toBe(false);
    expect(queued.some(q => q.id === 'challenge_fasting_2026-06-10')).toBe(true);
  });
});
