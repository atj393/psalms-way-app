import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Icons from './Icons';
import {spacing, useTheme, type SubScreen} from '../theme';
import {M3IconButton} from './M3';

type Props = {
  chapter: number;
  highlightVerse: number;
  subScreen: SubScreen;
  isFavorite: boolean;
  onSettingsPress: () => void;
  onSearchPress: () => void;
  onLibraryPress: () => void;
  onFavoritePress: () => void;
  onStatsPress: () => void;
};

export default function Header({
  chapter,
  highlightVerse,
  subScreen,
  isFavorite,
  onSettingsPress,
  onSearchPress,
  onLibraryPress,
  onFavoritePress,
  onStatsPress,
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
          <M3IconButton onPress={onStatsPress} accessibilityLabel="Reading stats">
            <Icons name="insights" size={22} color={iconColor} />
          </M3IconButton>
          <M3IconButton onPress={onLibraryPress} accessibilityLabel="Open library">
            <Icons name="library" size={22} color={iconColor} />
          </M3IconButton>
          <M3IconButton onPress={onSettingsPress} accessibilityLabel="Open settings">
            <Icons name="settings" size={22} color={iconColor} />
          </M3IconButton>
        </View>
      </View>

      {/* Row 2: Psalm reference (larger) + favorite */}
      <View style={styles.row}>
        <Text
          style={[type.titleLarge, styles.psalmsRef, {color: colors.onSurface}]}
          numberOfLines={1}>
          {psalmsRef}
        </Text>
        <View style={styles.rightGroup}>
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
  },
  psalmsRef: {
    letterSpacing: 0.5,
    flex: 1,
    marginRight: spacing.sm,
  },
});
