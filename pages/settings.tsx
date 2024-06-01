import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DatePicker from 'react-native-date-picker';
import {
  scheduleDailyVerseNotification,
  cancelDailyVerseNotification,
} from '../services/NotificationService';
import {Colors} from 'react-native/Libraries/NewAppScreen'; // Adjust import based on your structure

const SettingsModal = () => {
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(true);
  const [time, setTime] = useState(new Date());
  const [open, setOpen] = useState(false);
  const isDarkMode = useColorScheme() === 'dark';
  const buttonStyle = isDarkMode ? darkStyles.button : lightStyles.button;
  const buttonText = isDarkMode
    ? darkStyles.buttonText
    : lightStyles.buttonText;

  useEffect(() => {
    const getPreferences = async () => {
      const notificationEnabled = await AsyncStorage.getItem(
        'notificationsEnabled',
      );
      const storedTime = await AsyncStorage.getItem('notificationTime');

      if (notificationEnabled !== null) {
        setIsNotificationEnabled(JSON.parse(notificationEnabled));
      } else {
        setIsNotificationEnabled(true);
        await AsyncStorage.setItem(
          'notificationsEnabled',
          JSON.stringify(true),
        );
      }

      if (storedTime !== null) {
        setTime(new Date(JSON.parse(storedTime)));
      } else {
        const defaultTime = new Date();
        defaultTime.setHours(8);
        defaultTime.setMinutes(0);
        setTime(defaultTime);
        await AsyncStorage.setItem(
          'notificationTime',
          JSON.stringify(defaultTime),
        );
      }

      scheduleDailyVerseNotification();
    };
    getPreferences();
  }, []);

  const toggleNotification = async () => {
    const newValue = !isNotificationEnabled;
    setIsNotificationEnabled(newValue);
    await AsyncStorage.setItem(
      'notificationsEnabled',
      JSON.stringify(newValue),
    );

    if (newValue) {
      scheduleDailyVerseNotification();
      Alert.alert(
        'Notifications Enabled',
        'Daily verse notifications have been enabled.',
      );
    } else {
      cancelDailyVerseNotification();
      Alert.alert(
        'Notifications Disabled',
        'Daily verse notifications have been disabled.',
      );
    }
  };

  const handleConfirm = async (selectedTime: React.SetStateAction<Date>) => {
    setOpen(false);
    setTime(selectedTime);
    await AsyncStorage.setItem(
      'notificationTime',
      JSON.stringify(selectedTime),
    );
    scheduleDailyVerseNotification();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.settingItem}>
        <Text style={styles.settingText}>Notifications</Text>
        <Switch
          onValueChange={toggleNotification}
          value={isNotificationEnabled}
        />
      </View>
      <View style={styles.settingItem}>
        <Text style={[styles.settingText, styles.textLabel]}>
          Notification Time
        </Text>
        <TouchableOpacity
          style={[styles.button, buttonStyle]}
          onPress={() => setOpen(true)}>
          <Text style={[styles.buttonText, buttonText]}>Select Time</Text>
        </TouchableOpacity>
        <DatePicker
          modal
          open={open}
          date={time}
          mode="time"
          onConfirm={handleConfirm}
          onCancel={() => setOpen(false)}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  settingText: {
    fontSize: 18,
    flex: 2,
  },
  textLabel: {
    flex: 2,
  },
  button: {
    borderWidth: 1,
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 8,
    flex: 1,
  },
  buttonText: {
    fontSize: 18,
    fontFamily: 'Roboto',
  },
});

// Light theme styles
const lightStyles = StyleSheet.create({
  button: {
    backgroundColor: Colors.white,
    borderColor: Colors.dark,
  },
  buttonText: {
    color: Colors.darker,
  },
});

// Dark theme styles
const darkStyles = StyleSheet.create({
  button: {
    backgroundColor: Colors.black,
    borderColor: Colors.light,
  },
  buttonText: {
    color: Colors.lighter,
  },
});

export default SettingsModal;
