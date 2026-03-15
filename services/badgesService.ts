import AsyncStorage from '@react-native-async-storage/async-storage';

export type BadgeId =
  | 'day1'
  | 'day3'
  | 'day7'
  | 'day30'
  | 'day90'
  | 'day100'
  | 'day180'
  | 'day200'
  | 'day365';

export type BadgeDef = {
  id: BadgeId;
  requiredDays: number;
  icon: string;
  i18nKey: string;
  i18nDescKey: string;
};

export type EarnedBadges = Partial<Record<BadgeId, string>>; // badgeId -> ISO date earned

export const BADGE_DEFS: BadgeDef[] = [
  {id: 'day1',   requiredDays: 1,   icon: '🌱', i18nKey: 'badge_day1',   i18nDescKey: 'badge_day1_desc'},
  {id: 'day3',   requiredDays: 3,   icon: '🔥', i18nKey: 'badge_day3',   i18nDescKey: 'badge_day3_desc'},
  {id: 'day7',   requiredDays: 7,   icon: '⭐', i18nKey: 'badge_day7',   i18nDescKey: 'badge_day7_desc'},
  {id: 'day30',  requiredDays: 30,  icon: '🏅', i18nKey: 'badge_day30',  i18nDescKey: 'badge_day30_desc'},
  {id: 'day90',  requiredDays: 90,  icon: '🥈', i18nKey: 'badge_day90',  i18nDescKey: 'badge_day90_desc'},
  {id: 'day100', requiredDays: 100, icon: '💯', i18nKey: 'badge_day100', i18nDescKey: 'badge_day100_desc'},
  {id: 'day180', requiredDays: 180, icon: '🥇', i18nKey: 'badge_day180', i18nDescKey: 'badge_day180_desc'},
  {id: 'day200', requiredDays: 200, icon: '💎', i18nKey: 'badge_day200', i18nDescKey: 'badge_day200_desc'},
  {id: 'day365', requiredDays: 365, icon: '👑', i18nKey: 'badge_day365', i18nDescKey: 'badge_day365_desc'},
];

const STORAGE_KEY = 'earnedBadges';

async function load(): Promise<EarnedBadges> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as EarnedBadges) : {};
  } catch {
    return {};
  }
}

async function save(data: EarnedBadges): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function getEarnedBadges(): Promise<EarnedBadges> {
  return load();
}

/**
 * Check current streak against badge thresholds. Award any newly earned badges.
 * Returns array of BadgeDefs that were newly awarded (empty if none).
 */
export async function checkAndAwardBadges(streak: number): Promise<BadgeDef[]> {
  const earned = await load();
  const newlyEarned: BadgeDef[] = [];
  const now = new Date().toISOString();

  for (const badge of BADGE_DEFS) {
    if (streak >= badge.requiredDays && !earned[badge.id]) {
      earned[badge.id] = now;
      newlyEarned.push(badge);
    }
  }

  if (newlyEarned.length > 0) {
    await save(earned);
  }

  return newlyEarned;
}
