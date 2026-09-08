/**
 * Streak, badge and challenge progression.
 *
 * The day boundary is the thing worth testing here. All three features used
 * `new Date().toISOString().split('T')[0]`, i.e. the UTC day, so the streak
 * advanced and the once-per-day challenge gate opened at midnight UTC rather
 * than at the reader's own midnight. The clock is injected throughout so these
 * cases can be pinned regardless of the runner's timezone.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  checkAndUpdateStreak,
  getLongestStreak,
  getStreak,
} from '../services/streakService';
import {BADGE_DEFS, checkAndAwardBadges, getEarnedBadges} from '../services/badgesService';
import {
  CHALLENGE_DEFS,
  canReadToday,
  getNextDayIndex,
  markDayComplete,
  startChallenge,
  getProgress,
  resetChallenge,
  type ChallengeProgress,
} from '../services/challengesService';
import {toDateKey} from '../services/dateUtils';

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ─── Streak ───────────────────────────────────────────────────────────────────

describe('streak', () => {
  const day = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h);

  it('starts at 1 on the first open', async () => {
    expect(await checkAndUpdateStreak(day(2026, 6, 10))).toBe(1);
    expect(await getLongestStreak()).toBe(1);
  });

  it('does not double-count two opens on the same day', async () => {
    await checkAndUpdateStreak(day(2026, 6, 10, 8));
    expect(await checkAndUpdateStreak(day(2026, 6, 10, 22))).toBe(1);
  });

  it('increments on a consecutive day', async () => {
    await checkAndUpdateStreak(day(2026, 6, 10));
    expect(await checkAndUpdateStreak(day(2026, 6, 11))).toBe(2);
    expect(await checkAndUpdateStreak(day(2026, 6, 12))).toBe(3);
  });

  it('resets after a missed day', async () => {
    await checkAndUpdateStreak(day(2026, 6, 10));
    await checkAndUpdateStreak(day(2026, 6, 11));
    expect(await checkAndUpdateStreak(day(2026, 6, 14))).toBe(1);
  });

  it('remembers the longest streak across a reset', async () => {
    await checkAndUpdateStreak(day(2026, 6, 10));
    await checkAndUpdateStreak(day(2026, 6, 11));
    await checkAndUpdateStreak(day(2026, 6, 12));
    await checkAndUpdateStreak(day(2026, 6, 20)); // broken
    expect(await getLongestStreak()).toBe(3);
  });

  /**
   * The local-day regression. A late-evening open followed by a next-morning
   * open is two local days and must count as two, even though both can land on
   * the same UTC day (or on two different UTC days than the local ones).
   */
  it('uses the local calendar day for the boundary', async () => {
    await checkAndUpdateStreak(new Date(2026, 5, 10, 23, 45));
    expect(await checkAndUpdateStreak(new Date(2026, 5, 11, 0, 15))).toBe(2);
  });

  it('does not advance across a long same-day gap', async () => {
    await checkAndUpdateStreak(new Date(2026, 5, 10, 0, 5));
    expect(await checkAndUpdateStreak(new Date(2026, 5, 10, 23, 55))).toBe(1);
  });

  it('counts a DST spring-forward day as one day', async () => {
    await checkAndUpdateStreak(new Date(2026, 2, 7, 12));
    expect(await checkAndUpdateStreak(new Date(2026, 2, 8, 12))).toBe(2);
    expect(await checkAndUpdateStreak(new Date(2026, 2, 9, 12))).toBe(3);
  });

  it('counts a DST fall-back day as one day', async () => {
    await checkAndUpdateStreak(new Date(2026, 9, 31, 12));
    expect(await checkAndUpdateStreak(new Date(2026, 10, 1, 12))).toBe(2);
    expect(await checkAndUpdateStreak(new Date(2026, 10, 2, 12))).toBe(3);
  });

  it('reports 0 once the streak has lapsed', async () => {
    await checkAndUpdateStreak(day(2026, 6, 10));
    expect(await getStreak(day(2026, 6, 11))).toBe(1); // yesterday still counts
    expect(await getStreak(day(2026, 6, 20))).toBe(0);
  });

  it('recovers from a corrupt stored value', async () => {
    await AsyncStorage.setItem('streak', '{not json');
    expect(await checkAndUpdateStreak(day(2026, 6, 10))).toBe(1);
  });

  it('recovers from a stored value of the wrong shape', async () => {
    await AsyncStorage.setItem('streak', JSON.stringify({count: 'many', lastDate: 42}));
    expect(await checkAndUpdateStreak(day(2026, 6, 10))).toBe(1);
  });

  it('restarts rather than producing NaN from an unparseable date', async () => {
    await AsyncStorage.setItem('streak', JSON.stringify({lastDate: 'nope', count: 5}));
    const result = await checkAndUpdateStreak(day(2026, 6, 10));
    expect(Number.isNaN(result)).toBe(false);
    expect(result).toBe(1);
  });

  it('migrates a legacy record with no longestStreak field', async () => {
    const today = toDateKey(day(2026, 6, 10));
    await AsyncStorage.setItem('streak', JSON.stringify({lastDate: today, count: 7}));
    await checkAndUpdateStreak(day(2026, 6, 10));
    expect(await getLongestStreak()).toBe(7);
  });
});

// ─── Badges ───────────────────────────────────────────────────────────────────

