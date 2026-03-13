import React, {useCallback, useEffect, useRef, useState} from 'react';
import {SafeAreaView, ScrollView, StyleSheet} from 'react-native';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTheme, type SubScreen} from '../theme';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import ChapterScreen from './ChapterScreen';
import ChapterVerseScreen from './ChapterVerseScreen';
import type {RootStackParamList} from '../App';
import {checkAndUpdateStreak} from '../services/streakService';
import {addHistory} from '../services/historyService';
import {toggleFavorite, isFavorite} from '../services/favoritesService';
import {scheduleDailyNotification} from '../services/notificationService';
import {useAppSettings} from '../context/AppSettingsContext';

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;
type HomeRoute = RouteProp<RootStackParamList, 'Home'>;

function randomChapter() {
  return Math.floor(Math.random() * 150) + 1;
}

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const route = useRoute<HomeRoute>();
  const {colors} = useTheme();
  const {notificationEnabled, notificationHour, notificationMinute, bibleVersion} =
    useAppSettings();

  // If opened from a notification tap, use that chapter; else pick random
  const initialChapter = route.params?.chapter ?? randomChapter();
  const initialVerse = route.params?.verse ?? 0;
  const openedFromNotification = Boolean(route.params?.chapter);

  const [subScreen, setSubScreen] = useState<SubScreen>(
    openedFromNotification ? 'verse' : 'verse',
  );
  const [chapter, setChapter] = useState(initialChapter);
  const [highlightVerse, setHighlightVerse] = useState(initialVerse);
  const [streak, setStreak] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Update streak, reschedule notification with a fresh verse
  useEffect(() => {
    checkAndUpdateStreak().then(setStreak).catch(() => {});
    if (notificationEnabled) {
      scheduleDailyNotification(
        notificationHour,
        notificationMinute,
        bibleVersion,
      ).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync favorite state when chapter changes
  useEffect(() => {
    isFavorite(chapter).then(setIsFav).catch(() => {});
  }, [chapter]);

  // React to notification navigation updates (app already open)
  useEffect(() => {
    if (route.params?.chapter) {
      setChapter(route.params.chapter);
      setHighlightVerse(route.params.verse ?? 0);
      setSubScreen('verse');
      scrollRef.current?.scrollTo({y: 0, animated: false});
    }
  }, [route.params?.chapter, route.params?.verse]);

  const scrollTop = () => scrollRef.current?.scrollTo({y: 0, animated: false});

  const navigateToChapter = useCallback(
    (newChapter: number, screen: SubScreen) => {
      setChapter(newChapter);
      setHighlightVerse(0);
      setSubScreen(screen);
      scrollTop();
      addHistory(newChapter, 0).catch(() => {});
    },
    [],
  );

  const onNewVerse = useCallback(() => {
    const c = randomChapter();
    setChapter(c);
    setHighlightVerse(0);
    setSubScreen('verse');
    scrollTop();
    addHistory(c, 0).catch(() => {});
  }, []);

  const onNewChapter = useCallback(() => {
    navigateToChapter(randomChapter(), 'chapter');
  }, [navigateToChapter]);

  const onPrevChapter = useCallback(() => {
    setChapter(prev => {
      const next = prev <= 1 ? 150 : prev - 1;
      addHistory(next, 0).catch(() => {});
      return next;
    });
    setHighlightVerse(0);
    setSubScreen('chapter');
    scrollTop();
  }, []);

  const onNextChapter = useCallback(() => {
    setChapter(prev => {
      const next = prev >= 150 ? 1 : prev + 1;
      addHistory(next, 0).catch(() => {});
      return next;
    });
    setHighlightVerse(0);
    setSubScreen('chapter');
    scrollTop();
  }, []);

  const onVerseLoaded = useCallback((verseNumber: number) => {
    setHighlightVerse(verseNumber);
  }, []);

  const openChapterSelect = useCallback(() => {
    navigation.navigate('ChapterSelect', {
      onSelect: (selected: number) => {
        navigateToChapter(selected, 'chapter');
      },
    });
  }, [navigation, navigateToChapter]);

  const openSettings = useCallback(() => {
    navigation.navigate('Settings');
  }, [navigation]);

  const openSearch = useCallback(() => {
    navigation.navigate('Search');
  }, [navigation]);

  const openLibrary = useCallback(() => {
    navigation.navigate('Library', {
      onSelect: (selected: number) => {
        navigateToChapter(selected, 'chapter');
      },
    });
  }, [navigation, navigateToChapter]);

  const onFavoritePress = useCallback(async () => {
    const next = await toggleFavorite(chapter);
    setIsFav(next);
  }, [chapter]);

  const openCompare = useCallback(
    (verse: number) => {
      navigation.navigate('Compare', {chapter, verse});
    },
    [navigation, chapter],
  );

  const openNoteEdit = useCallback(
    (verse: number) => {
      navigation.navigate('NoteEdit', {chapter, verse});
    },
    [navigation, chapter],
  );

  const onOpenChapter = useCallback(() => {
    setSubScreen('chapter');
    scrollTop();
  }, []);

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <Header
        chapter={chapter}
        highlightVerse={highlightVerse}
        subScreen={subScreen}
        streak={streak}
        isFavorite={isFav}
        onSettingsPress={openSettings}
        onSearchPress={openSearch}
        onLibraryPress={openLibrary}
        onFavoritePress={onFavoritePress}
      />

      {subScreen === 'chapter' ? (
        <ChapterScreen
          chapter={chapter}
          highlightVerse={highlightVerse}
          onOpenNoteEdit={openNoteEdit}
        />
      ) : (
        <ScrollView ref={scrollRef} style={styles.scrollView}>
          <ChapterVerseScreen
            chapter={chapter}
            onVerseLoaded={onVerseLoaded}
            onCompare={openCompare}
            onNoteEdit={openNoteEdit}
            onOpenChapter={onOpenChapter}
          />
        </ScrollView>
      )}

      <Navigation
        onNewVerse={onNewVerse}
        onNewChapter={onNewChapter}
        onPrevChapter={onPrevChapter}
        onNextChapter={onNextChapter}
        onOpenChapterSelect={openChapterSelect}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
});
