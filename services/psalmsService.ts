import {getPsalmsData, getAllVersions, type PsalmMetadata} from './psalmsModules';

export {getAllVersions};
export type {PsalmMetadata};

export function getChapter(chapter: number, version: string = 'modern'): string[] {
  const data = getPsalmsData(version);
  if (chapter < 1 || chapter > data.length) return [];
  return data[chapter - 1] ?? [];
}

export function getVerse(
  chapter: number,
  verseNumber: number,
  version: string = 'modern',
): {verse: string; verseNumber: number} | null {
  const verses = getChapter(chapter, version);
  if (verseNumber < 1 || verseNumber > verses.length) return null;
  return {verse: verses[verseNumber - 1], verseNumber};
}

export function getRandomVerse(
  chapter: number,
  version: string = 'modern',
): {verse: string; verseNumber: number} | null {
  const verses = getChapter(chapter, version);
  if (verses.length === 0) return null;
  const index = Math.floor(Math.random() * verses.length);
  return {verse: verses[index], verseNumber: index + 1};
}
