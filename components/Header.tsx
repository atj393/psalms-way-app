import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import Icons from './Icons';
import {spacing, useTheme, type SubScreen} from '../theme';

type Props = {
  chapter: number;
  highlightVerse: number;
  subScreen: SubScreen;
  streak: number;
  isFavorite: boolean;
  onSettingsPress: () => void;
  onSearchPress: () => void;
  onLibraryPress: () => void;
  onFavoritePress: () => void;
};

export default function Header({
  chapter,
  highlightVerse,
  subScreen,
  streak,
  isFavorite,
  onSettingsPress,
  onSearchPress,
  onLibraryPress,
  onFavoritePress,
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
          <View style={styles.metaRow}>
            <Text style={[styles.location, {color: colors.primary, fontSize: fontSize - 5}]}>
              {location}
            </Text>
            {streak > 0 && (
              <View style={[styles.streakBadge, {backgroundColor: colors.surface}]}>
                <Text style={[styles.streakText, {color: colors.primary, fontSize: fontSize - 7}]}>
                  🔥 {streak}
                </Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.iconRow}>
          <TouchableOpacity
            onPress={onFavoritePress}
            style={[styles.iconBtn, {backgroundColor: colors.surface}]}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
            accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
            <Icons
              name={isFavorite ? 'star' : 'star-outline'}
              size={20}
              color={isFavorite ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onSearchPress}
            style={[styles.iconBtn, {backgroundColor: colors.surface}]}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
            accessibilityLabel="Search psalms">
            <Icons name="search" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onLibraryPress}
            style={[styles.iconBtn, {backgroundColor: colors.surface}]}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
            accessibilityLabel="Open library">
            <Icons name="library" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onSettingsPress}
            style={[styles.iconBtn, {backgroundColor: colors.surface}]}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
            accessibilityLabel="Open settings">
            <Icons name="settings" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  streakBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  streakText: {
    fontFamily: 'Roboto',
    fontWeight: '600',
  },
  iconRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
