import PushNotification from 'react-native-push-notification';
import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getPsalmsVerse} from './psalmsService';
import eventEmitter from './EventEmitter';

// Configure push notifications
PushNotification.configure({
  onNotification: function (notification) {
    if (notification.userInteraction) {
      const {chapter, verse} = notification.data;
      handleNotificationClick(chapter, verse);
    }
  },
  popInitialNotification: true,
  requestPermissions: Platform.OS === 'ios',
});

// Create a channel (required for Android)
PushNotification.createChannel(
  {
    channelId: 'daily-morning-verse-channel',
    channelName: 'Daily Morning Verse Channel',
    channelDescription: 'A channel for daily verse notifications',
    soundName: 'default',
    importance: 4,
    vibrate: true,
  },
  created => console.log(`CreateChannel returned '${created}'`),
);

// Schedule the notification
export const scheduleDailyVerseNotification = async () => {
  const notificationsEnabled = await AsyncStorage.getItem(
    'notificationsEnabled',
  );
  if (notificationsEnabled !== null && JSON.parse(notificationsEnabled)) {
    const notificationTime = await AsyncStorage.getItem('notificationTime');
    const {chapter, verse, verseNumber} = getDailyVerses();

    let triggerDate = new Date();
    if (notificationTime) {
      const time = new Date(JSON.parse(notificationTime));
      triggerDate.setHours(time.getHours());
      triggerDate.setMinutes(time.getMinutes());
      triggerDate.setSeconds(0);
    } else {
      triggerDate.setHours(8);
      triggerDate.setMinutes(0);
      triggerDate.setSeconds(0);
    }

    if (new Date() > triggerDate) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    PushNotification.localNotificationSchedule({
      channelId: 'daily-morning-verse-channel',
      title: `Psalms ${chapter}:${verseNumber}`,
      message: verse ?? '',
      date: triggerDate,
      repeatType: 'day',
      userInfo: {chapter, verse: verseNumber},
    });
  }
};

// Cancel the notification
export const cancelDailyVerseNotification = () => {
  PushNotification.cancelAllLocalNotifications();
  console.log('All notifications cancelled');
};

const getDailyVerses = (): {
  chapter: number;
  verse: string | undefined;
  verseNumber: number | undefined;
} => {
  const randomChapter = Math.floor(Math.random() * 150) + 1;
  const psalmsVerse = getPsalmsVerse(randomChapter);
  return {
    chapter: randomChapter,
    verse: psalmsVerse?.verse,
    verseNumber: psalmsVerse?.verseNumber,
  };
};

const handleNotificationClick = (chapter: number, verse: number) => {
  eventEmitter.emit('notificationClick', {chapter, verse});
};
