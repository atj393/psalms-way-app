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
import {M3FilledButton} from './M3';

export type AchievementType = 'badge' | 'challenge';

type Props = {
  visible: boolean;
  type: AchievementType;
  icon: string;
  title: string;
  description: string;
  onDismiss: () => void;
};

export default function AchievementCard({
  visible,
  type,
  icon,
  title,
  description,
  onDismiss,
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
        // Pulse the icon gently
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {toValue: 1.15, duration: 600, useNativeDriver: true}),
            Animated.timing(pulseAnim, {toValue: 1, duration: 600, useNativeDriver: true}),
          ]),
          {iterations: 3},
        ).start();
      });
    }
  }, [visible, scaleAnim, opacityAnim, pulseAnim]);

  const headline =
    type === 'badge' ? t('achievementUnlocked') : t('challengeFinished');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}>
      <TouchableOpacity
        style={[styles.backdrop, {backgroundColor: 'rgba(0,0,0,0.55)'}]}
        activeOpacity={1}
        onPress={onDismiss}
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
            {headline.toUpperCase()}
          </Text>

          {/* Big emoji icon */}
          <Animated.Text
            style={[styles.emoji, {transform: [{scale: pulseAnim}]}]}>
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
              {color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.sm},
            ]}>
            {description}
          </Text>

          {/* Dismiss button */}
          <M3FilledButton
            label={t('awesome')}
            onPress={onDismiss}
            style={styles.button}
          />
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
});
