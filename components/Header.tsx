import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Icons from './Icons';
import {useTheme, type SubScreen} from '../theme';

type Props = {
  chapter: number;
  highlightVerse: number;
  subScreen: SubScreen;
  onSettingsPress: () => void;
};

export default function Header({
  chapter,
  highlightVerse,
  subScreen,
  onSettingsPress,
}: Props) {
  const {colors, fontSize} = useTheme();

  const location =
    subScreen === 'verse' && highlightVerse > 0
      ? `Psalm ${chapter}:${highlightVerse}`
      : `Psalm ${chapter}`;

  return (
    <View
      style={[styles.container, {backgroundColor: colors.background, borderBottomColor: colors.border}]}>
      <View style={styles.row}>
        <View style={[styles.titleBox, {borderColor: colors.border}]}>
          <Text style={[styles.title, {color: colors.text, fontSize: fontSize - 2}]}>
            Psalms Way
          </Text>
        </View>
        <TouchableOpacity
          onPress={onSettingsPress}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
          accessibilityLabel="Open settings">
          <Icons name="settings" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>
      <Text style={[styles.location, {color: colors.textSecondary, fontSize: fontSize - 6}]}>
        {location}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleBox: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  title: {
    fontFamily: 'Roboto',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  location: {
    fontFamily: 'Roboto',
    marginTop: 4,
  },
});
