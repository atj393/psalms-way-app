import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTheme} from '../theme';

type Props = {
  onNewVerse: () => void;
  onNewChapter: () => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onOpenChapterSelect: () => void;
};

export default function Navigation({
  onNewVerse,
  onNewChapter,
  onPrevChapter,
  onNextChapter,
  onOpenChapterSelect,
}: Props) {
  const {colors, fontSize} = useTheme();

  const btnStyle = [
    styles.btn,
    {borderColor: colors.border, backgroundColor: colors.surface},
  ];
  const txtStyle = [styles.btnText, {color: colors.text, fontSize: fontSize - 4}];

  return (
    <View style={[styles.container, {borderTopColor: colors.border, backgroundColor: colors.background}]}>
      <View style={styles.row}>
        <TouchableOpacity style={[btnStyle, styles.flex]} onPress={onNewVerse}>
          <Text style={txtStyle}>New Verse</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[btnStyle, styles.flex]} onPress={onNewChapter}>
          <Text style={txtStyle}>New Chapter</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        <TouchableOpacity style={[btnStyle, styles.flex]} onPress={onPrevChapter}>
          <Text style={txtStyle}>◀ Prev</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[btnStyle, styles.flex]} onPress={onOpenChapterSelect}>
          <Text style={txtStyle}>Chapters</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[btnStyle, styles.flex]} onPress={onNextChapter}>
          <Text style={txtStyle}>Next ▶</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  flex: {
    flex: 1,
  },
  btn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontFamily: 'Roboto',
    fontWeight: '500',
  },
});
