module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/jest.setup.js'],
  // The react-native preset only transforms a fixed allow-list of node_modules.
  // These packages ship untranspiled ESM, so without adding them here Jest fails
  // on `export` with "Unexpected token 'export'".
  transformIgnorePatterns: [
    'node_modules/(?!(?:' +
      [
        '@react-native',
        'react-native',
        '@react-navigation',
        'react-native-screens',
        'react-native-safe-area-context',
        'react-native-svg',
        'react-native-localize',
        '@notifee/react-native',
        '@react-native-community/datetimepicker',
        '@react-native-async-storage/async-storage',
      ].join('|') +
      ')/)',
  ],
};
