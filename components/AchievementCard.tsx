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
import {useTheme, shape, spacing} from '../theme';
import {M3FilledButton, M3TonalButton} from './M3';

export type AchievementType = 'badge' | 'challenge' | 'info';

export type AchievementAction = {
  label: string;
  onPress: () => void;
  variant?: 'filled' | 'tonal';
};

type Props = {
  visible: boolean;
  type: AchievementType;
  icon: string;
  title: string;
  description: string;
  onDismiss: () => void;
  /** Override the default headline computed from `type` */
  headline?: string;
  /**
   * When provided, renders these buttons instead of the default "Awesome!" button.
   * Use for multi-action cards like the fallback notification.
   */
  actions?: AchievementAction[];
};

export default function AchievementCard({
  visible,
  type,
  icon,
  title,
  description,
  onDismiss,
  headline: headlineProp,
  actions,
}: Props) {
  const {t} = useTranslation();
  const {colors, type: typography} = useTheme();

  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.7);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 6,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Only pulse the icon for badge/challenge, not info
        if (type !== 'info') {
          Animated.loop(
            Animated.sequence([
              Animated.timing(pulseAnim, {toValue: 1.15, duration: 600, useNativeDriver: true}),
              Animated.timing(pulseAnim, {toValue: 1, duration: 600, useNativeDriver: true}),
            ]),
            {iterations: 3},
          ).start();
        }
      });
    }
  }, [visible, scaleAnim, opacityAnim, pulseAnim, type]);

  const computedHeadline =
    headlineProp ??
    (type === 'badge'
      ? t('achievementUnlocked')
      : type === 'challenge'
      ? t('challengeFinished')
      : t('fallbackTitle', {defaultValue: 'Language or Bible Version'}));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}>
      {/* Backdrop — tapping it dismisses badge/challenge but NOT info (requires explicit action) */}
      <TouchableOpacity
        style={[styles.backdrop, {backgroundColor: 'rgba(0,0,0,0.55)'}]}
        activeOpacity={1}
        onPress={type === 'info' ? undefined : onDismiss}
      />
      <View style={styles.center} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderRadius: shape.extraLarge,
              opacity: opacityAnim,
              transform: [{scale: scaleAnim}],
              elevation: 8,
            },
          ]}>
          {/* Headline */}
          <Text
            style={[
              typography.labelLarge,
              {color: colors.primary, letterSpacing: 1.2, marginBottom: spacing.sm},
            ]}>
            {computedHeadline.toUpperCase()}
          </Text>

          {/* Big emoji icon */}
          <Animated.Text
            style={[
              styles.emoji,
              type !== 'info' ? {transform: [{scale: pulseAnim}]} : undefined,
            ]}>
            {icon}
          </Animated.Text>

          {/* Title */}
          <Text
            style={[
              typography.headlineSmall,
              {color: colors.onSurface, textAlign: 'center', marginTop: spacing.md},
            ]}>
            {title}
          </Text>

          {/* Description */}
          <Text
            style={[
              typography.bodyMedium,
              {
                color: colors.onSurfaceVariant,
                textAlign: 'center',
                marginTop: spacing.sm,
                lineHeight: 22,
              },
            ]}>
            {description}
          </Text>

          {/* Buttons */}
          {actions && actions.length > 0 ? (
            <View style={styles.actionsRow}>
              {actions.map((action, i) =>
                action.variant === 'tonal' ? (
                  <M3TonalButton
                    key={i}
                    label={action.label}
                    onPress={action.onPress}
                    style={styles.actionBtn}
                  />
                ) : (
                  <M3FilledButton
                    key={i}
                    label={action.label}
                    onPress={action.onPress}
                    style={styles.actionBtn}
                  />
                ),
              )}
            </View>
          ) : (
            <M3FilledButton
              label={t('awesome')}
              onPress={onDismiss}
              style={styles.button}
            />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    padding: spacing.xl,
  },
  emoji: {
    fontSize: 72,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.xl,
    minWidth: 160,
  },
  actionsRow: {
    marginTop: spacing.xl,
    width: '100%',
    gap: spacing.sm,
  },
  actionBtn: {
    width: '100%',
  },
});
