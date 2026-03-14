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
import notifee, {EventType} from '@notifee/react-native';
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
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  // Stores a pending cold-start navigation until NavigationContainer is ready
  const pendingNav = useRef<{chapter: number; verse: number} | null>(null);

  useEffect(() => {
    // Helper: notify HomeScreen directly via DeviceEventEmitter (reliable for
    // both cold-start and background→foreground cases, bypasses React Navigation
    // params which can be a no-op when Home is already the active screen).
    function dispatchNotifPress(chapter: number, verse: number) {
      if (!chapter) return;
      DeviceEventEmitter.emit(NOTIF_PRESS_EVENT, {chapter, verse} as NotifPressPayload);
    }

    // Handle notification tap when app is in foreground or background.
    const unsubscribe = notifee.onForegroundEvent(({type, detail}) => {
      if (type === EventType.PRESS && detail.notification?.data) {
        const chapter = Number(detail.notification.data.chapter);
        const verse = Number(detail.notification.data.verse);
        dispatchNotifPress(chapter, verse);
      }
    });

    // Handle notification tap that cold-started the app.
    // getInitialNotification() may resolve before NavigationContainer is ready,
    // so we store it and emit in onReady if needed.
    notifee.getInitialNotification().then(initialNotification => {
      if (initialNotification?.notification.data) {
        const chapter = Number(initialNotification.notification.data.chapter);
        const verse = Number(initialNotification.notification.data.verse);
        if (chapter) {
          if (navigationRef.isReady()) {
            dispatchNotifPress(chapter, verse);
          } else {
            pendingNav.current = {chapter, verse};
          }
        }
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
              if (pendingNav.current) {
                const {chapter, verse} = pendingNav.current;
                pendingNav.current = null;
                DeviceEventEmitter.emit(NOTIF_PRESS_EVENT, {chapter, verse} as NotifPressPayload);
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
            </Stack.Navigator>
          </NavigationContainer>
        </AppSettingsProvider>
      </SafeAreaProvider>
    </I18nextProvider>
  );
}
