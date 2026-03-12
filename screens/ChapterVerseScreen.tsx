import React, {useEffect, useMemo, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {createVerseStyles, spacing, useTheme} from '../theme';
import {getRandomVerse} from '../services/psalmsService';

type Props = {
  chapter: number;
  onVerseLoaded: (verseNumber: number) => void;
};

export default function ChapterVerseScreen({chapter, onVerseLoaded}: Props) {
  const {colors, fontSize} = useTheme();
  const verseStyles = useMemo(() => createVerseStyles(colors, fontSize), [colors, fontSize]);

  const [verse, setVerse] = useState<{verse: string; verseNumber: number} | null>(null);

  useEffect(() => {
    const result = getRandomVerse(chapter);
    setVerse(result);
    if (result) {
      onVerseLoaded(result.verseNumber);
    }
  }, [chapter, onVerseLoaded]);

  if (!verse) return null;

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
});
