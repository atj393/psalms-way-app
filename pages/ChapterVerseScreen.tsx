import React, {useState, useEffect} from 'react';
import {View, Text, ScrollView, useColorScheme} from 'react-native';
import {getPsalmsVerse} from './../services/psalmsService'; // Update the import path as necessary
import {getCommonStyles} from '../styles/commonStyle';

// Assuming the VerseDetail type looks something like this
interface VerseDetail {
  verse: string;
  verseNumber: number;
}

interface ChapterVerseProps {
  chapterNumber: number; // The chapter number to display
  onUpdateVerseNumber: (verseNumber: number) => void; // New prop for updating verse number in App.tsx
}

interface LoadingProps {
  commonStyles: ReturnType<typeof getCommonStyles>;
}

const Loading: React.FC<LoadingProps> = ({commonStyles}) => (
  <View style={commonStyles.container}>
    <Text>Loading verse...</Text>
  </View>
);

const ChapterVerseScreen: React.FC<ChapterVerseProps> = ({
  chapterNumber,
  onUpdateVerseNumber,
}) => {
  const [verseDetail, setVerseDetail] = useState<VerseDetail | null>(null);
  const isDarkMode = useColorScheme() === 'dark';
  const commonStyles = getCommonStyles(isDarkMode);

  useEffect(() => {
    const fetchVerse = async () => {
      const fetchVerseDetail = await getPsalmsVerse(chapterNumber);

      setVerseDetail(fetchVerseDetail);
      // Call the callback function with the verse number
      if (fetchVerseDetail) {
        onUpdateVerseNumber(fetchVerseDetail.verseNumber);
      }
    };

    fetchVerse();
  }, [chapterNumber, onUpdateVerseNumber]);

  if (!verseDetail) {
    return <Loading commonStyles={commonStyles} />;
  }

  return (
    <ScrollView style={commonStyles.container}>
      {/* Display the verse number and verse text */}
      <Text style={commonStyles.verse}>{verseDetail.verse}</Text>
    </ScrollView>
  );
};

export default ChapterVerseScreen;
