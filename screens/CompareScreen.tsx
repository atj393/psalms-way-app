import React, {useMemo} from 'react';
import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import {spacing, useTheme} from '../theme';
import Icons from '../components/Icons';
import {getChapter} from '../services/psalmsService';
import type {RootStackParamList} from '../App';

type CompareRoute = RouteProp<RootStackParamList, 'Compare'>;

export default function CompareScreen() {
  const navigation = useNavigation();
  const route = useRoute<CompareRoute>();
  const {chapter, verse} = route.params;
  const {colors, fontSize} = useTheme();

  const modernVerse = useMemo(() => {
    const verses = getChapter(chapter, 'modern');
    return verses[verse - 1] ?? '';
  }, [chapter, verse]);

  const kjvVerse = useMemo(() => {
    const verses = getChapter(chapter, 'kjv');
    return verses[verse - 1] ?? '';
  }, [chapter, verse]);

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: colors.background}]}
      edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, {borderBottomColor: colors.border}]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, {color: colors.text, fontSize: fontSize + 2}]}>
            Compare
          </Text>
          <Text style={[styles.headerSub, {color: colors.textSecondary, fontSize: fontSize - 5}]}>
            Psalm {chapter}:{verse}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.closeBtn, {backgroundColor: colors.surface}]}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
          accessibilityLabel="Close compare">
          <Icons name="close" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Modern */}
        <View style={[styles.card, {backgroundColor: colors.surface}]}>
          <Text style={[styles.versionLabel, {color: colors.primary, fontSize: fontSize - 6}]}>
            MODERN
          </Text>
          <View style={[styles.accent, {backgroundColor: colors.primary}]} />
          <Text style={[styles.verseText, {color: colors.text, fontSize}]}>
            {modernVerse}
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, {backgroundColor: colors.border}]} />
          <Icons name="compare" size={20} color={colors.textSecondary} />
          <View style={[styles.dividerLine, {backgroundColor: colors.border}]} />
        </View>

        {/* KJV */}
        <View style={[styles.card, {backgroundColor: colors.surface}]}>
          <Text style={[styles.versionLabel, {color: colors.primary, fontSize: fontSize - 6}]}>
            KJV
          </Text>
          <View style={[styles.accent, {backgroundColor: colors.primary}]} />
          <Text style={[styles.verseText, {color: colors.text, fontSize}]}>
            {kjvVerse}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {gap: 2},
  headerTitle: {fontFamily: 'Roboto', fontWeight: '700'},
  headerSub: {fontFamily: 'Roboto'},
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: spacing.md,
    gap: spacing.md,
  },
  card: {
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.sm,
  },
  versionLabel: {
    fontFamily: 'Roboto',
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  accent: {
    width: 24,
    height: 2,
    borderRadius: 1,
  },
  verseText: {
    fontFamily: 'Roboto',
    lineHeight: 28,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
});
