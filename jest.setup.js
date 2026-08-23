/* eslint-env jest */
/**
 * Jest setup for the Psalms Way smoke test.
 *
 * React Native native modules (TurboModules) do not exist in a Node test
 * environment, so anything that reaches for the native binary must be mocked.
 * Packages that ship their own official mock use it; the rest are stubbed with
 * the minimum surface App.tsx actually touches.
 */

// Async storage ships an official mock.
jest.mock(
  '@react-native-async-storage/async-storage',
  () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Notifee ships an official mock.
jest.mock('@notifee/react-native', () => require('@notifee/react-native/jest-mock'));

// react-native-localize resolves the device locale through a native module.
// The app only needs a best-matching language tag to initialise i18next.
jest.mock('react-native-localize', () => ({
  findBestLanguageTag: () => ({languageTag: 'en', isRTL: false}),
  getLocales: () => [
    {countryCode: 'US', languageTag: 'en-US', languageCode: 'en', isRTL: false},
  ],
  getTimeZone: () => 'UTC',
  uses24HourClock: () => true,
}));

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');
