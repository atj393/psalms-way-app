import React, {useMemo} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {spacing, useTheme} from '../theme';
import Icons from '../components/Icons';
import {getChapter} from '../services/psalmsService';
import type {RootStackParamList} from '../App';
import {M3Card, M3Divider, M3IconButton} from '../components/M3';

type CompareRoute = RouteProp<RootStackParamList, 'Compare'>;

export default function CompareScreen() {
  const navigation = useNavigation();
  const route = useRoute<CompareRoute>();
  const {chapter, verse} = route.params;
  const {t} = useTranslation();
  const {colors, type, fontSize, isDark} = useTheme();

  const modernVerse = useMemo(() => {
    const verses = getChapter(chapter, 'modern');
    return verses[verse - 1] ?? '';
  }, [chapter, verse]);

  const kjvVerse = useMemo(() => {
    const verses = getChapter(chapter, 'kjv');
    return verses[verse - 1] ?? '';
  }, [chapter, verse]);

  const VerseCard = ({label, text}: {label: string; text: string}) => (
    <M3Card variant="elevated" style={styles.card}>
      {/* Accent bar + label row */}
      <View style={styles.cardHeader}>
        <View style={[styles.accent, {backgroundColor: colors.primaryContainer}]} />
        <Text style={[type.labelLarge, {color: colors.primary, letterSpacing: 1.5}]}>
          {label}
        </Text>
      </View>
      <Text
        style={{
          fontFamily: 'Roboto',
          fontSize,
          lineHeight: fontSize * 1.8,
          color: colors.onSurface,
          letterSpacing: 0.5,
          marginTop: spacing.sm,
        }}>
        {text}
      </Text>
    </M3Card>
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
          <Text style={[type.titleLarge, {color: colors.onSurface}]}>{t('compare')}</Text>
          <Text style={[type.labelMedium, {color: colors.onSurfaceVariant}]}>
            Psalm {chapter}:{verse}
          </Text>
        </View>
        <M3IconButton
          onPress={() => navigation.goBack()}
          accessibilityLabel="Close compare">
          <Icons name="close" size={22} color={colors.onSurfaceVariant} />
        </M3IconButton>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <VerseCard label="MODERN" text={modernVerse} />

        {/* Divider with icon */}
        <View style={styles.dividerRow}>
          <M3Divider style={styles.dividerLine} />
          <Icons name="compare" size={22} color={colors.onSurfaceVariant} />
          <M3Divider style={styles.dividerLine} />
        </View>

        <VerseCard label="KJV" text={kjvVerse} />
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
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  card: {
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  accent: {
    width: 3,
    height: 20,
    borderRadius: 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dividerLine: {
    flex: 1,
  },
});
