import React, {FC} from 'react';
import {Text, StyleSheet, TouchableOpacity, ScrollView} from 'react-native';

interface ChapterSelectScreenProps {
  onSelectChapter: (chapter: number) => void;
}

const ChapterSelectScreen: FC<ChapterSelectScreenProps> = ({
  onSelectChapter,
}) => {
  const chapters = Array.from({length: 150}, (_, i) => i + 1);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {chapters.map(chapter => (
        <TouchableOpacity
          key={chapter}
          style={styles.tile}
          onPress={() => onSelectChapter(chapter)}>
          <Text style={styles.tileText}>{chapter}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: 'white',
  },
  tile: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  tileText: {
    fontSize: 16,
    color: 'black',
  },
});

export default ChapterSelectScreen;
