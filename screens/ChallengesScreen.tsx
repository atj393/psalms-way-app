import React, {useCallback, useEffect, useState} from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTranslation} from 'react-i18next';
import {spacing, useTheme} from '../theme';
import {M3Divider, M3IconButton, M3Pressable} from '../components/M3';
import Icons from '../components/Icons';
import {
  CHALLENGE_DEFS,
  getAllProgress,
  getNextDayIndex,
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

  const done = progress?.completedDays.length ?? 0;
  const total = def.chapters.length;
  const isCompleted = progress?.completed ?? false;
  const isStarted = Boolean(progress && !isCompleted);
  const nextDayIndex = isStarted && progress ? getNextDayIndex(progress) : -1;

  // Always use explicit colors so text is always readable regardless of card variant
  const titleColor = isCompleted ? colors.primary : colors.onSurface;
  const subtitleColor = colors.onSurfaceVariant;

  return (
    <M3Pressable onPress={onPress}>
      <View
        style={[
          styles.cardContainer,
          {
            backgroundColor: isCompleted
              ? colors.primaryContainer
              : isStarted
              ? colors.secondaryContainer
              : colors.surfaceVariant,
            borderRadius: 16,
          },
        ]}>
        {/* Top row */}
        <View style={styles.challengeTop}>
          <Text style={styles.challengeEmoji}>{def.icon}</Text>
          <View style={styles.challengeInfo}>
            <Text style={[type.titleMedium, {color: titleColor, fontWeight: '600'}]}>
              {t(def.i18nKey)}
            </Text>
            <Text style={[type.bodySmall, {color: subtitleColor, marginTop: 2}]}>
              {def.days} {t('days').toLowerCase()}
            </Text>
            {isStarted && nextDayIndex >= 0 && (
              <Text style={[type.labelSmall, {color: colors.primary, marginTop: 2}]}>
                {t('challengeDay', {day: nextDayIndex + 1, total})}
              </Text>
            )}
            {isCompleted && (
              <Text style={[type.labelSmall, {color: colors.primary, marginTop: 2}]}>
                {t('challengeCompleted')}
              </Text>
            )}
          </View>
          {isCompleted ? (
            <Icons name="check-circle" size={22} color={colors.primary} />
          ) : isStarted ? (
            <Icons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
          ) : (
            <Icons name="play-arrow" size={20} color={colors.onSurfaceVariant} />
          )}
        </View>

        {/* Progress bar */}
        {(isStarted || isCompleted) && (
          <View style={{marginTop: spacing.sm}}>
            <ProgressBar done={done} total={total} />
            <Text style={[type.labelSmall, {color: subtitleColor, marginTop: 3}]}>
              {t('challengeProgress', {done, total})}
            </Text>
          </View>
        )}
      </View>
    </M3Pressable>
  );
}

export default function ChallengesScreen() {
  const navigation = useNavigation<NavProp>();
  const {t} = useTranslation();
  const {colors, type} = useTheme();
  const [allProgress, setAllProgress] = useState<AllChallengeProgress>({});

  const reload = useCallback(() => {
    getAllProgress().then(setAllProgress).catch(() => {});
  }, []);

  // Reload whenever screen comes into focus (e.g. returning from detail page)
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

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
            onPress={() => navigation.navigate('ChallengeDetail', {challengeId: item.id})}
          />
        )}
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
  list: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardContainer: {
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
});
