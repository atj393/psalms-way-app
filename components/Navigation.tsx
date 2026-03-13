import React from 'react';
import {StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {spacing, useTheme} from '../theme';
import {M3FilledButton, M3OutlinedButton, M3Divider, M3IconButton} from './M3';
import Icons from './Icons';

type Props = {
  onNewVerse: () => void;
  onNewChapter: () => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onOpenChapterSelect: () => void;
};

export default function Navigation({
  onNewVerse,
  onNewChapter,
  onPrevChapter,
  onNextChapter,
  onOpenChapterSelect,
}: Props) {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          paddingBottom: Math.max(insets.bottom, spacing.sm),
        },
      ]}>
      <M3Divider />

      <View style={styles.inner}>
        {/* Row 1: Primary filled buttons */}
        <View style={styles.row}>
          <M3FilledButton
            label="New Verse"
            onPress={onNewVerse}
            style={styles.flex}
          />
          <M3FilledButton
            label="New Chapter"
            onPress={onNewChapter}
            style={styles.flex}
          />
        </View>

        {/* Row 2: Prev | Grid-icon (chapters) | Next */}
        <View style={styles.row}>
          <M3OutlinedButton
            label="Prev"
            onPress={onPrevChapter}
            style={styles.flex}
          />
          <M3IconButton
            onPress={onOpenChapterSelect}
            accessibilityLabel="Select chapter"
            style={styles.chapterIconBtn}>
            <Icons name="grid" size={22} color={colors.primary} />
          </M3IconButton>
          <M3OutlinedButton
            label="Next"
            onPress={onNextChapter}
            style={styles.flex}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  inner: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm + 4,
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: {
    flex: 1,
  },
  chapterIconBtn: {
    width: 48,
    height: 40,
    borderRadius: 9999,
  },
});
