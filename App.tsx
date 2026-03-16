import React, {useEffect, useRef} from 'react';
import {createNavigationContainerRef, NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {I18nextProvider} from 'react-i18next';
import i18n from './i18n';
import {AppSettingsProvider} from './context/AppSettingsContext';
import HomeScreen from './screens/HomeScreen';
import ChapterSelectScreen from './screens/ChapterSelectScreen';
import SettingsScreen from './screens/SettingsScreen';
import LibraryScreen from './screens/LibraryScreen';
import SearchScreen from './screens/SearchScreen';
import CompareScreen from './screens/CompareScreen';
import NoteEditScreen from './screens/NoteEditScreen';
import StatsScreen from './screens/StatsScreen';
import BadgesScreen from './screens/BadgesScreen';
import ChallengesScreen from './screens/ChallengesScreen';
import ChallengeDetailScreen from './screens/ChallengeDetailScreen';
import notifee, {EventType} from '@notifee/react-native';
import type {ChallengeId} from './services/challengesService';

export type RootStackParamList = {
  Home: {chapter?: number; verse?: number} | undefined;
  ChapterSelect: {onSelect: (chapter: number) => void};
  Settings: undefined;
  Library: {onSelect: (chapter: number) => void};
  Search: undefined;
  Compare: {chapter: number; verse: number};
  NoteEdit: {chapter: number; verse: number};
  Stats: undefined;
  Badges: undefined;
  Challenges: undefined;
  ChallengeDetail: {challengeId: ChallengeId};
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

const Stack = createNativeStackNavigator<RootStackParamList>();

// ─── Pending navigation for cold-start (before NavigationContainer is ready) ─
type PendingVerse = {chapter: number; verse: number; challengeId?: undefined};
type PendingChallenge = {challengeId: ChallengeId; chapter?: undefined; verse?: undefined};

export default function App() {
  const pendingNav = useRef<PendingVerse | PendingChallenge | null>(null);

  useEffect(() => {
    /**
     * Navigate to the verse that was shown in the notification.
     * Uses React Navigation params instead of DeviceEventEmitter so it works
     * reliably for all three cases:
     *   1. Cold start  — getInitialNotification resolves after onReady
     *   2. Background  — onForegroundEvent fires when app comes to foreground
     *   3. Foreground  — onForegroundEvent fires while app is open
     *
     * HomeScreen watches route.params changes via a useEffect, so it always
     * reacts even when it's the currently active screen.
     */
    function navigateToVerse(chapter: number, verse: number) {
      if (!chapter || isNaN(chapter)) return;
      if (navigationRef.isReady()) {
        navigationRef.navigate('Home', {chapter, verse});
      } else {
        // NavigationContainer not ready yet — queue and replay in onReady
        pendingNav.current = {chapter, verse};
      }
    }

    function handleNotifData(data: Record<string, string>) {
      if (data.challengeId) {
        const cid = data.challengeId as ChallengeId;
        if (navigationRef.isReady()) {
          navigationRef.navigate('ChallengeDetail', {challengeId: cid});
        } else {
          pendingNav.current = {challengeId: cid};
        }
      } else {
        navigateToVerse(Number(data.chapter), Number(data.verse));
      }
    }

    // ── Foreground / background notification press ───────────────────────────
    const unsubscribe = notifee.onForegroundEvent(({type, detail}) => {
      if (type === EventType.PRESS && detail.notification?.data) {
        handleNotifData(detail.notification.data as Record<string, string>);
      }
    });

    // ── Cold-start notification press ────────────────────────────────────────
    // getInitialNotification() resolves asynchronously. By then onReady has
    // already fired and navigationRef.isReady() is true, so navigateToVerse
    // calls navigationRef.navigate directly (no pendingNav needed here).
    notifee.getInitialNotification().then(initial => {
      if (initial?.notification.data) {
        handleNotifData(initial.notification.data as Record<string, string>);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <SafeAreaProvider>
        <AppSettingsProvider>
          <NavigationContainer
            ref={navigationRef}
            onReady={() => {
              // Replay any navigation that was queued before the container was ready.
              // In practice this only fires if a notification is tapped before the
              // JS bundle has fully initialised (extremely rare).
              const nav = pendingNav.current;
              pendingNav.current = null;
              if (!nav) return;
              if (nav.challengeId) {
                navigationRef.navigate('ChallengeDetail', {challengeId: nav.challengeId});
              } else if (nav.chapter) {
                navigationRef.navigate('Home', {chapter: nav.chapter, verse: nav.verse ?? 0});
              }
            }}>
            <Stack.Navigator screenOptions={{headerShown: false}}>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen
                name="ChapterSelect"
                component={ChapterSelectScreen}
                options={{presentation: 'modal'}}
              />
              <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{presentation: 'modal'}}
              />
              <Stack.Screen
                name="Library"
                component={LibraryScreen}
                options={{presentation: 'modal'}}
              />
              <Stack.Screen
                name="Search"
                component={SearchScreen}
                options={{presentation: 'modal'}}
              />
              <Stack.Screen
                name="Compare"
                component={CompareScreen}
                options={{presentation: 'modal'}}
              />
              <Stack.Screen
                name="NoteEdit"
                component={NoteEditScreen}
                options={{presentation: 'modal'}}
              />
              <Stack.Screen
                name="Stats"
                component={StatsScreen}
                options={{presentation: 'modal'}}
              />
              <Stack.Screen
                name="Badges"
                component={BadgesScreen}
                options={{presentation: 'modal'}}
              />
              <Stack.Screen
                name="Challenges"
                component={ChallengesScreen}
                options={{presentation: 'modal'}}
              />
              <Stack.Screen
                name="ChallengeDetail"
                component={ChallengeDetailScreen}
                options={{presentation: 'modal'}}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </AppSettingsProvider>
      </SafeAreaProvider>
    </I18nextProvider>
  );
}
