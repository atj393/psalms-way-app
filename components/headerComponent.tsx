import React, {FC} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import SVGComponent from './SVGComponent';

interface HeaderComponentProps {
  isDarkMode: boolean;
  showChapterSelect: boolean;
  currentChapter: number;
  currentVerse: number;
  showChapter: boolean;
  isSettingsOpen: boolean;
  onSettingsPress: () => void;
}

const HeaderComponent: FC<HeaderComponentProps> = ({
  isDarkMode,
  showChapterSelect,
  currentChapter,
  currentVerse,
  showChapter,
  isSettingsOpen,
  onSettingsPress,
}) => {
  const headerStyle = isDarkMode ? darkStyles.header : lightStyles.header;
  const headerTitleStyle = isDarkMode
    ? darkStyles.headerTitle
    : lightStyles.headerTitle;
  const chapterTitleStyle = isDarkMode
    ? darkStyles.chapterTitle
    : lightStyles.chapterTitle;

  return (
    <View style={[styles.headerContainer, headerStyle]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, headerTitleStyle]}>Psalms Way!</Text>
        <TouchableOpacity onPress={onSettingsPress} style={styles.settingsIcon}>
          <SVGComponent
            size="24px"
            name={!isSettingsOpen ? 'settings' : 'close'}
          />
        </TouchableOpacity>
      </View>
      <Text
        style={[
          styles.chapterTitle,
          chapterTitleStyle,
          showChapterSelect && styles.chapterTitleChapters,
        ]}>
        {isSettingsOpen
          ? 'Settings'
          : !showChapterSelect
          ? `Chapter ${currentChapter}${showChapter ? '' : `:${currentVerse}`}`
          : 'Please select a chapter'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingsIcon: {
    flex: 1,
    padding: 4,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 12,
    paddingVertical: 4,
    fontFamily: 'Roboto',
    borderWidth: 1,
  },
  chapterTitle: {
    fontSize: 18,
    color: 'black',
    fontWeight: 'bold',
    marginVertical: 8,
    textAlign: 'left',
    paddingHorizontal: 8,
    fontFamily: 'Roboto',
  },
  chapterTitleChapters: {
    fontWeight: 'normal',
  },
});

// Light theme styles
const lightStyles = StyleSheet.create({
  headerTitle: {
    color: Colors.darker,
    borderColor: Colors.black,
  },
  header: {
    borderBottomColor: Colors.light,
  },
  chapterTitle: {
    color: Colors.darker,
  },
});

// Dark theme styles
const darkStyles = StyleSheet.create({
  headerTitle: {
    color: Colors.white,
    borderColor: Colors.white,
  },
  header: {
    borderBottomColor: Colors.dark,
  },
  chapterTitle: {
    color: Colors.lighter,
  },
});

export default HeaderComponent;
