import React, {useCallback, useEffect, useRef, useState} from 'react';
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
import SplashScreen from 'react-native-splash-screen';
import SettingsModal from './pages/settings';
import {scheduleDailyVerseNotification} from './services/NotificationService';
import eventEmitter from './services/EventEmitter';

const App: React.FC = () => {
  useEffect(() => {
    SplashScreen.hide();

    const handleNotificationClick = ({
      chapter,
      verse,
    }: {
      chapter: number;
      verse: number;
    }) => {
      setCurrentChapter(chapter);
      setCurrentVerse(verse);
      setShowChapter(true);
      setTimeout(() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({y: verse * 40, animated: true});
        }
      }, 200);
    };

    eventEmitter.addListener('notificationClick', handleNotificationClick);

    return () => {
      eventEmitter.removeAllListeners('notificationClick');
    };
  }, []);

  const scrollViewRef = useRef<ScrollView>(null);
  const isDarkMode = useColorScheme() === 'dark';
  const [showChapter, setShowChapter] = useState(false);
  const [showChapterSelect, setShowChapterSelect] = useState(false);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [currentVerse, setCurrentVerse] = useState(1);
  const [showSettings, setShowSettings] = useState(false);

  const backgroundStyle = isDarkMode
    ? darkStyles.background
    : lightStyles.background;

  const toggleChapterSelect = () => setShowChapterSelect(!showChapterSelect);

  const onSelectChapter = (chapter: React.SetStateAction<number>) => {
    setCurrentVerse(0);
    setCurrentChapter(chapter);
    setShowChapter(true);
    toggleChapterSelect();
  };

  const onNewVerse = () => {
    const randomChapter = Math.floor(Math.random() * 150) + 1;
    setCurrentChapter(randomChapter);
    setShowChapter(false);
    scrollToTop();
  };

  const onNewChapter = () => {
    setCurrentChapter(Math.floor(Math.random() * 150) + 1);
    setShowChapter(true);
    setCurrentVerse(0);
    scrollToTop();
    scheduleDailyVerseNotification();
  };

  const onPreviousChapter = () => {
    setCurrentVerse(0);
    setCurrentChapter(prev => (prev === 1 ? 150 : prev - 1));
    setShowChapter(true);
    scrollToTop();
  };

  const onNextChapter = () => {
    setCurrentVerse(0);
    setCurrentChapter(prev => (prev === 150 ? 1 : prev + 1));
    setShowChapter(true);
    scrollToTop();
  };

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({y: 0, animated: true});
  };

  const onUpdateVerseNumber = useCallback((verseNumber: number) => {
    setCurrentVerse(verseNumber);
  }, []);

  useEffect(() => {
    if (showSettings) {
      setShowChapterSelect(false);
    }
  }, [showSettings]);

  return (
    <SafeAreaView style={[styles.safeArea, backgroundStyle]}>
      <HeaderComponent
        isDarkMode={isDarkMode}
        showChapterSelect={showChapterSelect}
        currentChapter={currentChapter}
        currentVerse={currentVerse}
        showChapter={showChapter}
        onSettingsPress={() => setShowSettings(!showSettings)}
        isSettingsOpen={showSettings}
      />
      {showSettings && <SettingsModal />}

      {!showSettings &&
        (showChapterSelect ? (
          <ChapterSelectScreen onSelectChapter={onSelectChapter} />
        ) : (
          <ScrollView
            ref={scrollViewRef}
            contentInsetAdjustmentBehavior="automatic"
            style={backgroundStyle}>
            <View style={styles.verseContainer}>
              {showChapter ? (
                <ChapterScreen
                  chapterNumber={currentChapter}
                  currentVerse={currentVerse}
                />
              ) : (
                <ChapterVerseScreen
                  chapterNumber={currentChapter}
                  onUpdateVerseNumber={onUpdateVerseNumber}
                />
              )}
            </View>
          </ScrollView>
        ))}

      {!showSettings && (
        <NavigationComponent
          isDarkMode={isDarkMode}
          showChapterSelect={showChapterSelect}
          onPreviousChapter={onPreviousChapter}
          onNextChapter={onNextChapter}
          toggleChapterSelect={toggleChapterSelect}
          onNewVerse={onNewVerse}
          onNewChapter={onNewChapter}
        />
      )}
    </SafeAreaView>
  );
};

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
