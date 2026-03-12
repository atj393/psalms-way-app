import React, {useEffect, useMemo, useState} from 'react';
import {Share, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {createVerseStyles, spacing, useTheme} from '../theme';
import {getRandomVerse} from '../services/psalmsService';
import {toggleBookmark, isBookmarked} from '../services/bookmarksService';
import {useAppSettings} from '../context/AppSettingsContext';
import Icons from '../components/Icons';

type Props = {
  chapter: number;
  onVerseLoaded: (verseNumber: number) => void;
  onCompare: (verse: number) => void;
  onNoteEdit: (verse: number) => void;
};

export default function ChapterVerseScreen({
  chapter,
  onVerseLoaded,
  onCompare,
  onNoteEdit,
}: Props) {
  const {colors, fontSize} = useTheme();
  const {bibleVersion} = useAppSettings();
  const verseStyles = useMemo(() => createVerseStyles(colors, fontSize), [colors, fontSize]);

  const [verse, setVerse] = useState<{verse: string; verseNumber: number} | null>(null);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    const result = getRandomVerse(chapter, bibleVersion);
    setVerse(result);
    if (result) {
      onVerseLoaded(result.verseNumber);
      isBookmarked(chapter, result.verseNumber).then(setBookmarked).catch(() => {});
    }
  }, [chapter, bibleVersion, onVerseLoaded]);

  if (!verse) return null;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${verse.verse}\n\n— Psalm ${chapter}:${verse.verseNumber} (Psalms Way)`,
      });
    } catch {}
  };

  const handleBookmark = async () => {
    const next = await toggleBookmark(chapter, verse.verseNumber);
    setBookmarked(next);
  };

  return (
    <View style={[verseStyles.container, styles.wrapper]}>
      {/* Decorative accent line */}
      <View style={[styles.accent, {backgroundColor: colors.primary}]} />

      {/* Reference label */}
      <Text style={[styles.reference, {color: colors.primary, fontSize: fontSize - 5}]}>
        {`PSALM ${chapter}:${verse.verseNumber}`}
      </Text>

      {/* Verse text */}
      <Text style={verseStyles.verseText}>{verse.verse}</Text>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={handleShare}
          style={[styles.actionBtn, {backgroundColor: colors.surface}]}
          accessibilityLabel="Share verse">
          <Icons name="share" size={18} color={colors.textSecondary} />
          <Text style={[styles.actionLabel, {color: colors.textSecondary, fontSize: fontSize - 6}]}>
            Share
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleBookmark}
          style={[styles.actionBtn, {backgroundColor: colors.surface}]}
          accessibilityLabel={bookmarked ? 'Remove bookmark' : 'Add bookmark'}>
          <Icons
            name={bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color={bookmarked ? colors.primary : colors.textSecondary}
          />
          <Text
            style={[
              styles.actionLabel,
              {color: bookmarked ? colors.primary : colors.textSecondary, fontSize: fontSize - 6},
            ]}>
            Save
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onCompare(verse.verseNumber)}
          style={[styles.actionBtn, {backgroundColor: colors.surface}]}
          accessibilityLabel="Compare translations">
          <Icons name="compare" size={18} color={colors.textSecondary} />
          <Text style={[styles.actionLabel, {color: colors.textSecondary, fontSize: fontSize - 6}]}>
            Compare
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onNoteEdit(verse.verseNumber)}
          style={[styles.actionBtn, {backgroundColor: colors.surface}]}
          accessibilityLabel="Add note">
          <Icons name="note-outline" size={18} color={colors.textSecondary} />
          <Text style={[styles.actionLabel, {color: colors.textSecondary, fontSize: fontSize - 6}]}>
            Note
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    justifyContent: 'center',
  },
  accent: {
    width: 32,
    height: 3,
    borderRadius: 2,
    marginBottom: spacing.md,
  },
  reference: {
    fontFamily: 'Roboto',
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 12,
    gap: 4,
  },
  actionLabel: {
    fontFamily: 'Roboto',
    fontWeight: '500',
  },
});
