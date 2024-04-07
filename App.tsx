import React, {useCallback, useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import ChapterScreen from './pages/ChapterScreen';
import ChapterVerseScreen from './pages/ChapterVerseScreen';
import ChapterSelectScreen from './pages/ChapterSelectScreen';
import HeaderComponent from './components/HeaderComponent';
import NavigationComponent from './components/NavigationComponent';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [showChapter, setShowChapter] = useState(false);
  const [showChapterSelect, setShowChapterSelect] = useState(false);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [currentVerse, setCurrentVerse] = useState(1);

  const backgroundStyle = isDarkMode
    ? darkStyles.background
    : lightStyles.background;

  const toggleChapterSelect = () => setShowChapterSelect(!showChapterSelect);

  const onSelectChapter = (chapter: React.SetStateAction<number>) => {
    setCurrentChapter(chapter);
    setShowChapter(true);
    toggleChapterSelect();
  };

  const onNewVerse = () => {
    const randomChapter = Math.floor(Math.random() * 150) + 1;
    setCurrentChapter(randomChapter);
    setShowChapter(false);
  };

  const onNewChapter = () => {
    setCurrentChapter(Math.floor(Math.random() * 150) + 1);
    setShowChapter(true);
  };

  const onPreviousChapter = () => {
    setCurrentChapter(prev => (prev === 1 ? 150 : prev - 1));
    setShowChapter(true);
  };

  const onNextChapter = () => {
    setCurrentChapter(prev => (prev === 150 ? 1 : prev + 1));
    setShowChapter(true);
  };

  const onUpdateVerseNumber = useCallback((verseNumber: number) => {
    setCurrentVerse(verseNumber);
  }, []);

  return (
    <SafeAreaView style={[styles.safeArea, backgroundStyle]}>
      <HeaderComponent
        isDarkMode={isDarkMode}
        showChapterSelect={showChapterSelect}
        currentChapter={currentChapter}
        currentVerse={currentVerse}
        showChapter={showChapter}
      />

      {showChapterSelect ? (
        <ChapterSelectScreen onSelectChapter={onSelectChapter} />
      ) : (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={backgroundStyle}>
          <View style={styles.verseContainer}>
            {showChapter ? (
              <ChapterScreen chapterNumber={currentChapter} />
            ) : (
              <ChapterVerseScreen
                chapterNumber={currentChapter}
                onUpdateVerseNumber={onUpdateVerseNumber}
              />
            )}
          </View>
        </ScrollView>
      )}

      <NavigationComponent
        isDarkMode={isDarkMode}
        showChapterSelect={showChapterSelect}
        onPreviousChapter={onPreviousChapter}
        onNextChapter={onNextChapter}
        toggleChapterSelect={toggleChapterSelect}
        onNewVerse={onNewVerse}
        onNewChapter={onNewChapter}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  verseContainer: {
    marginBottom: 8,
  },
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light,
  },
});

// Light theme styles
const lightStyles = StyleSheet.create({
  background: {
    backgroundColor: Colors.white,
  },
});

// Dark theme styles
const darkStyles = StyleSheet.create({
  background: {
    backgroundColor: Colors.black,
  },
});

export default App;
