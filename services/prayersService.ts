import prayerData from '../prayers-en.json';

export type PrayerCategory = {
  id: string;
  name: string;
  icon?: string;
  i18nKey: string;
};

export type Prayer = {
  id: string;
  categoryId: string;
  title: string;
  prayer: string;
  occasion: 'daily' | 'situational' | 'seasonal';
  season: 'lent' | 'advent' | 'easter' | null;
  month: number | null;
  tags: string[];
  psalmsReference?: string[];
};

const categories: PrayerCategory[] = prayerData.categories;
const prayers: Prayer[] = prayerData.prayers as Prayer[];

export function getCategories(): PrayerCategory[] {
  return categories;
}

export function getPrayersByCategory(categoryId: string): Prayer[] {
  return prayers.filter(p => p.categoryId === categoryId);
}

export function getPrayer(id: string): Prayer | undefined {
  return prayers.find(p => p.id === id);
}
