import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTheme, type ThemeMode} from '../theme';
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
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={[styles.header, {borderBottomColor: colors.border}]}>
        <Text style={[styles.headerTitle, {color: colors.text, fontSize: fontSize}]}>
          Settings
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
          accessibilityLabel="Close settings">
          <Icons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Text size */}
        <Text style={[styles.sectionLabel, {color: colors.textSecondary, fontSize: fontSize - 6}]}>
          TEXT SIZE
        </Text>
        <View style={[styles.optionRow, {borderColor: colors.border, backgroundColor: colors.surface}]}>
          {FONT_SIZES.map(opt => {
            const isActive = fontSize === opt.size;
            return (
              <TouchableOpacity
                key={opt.size}
                style={[
                  styles.optionBtn,
                  {borderColor: colors.border},
                  isActive && {backgroundColor: colors.text},
                ]}
                onPress={() => setFontSize(opt.size)}
                accessibilityLabel={opt.a11y}>
                <Text
                  style={[
                    styles.fontSizeLabel,
                    {
                      fontSize: opt.size - 4,
                      color: isActive ? colors.background : colors.text,
                    },
                  ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Theme */}
        <Text style={[styles.sectionLabel, {color: colors.textSecondary, fontSize: fontSize - 6}]}>
          THEME
        </Text>
        <View style={[styles.optionRow, {borderColor: colors.border, backgroundColor: colors.surface}]}>
          {THEME_MODES.map(opt => {
            const isActive = themeMode === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.optionBtn,
                  {borderColor: colors.border},
                  isActive && {backgroundColor: colors.text},
                ]}
                onPress={() => setThemeMode(opt.value)}
                accessibilityLabel={opt.a11y}>
                <Text
                  style={[
                    styles.optionLabel,
                    {
                      fontSize: fontSize - 4,
                      color: isActive ? colors.background : colors.text,
                    },
                  ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontFamily: 'Roboto',
    fontWeight: '600',
  },
  body: {
    padding: 20,
    gap: 10,
  },
  sectionLabel: {
    fontFamily: 'Roboto',
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 4,
    marginTop: 10,
  },
  optionRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  optionBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
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
