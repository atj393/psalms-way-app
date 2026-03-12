import React from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {spacing, useTheme, type ThemeMode} from '../theme';
import {useAppSettings} from '../context/AppSettingsContext';
import Icons from '../components/Icons';

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

export default function SettingsScreen() {
  const navigation = useNavigation();
  const {colors, fontSize} = useTheme();
  const {themeMode, setThemeMode, setFontSize} = useAppSettings();

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
});
