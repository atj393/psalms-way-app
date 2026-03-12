import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {spacing, useTheme} from '../theme';

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
  const {colors, fontSize} = useTheme();
  const insets = useSafeAreaInsets();

  const btnTextSize = fontSize - 4;

  return (
    <View
      style={[
        styles.container,
        {
          borderTopColor: colors.border,
          backgroundColor: colors.background,
          paddingBottom: Math.max(insets.bottom, spacing.sm),
        },
      ]}>
      {/* Row 1: Primary actions */}
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.btnPrimary, {backgroundColor: colors.primary}]}
          onPress={onNewVerse}>
          <Text style={[styles.btnPrimaryText, {fontSize: btnTextSize}]}>
            New Verse
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnPrimary, {backgroundColor: colors.primary}]}
          onPress={onNewChapter}>
          <Text style={[styles.btnPrimaryText, {fontSize: btnTextSize}]}>
            New Chapter
          </Text>
        </TouchableOpacity>
      </View>

      {/* Row 2: Navigation actions */}
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.btnSecondary, {borderColor: colors.border, backgroundColor: colors.surface}]}
          onPress={onPrevChapter}>
          <Text style={[styles.btnSecondaryText, {color: colors.text, fontSize: btnTextSize}]}>
            ◀ Prev
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnSecondary, {borderColor: colors.border, backgroundColor: colors.surface}]}
          onPress={onOpenChapterSelect}>
          <Text style={[styles.btnSecondaryText, {color: colors.text, fontSize: btnTextSize}]}>
            Chapters
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnSecondary, {borderColor: colors.border, backgroundColor: colors.surface}]}
          onPress={onNextChapter}>
          <Text style={[styles.btnSecondaryText, {color: colors.text, fontSize: btnTextSize}]}>
            Next ▶
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  btnPrimary: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    fontFamily: 'Roboto',
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  btnSecondary: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  btnSecondaryText: {
    fontFamily: 'Roboto',
    fontWeight: '500',
  },
});
