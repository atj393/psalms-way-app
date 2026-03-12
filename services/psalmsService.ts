import psalmsModern from '../psalms-en.json';
import psalmsKjv from '../psalms-en-kjv.json';
import type {BibleVersion} from '../context/AppSettingsContext';

// Both JSON files are arrays of 150 chapters, each chapter is a string[]
const datasets: Record<BibleVersion, string[][]> = {
  modern: psalmsModern as string[][],
  kjv: psalmsKjv as string[][],
};

export function getChapter(chapter: number, version: BibleVersion = 'modern'): string[] {
  const data = datasets[version];
  if (chapter < 1 || chapter > data.length) return [];
  return data[chapter - 1] ?? [];
}

export function getRandomVerse(
  chapter: number,
  version: BibleVersion = 'modern',
): {verse: string; verseNumber: number} | null {
  const verses = getChapter(chapter, version);
  if (verses.length === 0) return null;
  const index = Math.floor(Math.random() * verses.length);
  return {verse: verses[index], verseNumber: index + 1};
}
