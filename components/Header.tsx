import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Icons from './Icons';
import {spacing, useTheme, type SubScreen} from '../theme';

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
      style={[
        styles.container,
        {backgroundColor: colors.background, borderBottomColor: colors.border},
      ]}>
      <View style={styles.row}>
        <View style={styles.titleGroup}>
          <Text style={[styles.title, {color: colors.text, fontSize: fontSize + 2}]}>
            Psalms Way
          </Text>
          <Text style={[styles.location, {color: colors.primary, fontSize: fontSize - 5}]}>
            {location}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onSettingsPress}
          style={[styles.iconBtn, {backgroundColor: colors.surface}]}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
          accessibilityLabel="Open settings">
          <Icons name="settings" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleGroup: {
    gap: 2,
  },
  title: {
    fontFamily: 'Roboto',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  location: {
    fontFamily: 'Roboto',
    fontWeight: '500',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
