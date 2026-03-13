import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'streak';

type StreakData = {
  lastDate: string; // 'YYYY-MM-DD'
  count: number;
  longestStreak?: number; // optional for backward compat with existing stored data
};

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 86400000;
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay);
}

async function load(): Promise<StreakData> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StreakData) : {lastDate: '', count: 0};
  } catch {
    return {lastDate: '', count: 0};
  }
}

function computeLongest(stored: StreakData, newCount: number): number {
  const prev = stored.longestStreak ?? stored.count ?? 0;
  return Math.max(prev, newCount);
}

export async function getStreak(): Promise<number> {
  const data = await load();
  // If last visit was more than 1 day ago, streak is broken
  if (!data.lastDate) return 0;
  const diff = daysBetween(data.lastDate, today());
  return diff <= 1 ? data.count : 0;
}

export async function getLongestStreak(): Promise<number> {
  const data = await load();
  return data.longestStreak ?? data.count ?? 0;
}

/**
 * Call once when app opens. Returns current streak count.
 * Increments count only if it's a new day.
 */
export async function checkAndUpdateStreak(): Promise<number> {
  const data = await load();
  const t = today();

  if (!data.lastDate) {
    // First ever open
    const next: StreakData = {lastDate: t, count: 1, longestStreak: 1};
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    return 1;
  }

  const diff = daysBetween(data.lastDate, t);

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
