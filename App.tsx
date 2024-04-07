import React, {useCallback, useState} from 'react';
import {
  Text,
  TouchableOpacity,
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
import {Divider} from 'react-native-elements';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [showChapter, setShowChapter] = useState(false);
  const [showChapterSelect, setShowChapterSelect] = useState(false);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [currentVerse, setCurrentVerse] = useState(1);

  const backgroundStyle = isDarkMode
    ? darkStyles.background
    : lightStyles.background;
  const headerTitle = isDarkMode
    ? darkStyles.headerTitle
    : lightStyles.headerTitle;
  const headerStyle = isDarkMode ? darkStyles.header : lightStyles.header;
  const chapterTitleStyle = isDarkMode
    ? darkStyles.chapterTitle
    : lightStyles.chapterTitle;
  const buttonStyle = isDarkMode ? darkStyles.button : lightStyles.button;
  const buttonText = isDarkMode
    ? darkStyles.buttonText
    : lightStyles.buttonText;

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
      <View style={[styles.headerContainer, headerStyle]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, headerTitle]}>Psalms Way!</Text>
        </View>
        <View>
          <Text style={[styles.chapterTitle, chapterTitleStyle]}>
            {!showChapterSelect
              ? `Chapter ${currentChapter}${
                  showChapter ? '' : `:${currentVerse}`
                }`
              : 'Please select a chapter'}
          </Text>
        </View>
      </View>
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

      <Divider />
      {!showChapterSelect && (
        <View style={styles.navigation}>
          <TouchableOpacity
            style={[styles.button, buttonStyle]}
            onPress={onNewVerse}>
            <Text style={[styles.buttonText, buttonText]}>New Verse</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, buttonStyle]}
            onPress={onNewChapter}>
            <Text style={[styles.buttonText, buttonText]}>New Chapter</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.navigation}>
        {showChapterSelect ? (
          <TouchableOpacity
            style={[styles.button, buttonStyle]}
            onPress={toggleChapterSelect}>
            <Text style={[styles.buttonText, buttonText]}>Close</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.button, buttonStyle]}
              onPress={onPreviousChapter}>
              <Text style={[styles.buttonText, buttonText]}>Previous</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, buttonStyle]}
              onPress={toggleChapterSelect}>
              <Text style={[styles.buttonText, buttonText]}>Chapters</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, buttonStyle]}
              onPress={onNextChapter}>
              <Text style={[styles.buttonText, buttonText]}>Next</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
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
  header: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    borderWidth: 1, // This sets the width of the border
    paddingHorizontal: 12,
    paddingVertical: 4,
    fontFamily: 'Roboto',
  },
  chapterTitle: {
    fontSize: 18,
    color: 'black',
    fontWeight: 'bold',
    marginVertical: 8,
    textAlign: 'left',
    paddingHorizontal: 8,
    fontFamily: 'Roboto',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 4,
  },
  button: {
    borderWidth: 1,
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
    margin: 2,
    marginHorizontal: 8,
    flex: 1,
  },
  buttonText: {
    fontSize: 18,
    fontFamily: 'Roboto',
  },
});

// Light theme styles
const lightStyles = StyleSheet.create({
  background: {
    backgroundColor: Colors.white,
  },
  headerTitle: {
    color: Colors.darker,
    borderColor: Colors.black,
  },
  header: {
    borderBottomColor: Colors.light,
  },
  chapterTitle: {
    color: Colors.darker,
  },
  button: {
    backgroundColor: Colors.white,
    borderColor: Colors.dark,
  },
  buttonText: {
    color: Colors.darker,
  },
  // ... Any other light theme specific styles
});

// Dark theme styles
const darkStyles = StyleSheet.create({
  background: {
    backgroundColor: Colors.black,
  },
  headerTitle: {
    color: Colors.white,
    borderColor: Colors.white,
  },
  header: {
    borderBottomColor: Colors.dark,
  },
  chapterTitle: {
    color: Colors.lighter,
  },
  button: {
    backgroundColor: Colors.black,
    borderColor: Colors.light,
  },
  buttonText: {
    color: Colors.lighter,
  },
  // ... Any other dark theme specific styles
});

export default App;
