/**
 * MoreSheet — slide-up bottom sheet that gives quick access to
 * Library, Stats, Badges, and Challenges from the main header.
 */
import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {shape, spacing, useTheme} from '../theme';
import Icons, {type IconName} from './Icons';
import {M3Pressable} from './M3';

type SheetItem = {
  icon: IconName;
  labelKey: string;
  onPress: () => void;
  color: string;
};

type Props = {
  visible: boolean;
  onDismiss: () => void;
  onLibraryPress: () => void;
  onStatsPress: () => void;
  onBadgesPress: () => void;
  onChallengesPress: () => void;
  onPrayersPress: () => void;
};

const SHEET_HEIGHT = 220;

export default function MoreSheet({
  visible,
  onDismiss,
  onLibraryPress,
  onStatsPress,
  onBadgesPress,
  onChallengesPress,
  onPrayersPress,
}: Props) {
  const {t} = useTranslation();
  const {colors, type} = useTheme();

  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SHEET_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, backdropOpacity]);

  const handleItemPress = (cb: () => void) => {
    onDismiss();
    // Small delay so sheet closes before navigating
    setTimeout(cb, 150);
  };

  const items: SheetItem[] = [
    {
      icon: 'library',
      labelKey: 'library',
      onPress: () => handleItemPress(onLibraryPress),
      color: colors.primary,
    },
    {
      icon: 'insights',
      labelKey: 'statsTitle',
      onPress: () => handleItemPress(onStatsPress),
      color: colors.secondary,
    },
    {
      icon: 'trophy',
      labelKey: 'badges',
      onPress: () => handleItemPress(onBadgesPress),
      color: colors.tertiary ?? colors.primary,
    },
    {
      icon: 'check-circle',
      labelKey: 'challenges',
      onPress: () => handleItemPress(onChallengesPress),
      color: colors.secondary,
    },
    {
      icon: 'prayer',
      labelKey: 'prayers',
      onPress: () => handleItemPress(onPrayersPress),
      color: colors.tertiary ?? colors.primary,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}>
      {/* Backdrop */}
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={onDismiss}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {backgroundColor: 'rgba(0,0,0,0.4)', opacity: backdropOpacity},
          ]}
        />
      </TouchableOpacity>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.surface,
            borderTopLeftRadius: shape.extraLarge,
            borderTopRightRadius: shape.extraLarge,
            transform: [{translateY}],
          },
        ]}
        pointerEvents="box-none">
        {/* Handle bar */}
        <View
          style={[styles.handle, {backgroundColor: colors.onSurfaceVariant + '40'}]}
        />

        {/* 2×2 tile grid */}
        <View style={styles.grid}>
          {items.map(item => (
            <M3Pressable
              key={item.labelKey}
              onPress={item.onPress}
              style={[
                styles.tile,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderRadius: shape.large,
                },
              ]}>
              <View
                style={[
                  styles.iconCircle,
                  {backgroundColor: item.color + '22'},
                ]}>
                <Icons name={item.icon} size={26} color={item.color} />
              </View>
              <Text
                style={[
                  type.labelMedium,
                  {color: colors.onSurface, marginTop: spacing.xs, textAlign: 'center'},
                ]}
                numberOfLines={1}>
                {t(item.labelKey)}
              </Text>
            </M3Pressable>
          ))}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  tile: {
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
