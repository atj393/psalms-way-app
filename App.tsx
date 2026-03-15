import React, {useEffect, useRef} from 'react';
import {DeviceEventEmitter} from 'react-native';
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
import {NOTIF_PRESS_EVENT, type NotifPressPayload} from './notificationEvents';
export {NOTIF_PRESS_EVENT, type NotifPressPayload} from './notificationEvents';

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

export default function App() {
  // Stores a pending cold-start navigation until NavigationContainer is ready
  const pendingNav = useRef<
    | {chapter: number; verse: number; challengeId?: undefined}
    | {challengeId: ChallengeId; chapter?: undefined; verse?: undefined}
    | null
  >(null);

  useEffect(() => {
    // Helper: notify HomeScreen directly via DeviceEventEmitter (reliable for
    // both cold-start and background→foreground cases, bypasses React Navigation
    // params which can be a no-op when Home is already the active screen).
    function dispatchNotifPress(chapter: number, verse: number) {
      if (!chapter) return;
      DeviceEventEmitter.emit(NOTIF_PRESS_EVENT, {chapter, verse} as NotifPressPayload);
    }

    function handleNotifData(data: Record<string, string>) {
      if (data.challengeId) {
        // Challenge notification tap → navigate to challenge detail
        const cid = data.challengeId as ChallengeId;
        if (navigationRef.isReady()) {
          navigationRef.navigate('ChallengeDetail', {challengeId: cid});
        } else {
          pendingNav.current = {challengeId: cid};
        }
      } else {
        const chapter = Number(data.chapter);
        const verse = Number(data.verse);
        dispatchNotifPress(chapter, verse);
      }
    }

    // Handle notification tap when app is in foreground or background.
    const unsubscribe = notifee.onForegroundEvent(({type, detail}) => {
      if (type === EventType.PRESS && detail.notification?.data) {
        handleNotifData(detail.notification.data as Record<string, string>);
      }
    });

    // Handle notification tap that cold-started the app.
    notifee.getInitialNotification().then(initialNotification => {
      if (initialNotification?.notification.data) {
        handleNotifData(initialNotification.notification.data as Record<string, string>);
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
              const nav = pendingNav.current;
              pendingNav.current = null;
              if (nav) {
                if (nav.challengeId) {
                  navigationRef.navigate('ChallengeDetail', {challengeId: nav.challengeId});
                } else {
                  DeviceEventEmitter.emit(NOTIF_PRESS_EVENT, {chapter: nav.chapter, verse: nav.verse} as NotifPressPayload);
                }
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
