import React, {createContext, useContext, useEffect, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {ThemeMode} from '../theme';

const STORAGE_KEY = 'appSettings';

type AppSettings = {
  fontSize: number;
  themeMode: ThemeMode;
};

type AppSettingsContextValue = AppSettings & {
  setFontSize: (size: number) => void;
  setThemeMode: (mode: ThemeMode) => void;
};

const defaults: AppSettings = {
  fontSize: 20,
  themeMode: 'auto',
};

const AppSettingsContext = createContext<AppSettingsContextValue>({
  ...defaults,
  setFontSize: () => {},
  setThemeMode: () => {},
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

  return (
    <AppSettingsContext.Provider
      value={{...settings, setFontSize, setThemeMode}}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  return useContext(AppSettingsContext);
}
