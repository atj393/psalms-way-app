import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Icons from './Icons';
import {spacing, useTheme, type SubScreen} from '../theme';
import {M3IconButton} from './M3';

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
  const {colors, type, isDark} = useTheme();

  const psalmsRef =
    subScreen === 'verse' && highlightVerse > 0
      ? `Psalm ${chapter}:${highlightVerse}`
      : `Psalm ${chapter}`;

  const iconColor = colors.onSurfaceVariant;

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: colors.surface, elevation: isDark ? 1 : 2},
      ]}>

      {/* Row 1: App title (smaller) + utility icons */}
      <View style={styles.row}>
        <Text style={[type.titleSmall, {color: colors.onSurfaceVariant}]}>
          Psalms Way
        </Text>
        <View style={styles.iconGroup}>
          <M3IconButton onPress={onSearchPress} accessibilityLabel="Search psalms">
            <Icons name="search" size={22} color={iconColor} />
          </M3IconButton>
          <M3IconButton onPress={onLibraryPress} accessibilityLabel="Open library">
            <Icons name="library" size={22} color={iconColor} />
          </M3IconButton>
          <M3IconButton onPress={onSettingsPress} accessibilityLabel="Open settings">
            <Icons name="settings" size={22} color={iconColor} />
          </M3IconButton>
        </View>
      </View>

      {/* Row 2: Psalm reference (larger) + streak badge + favorite */}
      <View style={styles.row}>
        <Text
          style={[type.titleLarge, styles.psalmsRef, {color: colors.onSurface}]}
          numberOfLines={1}>
          {psalmsRef}
        </Text>
        <View style={styles.rightGroup}>
          {streak > 0 && (
            <View style={[styles.streakBadge, {backgroundColor: colors.primaryContainer}]}>
              <Text style={[type.labelSmall, {color: colors.onPrimaryContainer}]}>
                🔥 {streak}
              </Text>
            </View>
          )}
          <M3IconButton
            onPress={onFavoritePress}
            accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
            <Icons
              name={isFavorite ? 'star' : 'star-outline'}
              size={22}
              color={isFavorite ? colors.primary : iconColor}
            />
          </M3IconButton>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    minHeight: 40,
  },
  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  psalmsRef: {
    letterSpacing: 0.5,
    flex: 1,
    marginRight: spacing.sm,
  },
  streakBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 9999,
  },
});
