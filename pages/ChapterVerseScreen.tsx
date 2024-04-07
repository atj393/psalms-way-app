import React, {useState, useEffect} from 'react';
import {View, Text, ScrollView, useColorScheme} from 'react-native';
import {getPsalmsVerse} from './../services/psalmsService'; // Update the import path as necessary
import {getCommonStyles} from '../styles/commonStyle';

interface ChapterVerseProps {
  chapterNumber: number; // The chapter number to display
  verseNumber: number; // The verse number to display within the chapter
}

interface LoadingProps {
  commonStyles: any; // Replace 'any' with the actual type of your styles
}

const Loading: React.FC<LoadingProps> = ({commonStyles}) => (
  <View style={commonStyles.container}>
    <Text>Loading verse...</Text>
  </View>
);

const ChapterVerseScreen: React.FC<ChapterVerseProps> = ({
  chapterNumber,
  verseNumber,
}) => {
  const [verseContent, setVerseContent] = useState<string | null>(null);
  const isDarkMode = useColorScheme() === 'dark';
  const commonStyles = getCommonStyles(isDarkMode);

  useEffect(() => {
    const fetchVerse = async () => {
      const verse = await getPsalmsVerse(chapterNumber, verseNumber);
      setVerseContent(verse);
    };

    fetchVerse();
  }, [chapterNumber, verseNumber]);

  if (!verseContent) {
    return <Loading commonStyles={commonStyles} />;
  }

  return (
    <ScrollView style={commonStyles.container}>
      <Text style={commonStyles.verse}>{verseContent}</Text>
    </ScrollView>
  );
};

export default ChapterVerseScreen;
