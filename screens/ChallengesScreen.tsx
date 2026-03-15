import React, {useCallback, useEffect, useState} from 'react';
import {
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {spacing, useTheme, shape} from '../theme';
import {M3Card, M3Divider, M3FilledButton, M3IconButton, M3Pressable, M3TextButton} from '../components/M3';
import Icons from '../components/Icons';
import {
  CHALLENGE_DEFS,
  getAllProgress,
  startChallenge,
  resetChallenge,
  type ChallengeDef,
  type AllChallengeProgress,
  type ChallengeId,
} from '../services/challengesService';
import type {RootStackParamList} from '../App';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Challenges'>;

function ProgressBar({done, total}: {done: number; total: number}) {
  const {colors} = useTheme();
  const pct = total > 0 ? done / total : 0;
  return (
    <View style={[styles.progressTrack, {backgroundColor: colors.surfaceVariant}]}>
      <View
        style={[
          styles.progressFill,
          {backgroundColor: colors.primary, width: `${Math.round(pct * 100)}%`},
        ]}
      />
    </View>
  );
}

function ChallengeCard({
  def,
  progress,
  onPress,
}: {
  def: ChallengeDef;
  progress?: AllChallengeProgress[ChallengeId];
  onPress: () => void;
}) {
  const {t} = useTranslation();
  const {colors, type} = useTheme();
  const done = progress?.completedChapters.length ?? 0;
  const total = def.chapters.length;
  const completed = progress?.completed ?? false;
  const started = Boolean(progress && !completed);

  return (
    <M3Pressable onPress={onPress}>
      <M3Card
        variant={completed ? 'filled' : 'elevated'}
        style={styles.challengeCard}>
        <View style={styles.challengeTop}>
          <Text style={styles.challengeEmoji}>{def.icon}</Text>
          <View style={styles.challengeInfo}>
            <Text style={[type.titleMedium, {color: colors.onSurface}]}>
              {t(def.i18nKey)}
            </Text>
            <Text style={[type.bodySmall, {color: colors.onSurfaceVariant, marginTop: 2}]}>
              {def.days} {t('days').toLowerCase()} · {t('challengeProgress', {done, total})}
            </Text>
          </View>
          {completed && <Icons name="check-circle" size={22} color={colors.primary} />}
          {!completed && started && <Icons name="chevron-right" size={20} color={colors.onSurfaceVariant} />}
          {!completed && !started && <Icons name="play-arrow" size={20} color={colors.onSurfaceVariant} />}
        </View>
        {(started || completed) && (
          <View style={{marginTop: spacing.sm}}>
            <ProgressBar done={done} total={total} />
          </View>
        )}
      </M3Card>
    </M3Pressable>
  );
}

export default function ChallengesScreen() {
  const navigation = useNavigation<NavProp>();
  const {t} = useTranslation();
  const {colors, type} = useTheme();
  const [allProgress, setAllProgress] = useState<AllChallengeProgress>({});
  const [selectedDef, setSelectedDef] = useState<ChallengeDef | null>(null);

  const reload = useCallback(() => {
    getAllProgress().then(setAllProgress).catch(() => {});
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleStart = useCallback(async (id: ChallengeId) => {
    await startChallenge(id).catch(() => {});
    reload();
  }, [reload]);

  const handleReset = useCallback(async (id: ChallengeId) => {
    await resetChallenge(id).catch(() => {});
    reload();
  }, [reload]);

  const handleChapterTap = useCallback((chapter: number) => {
    setSelectedDef(null);
    // Navigate home to that chapter
    navigation.navigate('Home', {chapter, verse: 0});
  }, [navigation]);

  const selected = selectedDef;
  const selectedProgress = selected ? allProgress[selected.id] : undefined;
  const isStarted = Boolean(selectedProgress && !selectedProgress.completed);
  const isCompleted = selectedProgress?.completed ?? false;

  return (
    <SafeAreaView edges={['top']} style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={[styles.header, {backgroundColor: colors.surface}]}>
        <M3IconButton onPress={() => navigation.goBack()} accessibilityLabel={t('close')}>
          <Icons name="arrow-back" size={24} color={colors.onSurface} />
        </M3IconButton>
        <Text style={[type.titleLarge, {color: colors.onSurface, flex: 1, marginLeft: spacing.sm}]}>
          {t('challengesTitle')}
        </Text>
      </View>
      <M3Divider />

      <FlatList
        data={CHALLENGE_DEFS}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({item}) => (
          <ChallengeCard
            def={item}
            progress={allProgress[item.id]}
            onPress={() => setSelectedDef(item)}
          />
        )}
      />

      {/* Challenge Detail Bottom Sheet */}
      <Modal
        visible={Boolean(selected)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedDef(null)}>
        <TouchableOpacity
          style={[styles.modalBackdrop, {backgroundColor: colors.scrim + '99'}]}
          activeOpacity={1}
          onPress={() => setSelectedDef(null)}
        />
        {selected && (
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.surface,
                borderTopLeftRadius: shape.extraLarge,
                borderTopRightRadius: shape.extraLarge,
              },
            ]}>
            <View style={styles.sheetHandle} />

            {/* Title */}
            <View style={styles.sheetTitleRow}>
              <Text style={styles.sheetEmoji}>{selected.icon}</Text>
              <View style={{flex: 1}}>
                <Text style={[type.titleLarge, {color: colors.onSurface}]}>
                  {t(selected.i18nKey)}
                </Text>
                <Text style={[type.bodySmall, {color: colors.onSurfaceVariant, marginTop: 2}]}>
                  {selected.days} {t('days').toLowerCase()} · {selected.chapters.length} {t('chapters').toLowerCase()}
                </Text>
              </View>
            </View>

            <Text style={[type.bodyMedium, {color: colors.onSurfaceVariant, paddingHorizontal: spacing.lg, marginBottom: spacing.md}]}>
              {t(selected.i18nDescKey)}
            </Text>

            {(isStarted || isCompleted) && (
              <View style={{paddingHorizontal: spacing.lg, marginBottom: spacing.md}}>
                <ProgressBar
                  done={selectedProgress?.completedChapters.length ?? 0}
                  total={selected.chapters.length}
                />
                <Text style={[type.labelSmall, {color: colors.onSurfaceVariant, marginTop: 4}]}>
                  {t('challengeProgress', {
                    done: selectedProgress?.completedChapters.length ?? 0,
                    total: selected.chapters.length,
                  })}
                </Text>
              </View>
            )}

            <M3Divider />

            {/* Chapter list */}
            <ScrollView style={styles.chapterList}>
              {selected.chapters.map((ch, idx) => {
                const isDone = selectedProgress?.completedChapters.includes(ch) ?? false;
                return (
                  <M3Pressable key={`${ch}-${idx}`} onPress={() => handleChapterTap(ch)}>
                    <View style={[styles.chapterRow, {borderBottomColor: colors.outlineVariant}]}>
                      <Icons
                        name={isDone ? 'check-circle' : 'circle-outline'}
                        size={18}
                        color={isDone ? colors.primary : colors.onSurfaceVariant}
                      />
                      <Text style={[type.bodyLarge, {color: colors.onSurface, marginLeft: spacing.sm, flex: 1}]}>
                        {t('psalmTitle', {chapter: ch})}
                      </Text>
                      <Icons name="chevron-right" size={18} color={colors.onSurfaceVariant} />
                    </View>
                  </M3Pressable>
                );
              })}
            </ScrollView>

            <M3Divider />

            <View style={styles.sheetFooter}>
              {isCompleted ? (
                <>
                  <Text style={[type.labelLarge, {color: colors.primary}]}>{t('challengeCompleted')}</Text>
                  <M3TextButton
                    label={t('close')}
                    onPress={() => { handleReset(selected.id); setSelectedDef(null); }}
                  />
                </>
              ) : isStarted ? (
                <>
                  <M3TextButton label={t('close')} onPress={() => setSelectedDef(null)} />
                </>
              ) : (
                <>
                  <M3TextButton label={t('close')} onPress={() => setSelectedDef(null)} />
                  <M3FilledButton
                    label={t('challengeStart')}
                    onPress={() => { handleStart(selected.id); setSelectedDef(null); }}
                  />
                </>
              )}
            </View>
          </View>
        )}
      </Modal>
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
  list: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  challengeCard: {
    padding: spacing.md,
  },
  challengeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  challengeEmoji: {
    fontSize: 36,
  },
  challengeInfo: {
    flex: 1,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '80%',
    paddingBottom: spacing.lg,
  },
  sheetHandle: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
    alignSelf: 'center',
    marginVertical: spacing.sm,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  sheetEmoji: {
    fontSize: 40,
  },
  chapterList: {
    maxHeight: 260,
    paddingHorizontal: spacing.md,
  },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.xs,
  },
  sheetFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
});
