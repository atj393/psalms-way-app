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

  return (
    <M3Card
      variant={earned ? 'filled' : 'outlined'}
      style={[styles.badgeCard, !earned && {opacity: 0.45}]}>
      <View style={styles.badgeRow}>
        <Text style={styles.badgeEmoji}>{def.icon}</Text>
        <View style={styles.badgeInfo}>
          <Text style={[type.titleMedium, {color: earned ? colors.onSurface : colors.onSurfaceVariant}]}>
            {t(def.i18nKey)}
          </Text>
          <Text style={[type.bodySmall, {color: colors.onSurfaceVariant, marginTop: 2}]}>
            {t(def.i18nDescKey)}
          </Text>
          {earned && dateLabel ? (
            <Text style={[type.labelSmall, {color: colors.primary, marginTop: 4}]}>
              {dateLabel}
            </Text>
          ) : !earned ? (
            <Text style={[type.labelSmall, {color: colors.onSurfaceVariant, marginTop: 4}]}>
              {t('badgeLocked')}
            </Text>
          ) : null}
        </View>
        {earned && (
          <Icons name="check-circle" size={22} color={colors.primary} />
        )}
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
        <Text style={[type.labelLarge, {color: colors.primary}]}>
          {earnedCount}/{BADGE_DEFS.length}
        </Text>
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
  list: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  badgeCard: {
    padding: spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  badgeEmoji: {
    fontSize: 40,
  },
  badgeInfo: {
    flex: 1,
  },
});
