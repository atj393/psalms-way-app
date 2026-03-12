import {StyleSheet, useColorScheme} from 'react-native';
import {useAppSettings} from '../context/AppSettingsContext';

export type ThemeMode = 'auto' | 'light' | 'dark';

export type AppColors = {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
};

export type SubScreen = 'verse' | 'chapter';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const lightColors: AppColors = {
  background: '#FAFAF8',
  surface: '#F0EFE9',
  text: '#1C1C1A',
  textSecondary: '#7A7A72',
  border: '#E0DFD8',
  primary: '#5B7FA6',
};

const darkColors: AppColors = {
  background: '#111110',
  surface: '#1E1E1C',
  text: '#EDEDE8',
  textSecondary: '#9A9A92',
  border: '#2E2E2C',
  primary: '#6B9BC4',
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
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      backgroundColor: colors.background,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    verseHighlight: {
      backgroundColor: colors.surface,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    verseNumber: {
      fontSize: fontSize - 5,
      color: colors.primary,
      fontFamily: 'Roboto',
      minWidth: 28,
      paddingTop: 2,
      textAlign: 'right' as const,
      marginRight: spacing.sm,
    },
    verseText: {
      flex: 1,
      fontSize: fontSize,
      color: colors.text,
      fontFamily: 'Roboto',
      lineHeight: fontSize * 1.75,
    },
  };
}
