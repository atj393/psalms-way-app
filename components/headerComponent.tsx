import React, {FC} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';

interface HeaderComponentProps {
  isDarkMode: boolean;
  showChapterSelect: boolean;
  currentChapter: number;
  currentVerse: number;
  showChapter: boolean;
}

const HeaderComponent: FC<HeaderComponentProps> = ({
  isDarkMode,
  showChapterSelect,
  currentChapter,
  currentVerse,
  showChapter,
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
      </View>
      <View>
        <Text
          style={[
            styles.chapterTitle,
            chapterTitleStyle,
            showChapterSelect && styles.chapterTitleChapters,
          ]}>
          {!showChapterSelect
            ? `Chapter ${currentChapter}${
                showChapter ? '' : `:${currentVerse}`
              }`
            : 'Please select a chapter'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light,
  },
  header: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    fontFamily: 'Roboto',
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
