import React, {createContext, useContext, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {ThemeMode} from '../theme';

const STORAGE_KEY = 'appSettings';

export type BibleVersion = 'modern' | 'kjv';
export type AppLanguage = 'en' | 'de' | 'fr' | 'es' | 'hi' | 'ta' | 'te' | 'kn' | 'ml';

type AppSettings = {
  fontSize: number;
  themeMode: ThemeMode;
  bibleVersion: BibleVersion;
  language: AppLanguage | 'auto';
};

type AppSettingsContextValue = AppSettings & {
  setFontSize: (size: number) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setBibleVersion: (version: BibleVersion) => void;
  setLanguage: (lang: AppLanguage | 'auto') => void;
};

const defaults: AppSettings = {
  fontSize: 20,
  themeMode: 'auto',
  bibleVersion: 'modern',
  language: 'auto',
};

const AppSettingsContext = createContext<AppSettingsContextValue>({
  ...defaults,
  setFontSize: () => {},
  setThemeMode: () => {},
  setBibleVersion: () => {},
  setLanguage: () => {},
});

export function AppSettingsProvider({children}: {children: React.ReactNode}) {
  const [settings, setSettings] = useState<AppSettings>(defaults);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as Partial<AppSettings>;
        setSettings(prev => ({...prev, ...parsed}));
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

  return (
    <AppSettingsContext.Provider
      value={{...settings, setFontSize, setThemeMode, setBibleVersion, setLanguage}}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  return useContext(AppSettingsContext);
}
