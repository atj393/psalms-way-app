import {useColorScheme} from 'react-native';
import {useAppSettings} from '../context/AppSettingsContext';

export type ThemeMode = 'auto' | 'light' | 'dark';
export type SubScreen = 'verse' | 'chapter';

// ─── MD3 Color Roles ────────────────────────────────────────────────────────

export type AppColors = {
  // Primary
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  // Secondary
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  // Tertiary
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  // Surface
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  // Background
  background: string;
  onBackground: string;
  // Outline
  outline: string;
  outlineVariant: string;
  // Error
  error: string;
  onError: string;
  // Scrim
  scrim: string;
  // Legacy aliases (used by legacy screens during migration)
  text: string;
  textSecondary: string;
  border: string;
};

const lightColors: AppColors = {
  primary: '#3A6B38',
  onPrimary: '#FFFFFF',
  primaryContainer: '#BBEFB5',
  onPrimaryContainer: '#002204',
  secondary: '#526350',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#D5E8CF',
  onSecondaryContainer: '#102010',
  tertiary: '#3A6568',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#BCEBEF',
  onTertiaryContainer: '#002022',
  surface: '#F5FAF4',
  onSurface: '#181D17',
  surfaceVariant: '#DCE5D8',
  onSurfaceVariant: '#40483E',
  background: '#F5FAF4',
  onBackground: '#181D17',
  outline: '#707970',
  outlineVariant: '#C0C8BD',
  error: '#BA1A1A',
  onError: '#FFFFFF',
  scrim: '#000000',
  // Legacy aliases
  text: '#181D17',
  textSecondary: '#40483E',
  border: '#C0C8BD',
};

const darkColors: AppColors = {
  primary: '#9FD49C',
  onPrimary: '#003A00',
  primaryContainer: '#1F5221',
  onPrimaryContainer: '#BBEFB5',
  secondary: '#B9CBB3',
  onSecondary: '#253422',
  secondaryContainer: '#3B4B37',
  onSecondaryContainer: '#D5E8CF',
  tertiary: '#A1CED1',
  onTertiary: '#003740',
  tertiaryContainer: '#1F4D52',
  onTertiaryContainer: '#BCEBEF',
  surface: '#1A2119',
  onSurface: '#DEE4D9',
  surfaceVariant: '#40483E',
  onSurfaceVariant: '#C0C8BD',
  background: '#0F1510',
  onBackground: '#DEE4D9',
  outline: '#8A928A',
  outlineVariant: '#40483E',
  error: '#FFB4AB',
  onError: '#690005',
  scrim: '#000000',
  // Legacy aliases
  text: '#DEE4D9',
  textSecondary: '#C0C8BD',
  border: '#40483E',
};

// ─── MD3 Typography Scale ────────────────────────────────────────────────────

export type TypeStyle = {
  fontSize: number;
  lineHeight: number;
  fontWeight: '400' | '500' | '600' | '700';
  letterSpacing: number;
  fontFamily: string;
};

export type MD3TypeScale = {
  displaySmall: TypeStyle;
  headlineLarge: TypeStyle;
  headlineMedium: TypeStyle;
  headlineSmall: TypeStyle;
  titleLarge: TypeStyle;
  titleMedium: TypeStyle;
  titleSmall: TypeStyle;
  bodyLarge: TypeStyle;
  bodyMedium: TypeStyle;
  bodySmall: TypeStyle;
  labelLarge: TypeStyle;
  labelMedium: TypeStyle;
  labelSmall: TypeStyle;
};

const RB = 'Roboto';

export const typeScale: MD3TypeScale = {
  displaySmall:  {fontSize: 36, lineHeight: 44, fontWeight: '400', letterSpacing: 0,    fontFamily: RB},
  headlineLarge: {fontSize: 32, lineHeight: 40, fontWeight: '400', letterSpacing: 0,    fontFamily: RB},
  headlineMedium:{fontSize: 28, lineHeight: 36, fontWeight: '400', letterSpacing: 0,    fontFamily: RB},
  headlineSmall: {fontSize: 24, lineHeight: 32, fontWeight: '400', letterSpacing: 0,    fontFamily: RB},
  titleLarge:    {fontSize: 22, lineHeight: 28, fontWeight: '400', letterSpacing: 0,    fontFamily: RB},
  titleMedium:   {fontSize: 16, lineHeight: 24, fontWeight: '500', letterSpacing: 0.15, fontFamily: RB},
  titleSmall:    {fontSize: 14, lineHeight: 20, fontWeight: '500', letterSpacing: 0.1,  fontFamily: RB},
  bodyLarge:     {fontSize: 16, lineHeight: 24, fontWeight: '400', letterSpacing: 0.5,  fontFamily: RB},
  bodyMedium:    {fontSize: 14, lineHeight: 20, fontWeight: '400', letterSpacing: 0.25, fontFamily: RB},
  bodySmall:     {fontSize: 12, lineHeight: 16, fontWeight: '400', letterSpacing: 0.4,  fontFamily: RB},
  labelLarge:    {fontSize: 14, lineHeight: 20, fontWeight: '500', letterSpacing: 0.1,  fontFamily: RB},
  labelMedium:   {fontSize: 12, lineHeight: 16, fontWeight: '500', letterSpacing: 0.5,  fontFamily: RB},
  labelSmall:    {fontSize: 11, lineHeight: 16, fontWeight: '500', letterSpacing: 0.5,  fontFamily: RB},
};

// ─── MD3 Shape Scale ─────────────────────────────────────────────────────────

export const shape = {
  none:       0,
  extraSmall: 4,
  small:      8,
  medium:     12,
  large:      16,
  extraLarge: 28,
  full:       9999,
};

// ─── MD3 Elevation ───────────────────────────────────────────────────────────

export const elevation = {
  level0: 0,
  level1: 1,
  level2: 3,
  level3: 6,
  level4: 8,
  level5: 12,
};

// ─── Spacing Grid (4dp base) ─────────────────────────────────────────────────

export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

// ─── Ripple colors ───────────────────────────────────────────────────────────

export const ripple = {
  onPrimary:       '#FFFFFF33',
  onSurface:       '#181D171F',
  onSurfaceVariant:'#40483E1F',
  onDarkSurface:   '#DEE4D91F',
};

// ─── useTheme hook ───────────────────────────────────────────────────────────

export type Theme = {
  isDark: boolean;
  colors: AppColors;
  type: MD3TypeScale;
  shape: typeof shape;
  elevation: typeof elevation;
  fontSize: number;
};

export function useTheme(): Theme {
  const {themeMode, fontSize} = useAppSettings();
  const systemScheme = useColorScheme();

  const isDark =
    themeMode === 'dark'
      ? true
      : themeMode === 'light'
      ? false
      : systemScheme === 'dark';

  return {
    isDark,
    colors: isDark ? darkColors : lightColors,
    type: typeScale,
    shape,
    elevation,
    fontSize,
  };
}

// Keep for backward-compat with any remaining callers (no-op, will be removed)
export function createVerseStyles(_colors: AppColors, _fontSize: number) {
  return {} as ReturnType<typeof import('react-native').StyleSheet.create>;
}
