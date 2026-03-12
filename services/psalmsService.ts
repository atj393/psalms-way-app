import psalmsData from '../psalms-en.json';

// psalms-en.json is an array of 150 chapters, each chapter is a string[]
const data = psalmsData as string[][];

export function getChapter(chapter: number): string[] {
  if (chapter < 1 || chapter > data.length) return [];
  return data[chapter - 1] ?? [];
}

export function getRandomVerse(
  chapter: number,
): {verse: string; verseNumber: number} | null {
  const verses = getChapter(chapter);
  if (verses.length === 0) return null;
  const index = Math.floor(Math.random() * verses.length);
  return {verse: verses[index], verseNumber: index + 1};
}
