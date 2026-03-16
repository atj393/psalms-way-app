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
import {M3Divider, M3IconButton} from '../components/M3';
import Icons from '../components/Icons';
import {
  BADGE_DEFS,
  getEarnedBadges,
  type BadgeDef,
  type EarnedBadges,
} from '../services/badgesService';

// ─── Badge card ───────────────────────────────────────────────────────────────

function EarnedBadgeItem({def, earnedDate}: {def: BadgeDef; earnedDate: string}) {
  const {t} = useTranslation();
  const {colors, type} = useTheme();

  const dateLabel = new Date(earnedDate).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <View
      style={[
        styles.badgeCard,
        {
          backgroundColor: colors.primaryContainer,
          borderLeftWidth: 4,
          borderLeftColor: colors.primary,
        },
      ]}>
      <View style={styles.badgeRow}>
        {/* Icon circle with solid primary background */}
        <View style={[styles.emojiWrap, {backgroundColor: colors.primary + '33'}]}>
          <Text style={styles.badgeEmoji}>{def.icon}</Text>
        </View>

        {/* Text info */}
        <View style={styles.badgeInfo}>
          <Text
            style={[
              type.titleMedium,
              {color: colors.onPrimaryContainer, fontWeight: '700'},
            ]}>
            {t(def.i18nKey)}
          </Text>
          <Text
            style={[
              type.bodySmall,
              {color: colors.onPrimaryContainer, marginTop: 2},
            ]}>
            {t(def.i18nDescKey)}
          </Text>
          <Text
            style={[
              type.labelSmall,
              {color: colors.primary, marginTop: 5, fontWeight: '700'},
            ]}>
            🏆 {dateLabel}
          </Text>
        </View>

        {/* Check icon */}
        <Icons name="check-circle" size={26} color={colors.primary} />
      </View>
    </View>
  );
}

function LockedBadgeItem({def}: {def: BadgeDef}) {
  const {t} = useTranslation();
  const {colors, type} = useTheme();

  return (
    <View
      style={[
        styles.badgeCard,
        {backgroundColor: colors.surfaceVariant},
      ]}>
      <View style={styles.badgeRow}>
        {/* Greyed emoji */}
        <View style={[styles.emojiWrap, {backgroundColor: colors.onSurface + '0F'}]}>
          <Text style={[styles.badgeEmoji, {opacity: 0.3}]}>{def.icon}</Text>
        </View>

        {/* Text info — full opacity for readability */}
        <View style={styles.badgeInfo}>
          <Text style={[type.titleMedium, {color: colors.onSurfaceVariant}]}>
            {t(def.i18nKey)}
          </Text>
          <Text style={[type.bodySmall, {color: colors.onSurfaceVariant, marginTop: 2}]}>
            {t(def.i18nDescKey)}
          </Text>
          <Text
            style={[
              type.labelSmall,
              {color: colors.onSurfaceVariant, marginTop: 5},
            ]}>
            🔒 {t('badgeLocked')}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({label, count}: {label: string; count: number}) {
  const {colors, type} = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text
        style={[
          type.labelLarge,
          {color: colors.primary, fontWeight: '700', letterSpacing: 1},
        ]}>
        {label.toUpperCase()}
      </Text>
      <View
        style={[styles.sectionChip, {backgroundColor: colors.primaryContainer}]}>
        <Text
          style={[
            type.labelSmall,
            {color: colors.onPrimaryContainer, fontWeight: '700'},
          ]}>
          {count}
        </Text>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

type ListItem =
  | {kind: 'header'; label: string; count: number}
  | {kind: 'earned'; def: BadgeDef; earnedDate: string}
  | {kind: 'locked'; def: BadgeDef};

export default function BadgesScreen() {
  const navigation = useNavigation();
  const {t} = useTranslation();
  const {colors, type} = useTheme();
  const [earned, setEarned] = useState<EarnedBadges>({});

  useEffect(() => {
    getEarnedBadges().then(setEarned).catch(() => {});
  }, []);

  const earnedBadges = BADGE_DEFS.filter(d => earned[d.id]);
  const lockedBadges = BADGE_DEFS.filter(d => !earned[d.id]);

  const listData: ListItem[] = [
    // ── Earned section (only shown if at least one badge earned) ──────────
    ...(earnedBadges.length > 0
      ? [
          {
            kind: 'header' as const,
            label: t('badgesEarned', {defaultValue: 'Earned'}),
            count: earnedBadges.length,
          },
          ...earnedBadges.map(def => ({
            kind: 'earned' as const,
            def,
            earnedDate: earned[def.id]!,
          })),
        ]
      : []),

    // ── Locked section ────────────────────────────────────────────────────
    ...(lockedBadges.length > 0
      ? [
          {
            kind: 'header' as const,
            label: t('badgesLocked', {defaultValue: 'Locked'}),
            count: lockedBadges.length,
          },
          ...lockedBadges.map(def => ({kind: 'locked' as const, def})),
        ]
      : []),
  ];

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, {backgroundColor: colors.background}]}>

      {/* Top bar */}
      <View style={[styles.topBar, {backgroundColor: colors.surface}]}>
        <M3IconButton
          onPress={() => navigation.goBack()}
          accessibilityLabel={t('close')}>
          <Icons name="arrow-back" size={24} color={colors.onSurface} />
        </M3IconButton>
        <Text
          style={[
            type.titleLarge,
            {color: colors.onSurface, flex: 1, marginLeft: spacing.sm},
          ]}>
          {t('badgesTitle')}
        </Text>
        <View
          style={[styles.countChip, {backgroundColor: colors.primaryContainer}]}>
          <Text
            style={[
              type.labelMedium,
              {color: colors.onPrimaryContainer, fontWeight: '700'},
            ]}>
            {earnedBadges.length}/{BADGE_DEFS.length}
          </Text>
        </View>
      </View>
      <M3Divider />

      <FlatList
        data={listData}
        keyExtractor={(item, i) =>
          item.kind === 'header' ? `hdr-${i}` : item.def.id
        }
        contentContainerStyle={styles.list}
        renderItem={({item}) => {
          if (item.kind === 'header') {
            return <SectionHeader label={item.label} count={item.count} />;
          }
          if (item.kind === 'earned') {
            return <EarnedBadgeItem def={item.def} earnedDate={item.earnedDate} />;
          }
          return <LockedBadgeItem def={item.def} />;
        }}
        ItemSeparatorComponent={() => <View style={{height: spacing.sm}} />}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {flex: 1},
  topBar: {
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
    paddingBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  sectionChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeCard: {
    padding: spacing.md,
    borderRadius: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  emojiWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeEmoji: {
    fontSize: 32,
  },
  badgeInfo: {
    flex: 1,
  },
});
