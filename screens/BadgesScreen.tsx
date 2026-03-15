import React, {useEffect, useState} from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {spacing, useTheme} from '../theme';
import {M3Card, M3Divider, M3IconButton} from '../components/M3';
import Icons from '../components/Icons';
import {
  BADGE_DEFS,
  getEarnedBadges,
  type BadgeDef,
  type EarnedBadges,
} from '../services/badgesService';

function BadgeItem({def, earnedDate}: {def: BadgeDef; earnedDate?: string}) {
  const {t} = useTranslation();
  const {colors, type} = useTheme();
  const earned = Boolean(earnedDate);

  const dateLabel = earnedDate
    ? new Date(earnedDate).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  if (earned) {
    // Earned badge — bright, prominent, gold accent
    return (
      <M3Card variant="filled" style={[styles.badgeCard, styles.badgeCardEarned]}>
        <View style={styles.badgeRow}>
          <View style={styles.emojiWrap}>
            <Text style={styles.badgeEmoji}>{def.icon}</Text>
          </View>
          <View style={styles.badgeInfo}>
            <Text style={[type.titleMedium, {color: colors.onSurface, fontWeight: '700'}]}>
              {t(def.i18nKey)}
            </Text>
            <Text style={[type.bodySmall, {color: colors.onSurfaceVariant, marginTop: 2}]}>
              {t(def.i18nDescKey)}
            </Text>
            {dateLabel && (
              <Text style={[type.labelSmall, {color: colors.primary, marginTop: 4}]}>
                🏆 {dateLabel}
              </Text>
            )}
          </View>
          <Icons name="check-circle" size={24} color={colors.primary} />
        </View>
      </M3Card>
    );
  }

  // Locked badge — visible but clearly not yet achieved
  return (
    <M3Card variant="outlined" style={styles.badgeCard}>
      <View style={styles.badgeRow}>
        <View style={[styles.emojiWrap, styles.emojiWrapLocked]}>
          <Text style={[styles.badgeEmoji, {opacity: 0.35}]}>{def.icon}</Text>
        </View>
        <View style={styles.badgeInfo}>
          <Text style={[type.titleMedium, {color: colors.onSurfaceVariant}]}>
            {t(def.i18nKey)}
          </Text>
          <Text style={[type.bodySmall, {color: colors.onSurfaceVariant, marginTop: 2, opacity: 0.7}]}>
            {t(def.i18nDescKey)}
          </Text>
          <View style={styles.lockedRow}>
            <Icons name="circle-outline" size={12} color={colors.onSurfaceVariant} />
            <Text style={[type.labelSmall, {color: colors.onSurfaceVariant, marginLeft: 4, opacity: 0.7}]}>
              {t('badgeLocked')}
            </Text>
          </View>
        </View>
      </View>
    </M3Card>
  );
}

export default function BadgesScreen() {
  const navigation = useNavigation();
  const {t} = useTranslation();
  const {colors, type} = useTheme();
  const [earned, setEarned] = useState<EarnedBadges>({});

  useEffect(() => {
    getEarnedBadges().then(setEarned).catch(() => {});
  }, []);

  const earnedCount = Object.keys(earned).length;

  return (
    <SafeAreaView edges={['top']} style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={[styles.header, {backgroundColor: colors.surface}]}>
        <M3IconButton onPress={() => navigation.goBack()} accessibilityLabel={t('close')}>
          <Icons name="arrow-back" size={24} color={colors.onSurface} />
        </M3IconButton>
        <Text style={[type.titleLarge, {color: colors.onSurface, flex: 1, marginLeft: spacing.sm}]}>
          {t('badgesTitle')}
        </Text>
        <View style={styles.countChip}>
          <Text style={[type.labelMedium, {color: colors.primary}]}>
            {earnedCount}/{BADGE_DEFS.length}
          </Text>
        </View>
      </View>
      <M3Divider />

      <FlatList
        data={BADGE_DEFS}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({item}) => (
          <BadgeItem def={item} earnedDate={earned[item.id]} />
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
  countChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  list: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  badgeCard: {
    padding: spacing.md,
  },
  badgeCardEarned: {
    // M3 filled card already has a surface tint — no extra opacity
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  emojiWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  emojiWrapLocked: {
    // faint background for locked
    backgroundColor: 'rgba(128,128,128,0.1)',
  },
  badgeEmoji: {
    fontSize: 36,
  },
  badgeInfo: {
    flex: 1,
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
});
