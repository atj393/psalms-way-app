import React, {useState, useEffect} from 'react';
import {Text, StyleSheet, ScrollView, useColorScheme} from 'react-native';
import {getPsalmsChapter, Verse} from './../services/psalmsService';
import {getCommonStyles} from '../styles/commonStyle';

interface ChapterScreenProps {
  chapterNumber: number; // The chapter number to display, passed as a prop
}

const ChapterScreen: React.FC<ChapterScreenProps> = ({chapterNumber}) => {
  const [chapterVerses, setChapterVerses] = useState<Verse[]>([]);
  const isDarkMode = useColorScheme() === 'dark';
  const commonStyles = getCommonStyles(isDarkMode);

  useEffect(() => {
    const selectedChapterVerses = getPsalmsChapter(chapterNumber);
    setChapterVerses(selectedChapterVerses);
  }, [chapterNumber]);

  return (
    <ScrollView style={styles.container}>
      {chapterVerses.map((verse, index) => (
        <Text
          key={index}
          style={[
            commonStyles.verse,
            index % 2 === 0 ? commonStyles.oddVerse : commonStyles.evenVerse,
          ]}>
          {index + 1}. {verse}
        </Text>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0)', // Or any other background color
  },
});

export default ChapterScreen;
