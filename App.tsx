import React, {useState} from 'react';
import {Text, TouchableOpacity} from 'react-native';
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
import ChapterSelectScreen from './pages/ChapterSelectScreen'; // Assume you have a pages folder
import {Divider} from 'react-native-elements';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [showChapter, setShowChapter] = useState<boolean>(false);
  const [currentChapter, setCurrentChapter] = useState<number>(1);
  const [currentVerse, setCurrentVerse] = useState<number>(1);
  const [showChapterSelect, setShowChapterSelect] = useState<boolean>(false);

  // Assuming you have the total number of chapters and verses
  const totalChapters = 150;
  const totalVerses = 6; // This should be dynamic based on the chapter

  const backgroundStyle = {
    //  backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    backgroundColor: isDarkMode ? Colors.darker : Colors.white,
  };

  const headerStyles = {
    ...styles.header,
    backgroundColor: isDarkMode ? Colors.darker : Colors.white,
  };

  const headerTitleStyles = {
    ...styles.headerTitle,
    color: isDarkMode ? Colors.white : Colors.black,
  };

  const selectChapter = (chapter: number) => {
    setCurrentChapter(chapter);
    setShowChapter(true);
    setShowChapterSelect(false);
  };

  const handleNewVerse = () => {
    // Generate a random chapter and verse number
    const randomChapter = Math.floor(Math.random() * totalChapters) + 1;
    const randomVerse = Math.floor(Math.random() * totalVerses) + 1;

    setCurrentChapter(randomChapter);
    setCurrentVerse(randomVerse);
    setShowChapter(false);
  };

  const handleNewChapter = (chapter?: number) => {
    const chapterToSet =
      chapter ?? Math.floor(Math.random() * totalChapters) + 1;
    setCurrentChapter(chapterToSet);
    setShowChapter(true);
  };

  const handlePreviousChapter = () => {
    setCurrentChapter(prevChapter =>
      prevChapter === 1 ? totalChapters : prevChapter - 1,
    );
    setShowChapter(true);
  };

  const handleNextChapter = () => {
    setCurrentChapter(prevChapter =>
      prevChapter === totalChapters ? 1 : prevChapter + 1,
    );
    setShowChapter(true);
  };

  return (
    <SafeAreaView style={[styles.safeArea, backgroundStyle]}>
      <View>
        <View style={headerStyles}>
          <Text style={headerTitleStyles}>Psalms Way!</Text>
          {/*  <TouchableOpacity
          onPress={() => {
            console.log('Settings pressed');
          }}>
          <Icon
            name="settings"
            size={24}
            color={isDarkMode ? Colors.white : Colors.black}
          />
        </TouchableOpacity> */}
        </View>
        <View>
          <Text style={styles.chapterTitle}>
            {showChapter
              ? `Chapter ${currentChapter}`
              : `Chapter ${currentChapter}:${currentVerse}`}
          </Text>
        </View>
      </View>

      {showChapterSelect ? (
        <ChapterSelectScreen onSelectChapter={selectChapter} />
      ) : (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          style={backgroundStyle}>
          <View
            style={[
              styles.viewStyle,
              {
                backgroundColor: isDarkMode ? Colors.black : Colors.white,
              },
              styles.verse,
            ]}>
            {showChapter ? (
              <ChapterScreen chapterNumber={currentChapter} />
            ) : (
              <ChapterVerseScreen
                chapterNumber={currentChapter}
                verseNumber={currentVerse}
              />
            )}
          </View>
        </ScrollView>
      )}
      <Divider orientation="vertical" />

      <View style={styles.navigation}>
        <TouchableOpacity style={styles.button} onPress={handlePreviousChapter}>
          <Text style={styles.buttonText}>Previous</Text>
        </TouchableOpacity>
        {!showChapterSelect && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => setShowChapterSelect(true)} // Show the chapter selection screen
          >
            <Text style={styles.buttonText}>Chapters</Text>
          </TouchableOpacity>
        )}
        {showChapterSelect && (
          <TouchableOpacity
            style={styles.button}
            onPress={() => setShowChapterSelect(false)} // Show the chapter selection screen
          >
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.button} onPress={handleNextChapter}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.navigation}>
        <TouchableOpacity style={styles.button} onPress={handleNewVerse}>
          <Text style={styles.buttonText}>New Verse</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => handleNewChapter()}>
          <Text style={styles.buttonText}>New Chapter</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    borderStyle: 'solid',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    padding: 4,
    paddingHorizontal: 16,
  },
  chapterTitle: {
    fontSize: 20,
    color: 'black',
    fontWeight: 'bold',
    fontStyle: 'normal',
    fontFamily: 'calibri',
    marginVertical: 4,
    marginHorizontal: 8,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
  viewStyle: {
    marginBottom: 8,
    fontSize: 24,
  },
  verse: {
    fontSize: 18,
    fontStyle: 'normal',
    fontWeight: 'normal',
    lineHeight: 30, // Increased line height for better readability
    paddingHorizontal: 8, // Add padding to the sides of the verses
    paddingVertical: 4,
    marginVertical: 4, // Add vertical margin for spacing between verses
    borderRadius: 5, // Optional: rounded corners for each verse background
  },
  safeArea: {
    flex: 1, // This ensures the SafeAreaView fills all available space
    justifyContent: 'space-between', // Positions children at start and end of container
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between', // If you want to remove any space between the buttons, change this to 'space-around' or 'space-evenly'
    padding: 4,
    backgroundColor: 'white',
  },
  button: {
    flex: 1,
    backgroundColor: '#fff',
    borderColor: '#000',
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    margin: 2,
  },
  buttonText: {
    color: '#000',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'gray',
    padding: 10,
    marginHorizontal: 5, // Keep consistent spacing between input and buttons
    // If you want the input field to be smaller than the buttons, you can use flexGrow, flexShrink, and flexBasis instead of flex
  },
});

export default App;
