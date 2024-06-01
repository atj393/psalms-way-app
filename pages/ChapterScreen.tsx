import React, {useState, useEffect, useRef} from 'react';
import {Text, StyleSheet, ScrollView, useColorScheme, View} from 'react-native';
import {getPsalmsChapter, Verse} from './../services/psalmsService';
import {getCommonStyles} from '../styles/commonStyle';
import {Colors} from 'react-native/Libraries/NewAppScreen';

interface ChapterScreenProps {
  chapterNumber: number; // The chapter number to display, passed as a prop
  currentVerse: number; // The verse number to highlight, passed as a prop
}

const ChapterScreen: React.FC<ChapterScreenProps> = ({
  chapterNumber,
  currentVerse,
}) => {
  const [chapterVerses, setChapterVerses] = useState<Verse[]>([]);
  const [currentVerseNo, setCurrentVerse] = useState<number>(0);
  const isDarkMode = useColorScheme() === 'dark';
  const commonStyles = getCommonStyles(isDarkMode);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const selectedChapterVerses = getPsalmsChapter(chapterNumber);
    setChapterVerses(selectedChapterVerses);
    setCurrentVerse(currentVerse);
  }, [chapterNumber, currentVerse]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 8,
      backgroundColor: 'rgba(0,0,0,0)',
    },
    highlightedVerse: {
      borderColor: isDarkMode ? Colors.white : Colors.black,
      borderWidth: 1,
      borderStyle: 'solid',
      borderLeftWidth: 4,
      padding: 4,
      marginVertical: 4,
    },
  });

  return (
    <ScrollView ref={scrollViewRef} style={styles.container}>
      {chapterVerses.map((verse, index) => (
        <View
          key={index}
          style={index + 1 === currentVerseNo ? styles.highlightedVerse : null}>
          <Text
            style={[
              commonStyles.verse,
              index % 2 === 0 ? commonStyles.oddVerse : commonStyles.evenVerse,
            ]}>
            {index + 1}. {verse}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
};

export default ChapterScreen;
