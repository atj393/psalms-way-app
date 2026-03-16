import React, {useCallback, useEffect, useRef, useState} from 'react';
import {DeviceEventEmitter, ScrollView, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useTheme, type SubScreen} from '../theme';
import Header from '../components/Header';
import MoreSheet from '../components/MoreSheet';
import Navigation from '../components/Navigation';
import ChapterScreen from './ChapterScreen';
import ChapterVerseScreen from './ChapterVerseScreen';
import type {RootStackParamList} from '../App';
import {NOTIF_PRESS_EVENT, type NotifPressPayload} from '../notificationEvents';
import {checkAndUpdateStreak} from '../services/streakService';
import {addHistory} from '../services/historyService';
import {toggleFavorite, isFavorite} from '../services/favoritesService';
import {scheduleDailyNotification} from '../services/notificationService';
import {useAppSettings} from '../context/AppSettingsContext';
import {checkAndAwardBadges} from '../services/badgesService';
import AchievementCard, {type AchievementAction} from '../components/AchievementCard';
import {useTranslation} from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {FALLBACK_NOTIF_KEY, type FallbackInfo} from '../services/autoSetupService';

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
  const [moreSheetVisible, setMoreSheetVisible] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const {t} = useTranslation();

  // Achievement card state: null = hidden, object = show card
  type Achievement = {
    type: 'badge' | 'challenge' | 'info';
    icon: string;
    title: string;
    description: string;
    headline?: string;
    actions?: AchievementAction[];
  };
  const [achievement, setAchievement] = useState<Achievement | null>(null);
  const pendingAchievements = useRef<Achievement[]>([]);

  const showNextAchievement = useCallback(() => {
    const next = pendingAchievements.current.shift();
    setAchievement(next ?? null);
  }, []);

  // Update streak, reschedule notification with a fresh verse
  useEffect(() => {
    checkAndUpdateStreak().then(newStreak => {
      setStreak(newStreak);
      checkAndAwardBadges(newStreak).then(newBadges => {
        if (newBadges.length > 0) {
          const items: Achievement[] = newBadges.map(b => ({
            type: 'badge' as const,
            icon: b.icon,
            title: t(b.i18nKey),
            description: t(b.i18nDescKey),
          }));
          pendingAchievements.current.push(...items);
          // Delay 5 seconds so user can settle into reading first
          setTimeout(() => {
            setAchievement(prev => prev ?? (pendingAchievements.current.shift() ?? null));
          }, 5000);
        }
      }).catch(() => {});
    }).catch(() => {});
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

  /**
   * Handle notification verse taps — all three cases:
   *   Cold start   → App.tsx's getInitialNotification() resolves (macrotask) →
   *                  listener below is already registered → event received ✓
   *   Background   → App.tsx's onForegroundEvent fires → event emitted →
   *                  listener below is registered → event received ✓
   *   Foreground   → same as background ✓
   *
   * DeviceEventEmitter is used instead of route.params because:
   *   - It fires unconditionally on every emit, regardless of value equality.
   *   - route.params useEffect only fires when the param VALUE changes, so
   *     tapping a notification for the same chapter as the current one would
   *     be silently ignored.
   */
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      NOTIF_PRESS_EVENT,
      ({chapter: notifChapter, verse: notifVerse}: NotifPressPayload) => {
        console.log(
          `[Home] Notification press received → chapter=${notifChapter} verse=${notifVerse}`,
        );
        setChapter(notifChapter);
        setHighlightVerse(notifVerse);
        setSubScreen('verse');
        scrollRef.current?.scrollTo({y: 0, animated: false});
      },
    );
    return () => sub.remove();
  }, []);

  const scrollTop = () => scrollRef.current?.scrollTo({y: 0, animated: false});

  const handleChapterRead = useCallback((chapterNum: number) => {
    addHistory(chapterNum, 0).catch(() => {});
  }, []);

  const navigateToChapter = useCallback(
    (newChapter: number, screen: SubScreen) => {
      setChapter(newChapter);
      setHighlightVerse(0);
      setSubScreen(screen);
      scrollTop();
      handleChapterRead(newChapter);
    },
    [handleChapterRead],
  );

  const onNewVerse = useCallback(() => {
    const c = randomChapter();
    setChapter(c);
    setHighlightVerse(0);
    setSubScreen('verse');
    scrollTop();
    handleChapterRead(c);
  }, [handleChapterRead]);

  const onNewChapter = useCallback(() => {
    navigateToChapter(randomChapter(), 'chapter');
  }, [navigateToChapter]);

  const onPrevChapter = useCallback(() => {
    setChapter(prev => {
      const next = prev <= 1 ? 150 : prev - 1;
      handleChapterRead(next);
      return next;
    });
    setHighlightVerse(0);
    setSubScreen('chapter');
    scrollTop();
  }, [handleChapterRead]);

  const onNextChapter = useCallback(() => {
    setChapter(prev => {
      const next = prev >= 150 ? 1 : prev + 1;
      handleChapterRead(next);
      return next;
    });
    setHighlightVerse(0);
    setSubScreen('chapter');
    scrollTop();
  }, [handleChapterRead]);

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

  // Check if a language/Bible fallback happened on first launch and show notification
  useEffect(() => {
    AsyncStorage.getItem(FALLBACK_NOTIF_KEY).then(raw => {
      if (!raw) return;
      AsyncStorage.removeItem(FALLBACK_NOTIF_KEY);
      const info = JSON.parse(raw) as FallbackInfo;

      const buildMessage = () => {
        if (info.langFallback && info.bibleFallback) {
          return t('fallbackBothMessage', {
            defaultValue:
              "Your phone's language isn't fully supported yet, and no Bible in that language was found. English and the KJV Bible were opened. You can change both in Settings.",
          });
        }
        if (info.bibleFallback) {
          return t('fallbackBibleMessage', {
            defaultValue:
              "We couldn't find a Bible in your phone's language, so the English KJV was opened. You can choose another version in Settings.",
          });
        }
        return t('fallbackLangMessage', {
          defaultValue:
            "Your phone's language isn't fully supported yet. English is used as a fallback. You can change it in Settings.",
        });
      };

      const card: Achievement = {
        type: 'info',
        icon: '🌐',
        headline: t('fallbackTitle', {defaultValue: 'Language or Bible Version'}),
        title: t('fallbackTitle', {defaultValue: 'Language or Bible Version'}),
        description: buildMessage(),
        actions: [
          {
            label: t('settings'),
            onPress: () => {
              setAchievement(null);
              navigation.navigate('Settings');
            },
            variant: 'filled',
          },
          {
            label: t('close'),
            onPress: () => setAchievement(null),
            variant: 'tonal',
          },
        ],
      };

      setTimeout(() => {
        setAchievement(prev => prev ?? card);
      }, 5000);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openSearch = useCallback(() => {
    navigation.navigate('Search');
  }, [navigation]);

  const openMore = useCallback(() => setMoreSheetVisible(true), []);
  const closeMore = useCallback(() => setMoreSheetVisible(false), []);

  const openStats = useCallback(() => {
    navigation.navigate('Stats');
  }, [navigation]);

  const openBadges = useCallback(() => {
    navigation.navigate('Badges');
  }, [navigation]);

  const openChallenges = useCallback(() => {
    navigation.navigate('Challenges');
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
    <SafeAreaView edges={['top']} style={[styles.container, {backgroundColor: colors.background}]}>
      <Header
        chapter={chapter}
        highlightVerse={highlightVerse}
        subScreen={subScreen}
        isFavorite={isFav}
        onSettingsPress={openSettings}
        onSearchPress={openSearch}
        onMorePress={openMore}
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
            specificVerse={highlightVerse > 0 ? highlightVerse : undefined}
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

      <MoreSheet
        visible={moreSheetVisible}
        onDismiss={closeMore}
        onLibraryPress={openLibrary}
        onStatsPress={openStats}
        onBadgesPress={openBadges}
        onChallengesPress={openChallenges}
      />

      {achievement && (
        <AchievementCard
          visible={true}
          type={achievement.type}
          icon={achievement.icon}
          title={achievement.title}
          description={achievement.description}
          headline={achievement.headline}
          actions={achievement.actions}
          onDismiss={showNextAchievement}
        />
      )}
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
