import React from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {spacing, useTheme, type ThemeMode} from '../theme';
import {useAppSettings, type BibleVersion, type AppLanguage} from '../context/AppSettingsContext';
import Icons from '../components/Icons';
import i18n from '../i18n';

const FONT_SIZES: {label: string; size: number; a11y: string}[] = [
  {label: 'A', size: 16, a11y: 'Small text'},
  {label: 'A', size: 20, a11y: 'Medium text'},
  {label: 'A', size: 24, a11y: 'Large text'},
];

const THEME_MODES: {label: string; value: ThemeMode; a11y: string}[] = [
  {label: 'Auto', value: 'auto', a11y: 'Follow system theme'},
  {label: 'Light', value: 'light', a11y: 'Light theme'},
  {label: 'Dark', value: 'dark', a11y: 'Dark theme'},
];

const BIBLE_VERSIONS: {label: string; value: BibleVersion; a11y: string}[] = [
  {label: 'Modern', value: 'modern', a11y: 'Modern English'},
  {label: 'KJV', value: 'kjv', a11y: 'King James Version'},
];

type LangOption = {label: string; value: AppLanguage | 'auto'};
const LANGUAGES: LangOption[] = [
  {label: 'Auto', value: 'auto'},
  {label: 'English', value: 'en'},
  {label: 'Deutsch', value: 'de'},
  {label: 'Français', value: 'fr'},
  {label: 'Español', value: 'es'},
  {label: 'हिन्दी', value: 'hi'},
  {label: 'தமிழ்', value: 'ta'},
  {label: 'తెలుగు', value: 'te'},
  {label: 'ಕನ್ನಡ', value: 'kn'},
  {label: 'മലയാളം', value: 'ml'},
];

export default function SettingsScreen() {
  const navigation = useNavigation();
  const {colors, fontSize} = useTheme();
  const {themeMode, setThemeMode, setFontSize, bibleVersion, setBibleVersion, language, setLanguage} =
    useAppSettings();

  const handleSetLanguage = (lang: AppLanguage | 'auto') => {
    setLanguage(lang);
    const resolved = lang === 'auto' ? undefined : lang;
    if (resolved) {
      i18n.changeLanguage(resolved).catch(() => {});
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: colors.background}]}
      edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, {borderBottomColor: colors.border}]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, {color: colors.text, fontSize: fontSize + 2}]}>
            Settings
          </Text>
          <Text style={[styles.headerSub, {color: colors.textSecondary, fontSize: fontSize - 5}]}>
            Appearance
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.closeBtn, {backgroundColor: colors.surface}]}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
          accessibilityLabel="Close settings">
          <Icons name="close" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Text size */}
        <Text style={[styles.sectionLabel, {color: colors.primary, fontSize: fontSize - 6}]}>
          TEXT SIZE
        </Text>
        <View style={[styles.segmentContainer, {backgroundColor: colors.surface}]}>
          {FONT_SIZES.map(opt => {
            const isActive = fontSize === opt.size;
            return (
              <TouchableOpacity
                key={opt.size}
                style={[
                  styles.segmentBtn,
                  isActive && {backgroundColor: colors.primary},
                ]}
                onPress={() => setFontSize(opt.size)}
                accessibilityLabel={opt.a11y}>
                <Text
                  style={[
                    styles.fontSizeLabel,
                    {
                      fontSize: opt.size - 4,
                      color: isActive ? '#FFFFFF' : colors.text,
                    },
                  ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Theme */}
        <Text style={[styles.sectionLabel, {color: colors.primary, fontSize: fontSize - 6}]}>
          THEME
        </Text>
        <View style={[styles.segmentContainer, {backgroundColor: colors.surface}]}>
          {THEME_MODES.map(opt => {
            const isActive = themeMode === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.segmentBtn,
                  isActive && {backgroundColor: colors.primary},
                ]}
                onPress={() => setThemeMode(opt.value)}
                accessibilityLabel={opt.a11y}>
                <Text
                  style={[
                    styles.optionLabel,
                    {
                      fontSize: fontSize - 4,
                      color: isActive ? '#FFFFFF' : colors.text,
                    },
                  ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bible Version */}
        <Text style={[styles.sectionLabel, {color: colors.primary, fontSize: fontSize - 6}]}>
          BIBLE VERSION
        </Text>
        <View style={[styles.segmentContainer, {backgroundColor: colors.surface}]}>
          {BIBLE_VERSIONS.map(opt => {
            const isActive = bibleVersion === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.segmentBtn,
                  isActive && {backgroundColor: colors.primary},
                ]}
                onPress={() => setBibleVersion(opt.value)}
                accessibilityLabel={opt.a11y}>
                <Text
                  style={[
                    styles.optionLabel,
                    {
                      fontSize: fontSize - 4,
                      color: isActive ? '#FFFFFF' : colors.text,
                    },
                  ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Language */}
        <Text style={[styles.sectionLabel, {color: colors.primary, fontSize: fontSize - 6}]}>
          LANGUAGE
        </Text>
        <View style={styles.languageGrid}>
          {LANGUAGES.map(opt => {
            const isActive = language === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.langBtn,
                  {
                    backgroundColor: isActive ? colors.primary : colors.surface,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleSetLanguage(opt.value)}
                accessibilityLabel={opt.label}>
                <Text
                  style={[
                    styles.langLabel,
                    {
                      fontSize: fontSize - 5,
                      color: isActive ? '#FFFFFF' : colors.text,
                    },
                  ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    gap: 2,
  },
  headerTitle: {
    fontFamily: 'Roboto',
    fontWeight: '700',
  },
  headerSub: {
    fontFamily: 'Roboto',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  sectionLabel: {
    fontFamily: 'Roboto',
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  fontSizeLabel: {
    fontFamily: 'Roboto',
    fontWeight: '700',
  },
  optionLabel: {
    fontFamily: 'Roboto',
    fontWeight: '500',
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  langBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  langLabel: {
    fontFamily: 'Roboto',
    fontWeight: '500',
  },
});
