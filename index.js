/**
 * @format
 */

import {AppRegistry} from 'react-native';
import notifee from '@notifee/react-native';
import App from './App';
import {name as appName} from './app.json';

// Required by Notifee — must be registered at module level.
// Without this, getInitialNotification() returns null on cold start
// and background press events are dropped.
notifee.onBackgroundEvent(async () => {});

AppRegistry.registerComponent(appName, () => App);