describe('badges', () => {
  it('awards a badge once the streak reaches its threshold', async () => {
    const awarded = await checkAndAwardBadges(3);
    const ids = awarded.map(b => b.id);
    expect(ids).toContain('day1');
    expect(ids).toContain('day3');
    expect(ids).not.toContain('day7');
  });

  it('never awards the same badge twice', async () => {
    await checkAndAwardBadges(7);
    const second = await checkAndAwardBadges(7);
    expect(second).toEqual([]);
  });

  it('awards only the newly crossed thresholds on a later call', async () => {
    await checkAndAwardBadges(3);
    const next = await checkAndAwardBadges(7);
    expect(next.map(b => b.id)).toEqual(['day7']);
  });

  it('awards nothing at a zero streak', async () => {
    expect(await checkAndAwardBadges(0)).toEqual([]);
    expect(await getEarnedBadges()).toEqual({});
  });

  it('records an ISO date for each badge earned', async () => {
    await checkAndAwardBadges(1);
    const earned = await getEarnedBadges();
    expect(Number.isNaN(new Date(earned.day1!).getTime())).toBe(false);
  });

  it('has ascending, unique thresholds', () => {
    const days = BADGE_DEFS.map(b => b.requiredDays);
    expect([...days].sort((a, b) => a - b)).toEqual(days);
    expect(new Set(days).size).toBe(days.length);
  });
});

// ─── Challenges ───────────────────────────────────────────────────────────────

describe('challenge definitions', () => {
  it('gives every challenge one chapter per day', () => {
    for (const def of CHALLENGE_DEFS) {
      expect(def.chapters).toHaveLength(def.days);
    }
  });

  it('references only valid psalm chapters', () => {
    for (const def of CHALLENGE_DEFS) {
      for (const chapter of def.chapters) {
        expect(chapter).toBeGreaterThanOrEqual(1);
        expect(chapter).toBeLessThanOrEqual(150);
      }
    }
  });

  it('has unique ids', () => {
    const ids = CHALLENGE_DEFS.map(d => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('challenge progress', () => {
  it('rejects an unknown challenge id', async () => {
    await expect(startChallenge('nope' as never, 8, 0)).rejects.toThrow(/Unknown challenge/);
  });

  it('pre-assigns one verse per day', async () => {
    const progress = await startChallenge('david_hiding', 8, 0);
    const def = CHALLENGE_DEFS.find(d => d.id === 'david_hiding')!;
    expect(progress.dayAssignments).toHaveLength(def.days);
    expect(progress.completedDays).toEqual([]);
    expect(progress.completed).toBe(false);
  });

  it('reports the next uncompleted day', () => {
    const progress = {
      dayAssignments: [{chapter: 1, verseNumber: 1}, {chapter: 2, verseNumber: 1}],
      completedDays: [0],
    } as ChallengeProgress;
    expect(getNextDayIndex(progress)).toBe(1);
  });

  it('reports -1 when every day is done', () => {
    const progress = {
      dayAssignments: [{chapter: 1, verseNumber: 1}],
      completedDays: [0],
    } as ChallengeProgress;
    expect(getNextDayIndex(progress)).toBe(-1);
  });

  it('marks a day complete and advances', async () => {
    await startChallenge('david_hiding', 8, 0);
    const result = await markDayComplete('david_hiding', 0);
    expect(result.blocked).toBe(false);
    if (!result.blocked) {
      expect(result.completedDayIndex).toBe(0);
      expect(result.daysLeft).toBe(6);
      expect(result.challengeJustCompleted).toBe(false);
    }
  });

  it('blocks a second completion on the same local day', async () => {
    await startChallenge('david_hiding', 8, 0);
    await markDayComplete('david_hiding', 0);
    const second = await markDayComplete('david_hiding', 1);
    expect(second.blocked).toBe(true);
    const progress = await getProgress('david_hiding');
    expect(progress!.completedDays).toEqual([0]);
  });

  it('reports canReadToday consistently with the gate', async () => {
    await startChallenge('david_hiding', 8, 0);
    const before = await getProgress('david_hiding');
    expect(canReadToday(before!)).toBe(true);
    await markDayComplete('david_hiding', 0);
    const after = await getProgress('david_hiding');
    expect(canReadToday(after!)).toBe(false);
  });

  it('rejects an out-of-range day index', async () => {
    await startChallenge('david_hiding', 8, 0);
    await expect(markDayComplete('david_hiding', 99)).rejects.toThrow(/out of range/);
    await expect(markDayComplete('david_hiding', -1)).rejects.toThrow(/out of range/);
    const progress = await getProgress('david_hiding');
    expect(progress!.completedDays).toEqual([]);
  });

  it('throws when the challenge was never started', async () => {
    await expect(markDayComplete('david_hiding', 0)).rejects.toThrow(/not started/);
  });

  it('marks the challenge complete on the final day', async () => {
    await startChallenge('david_hiding', 8, 0);
    const progress = await getProgress('david_hiding');
    // Simulate six earlier days already read on previous dates.
    progress!.completedDays = [0, 1, 2, 3, 4, 5];
    progress!.lastCompletedDate = '2020-01-01';
    await AsyncStorage.setItem(
      'challengeProgress_v2',
      JSON.stringify({david_hiding: progress}),
    );

    const result = await markDayComplete('david_hiding', 6);
    expect(result.blocked).toBe(false);
    if (!result.blocked) {
      expect(result.daysLeft).toBe(0);
      expect(result.challengeJustCompleted).toBe(true);
    }
    expect((await getProgress('david_hiding'))!.completed).toBe(true);
  });

  it('clears progress on reset', async () => {
    await startChallenge('david_hiding', 8, 0);
    await resetChallenge('david_hiding');
    expect(await getProgress('david_hiding')).toBeUndefined();
  });

  it('stores the start date as a local calendar day', async () => {
    const progress = await startChallenge('david_hiding', 8, 0);
    expect(progress.startDate).toBe(toDateKey(new Date()));
    expect(progress.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
