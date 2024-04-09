# Psalms Way App

## Overview

Psalms Way is a thoughtful mobile application designed to enrich users' lives with the spiritual wisdom of the Book of Psalms. It offers an easily navigable interface to access random chapters and verses for reflection and inspiration. Designed for both Android and iOS, Psalms Way stands out for its simplicity, offline access, and the personalized journey it offers through the Psalms.

## Features

### Random Verses

- Delivers random verses from the Book of Psalms, offering daily inspiration and contemplation opportunities.

### Offline Access

- Psalms Way provides complete offline functionality, ensuring that the wisdom of the Psalms is always at your fingertips, regardless of your internet connection.

## Technical Details

Psalms Way is developed using React Native, enabling a cross-platform mobile experience that is both efficient and scalable.

### Android & iOS

- **Build Configurations**: The app's build configurations for Android are specified in the `android/app/build.gradle` file. For iOS, configurations are managed within the Xcode project settings.
- **Signing Configurations**: Android release builds are signed with a keystore, details of which are specified in `android/gradle.properties`. iOS signing is managed via Xcode, utilizing development and distribution certificates.

### Dependencies

Psalms Way leverages various third-party libraries to enhance its functionality:

- `react-native` for the core framework.
- `react-navigation` for intuitive navigation between different screens.
- `redux` for state management across the app.
- `react-native-splash-screen` to display a launch screen.

## Getting Started

### Prerequisites

- Install Node.js and npm on your development machine.
- Install React Native CLI: `npm install -g react-native-cli`.
- Android development requires Android Studio and the Android SDK.
- iOS development requires Xcode installed on a macOS system.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/atj393/psalms-way-app.git
   ```
2. Install dependencies:
   Navigate to the cloned repository directory and run:
   bash
   ```bash
   npm install
   ```
3. Start the Metro bundler:
   In the project directory, execute:
   ```bash
   npx react-native start
   ```
4. Run the app:

   For Android: `npx react-native run-android`

   For iOS: npx `react-native run-ios`

## Contributing

Contributions to Psalms Way are warmly welcomed, whether they be feature requests, bug fixes, documentation improvements, or new translations.

### If you're looking to contribute:

1. Fork the repository.
2. Create a new branch for your feature or fix.
3. Commit your changes.
4. Push your branch and open a Pull Request.

For more details, please refer to our contributing guidelines (link to guidelines).

## License

Psalms Way is open source software licensed under the MIT license.
