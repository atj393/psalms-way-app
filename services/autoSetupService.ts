/**
 * Auto-setup service — runs exactly once on first app launch.
 *
 * Responsibilities:
 *  - Detect the device's primary language
 *  - Find the best Bible translation for that language
 *  - Fall back to KJV if no translation is available
 *  - Store a flag so HomeScreen can show a fallback notification
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {getLocales} from 'react-native-localize';
import {getDeviceLanguage} from '../i18n';
import {getAllVersions} from './psalmsService';

const AUTO_SETUP_KEY = 'autoSetupDone_v1';
export const FALLBACK_NOTIF_KEY = 'fallbackNotifPending';

export type FallbackInfo = {
  langFallback: boolean;   // phone language not supported → fell back to English
  bibleFallback: boolean;  // no Bible in phone language → fell back to KJV
};

/**
 * Find the first available Bible module whose lang_short matches the given code.
 * Returns null if no translation exists for that language.
 */
function findBestBibleForLang(langCode: string): string | null {
  const all = getAllVersions();
  // Skip 'modern' (our custom Modern English version) when auto-matching
  const match = all.find(v => v.lang_short === langCode && v.module !== 'modern');
  return match?.module ?? null;
}

/**
 * Called by AppSettingsContext on first launch.
 * Returns the resolved bibleVersion + fallback info, or null if setup already ran.
 */
export async function runAutoSetup(): Promise<{
  bibleVersion: string;
  fallback: FallbackInfo;
} | null> {
  const done = await AsyncStorage.getItem(AUTO_SETUP_KEY);
  if (done) return null; // already ran once — don't interfere with saved settings

  // Mark as done immediately so concurrent calls are no-ops
  await AsyncStorage.setItem(AUTO_SETUP_KEY, 'true');

  // Raw device language (e.g. 'sw', 'ar', 'de')
  const rawLang = getLocales()[0]?.languageCode ?? 'en';

  // Best supported app language (may fall back to 'en' if rawLang isn't in our list)
  const resolvedLang = getDeviceLanguage();

  const langFallback = rawLang !== resolvedLang;

  // Try to find a Bible in the resolved language
  const bestBible = findBestBibleForLang(resolvedLang);
  const bibleVersion = bestBible ?? 'kjv';
  const bibleFallback = bestBible === null;

  const fallback: FallbackInfo = {langFallback, bibleFallback};

  // Store flag so HomeScreen can show the notification after launch
  if (langFallback || bibleFallback) {
    await AsyncStorage.setItem(FALLBACK_NOTIF_KEY, JSON.stringify(fallback));
  }

  return {bibleVersion, fallback};
}
