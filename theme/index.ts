import {useColorScheme} from 'react-native';
import {useAppSettings} from '../context/AppSettingsContext';
import type {ThemeColor} from '../context/AppSettingsContext';

export type ThemeMode = 'auto' | 'light' | 'dark';
export type {ThemeColor};
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

// ─── Color Palettes (5 MD3 themes) ───────────────────────────────────────────

const PALETTES: Record<ThemeColor, {light: AppColors; dark: AppColors}> = {
  // ── Forest (green — original) ──────────────────────────────────────────────
  green: {
    light: {
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
      text: '#181D17',
      textSecondary: '#40483E',
      border: '#C0C8BD',
    },
    dark: {
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
      text: '#DEE4D9',
      textSecondary: '#C0C8BD',
      border: '#40483E',
    },
  },

  // ── Ocean (blue) ───────────────────────────────────────────────────────────
  blue: {
    light: {
      primary: '#0057A8',
      onPrimary: '#FFFFFF',
      primaryContainer: '#D6E4FF',
      onPrimaryContainer: '#001849',
      secondary: '#575E71',
      onSecondary: '#FFFFFF',
      secondaryContainer: '#DBE2F9',
      onSecondaryContainer: '#131C2C',
      tertiary: '#725572',
      onTertiary: '#FFFFFF',
      tertiaryContainer: '#FDD7FA',
      onTertiaryContainer: '#2B122B',
      surface: '#F9F9FF',
      onSurface: '#1A1B1F',
      surfaceVariant: '#E1E2EC',
      onSurfaceVariant: '#44474E',
      background: '#F9F9FF',
      onBackground: '#1A1B1F',
      outline: '#757780',
      outlineVariant: '#C5C6D0',
      error: '#BA1A1A',
      onError: '#FFFFFF',
      scrim: '#000000',
      text: '#1A1B1F',
      textSecondary: '#44474E',
      border: '#C5C6D0',
    },
    dark: {
      primary: '#ADC6FF',
      onPrimary: '#002D6D',
      primaryContainer: '#00429A',
      onPrimaryContainer: '#D6E4FF',
      secondary: '#BFC6DC',
      onSecondary: '#293041',
      secondaryContainer: '#3F4759',
      onSecondaryContainer: '#DBE2F9',
      tertiary: '#E0BADF',
      onTertiary: '#412641',
      tertiaryContainer: '#593E59',
      onTertiaryContainer: '#FDD7FA',
      surface: '#1A1B21',
      onSurface: '#E4E2E9',
      surfaceVariant: '#44474E',
      onSurfaceVariant: '#C5C6D0',
      background: '#12121A',
      onBackground: '#E4E2E9',
      outline: '#8E9099',
      outlineVariant: '#44474E',
      error: '#FFB4AB',
      onError: '#690005',
      scrim: '#000000',
      text: '#E4E2E9',
      textSecondary: '#C5C6D0',
      border: '#44474E',
    },
  },

  // ── Crimson (red) ──────────────────────────────────────────────────────────
  red: {
    light: {
      primary: '#9B1919',
      onPrimary: '#FFFFFF',
      primaryContainer: '#FFDAD6',
      onPrimaryContainer: '#410001',
      secondary: '#775651',
      onSecondary: '#FFFFFF',
      secondaryContainer: '#FFDAD6',
      onSecondaryContainer: '#2C1512',
      tertiary: '#735B2E',
      onTertiary: '#FFFFFF',
      tertiaryContainer: '#FFDEA7',
      onTertiaryContainer: '#291800',
      surface: '#FFFBFF',
      onSurface: '#201A19',
      surfaceVariant: '#F5DDDA',
      onSurfaceVariant: '#534341',
      background: '#FFFBFF',
      onBackground: '#201A19',
      outline: '#857370',
      outlineVariant: '#D8C2BF',
      error: '#BA1A1A',
      onError: '#FFFFFF',
      scrim: '#000000',
      text: '#201A19',
      textSecondary: '#534341',
      border: '#D8C2BF',
    },
    dark: {
      primary: '#FFB4AB',
      onPrimary: '#690003',
      primaryContainer: '#93000A',
      onPrimaryContainer: '#FFDAD6',
      secondary: '#E7BDB8',
      onSecondary: '#442926',
      secondaryContainer: '#5D3F3C',
      onSecondaryContainer: '#FFDAD6',
      tertiary: '#E5C18A',
      onTertiary: '#3F2D04',
      tertiaryContainer: '#594419',
      onTertiaryContainer: '#FFDEA7',
      surface: '#271816',
      onSurface: '#EDE0DE',
      surfaceVariant: '#534341',
      onSurfaceVariant: '#D8C2BF',
      background: '#201A19',
      onBackground: '#EDE0DE',
      outline: '#A08C89',
      outlineVariant: '#534341',
      error: '#FFB4AB',
      onError: '#690005',
      scrim: '#000000',
      text: '#EDE0DE',
      textSecondary: '#D8C2BF',
      border: '#534341',
    },
  },

  // ── Sunset (amber) ─────────────────────────────────────────────────────────
  amber: {
    light: {
      primary: '#8B5000',
      onPrimary: '#FFFFFF',
      primaryContainer: '#FFDDB7',
      onPrimaryContainer: '#2C1700',
      secondary: '#6F5B40',
      onSecondary: '#FFFFFF',
      secondaryContainer: '#FAE1BE',
      onSecondaryContainer: '#271906',
      tertiary: '#506440',
      onTertiary: '#FFFFFF',
      tertiaryContainer: '#D2EABC',
      onTertiaryContainer: '#0E2002',
      surface: '#FFFBFF',
      onSurface: '#1F1B16',
      surfaceVariant: '#F0E0CF',
      onSurfaceVariant: '#50453A',
      background: '#FFFBFF',
      onBackground: '#1F1B16',
      outline: '#827568',
      outlineVariant: '#D3C4B4',
      error: '#BA1A1A',
      onError: '#FFFFFF',
      scrim: '#000000',
      text: '#1F1B16',
      textSecondary: '#50453A',
      border: '#D3C4B4',
    },
    dark: {
      primary: '#FFB961',
      onPrimary: '#4A2800',
      primaryContainer: '#6A3C00',
      onPrimaryContainer: '#FFDDB7',
      secondary: '#DDCAAD',
      onSecondary: '#3D2D16',
      secondaryContainer: '#55432A',
      onSecondaryContainer: '#FAE1BE',
      tertiary: '#B6CDA2',
      onTertiary: '#223514',
      tertiaryContainer: '#384C29',
      onTertiaryContainer: '#D2EABC',
      surface: '#27231B',
      onSurface: '#EAE1D8',
      surfaceVariant: '#50453A',
      onSurfaceVariant: '#D3C4B4',
      background: '#1F1B16',
      onBackground: '#EAE1D8',
      outline: '#9C8E80',
      outlineVariant: '#50453A',
      error: '#FFB4AB',
      onError: '#690005',
      scrim: '#000000',
      text: '#EAE1D8',
      textSecondary: '#D3C4B4',
      border: '#50453A',
    },
  },

  // ── Lavender (purple) ──────────────────────────────────────────────────────
  purple: {
    light: {
      primary: '#6B3FA0',
      onPrimary: '#FFFFFF',
      primaryContainer: '#EBDDFF',
      onPrimaryContainer: '#250059',
      secondary: '#635B70',
      onSecondary: '#FFFFFF',
      secondaryContainer: '#E8DEF8',
      onSecondaryContainer: '#1E1829',
      tertiary: '#7E525A',
      onTertiary: '#FFFFFF',
      tertiaryContainer: '#FFD9E0',
      onTertiaryContainer: '#311018',
      surface: '#FFFBFF',
      onSurface: '#1C1B1E',
      surfaceVariant: '#E7E0EB',
      onSurfaceVariant: '#48454E',
      background: '#FFFBFF',
      onBackground: '#1C1B1E',
      outline: '#79747E',
      outlineVariant: '#CAC4CF',
      error: '#BA1A1A',
      onError: '#FFFFFF',
      scrim: '#000000',
      text: '#1C1B1E',
      textSecondary: '#48454E',
      border: '#CAC4CF',
    },
    dark: {
      primary: '#D4BBFF',
      onPrimary: '#3B006B',
      primaryContainer: '#52278A',
      onPrimaryContainer: '#EBDDFF',
      secondary: '#CCC2DB',
      onSecondary: '#332D41',
      secondaryContainer: '#4A4358',
      onSecondaryContainer: '#E8DEF8',
      tertiary: '#EFB8C0',
      onTertiary: '#4A2328',
      tertiaryContainer: '#643B3E',
      onTertiaryContainer: '#FFD9E0',
      surface: '#231F26',
      onSurface: '#E6E1E5',
      surfaceVariant: '#48454E',
      onSurfaceVariant: '#CAC4CF',
      background: '#1C1B1E',
      onBackground: '#E6E1E5',
      outline: '#948F99',
      outlineVariant: '#48454E',
      error: '#FFB4AB',
      onError: '#690005',
      scrim: '#000000',
      text: '#E6E1E5',
      textSecondary: '#CAC4CF',
      border: '#48454E',
    },
  },
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
  const {themeMode, themeColor, fontSize} = useAppSettings();
  const systemScheme = useColorScheme();

  const isDark =
    themeMode === 'dark'
      ? true
      : themeMode === 'light'
      ? false
      : systemScheme === 'dark';

  const palette = PALETTES[themeColor ?? 'green'];

  return {
    isDark,
    colors: isDark ? palette.dark : palette.light,
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
