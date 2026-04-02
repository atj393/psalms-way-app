import React, {useCallback, useRef, useState} from 'react';
import {
  Animated,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, {type DateTimePickerEvent} from '@react-native-community/datetimepicker';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect, useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {getShadowStyle, shape, spacing, useTheme} from '../theme';
import {M3Card, M3Divider, M3FilledButton, M3IconButton, M3TonalButton} from '../components/M3';
import Icons from '../components/Icons';
import {
  CHALLENGE_DEFS,
  getProgress,
  getNextDayIndex,
  canReadToday,
  markDayComplete,
  startChallenge,
  resetChallenge,
  type ChallengeId,
  type ChallengeProgress,
} from '../services/challengesService';
import {
  scheduleChallengeNotification,
  cancelChallengeNotification,
} from '../services/notificationService';
import {getVerse} from '../services/psalmsService';
import {useAppSettings} from '../context/AppSettingsContext';
import type {RootStackParamList} from '../App';

type DetailRoute = RouteProp<RootStackParamList, 'ChallengeDetail'>;
type DetailNav = NativeStackNavigationProp<RootStackParamList, 'ChallengeDetail'>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(hour: number, minute: number, t: (k: string) => string): string {
  const h = hour % 12 || 12;
  const m = String(minute).padStart(2, '0');
  const ampm = hour < 12 ? t('am') : t('pm');
  return `${h}:${m} ${ampm}`;
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({done, total}: {done: number; total: number}) {
  const {colors} = useTheme();
  const pct = total > 0 ? done / total : 0;
  return (
    <View style={[styles.progressTrack, {backgroundColor: colors.surfaceVariant}]}>
      <View
        style={[styles.progressFill, {backgroundColor: colors.primary, width: `${Math.round(pct * 100)}%`}]}
      />
    </View>
  );
}

// ─── Day Complete Card ────────────────────────────────────────────────────────

function DayCompleteCard({
  visible,
  dayNumber,
  daysLeft,
  allDone,
  onDismiss,
}: {
  visible: boolean;
  dayNumber: number;
  daysLeft: number;
  allDone: boolean;
  onDismiss: () => void;
}) {
  const {t} = useTranslation();
  const {colors, type} = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.75)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.75);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, {toValue: 1, useNativeDriver: true, tension: 80, friction: 6}),
        Animated.timing(opacityAnim, {toValue: 1, duration: 200, useNativeDriver: true}),
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim]);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onDismiss}>
      <TouchableOpacity style={styles.cardBackdrop} activeOpacity={1} onPress={onDismiss} />
      <View style={styles.cardCenter} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.dayCard,
            {backgroundColor: colors.surface, borderRadius: shape.extraLarge, opacity: opacityAnim, transform: [{scale: scaleAnim}], ...getShadowStyle(8)},
          ]}>
          <Text style={styles.dayCardEmoji}>{allDone ? '👑' : '🎉'}</Text>
          <Text style={[type.headlineSmall, {color: colors.onSurface, textAlign: 'center', marginTop: spacing.md}]}>
            {allDone ? t('challengeAllDone') : t('challengeDayComplete', {day: dayNumber})}
          </Text>
          {!allDone && (
            <>
              <Text style={[type.bodyLarge, {color: colors.primary, textAlign: 'center', marginTop: spacing.sm, fontWeight: '600'}]}>
                {daysLeft === 1 ? t('challengeOneMoreDay') : t('challengeDaysLeft', {count: daysLeft})}
              </Text>
              <Text style={[type.bodyMedium, {color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.xs}]}>
                {t('challengeSeeYouTomorrow')}
              </Text>
            </>
          )}
          <M3FilledButton label={t('awesome')} onPress={onDismiss} style={styles.dayCardBtn} />
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ChallengeDetailScreen() {
  const route = useRoute<DetailRoute>();
  const navigation = useNavigation<DetailNav>();
  const {t} = useTranslation();
  const {colors, type} = useTheme();
  const {bibleVersion, notificationHour, notificationMinute} = useAppSettings();

  const {challengeId} = route.params;
  const def = CHALLENGE_DEFS.find(d => d.id === challengeId)!;

  const [progress, setProgress] = useState<ChallengeProgress | undefined>();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerHour, setPickerHour] = useState(notificationHour);
  const [pickerMinute, setPickerMinute] = useState(notificationMinute);
  const [dayCardVisible, setDayCardVisible] = useState(false);
  const [dayCardData, setDayCardData] = useState({day: 1, daysLeft: 0, allDone: false});

  const reload = useCallback(() => {
    getProgress(challengeId).then(setProgress).catch(() => {});
  }, [challengeId]);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  // ── Derived state ────────────────────────────────────────────────────────────
  const isCompleted = progress?.completed ?? false;
  const isStarted = Boolean(progress && !isCompleted);
  const doneCount = progress?.completedDays.length ?? 0;
  const totalDays = def.chapters.length;

  // Next unread day
  const todayDayIndex = isStarted && progress ? getNextDayIndex(progress) : -1;
  const todayAssignment = todayDayIndex >= 0 && progress ? progress.dayAssignments[todayDayIndex] : null;
  const todayVerse = todayAssignment
    ? getVerse(todayAssignment.chapter, todayAssignment.verseNumber, bibleVersion)
    : null;

  // One-per-day gate: can the user read today?
  const readAllowed = isStarted && progress ? canReadToday(progress) : false;
  // Today's slot is exhausted but challenge not yet done
  const waitingForTomorrow = isStarted && !isCompleted && !readAllowed;

  // ── Time picker ──────────────────────────────────────────────────────────────
  const pickerDate = new Date();
  pickerDate.setHours(pickerHour, pickerMinute, 0, 0);

  const handleTimeChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (date) {
      setPickerHour(date.getHours());
      setPickerMinute(date.getMinutes());
    }
  };

  // ── Start challenge ───────────────────────────────────────────────────────────
  const handleStartChallenge = useCallback(async () => {
    const newProgress = await startChallenge(challengeId, pickerHour, pickerMinute, bibleVersion);
    reload();
    const firstAssignment = newProgress.dayAssignments[0];
    if (firstAssignment) {
      const verseResult = getVerse(firstAssignment.chapter, firstAssignment.verseNumber, bibleVersion);
      if (verseResult) {
        await scheduleChallengeNotification(
          challengeId, t(def.i18nKey), pickerHour, pickerMinute, verseResult.verse,
        ).catch(() => {});
      }
    }
  }, [challengeId, pickerHour, pickerMinute, bibleVersion, def.i18nKey, t, reload]);

  // ── Restart ───────────────────────────────────────────────────────────────────
  const handleRestart = useCallback(async () => {
    await cancelChallengeNotification(challengeId).catch(() => {});
    await resetChallenge(challengeId).catch(() => {});
    reload();
  }, [challengeId, reload]);

  // ── Mark as read ──────────────────────────────────────────────────────────────
  const handleMarkRead = useCallback(async () => {
    if (todayDayIndex < 0 || !progress) return;
    const result = await markDayComplete(challengeId, todayDayIndex);
    if (result.blocked) return; // already done today (shouldn't happen if button is hidden, but safe)
    reload();
    setDayCardData({day: result.completedDayIndex + 1, daysLeft: result.daysLeft, allDone: result.challengeJustCompleted});
    setDayCardVisible(true);
    if (result.challengeJustCompleted) {
      await cancelChallengeNotification(challengeId).catch(() => {});
    }
  }, [todayDayIndex, progress, challengeId, reload]);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView edges={['top']} style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={[styles.header, {backgroundColor: colors.surface}]}>
        <M3IconButton onPress={() => navigation.goBack()} accessibilityLabel={t('close')}>
          <Icons name="arrow-back" size={24} color={colors.onSurface} />
        </M3IconButton>
        <Text style={[type.titleLarge, {color: colors.onSurface, flex: 1, marginLeft: spacing.sm}]}>
          {t(def.i18nKey)}
        </Text>
        <Text style={styles.defEmoji}>{def.icon}</Text>
      </View>
      <M3Divider />

      <ScrollView contentContainerStyle={styles.content}>

        {/* ══ IN PROGRESS ══════════════════════════════════════════════════════ */}
        {isStarted && (
          <>
            {/* Progress row */}
            <View style={[styles.progressCard, {backgroundColor: colors.secondaryContainer, borderRadius: 16}]}>
              <View style={styles.progressRow}>
                <View style={{flex: 1}}>
                  <Text style={[type.titleMedium, {color: colors.onSecondaryContainer, fontWeight: '700'}]}>
                    {t('challengeDay', {day: doneCount + (todayDayIndex >= 0 ? 1 : doneCount), total: totalDays})}
                  </Text>
                  <Text style={[type.bodySmall, {color: colors.onSecondaryContainer, opacity: 0.8, marginTop: 2}]}>
                    {t('challengeProgress', {done: doneCount, total: totalDays})}
                  </Text>
                </View>
                {progress?.notifHour !== undefined && (
                  <Text style={[type.labelSmall, {color: colors.onSecondaryContainer, opacity: 0.7}]}>
                    🔔 {formatTime(progress.notifHour, progress.notifMinute, t)}
                  </Text>
                )}
              </View>
              <View style={{marginTop: spacing.sm}}>
                <ProgressBar done={doneCount} total={totalDays} />
              </View>
            </View>

            {/* ── Waiting for tomorrow ── */}
            {waitingForTomorrow && (
              <View style={[styles.tomorrowCard, {backgroundColor: colors.surfaceVariant, borderRadius: 16}]}>
                <Text style={styles.tomorrowEmoji}>🌙</Text>
                <Text style={[type.titleMedium, {color: colors.onSurface, textAlign: 'center'}]}>
                  {t('challengeAlreadyDone')}
                </Text>
                <Text style={[type.bodySmall, {color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.xs}]}>
                  {t('challengeSeeYouTomorrow')}
                </Text>
              </View>
            )}

            {/* ── Today's verse (HERO) ── */}
            {readAllowed && todayAssignment && todayVerse && (
              <View style={styles.verseSection}>
                <Text style={[type.labelLarge, {color: colors.primary, letterSpacing: 1, marginBottom: spacing.sm}]}>
                  {t('challengeTodaysVerse').toUpperCase()}
                </Text>
                <Text style={[type.labelMedium, {color: colors.onSurfaceVariant, marginBottom: spacing.sm}]}>
                  {t('psalmSubtitle', {chapter: todayAssignment.chapter, verse: todayAssignment.verseNumber})}
                </Text>
                <M3Card variant="elevated" style={styles.verseCard}>
                  <Text style={[type.bodyLarge, {color: colors.onSurface, lineHeight: 28, fontSize: 18}]}>
                    "{todayVerse.verse}"
                  </Text>
                </M3Card>
                <M3FilledButton
                  label={t('markAsRead')}
                  onPress={handleMarkRead}
                  style={styles.markBtn}
                />
              </View>
            )}

            {/* Description (below the action) */}
            <Text style={[type.bodyMedium, {color: colors.onSurfaceVariant, marginTop: spacing.sm, lineHeight: 22}]}>
              {t(def.i18nDescKey)}
            </Text>

            {/* Completed days log */}
            {progress && progress.completedDays.length > 0 && (
              <View style={styles.pastDaysSection}>
                <M3Divider style={{marginBottom: spacing.md}} />
                <Text style={[type.labelLarge, {color: colors.primary, letterSpacing: 1, marginBottom: spacing.sm}]}>
                  {t('challengePastDays').toUpperCase()}
                </Text>
                {progress.completedDays
                  .slice().sort((a, b) => a - b)
                  .map(dayIdx => {
                    const assignment = progress.dayAssignments[dayIdx];
                    return (
                      <View key={dayIdx} style={[styles.pastDayRow, {borderBottomColor: colors.outlineVariant}]}>
                        <Icons name="check-circle" size={16} color={colors.primary} />
                        <Text style={[type.bodySmall, {color: colors.onSurface, marginLeft: spacing.sm, flex: 1}]}>
                          {t('challengeDayNumber', {day: dayIdx + 1})} — {t('psalmTitle', {chapter: assignment?.chapter ?? 0})}
                        </Text>
                      </View>
                    );
                  })}
              </View>
            )}
          </>
        )}

        {/* ══ NOT STARTED ══════════════════════════════════════════════════════ */}
        {!isStarted && !isCompleted && (
          <>
            {/* Hero */}
            <View style={[styles.heroBanner, {backgroundColor: colors.primaryContainer}]}>
              <Text style={styles.heroEmoji}>{def.icon}</Text>
              <View style={{flex: 1}}>
                <Text style={[type.titleLarge, {color: colors.onPrimaryContainer, fontWeight: '700'}]}>
                  {t(def.i18nKey)}
                </Text>
                <Text style={[type.bodySmall, {color: colors.onPrimaryContainer, opacity: 0.8, marginTop: 2}]}>
                  {def.days} {t('days').toLowerCase()} · {def.chapters.length} {t('chapters').toLowerCase()}
                </Text>
              </View>
            </View>

            {/* Description */}
            <Text style={[type.bodyLarge, {color: colors.onSurfaceVariant, marginBottom: spacing.lg, lineHeight: 24}]}>
              {t(def.i18nDescKey)}
            </Text>

            {/* Reminder time + start */}
            <View style={[styles.startSection, {backgroundColor: colors.surfaceVariant, borderRadius: 16}]}>
              <Text style={[type.titleMedium, {color: colors.onSurface, marginBottom: spacing.xs}]}>
                {t('challengeSetTime')}
              </Text>
              <Text style={[type.bodySmall, {color: colors.onSurfaceVariant, marginBottom: spacing.md}]}>
                {t('challengeTimeDesc', {time: formatTime(pickerHour, pickerMinute, t)})}
              </Text>

              <TouchableOpacity
                style={[styles.timeRow, {backgroundColor: colors.surface, borderRadius: 12}]}
                onPress={() => setShowTimePicker(true)}>
                <View style={{flex: 1}}>
                  <Text style={[type.labelLarge, {color: colors.onSurface}]}>{t('reminderTime')}</Text>
                  <Text style={[type.bodyMedium, {color: colors.primary}]}>
                    {t('everyDayAt', {time: formatTime(pickerHour, pickerMinute, t)})}
                  </Text>
                </View>
                <Icons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
              </TouchableOpacity>

              {showTimePicker && (
                <DateTimePicker
                  value={pickerDate}
                  mode="time"
                  is24Hour={false}
                  display="default"
                  onChange={handleTimeChange}
                />
              )}

              <M3FilledButton
                label={t('challengeStart')}
                onPress={handleStartChallenge}
                style={styles.startBtn}
              />
            </View>
          </>
        )}

        {/* ══ COMPLETED ════════════════════════════════════════════════════════ */}
        {isCompleted && (
          <>
            <View style={[styles.completedBanner, {backgroundColor: colors.primaryContainer, borderRadius: 16}]}>
              <Text style={styles.completedEmoji}>👑</Text>
              <Text style={[type.headlineSmall, {color: colors.onPrimaryContainer, textAlign: 'center', fontWeight: '700'}]}>
                {t('challengeAllDone')}
              </Text>
              {progress?.completedDate && (
                <Text style={[type.bodySmall, {color: colors.onPrimaryContainer, opacity: 0.8, textAlign: 'center', marginTop: spacing.xs}]}>
                  {new Date(progress.completedDate).toLocaleDateString(undefined, {month: 'long', day: 'numeric', year: 'numeric'})}
                </Text>
              )}
            </View>
            <Text style={[type.bodyMedium, {color: colors.onSurfaceVariant, marginVertical: spacing.lg, lineHeight: 22}]}>
              {t(def.i18nDescKey)}
            </Text>
            <M3TonalButton
              label={t('challengeRestart')}
              onPress={handleRestart}
              style={styles.restartBtn}
            />
          </>
        )}
      </ScrollView>

      <DayCompleteCard
        visible={dayCardVisible}
        dayNumber={dayCardData.day}
        daysLeft={dayCardData.daysLeft}
        allDone={dayCardData.allDone}
        onDismiss={() => setDayCardVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 56,
  },
  defEmoji: {fontSize: 28, marginRight: spacing.sm},
  content: {padding: spacing.lg, paddingBottom: 60},

  // Progress card (in progress)
  progressCard: {padding: spacing.md, marginBottom: spacing.lg},
  progressRow: {flexDirection: 'row', alignItems: 'center'},
  progressTrack: {height: 8, borderRadius: 4, overflow: 'hidden'},
  progressFill: {height: 8, borderRadius: 4},

  // Waiting for tomorrow
  tomorrowCard: {
    alignItems: 'center',
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  tomorrowEmoji: {fontSize: 48, marginBottom: spacing.sm},

  // Verse hero (in progress)
  verseSection: {marginBottom: spacing.lg},
  verseCard: {padding: spacing.lg, marginBottom: spacing.lg},
  markBtn: {alignSelf: 'center', minWidth: 200},

  // Completed days log
  pastDaysSection: {marginTop: spacing.sm},
  pastDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  // Not started
  heroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.lg,
  },
  heroEmoji: {fontSize: 48},
  startSection: {padding: spacing.lg},
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  startBtn: {alignSelf: 'center', minWidth: 200, marginTop: spacing.xs},

  // Completed
  completedBanner: {alignItems: 'center', padding: spacing.xl},
  completedEmoji: {fontSize: 64, marginBottom: spacing.md},
  restartBtn: {alignSelf: 'center', minWidth: 200},

  // Day card
  cardBackdrop: {...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)'},
  cardCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  dayCard: {width: '100%', maxWidth: 340, alignItems: 'center', padding: spacing.xl},
  dayCardEmoji: {fontSize: 64},
  dayCardBtn: {marginTop: spacing.xl, minWidth: 160},
});
