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
  /**
   * Stores pending navigation when the NavigationContainer is not yet ready.
   * This is for the extremely rare cold-start case where JS finishes before
   * the navigation container has initialised (in practice, getInitialNotification
   * always resolves after onReady, so pendingNav is almost never used for verses).
   */
  const pendingNav = useRef<
    | {chapter: number; verse: number; challengeId?: undefined}
    | {challengeId: ChallengeId; chapter?: undefined; verse?: undefined}
    | null
  >(null);

  useEffect(() => {
    // ─── Helpers ────────────────────────────────────────────────────────────

    /**
     * Validate and dispatch a verse notification press to HomeScreen.
     *
     * Architecture: DeviceEventEmitter is the reliable cross-case mechanism:
     *
     *   Cold start: getInitialNotification() resolves as a JS macrotask, which
     *     always runs AFTER useEffect hooks have run in the component tree.
     *     HomeScreen's DeviceEventEmitter listener is therefore already registered
     *     by the time the event is emitted. ✓
     *
     *   Background → foreground: onForegroundEvent fires while HomeScreen is
     *     already mounted and its listener is registered. ✓
     *
     *   Foreground: same as background. ✓
     *
     * We do NOT rely on navigationRef.navigate('Home', params) for verse
     * navigation because React Navigation merges params — if the incoming
     * chapter/verse happens to be the same as the currently stored params,
     * the route.params object reference doesn't change and route-watching
     * useEffects in HomeScreen would not re-fire. DeviceEventEmitter emits
     * unconditionally and is not subject to value-equality checks.
     */
    function dispatchVersePress(chapter: number, verse: number): void {
      // Validate
      if (!chapter || isNaN(chapter) || chapter < 1 || chapter > 150) {
        console.warn('[App] dispatchVersePress: invalid chapter', chapter, '— ignoring');
        return;
      }
      if (!verse || isNaN(verse) || verse < 1) {
        console.warn('[App] dispatchVersePress: invalid verse', verse, '— ignoring');
        return;
      }

      console.log(`[App] Dispatching verse press → chapter=${chapter} verse=${verse}`);
      DeviceEventEmitter.emit(NOTIF_PRESS_EVENT, {chapter, verse} as NotifPressPayload);
    }

    function handleNotifData(data: Record<string, string>, source: string): void {
      console.log(`[App] handleNotifData from "${source}":`, JSON.stringify(data));

      if (data.challengeId) {
        // Challenge notification tap → navigate to challenge detail screen
        const cid = data.challengeId as ChallengeId;
        console.log('[App] Challenge notification → challengeId:', cid);
        if (navigationRef.isReady()) {
          navigationRef.navigate('ChallengeDetail', {challengeId: cid});
        } else {
          pendingNav.current = {challengeId: cid};
        }
      } else {
        // Daily verse notification tap
        const chapter = Number(data.chapter);
        const verse = Number(data.verse);
        console.log(`[App] Daily verse notification → chapter=${chapter} verse=${verse}`);
        dispatchVersePress(chapter, verse);
      }
    }

    // ── Foreground & background notification press ───────────────────────────
    // onForegroundEvent fires whenever the app is visible (or becomes visible)
    // and the user presses a notification.
    const unsubscribe = notifee.onForegroundEvent(({type, detail}) => {
      console.log('[App] onForegroundEvent type:', type);
      if (type === EventType.PRESS && detail.notification?.data) {
        handleNotifData(
          detail.notification.data as Record<string, string>,
          'onForegroundEvent',
        );
      }
    });

    // ── Cold-start notification press ────────────────────────────────────────
    // getInitialNotification() is ONLY non-null when the app was fully killed
    // and then launched by tapping a notification.
    //
    // IMPORTANT: This resolves as a JS macrotask, meaning it resolves AFTER all
    // useEffect hooks have run. By then HomeScreen's DeviceEventEmitter listener
    // is registered and will receive the emitted event.
    //
    // REQUIREMENT: pressAction must have launchActivity: 'default' in the
    // notification (see notificationService.ts) for this to return non-null.
    notifee.getInitialNotification().then(initial => {
      if (initial) {
        console.log('[App] getInitialNotification: found notification id=', initial.notification.id);
        if (initial.notification.data) {
          handleNotifData(
            initial.notification.data as Record<string, string>,
            'getInitialNotification',
          );
        } else {
          console.warn('[App] getInitialNotification: notification has no data payload');
        }
      } else {
        console.log('[App] getInitialNotification: null (normal open, not from notification)');
      }
    }).catch(err => {
      console.error('[App] getInitialNotification error:', err);
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
              console.log('[App] NavigationContainer ready');
              const nav = pendingNav.current;
              pendingNav.current = null;
              if (!nav) return;
              if (nav.challengeId) {
                console.log('[App] Replaying pending challenge nav:', nav.challengeId);
                navigationRef.navigate('ChallengeDetail', {challengeId: nav.challengeId});
              } else if (nav.chapter) {
                // For the verse case, re-emit via DeviceEventEmitter (same path
                // as normal) rather than using navigate params.
                console.log('[App] Replaying pending verse nav:', nav.chapter, nav.verse);
                DeviceEventEmitter.emit(NOTIF_PRESS_EVENT, {
                  chapter: nav.chapter,
                  verse: nav.verse,
                } as NotifPressPayload);
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
