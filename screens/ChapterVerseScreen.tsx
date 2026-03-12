import React, {useEffect, useMemo, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {createVerseStyles, useTheme} from '../theme';
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
      <Text style={[styles.reference, {color: colors.textSecondary, fontSize: fontSize - 4}]}>
        Psalm {chapter}:{verse.verseNumber}
      </Text>
      <Text style={verseStyles.verseText}>{verse.verse}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    padding: 20,
    flex: 1,
  },
  reference: {
    fontFamily: 'Roboto',
    marginBottom: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
