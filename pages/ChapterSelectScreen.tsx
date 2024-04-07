import React, {FC} from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';

interface ChapterSelectScreenProps {
  onSelectChapter: (chapter: number) => void;
}

interface ChapterTileProps {
  chapter: number;
  onSelect: () => void;
}

const chapters = Array.from({length: 150}, (_, i) => i + 1);

const ChapterTile: FC<ChapterTileProps> = ({chapter, onSelect}) => {
  const isDarkMode = useColorScheme() === 'dark';

  const tileStyles = isDarkMode ? darkStyles.tile : lightStyles.tile;
  const tileTextStyles = isDarkMode
    ? darkStyles.tileText
    : lightStyles.tileText;

  return (
    <TouchableOpacity style={tileStyles} onPress={onSelect}>
      <Text style={tileTextStyles}>{chapter}</Text>
    </TouchableOpacity>
  );
};

const ChapterSelectScreen: FC<ChapterSelectScreenProps> = ({
  onSelectChapter,
}) => {
  const isDarkMode = useColorScheme() === 'dark';

  const containerStyles = isDarkMode
    ? darkStyles.container
    : lightStyles.container;

  return (
    <ScrollView contentContainerStyle={containerStyles}>
      {chapters.map(chapter => (
        <ChapterTile
          key={chapter}
          chapter={chapter}
          onSelect={() => onSelectChapter(chapter)}
        />
      ))}
    </ScrollView>
  );
};

const baseStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 10,
  },
  tile: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  tileText: {
    fontSize: 16,
    fontFamily: 'Roboto',
  },
});

const lightStyles = StyleSheet.create({
  container: {
    ...baseStyles.container,
    backgroundColor: 'white',
  },
  tile: {
    ...baseStyles.tile,
    backgroundColor: Colors.lighter,
    borderColor: Colors.light,
  },
  tileText: {
    ...baseStyles.tileText,
    color: 'black',
  },
});

const darkStyles = StyleSheet.create({
  container: {
    ...baseStyles.container,
    backgroundColor: 'black',
  },
  tile: {
    ...baseStyles.tile,
    backgroundColor: Colors.darker,
    borderColor: Colors.dark,
  },
  tileText: {
    ...baseStyles.tileText,
    color: 'white',
  },
});

export default ChapterSelectScreen;
