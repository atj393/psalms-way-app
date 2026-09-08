import AsyncStorage from '@react-native-async-storage/async-storage';
import {daysBetween, todayKey} from './dateUtils';

const KEY = 'streak';

type StreakData = {
  lastDate: string; // 'YYYY-MM-DD', the user's LOCAL calendar day
  count: number;
  longestStreak?: number; // optional for backward compat with existing stored data
};

const EMPTY: StreakData = {lastDate: '', count: 0};

/**
 * Narrows unknown stored JSON to StreakData.
 *
 * Stored values are untrusted: they may predate the current shape, or have been
 * truncated by a failed write. Returning the empty streak on anything unexpected
 * is better than letting NaN propagate into the count and render as "NaN days".
 */
function parseStreak(raw: string): StreakData {
  const value: unknown = JSON.parse(raw);
  if (typeof value !== 'object' || value === null) return EMPTY;
  const v = value as Record<string, unknown>;
  const count = typeof v.count === 'number' && Number.isFinite(v.count) ? v.count : 0;
  const lastDate = typeof v.lastDate === 'string' ? v.lastDate : '';
  const longestStreak =
    typeof v.longestStreak === 'number' && Number.isFinite(v.longestStreak)
      ? v.longestStreak
      : undefined;
  return {lastDate, count, longestStreak};
}

async function load(): Promise<StreakData> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? parseStreak(raw) : EMPTY;
  } catch {
    return EMPTY;
  }
}

function computeLongest(stored: StreakData, newCount: number): number {
  const prev = stored.longestStreak ?? stored.count ?? 0;
  return Math.max(prev, newCount);
}

export async function getStreak(now: Date = new Date()): Promise<number> {
  const data = await load();
  // If last visit was more than 1 day ago, streak is broken
  if (!data.lastDate) return 0;
  const diff = daysBetween(data.lastDate, todayKey(now));
  // An unparseable stored date means the streak cannot be trusted.
  if (diff === null) return 0;
  return diff <= 1 ? data.count : 0;
}

export async function getLongestStreak(): Promise<number> {
  const data = await load();
  return data.longestStreak ?? data.count ?? 0;
}

/**
 * Call once when app opens. Returns current streak count.
 * Increments count only if it's a new LOCAL calendar day.
 *
 * `now` is injectable so tests can pin the clock across day and DST boundaries.
 */
export async function checkAndUpdateStreak(now: Date = new Date()): Promise<number> {
  const data = await load();
  const t = todayKey(now);

  if (!data.lastDate) {
    // First ever open
    const next: StreakData = {lastDate: t, count: 1, longestStreak: 1};
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    return 1;
  }

  const diff = daysBetween(data.lastDate, t);

  if (diff === null) {
    // Corrupt stored date — restart the streak rather than propagating NaN.
    const next: StreakData = {lastDate: t, count: 1, longestStreak: computeLongest(data, 1)};
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    return 1;
  }

  if (diff === 0) {
    // Already visited today — migrate longestStreak field if missing
    if (data.longestStreak === undefined) {
      const migrated: StreakData = {...data, longestStreak: data.count};
      await AsyncStorage.setItem(KEY, JSON.stringify(migrated));
    }
    return data.count;
  } else if (diff === 1) {
    // Consecutive day — increment
    const newCount = data.count + 1;
    const next: StreakData = {
      lastDate: t,
      count: newCount,
      longestStreak: computeLongest(data, newCount),
    };
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    return next.count;
  } else {
    // Streak broken — reset to 1
    const next: StreakData = {
      lastDate: t,
      count: 1,
      longestStreak: computeLongest(data, 1),
    };
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    return 1;
  }
}
