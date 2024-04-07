// NavigationComponent.js

import React, {FC} from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';
import {Divider} from 'react-native-elements';
import {Colors} from 'react-native/Libraries/NewAppScreen'; // Adjust import based on your structure

interface NavigationComponentProps {
  isDarkMode: boolean;
  showChapterSelect: boolean;
  onPreviousChapter: () => void;
  onNextChapter: () => void;
  toggleChapterSelect: () => void;
  onNewVerse: () => void;
  onNewChapter: () => void;
}

const NavigationComponent: FC<NavigationComponentProps> = ({
  isDarkMode,
  showChapterSelect,
  onPreviousChapter,
  onNextChapter,
  toggleChapterSelect,
  onNewVerse,
  onNewChapter,
}) => {
  const buttonStyle = isDarkMode ? darkStyles.button : lightStyles.button;
  const buttonText = isDarkMode
    ? darkStyles.buttonText
    : lightStyles.buttonText;

  return (
    <>
      <Divider />
      {!showChapterSelect && (
        <View style={styles.navigation}>
          <TouchableOpacity
            style={[styles.button, buttonStyle]}
            onPress={onNewVerse}>
            <Text style={[styles.buttonText, buttonText]}>New Verse</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, buttonStyle]}
            onPress={onNewChapter}>
            <Text style={[styles.buttonText, buttonText]}>New Chapter</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.navigation}>
        {showChapterSelect ? (
          <TouchableOpacity
            style={[styles.button, buttonStyle]}
            onPress={toggleChapterSelect}>
            <Text style={[styles.buttonText, buttonText]}>Close</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.button, buttonStyle]}
              onPress={onPreviousChapter}>
              <Text style={[styles.buttonText, buttonText]}>Previous</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, buttonStyle]}
              onPress={toggleChapterSelect}>
              <Text style={[styles.buttonText, buttonText]}>Chapters</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, buttonStyle]}
              onPress={onNextChapter}>
              <Text style={[styles.buttonText, buttonText]}>Next</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 4,
  },
  button: {
    borderWidth: 1,
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
    margin: 2,
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

export default NavigationComponent;
