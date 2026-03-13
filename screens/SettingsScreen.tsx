import React, {useState} from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import DateTimePicker, {type DateTimePickerEvent} from '@react-native-community/datetimepicker';
import {shape, spacing, useTheme, type ThemeMode} from '../theme';
import {useAppSettings, type BibleVersion, type AppLanguage} from '../context/AppSettingsContext';
import Icons from '../components/Icons';
import i18n from '../i18n';
import {
  requestNotificationPermission,
  scheduleDailyNotification,
  cancelDailyNotification,
} from '../services/notificationService';
import {M3Card, M3Divider, M3IconButton, M3SegmentedButton, M3Chip} from '../components/M3';

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

function formatTime(hour: number, minute: number): string {
  const h = hour % 12 || 12;
  const m = String(minute).padStart(2, '0');
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${h}:${m} ${ampm}`;
}

export default function SettingsScreen() {
  const navigation = useNavigation();
  const {colors, type, isDark} = useTheme();
  const {
    themeMode,
    setThemeMode,
    fontSize,
    setFontSize,
    bibleVersion,
    setBibleVersion,
    language,
    setLanguage,
    notificationEnabled,
    notificationHour,
    notificationMinute,
    setNotificationEnabled,
    setNotificationTime,
  } = useAppSettings();

  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleSetLanguage = (lang: AppLanguage | 'auto') => {
    setLanguage(lang);
    const resolved = lang === 'auto' ? undefined : lang;
    if (resolved) {
      i18n.changeLanguage(resolved).catch(() => {});
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Permission required',
          'Please allow notifications for Psalms Way in your device settings.',
        );
        return;
      }
      await scheduleDailyNotification(notificationHour, notificationMinute, bibleVersion);
      setNotificationEnabled(true);
    } else {
      await cancelDailyNotification();
      setNotificationEnabled(false);
    }
  };

  const handleTimeChange = async (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (date) {
      const hour = date.getHours();
      const minute = date.getMinutes();
      setNotificationTime(hour, minute);
      if (notificationEnabled) {
        await scheduleDailyNotification(hour, minute, bibleVersion).catch(() => {});
      }
    }
  };

  const pickerDate = new Date();
  pickerDate.setHours(notificationHour, notificationMinute, 0, 0);

  const SectionLabel = ({label}: {label: string}) => (
    <Text style={[type.labelLarge, styles.sectionLabel, {color: colors.primary}]}>
      {label}
    </Text>
  );

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: colors.background}]}
      edges={['top', 'bottom']}>

      {/* MD3 Top App Bar */}
      <View
        style={[
          styles.appBar,
          {backgroundColor: colors.surface, elevation: isDark ? 1 : 2},
        ]}>
        <View style={styles.titleGroup}>
          <Text style={[type.titleLarge, {color: colors.onSurface}]}>Settings</Text>
          <Text style={[type.labelMedium, {color: colors.onSurfaceVariant}]}>Appearance</Text>
        </View>
        <M3IconButton
          onPress={() => navigation.goBack()}
          accessibilityLabel="Close settings">
          <Icons name="close" size={22} color={colors.onSurfaceVariant} />
        </M3IconButton>
      </View>

      <ScrollView contentContainerStyle={styles.body}>

        {/* TEXT SIZE */}
        <SectionLabel label="TEXT SIZE" />
        <M3Card variant="filled" style={styles.sectionCard}>
          <M3SegmentedButton
            options={FONT_SIZES.map(opt => ({
              label: opt.label,
              value: String(opt.size),
              a11y: opt.a11y,
            }))}
            value={String(fontSize)}
            onChange={v => setFontSize(Number(v))}
          />
        </M3Card>

        {/* THEME */}
        <SectionLabel label="THEME" />
        <M3Card variant="filled" style={styles.sectionCard}>
          <M3SegmentedButton
            options={THEME_MODES.map(opt => ({
              label: opt.label,
              value: opt.value,
              a11y: opt.a11y,
            }))}
            value={themeMode}
            onChange={v => setThemeMode(v as ThemeMode)}
          />
        </M3Card>

        {/* BIBLE VERSION */}
        <SectionLabel label="BIBLE VERSION" />
        <M3Card variant="filled" style={styles.sectionCard}>
          <M3SegmentedButton
            options={BIBLE_VERSIONS.map(opt => ({
              label: opt.label,
              value: opt.value,
              a11y: opt.a11y,
            }))}
            value={bibleVersion}
            onChange={v => setBibleVersion(v as BibleVersion)}
          />
        </M3Card>

        {/* LANGUAGE */}
        <SectionLabel label="LANGUAGE" />
        <View style={styles.chipRow}>
          {LANGUAGES.map(opt => (
            <M3Chip
              key={opt.value}
              label={opt.label}
              type="filter"
              selected={language === opt.value}
              onPress={() => handleSetLanguage(opt.value)}
            />
          ))}
        </View>

        {/* DAILY VERSE */}
        <SectionLabel label="DAILY VERSE" />
        <M3Card variant="filled" style={styles.notifCard}>
          {/* Toggle row */}
          <View style={styles.notifRow}>
            <View style={styles.notifRowLeft}>
              <Text style={[type.titleSmall, {color: colors.onSurface}]}>
                Daily verse reminder
              </Text>
              <Text style={[type.bodySmall, {color: colors.onSurfaceVariant}]}>
                Receive a psalm verse each day
              </Text>
            </View>
            <Switch
              value={notificationEnabled}
              onValueChange={handleNotificationToggle}
              trackColor={{false: colors.outlineVariant, true: colors.primary}}
              thumbColor="#FFFFFF"
            />
          </View>

          {notificationEnabled && (
            <>
              <M3Divider style={styles.notifDivider} />
              <TouchableOpacity
                style={styles.notifRow}
                onPress={() => setShowTimePicker(true)}
                accessibilityLabel="Change notification time">
                <View style={styles.notifRowLeft}>
                  <Text style={[type.titleSmall, {color: colors.onSurface}]}>
                    ⏰ Reminder time
                  </Text>
                  <Text style={[type.bodyMedium, {color: colors.primary}]}>
                    Every day at {formatTime(notificationHour, notificationMinute)}
                  </Text>
                </View>
                <Icons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </>
          )}
        </M3Card>

        {showTimePicker && (
          <DateTimePicker
            value={pickerDate}
            mode="time"
            is24Hour={false}
            display="default"
            onChange={handleTimeChange}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    minHeight: 64,
  },
  titleGroup: {
    flex: 1,
    gap: 2,
    paddingHorizontal: spacing.xs,
  },
  body: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  sectionLabel: {
    letterSpacing: 1.2,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionCard: {
    padding: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  notifCard: {
    overflow: 'hidden',
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    gap: spacing.md,
  },
  notifRowLeft: {
    flex: 1,
    gap: 2,
  },
  notifDivider: {
    marginHorizontal: spacing.md,
  },
});
