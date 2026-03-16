import React, {createContext, useContext, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {ThemeMode} from '../theme';
import i18n, {getDeviceLanguage} from '../i18n';
import {runAutoSetup} from '../services/autoSetupService';

const STORAGE_KEY = 'appSettings';

export type BibleVersion = string;
export type AppLanguage = 'en' | 'de' | 'fr' | 'es' | 'hi' | 'ta' | 'te' | 'kn' | 'ml'
  | 'zh' | 'pt' | 'pl' | 'ja' | 'ro' | 'he' | 'id' | 'af' | 'sq' | 'cs' | 'bn' | 'bo'
  | 'vi' | 'it' | 'fi' | 'gu' | 'ha' | 'ht' | 'hu' | 'ko' | 'lt' | 'lv' | 'mi' | 'mr'
  | 'my' | 'ne' | 'fa' | 'pa' | 'so' | 'nl' | 'ar' | 'ru' | 'tl' | 'th' | 'tr' | 'ug' | 'ur' | 'wo';

type AppSettings = {
  fontSize: number;
  themeMode: ThemeMode;
  bibleVersion: BibleVersion;
  language: AppLanguage | 'auto';
  notificationEnabled: boolean;
  notificationHour: number;
  notificationMinute: number;
};

type AppSettingsContextValue = AppSettings & {
  setFontSize: (size: number) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setBibleVersion: (version: BibleVersion) => void;
  setLanguage: (lang: AppLanguage | 'auto') => void;
  setNotificationEnabled: (enabled: boolean) => void;
  setNotificationTime: (hour: number, minute: number) => void;
};

const defaults: AppSettings = {
  fontSize: 20,
  themeMode: 'auto',
  bibleVersion: 'modern',
  language: 'auto',
  notificationEnabled: false,
  notificationHour: 8,
  notificationMinute: 0,
};

const AppSettingsContext = createContext<AppSettingsContextValue>({
  ...defaults,
  setFontSize: () => {},
  setThemeMode: () => {},
  setBibleVersion: () => {},
  setLanguage: () => {},
  setNotificationEnabled: () => {},
  setNotificationTime: () => {},
});

export function AppSettingsProvider({children}: {children: React.ReactNode}) {
  const [settings, setSettings] = useState<AppSettings>(defaults);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(async raw => {
      if (!raw) {
        // ── First launch: auto-detect language & Bible ─────────────────────
        const result = await runAutoSetup();
        if (result) {
          const initial: AppSettings = {...defaults, bibleVersion: result.bibleVersion};
          setSettings(initial);
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        }
        // i18n is already initialised to device language in i18n/index.ts
        return;
      }

      // ── Subsequent launches: restore saved settings ──────────────────────
      try {
        const parsed = JSON.parse(raw) as Partial<AppSettings>;
        setSettings(prev => ({...prev, ...parsed}));
        // Re-apply saved language to i18n
        const savedLang = parsed.language;
        const resolved = savedLang === 'auto' || !savedLang
          ? getDeviceLanguage()
          : savedLang;
        i18n.changeLanguage(resolved).catch(() => {});
      } catch {}
    });
  }, []);

  const persist = (next: AppSettings) => {
    setSettings(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const setFontSize = (fontSize: number) => persist({...settings, fontSize});
  const setThemeMode = (themeMode: ThemeMode) => persist({...settings, themeMode});
  const setBibleVersion = (bibleVersion: BibleVersion) => persist({...settings, bibleVersion});
  const setLanguage = (language: AppLanguage | 'auto') => persist({...settings, language});
  const setNotificationEnabled = (notificationEnabled: boolean) =>
    persist({...settings, notificationEnabled});
  const setNotificationTime = (notificationHour: number, notificationMinute: number) =>
    persist({...settings, notificationHour, notificationMinute});

  return (
    <AppSettingsContext.Provider
      value={{
        ...settings,
        setFontSize,
        setThemeMode,
        setBibleVersion,
        setLanguage,
        setNotificationEnabled,
        setNotificationTime,
      }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  return useContext(AppSettingsContext);
}
