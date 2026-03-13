import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Icons from './Icons';
import {ripple, spacing, useTheme, type SubScreen} from '../theme';
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

  const subtitle =
    subScreen === 'verse' && highlightVerse > 0
      ? `Psalm ${chapter}:${highlightVerse}`
      : `Psalm ${chapter}`;

  const iconColor = colors.onSurfaceVariant;
  const rc = isDark ? ripple.onDarkSurface : ripple.onSurface;

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: colors.surface, elevation: isDark ? 1 : 2},
      ]}>
      {/* Title area */}
      <View style={styles.titleGroup}>
        <Text style={[type.titleLarge, {color: colors.onSurface}]} numberOfLines={1}>
          Psalms Way
        </Text>
        <View style={styles.subtitleRow}>
          <Text
            style={[
              type.labelLarge,
              {color: colors.primary, letterSpacing: 0.1},
            ]}
            numberOfLines={1}>
            {subtitle.toUpperCase()}
          </Text>
          {streak > 0 && (
            <View style={[styles.streakBadge, {backgroundColor: colors.primaryContainer}]}>
              <Text style={[type.labelSmall, {color: colors.onPrimaryContainer}]}>
                🔥 {streak}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Action icons */}
      <View style={styles.actions}>
        <M3IconButton
          onPress={onFavoritePress}
          accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
          <Icons
            name={isFavorite ? 'star' : 'star-outline'}
            size={22}
            color={isFavorite ? colors.primary : iconColor}
          />
        </M3IconButton>

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
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    gap: spacing.xs,
    minHeight: 64,
  },
  titleGroup: {
    flex: 1,
    gap: 2,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  streakBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
