import React, {useEffect, useMemo, useState} from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import {createVerseStyles, spacing, useTheme} from '../theme';
import {getChapter} from '../services/psalmsService';

type Props = {
  chapter: number;
  highlightVerse: number;
};

export default function ChapterScreen({chapter, highlightVerse}: Props) {
  const {colors, fontSize} = useTheme();
  const verseStyles = useMemo(() => createVerseStyles(colors, fontSize), [colors, fontSize]);

  const [verses, setVerses] = useState<string[]>([]);

  useEffect(() => {
    setVerses(getChapter(chapter));
  }, [chapter]);

  return (
    <FlatList
      data={verses}
      keyExtractor={(_, i) => String(i)}
      style={verseStyles.container}
      contentContainerStyle={styles.content}
      renderItem={({item, index}) => {
        const verseNumber = index + 1;
        const isHighlighted = highlightVerse === verseNumber;

        return (
          <View
            style={[
              verseStyles.verseRow,
              isHighlighted && verseStyles.verseHighlight,
            ]}>
            <Text style={verseStyles.verseNumber}>{verseNumber}</Text>
            <Text style={verseStyles.verseText}>{item}</Text>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
  },
});
