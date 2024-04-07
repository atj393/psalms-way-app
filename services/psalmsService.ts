// psalmsService.ts
import PsalmsData from './../psalms-en.json';

export type Verse = string;

export const getPsalmsChapter = (chapterNumber: number): Verse[] => {
  return PsalmsData[chapterNumber - 1] || [];
};

export type VerseDetail = {
  verse: string;
  verseNumber: number;
};

export const getPsalmsVerse = (chapterNumber: number): VerseDetail | null => {
  const chapter = PsalmsData[chapterNumber - 1];
  const randomVerse = Math.floor(Math.random() * chapter.length);
  return (
    chapter && {
      verse: chapter[randomVerse] || '',
      verseNumber: randomVerse + 1,
    }
  );
};
