import AsyncStorage from '@react-native-async-storage/async-storage';

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
  chapters: number[];
  icon: string;
  i18nKey: string;
  i18nDescKey: string;
};

export type ChallengeProgress = {
  startDate: string;
  completedChapters: number[];
  completed: boolean;
  completedDate?: string;
};

export type AllChallengeProgress = Partial<Record<ChallengeId, ChallengeProgress>>;

export const CHALLENGE_DEFS: ChallengeDef[] = [
  {
    id: 'jesus_testing',
    days: 40,
    chapters: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,
               21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40],
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

const STORAGE_KEY = 'challengeProgress';

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

export async function startChallenge(id: ChallengeId): Promise<void> {
  const all = await load();
  if (all[id] && !all[id]!.completed) {
    return; // already in progress
  }
  all[id] = {
    startDate: new Date().toISOString().split('T')[0],
    completedChapters: [],
    completed: false,
  };
  await save(all);
}

/**
 * Mark a chapter as read for all active (started, not completed) challenges that include it.
 * Returns array of ChallengeIds that were JUST completed by this read.
 */
export async function markChapterReadForChallenges(chapter: number): Promise<ChallengeId[]> {
  const all = await load();
  const justCompleted: ChallengeId[] = [];

  for (const def of CHALLENGE_DEFS) {
    const progress = all[def.id];
    if (!progress || progress.completed) continue;
    if (!def.chapters.includes(chapter)) continue;
    if (progress.completedChapters.includes(chapter)) continue;

    progress.completedChapters = [...progress.completedChapters, chapter];

    // Check if all chapters are now done
    const allDone = def.chapters.every(c => progress.completedChapters.includes(c));
    if (allDone) {
      progress.completed = true;
      progress.completedDate = new Date().toISOString().split('T')[0];
      justCompleted.push(def.id);
    }
    all[def.id] = progress;
  }

  if (justCompleted.length > 0 || Object.keys(all).length > 0) {
    await save(all);
  }

  return justCompleted;
}

export async function resetChallenge(id: ChallengeId): Promise<void> {
  const all = await load();
  delete all[id];
  await save(all);
}
