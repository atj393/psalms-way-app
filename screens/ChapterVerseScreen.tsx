import React, {useEffect, useState} from 'react';
import {Share, StyleSheet, Text, View} from 'react-native';
import {useTranslation} from 'react-i18next';
import {spacing, useTheme} from '../theme';
import {getRandomVerse, getVerse} from '../services/psalmsService';
import {toggleBookmark, isBookmarked} from '../services/bookmarksService';
import {useAppSettings} from '../context/AppSettingsContext';
import Icons from '../components/Icons';
import {M3Card, M3Chip} from '../components/M3';

type Props = {
  chapter: number;
  specificVerse?: number; // if >0, show this exact verse (e.g. from notification tap)
  onVerseLoaded: (verseNumber: number) => void;
  onCompare: (verse: number) => void;
  onNoteEdit: (verse: number) => void;
  onOpenChapter: () => void;
};

export default function ChapterVerseScreen({
  chapter,
  specificVerse,
  onVerseLoaded,
  onCompare,
  onNoteEdit,
  onOpenChapter,
}: Props) {
  const {t} = useTranslation();
  const {colors, type, fontSize} = useTheme();
  const {bibleVersion} = useAppSettings();

  const [verse, setVerse] = useState<{verse: string; verseNumber: number} | null>(null);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    // If a specific verse was requested (e.g. from a notification tap), show it;
    // otherwise pick a random verse from the chapter.
    const result =
      specificVerse && specificVerse > 0
        ? getVerse(chapter, specificVerse, bibleVersion)
        : getRandomVerse(chapter, bibleVersion);
    setVerse(result);
    if (result) {
      onVerseLoaded(result.verseNumber);
      isBookmarked(chapter, result.verseNumber).then(setBookmarked).catch(() => {});
    }
  }, [chapter, specificVerse, bibleVersion, onVerseLoaded]);

  if (!verse) {
    return null;
  }

  const handleShare = async () => {
    try {
      await Share.share({
        message: t('shareText', {verse: verse.verse, chapter, verseNum: verse.verseNumber}),
      });
    } catch {}
  };

  const handleBookmark = async () => {
    const next = await toggleBookmark(chapter, verse.verseNumber);
    setBookmarked(next);
  };

  return (
    <View style={[styles.wrapper, {backgroundColor: colors.background}]}>
      <M3Card variant="elevated" style={styles.card}>
        {/* Accent bar */}
        <View style={[styles.accent, {backgroundColor: colors.primaryContainer}]} />

        {/* Verse text — user fontSize */}
        <Text
          style={{
            fontFamily: 'Roboto',
            fontSize,
            lineHeight: fontSize * 1.8,
            color: colors.onSurface,
            letterSpacing: 0.5,
            marginTop: spacing.xs,
          }}>
          {verse.verse}
        </Text>

        {/* Action chips */}
        <View style={styles.chips}>
          <M3Chip
            label={t('share')}
            leading={<Icons name="share" size={16} color={colors.onSurfaceVariant} />}
            onPress={handleShare}
          />
          <M3Chip
            label={t('bookmark')}
            selected={bookmarked}
            leading={
              <Icons
                name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                size={16}
                color={bookmarked ? colors.onSecondaryContainer : colors.onSurfaceVariant}
              />
            }
            onPress={handleBookmark}
          />
          <M3Chip
            label={t('compare')}
            leading={<Icons name="compare" size={16} color={colors.onSurfaceVariant} />}
            onPress={() => onCompare(verse.verseNumber)}
          />
          <M3Chip
            label={t('note')}
            leading={<Icons name="note-outline" size={16} color={colors.onSurfaceVariant} />}
            onPress={() => onNoteEdit(verse.verseNumber)}
          />
          <M3Chip
            label={t('chapters')}
            leading={<Icons name="library" size={16} color={colors.onSurfaceVariant} />}
            onPress={onOpenChapter}
          />
        </View>
      </M3Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    padding: spacing.sm,
    justifyContent: 'center',
  },
  card: {
    padding: spacing.md,
  },
  accent: {
    width: 32,
    height: 3,
    borderRadius: spacing.xs,
    marginBottom: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
