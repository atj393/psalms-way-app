import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {getPsalmsVerse} from './../services/psalmsService'; // Update the import path as necessary

interface ChapterVerseProps {
  chapterNumber: number; // The chapter number to display
  verseNumber: number; // The verse number to display within the chapter
}

// Assume PsalmsData is an array of chapters, and each chapter is an array of verses
const ChapterVerseScreen: React.FC<ChapterVerseProps> = ({
  chapterNumber,
  verseNumber,
}) => {
  const [verseContent, setVerseContent] = useState<string | null>(null);

  useEffect(() => {
    const verse = getPsalmsVerse(chapterNumber, verseNumber);
    setVerseContent(verse);
  }, [chapterNumber, verseNumber]);

  if (!verseContent) {
    return (
      <View style={styles.container}>
        <Text>Loading verse...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.verse}>{verseContent}</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff', // Or any other background color
  },

  verse: {
    fontSize: 20,
    fontStyle: 'normal',
    fontWeight: 'normal',
    lineHeight: 30, // Increased line height for better readability
    paddingHorizontal: 8, // Add padding to the sides of the verses
    paddingVertical: 4,
    marginVertical: 4, // Add vertical margin for spacing between verses
    borderRadius: 5, // Optional: rounded corners for each verse background
  },
});

export default ChapterVerseScreen;
