import AsyncStorage from '@react-native-async-storage/async-storage';
import {getRandomVerse} from './psalmsService';

export type ChallengeId =
  | 'jesus_testing'
  | 'fasting'
  | 'david_hiding'
  | 'birth_of_jesus'
  | 'trust_in_god'
  | 'praise_journey';

export type ChallengeDef = {
  id: ChallengeId;
  days: number;
  chapters: number[]; // one psalm chapter per day
  icon: string;
  i18nKey: string;
  i18nDescKey: string;
};

/** One verse assigned to a single day of the challenge */
export type ChallengeDayAssignment = {
  chapter: number;
  verseNumber: number;
};

export type ChallengeProgress = {
  startDate: string;             // 'YYYY-MM-DD'
  notifHour: number;
  notifMinute: number;
  dayAssignments: ChallengeDayAssignment[]; // pre-generated, one per day
  completedDays: number[];       // 0-based day indices that are done
  lastCompletedDate?: string;    // 'YYYY-MM-DD' — date the most recent day was marked read
  completed: boolean;
  completedDate?: string;
};

export type AllChallengeProgress = Partial<Record<ChallengeId, ChallengeProgress>>;

export const CHALLENGE_DEFS: ChallengeDef[] = [
  {
    id: 'jesus_testing',
    days: 40,
    chapters: [
      1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,
      21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,
    ],
    icon: '✝️',
    i18nKey: 'challenge_jesus_testing',
    i18nDescKey: 'challenge_jesus_testing_desc',
  },
  {
    id: 'fasting',
    days: 21,
    chapters: [51,32,42,43,46,63,84,91,103,130,143,22,23,27,31,34,37,40,62,86,25],
    icon: '🙏',
    i18nKey: 'challenge_fasting',
    i18nDescKey: 'challenge_fasting_desc',
  },
  {
    id: 'david_hiding',
    days: 7,
    chapters: [57,142,54,52,34,56,63],
    icon: '🏔️',
    i18nKey: 'challenge_david_hiding',
    i18nDescKey: 'challenge_david_hiding_desc',
  },
  {
    id: 'birth_of_jesus',
    days: 12,
    chapters: [2,8,19,22,24,45,72,89,98,110,118,132],
    icon: '⭐',
    i18nKey: 'challenge_birth',
    i18nDescKey: 'challenge_birth_desc',
  },
  {
    id: 'trust_in_god',
    days: 30,
    chapters: [23,46,91,121,27,62,37,40,34,84,63,71,125,131,112,111,128,16,18,3,4,11,17,20,25,31,36,52,55,61],
    icon: '🕊️',
    i18nKey: 'challenge_trust',
    i18nDescKey: 'challenge_trust_desc',
  },
  {
    id: 'praise_journey',
    days: 7,
    chapters: [100,103,104,107,145,146,150],
    icon: '🎵',
    i18nKey: 'challenge_praise',
    i18nDescKey: 'challenge_praise_desc',
  },
];

const STORAGE_KEY = 'challengeProgress_v2';

async function load(): Promise<AllChallengeProgress> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AllChallengeProgress) : {};
  } catch {
    return {};
  }
}

async function save(data: AllChallengeProgress): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function getAllProgress(): Promise<AllChallengeProgress> {
  return load();
}

export async function getProgress(id: ChallengeId): Promise<ChallengeProgress | undefined> {
  const all = await load();
  return all[id];
}

/**
 * Start a challenge. Generates a random verse per chapter (pre-assigned).
 * Returns the new progress object (so caller can schedule the notification).
 */
export async function startChallenge(
  id: ChallengeId,
  notifHour: number,
  notifMinute: number,
  version: string = 'modern',
): Promise<ChallengeProgress> {
  const def = CHALLENGE_DEFS.find(d => d.id === id)!;

  // Generate one random verse per chapter
  const dayAssignments: ChallengeDayAssignment[] = def.chapters.map(chapter => {
    const result = getRandomVerse(chapter, version);
    return {
      chapter,
      verseNumber: result?.verseNumber ?? 1,
    };
  });

  const progress: ChallengeProgress = {
    startDate: new Date().toISOString().split('T')[0],
    notifHour,
    notifMinute,
    dayAssignments,
    completedDays: [],
    completed: false,
  };

  const all = await load();
  all[id] = progress;
  await save(all);
  return progress;
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get the next uncompleted day index (0-based). Returns -1 if all done.
 */
export function getNextDayIndex(progress: ChallengeProgress): number {
  const total = progress.dayAssignments.length;
  for (let i = 0; i < total; i++) {
    if (!progress.completedDays.includes(i)) return i;
  }
  return -1;
}

/**
 * Returns true if the user is allowed to mark a verse as read today.
 * False if they already did it today.
 */
export function canReadToday(progress: ChallengeProgress): boolean {
  if (!progress.lastCompletedDate) return true;
  return progress.lastCompletedDate !== todayStr();
}

export type DayCompleteResult =
  | {blocked: true}
  | {blocked: false; completedDayIndex: number; daysLeft: number; challengeJustCompleted: boolean};

/**
 * Mark a specific day (0-based) as complete.
 * Enforces one read per calendar day — returns {blocked: true} if already done today.
 */
export async function markDayComplete(
  id: ChallengeId,
  dayIndex: number,
): Promise<DayCompleteResult> {
  const all = await load();
  const progress = all[id];
  if (!progress) throw new Error('Challenge not started');

  // One per day enforcement
  const today = todayStr();
  if (progress.lastCompletedDate === today) {
    return {blocked: true};
  }

  if (!progress.completedDays.includes(dayIndex)) {
    progress.completedDays = [...progress.completedDays, dayIndex];
  }
  progress.lastCompletedDate = today;

  const total = progress.dayAssignments.length;
  const daysLeft = total - progress.completedDays.length;
  const challengeJustCompleted = daysLeft === 0;

  if (challengeJustCompleted) {
    progress.completed = true;
    progress.completedDate = today;
  }

  all[id] = progress;
  await save(all);

  return {
    blocked: false,
    completedDayIndex: dayIndex,
    daysLeft,
    challengeJustCompleted,
  };
}

export async function resetChallenge(id: ChallengeId): Promise<void> {
  const all = await load();
  delete all[id];
  await save(all);
}
