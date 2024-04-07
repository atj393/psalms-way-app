// psalmsService.ts
import PsalmsData from './../psalms-en.json';

export type Verse = string;

export const getPsalmsChapter = (chapterNumber: number): Verse[] => {
  return PsalmsData[chapterNumber - 1] || [];
};

export const getPsalmsVerse = (
  chapterNumber: number,
  verseNumber: number,
): string => {
  const chapter = PsalmsData[chapterNumber - 1];
  const randomVerse = Math.floor(Math.random() * chapter.length); // Assuming each chapter has 6 verses
  return (chapter && chapter[randomVerse - 1]) || '';
};
