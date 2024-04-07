import React, {useState, useEffect} from 'react';
import {Text, StyleSheet, ScrollView} from 'react-native';
import {getPsalmsChapter, Verse} from './../services/psalmsService';
import {Colors} from 'react-native/Libraries/NewAppScreen';

interface ChapterScreenProps {
  chapterNumber: number; // The chapter number to display, passed as a prop
}

const ChapterScreen: React.FC<ChapterScreenProps> = ({chapterNumber}) => {
  const [chapterVerses, setChapterVerses] = useState<Verse[]>([]);

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
            styles.verse,
            index % 2 === 0 ? styles.oddVerse : styles.evenVerse,
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
  verse: {
    fontSize: 18,
    fontFamily: 'calibri', // Use a custom font family
    fontStyle: 'normal',
    fontWeight: 'normal',
    lineHeight: 30, // Increased line height for better readability
    paddingHorizontal: 8, // Add padding to the sides of the verses
    paddingVertical: 4,
    marginVertical: 4, // Add vertical margin for spacing between verses
    borderRadius: 5, // Optional: rounded corners for each verse background
  },
  oddVerse: {
    backgroundColor: '#f0f0f0', // A light color for odd verses
  },
  evenVerse: {
    backgroundColor: Colors.grey5, // A slightly different light color for even verses
  },
});

export default ChapterScreen;
