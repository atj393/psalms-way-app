import {useColorScheme} from 'react-native';
import {useAppSettings} from '../context/AppSettingsContext';

export type ThemeMode = 'auto' | 'light' | 'dark';

export type AppColors = {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
};

export type SubScreen = 'verse' | 'chapter';

const lightColors: AppColors = {
  background: '#FFFFFF',
  surface: '#F5F5F5',
  surfaceAlt: '#E8E8E8',
  text: '#1A1A1A',
  textSecondary: '#666666',
  border: '#D0D0D0',
  primary: '#4A7C9B',
};

const darkColors: AppColors = {
  background: '#0D0D0D',
  surface: '#1C1C1E',
  surfaceAlt: '#2C2C2E',
  text: '#F2F2F7',
  textSecondary: '#AEAEB2',
  border: '#3A3A3C',
  primary: '#5E9DC8',
};

export function useTheme(): {isDark: boolean; colors: AppColors; fontSize: number} {
  const {themeMode, fontSize} = useAppSettings();
  const systemScheme = useColorScheme();

  const isDark =
    themeMode === 'dark'
      ? true
      : themeMode === 'light'
      ? false
      : systemScheme === 'dark';

  return {isDark, colors: isDark ? darkColors : lightColors, fontSize};
}

export function createVerseStyles(colors: AppColors, fontSize: number) {
  return {
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    verseRow: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    verseOdd: {
      backgroundColor: colors.surface,
    },
    verseEven: {
      backgroundColor: colors.surfaceAlt,
    },
    verseHighlight: {
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    verseNumber: {
      fontSize: fontSize - 4,
      color: colors.textSecondary,
      fontFamily: 'Roboto',
      minWidth: 28,
      paddingTop: 2,
    },
    verseText: {
      flex: 1,
      fontSize: fontSize,
      color: colors.text,
      fontFamily: 'Roboto',
      lineHeight: fontSize * 1.6,
    },
  };
}
