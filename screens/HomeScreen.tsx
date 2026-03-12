import React, {useCallback, useRef, useState} from 'react';
import {SafeAreaView, ScrollView, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTheme, type SubScreen} from '../theme';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import ChapterScreen from './ChapterScreen';
import ChapterVerseScreen from './ChapterVerseScreen';
import type {RootStackParamList} from '../App';

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

function randomChapter() {
  return Math.floor(Math.random() * 150) + 1;
}

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const {colors} = useTheme();

  const [subScreen, setSubScreen] = useState<SubScreen>('verse');
  const [chapter, setChapter] = useState(randomChapter);
  const [highlightVerse, setHighlightVerse] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const scrollTop = () => scrollRef.current?.scrollTo({y: 0, animated: false});

  const onNewVerse = useCallback(() => {
    setChapter(randomChapter());
    setHighlightVerse(0);
    setSubScreen('verse');
    scrollTop();
  }, []);

  const onNewChapter = useCallback(() => {
    setChapter(randomChapter());
    setHighlightVerse(0);
    setSubScreen('chapter');
    scrollTop();
  }, []);

  const onPrevChapter = useCallback(() => {
    setChapter(prev => (prev <= 1 ? 150 : prev - 1));
    setHighlightVerse(0);
    setSubScreen('chapter');
    scrollTop();
  }, []);

  const onNextChapter = useCallback(() => {
    setChapter(prev => (prev >= 150 ? 1 : prev + 1));
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
        setChapter(selected);
        setHighlightVerse(0);
        setSubScreen('chapter');
        scrollTop();
      },
    });
  }, [navigation]);

  const openSettings = useCallback(() => {
    navigation.navigate('Settings');
  }, [navigation]);

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <Header
        chapter={chapter}
        highlightVerse={highlightVerse}
        subScreen={subScreen}
        onSettingsPress={openSettings}
      />

      {subScreen === 'chapter' ? (
        <ChapterScreen chapter={chapter} highlightVerse={highlightVerse} />
      ) : (
        <ScrollView ref={scrollRef} style={styles.scrollView}>
          <ChapterVerseScreen chapter={chapter} onVerseLoaded={onVerseLoaded} />
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
