import React from 'react';
import {
  DeviceEventEmitter,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {NOTIF_PRESS_EVENT, type NotifPressPayload} from '../notificationEvents';
import {spacing, useTheme} from '../theme';
import {M3Divider, M3IconButton, M3Pressable, M3TonalButton} from '../components/M3';
import Icons from '../components/Icons';
import {getPrayer} from '../services/prayersService';
import type {RootStackParamList} from '../App';

type PrayerDetailRoute = RouteProp<RootStackParamList, 'PrayerDetail'>;

export default function PrayerDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<PrayerDetailRoute>();
  const {prayerId} = route.params;
  const {t} = useTranslation();
  const {colors, type, fontSize} = useTheme();

  const prayer = getPrayer(prayerId);

  const handleShare = async () => {
    if (!prayer) {return;}
    try {
      const refs =
        (prayer.psalmsReference ?? []).length > 0
          ? '\n\n' + t('scriptureReferenceLabel') +
            prayer.psalmsReference!.map(r => t('psalmPrefix') + ' ' + r).join(', ')
          : '';
      const message =
        prayer.title +
        '\n\n' +
        prayer.prayer +
        refs +
        '\n\n' + t('sharedFromPsalmsWay');
      await Share.share({message});
    } catch {}
  };

  const handleReferencePress = (ref: string) => {
    const [chStr, vStr] = ref.split(':');
    const chapter = parseInt(chStr, 10);
    const verse = parseInt(vStr, 10);
    if (!chapter || !verse) {return;}
    // Emit first — HomeScreen is mounted beneath the modals and its listener
    // is active, so state updates are ready before Home slides back into view.
    DeviceEventEmitter.emit(NOTIF_PRESS_EVENT, {
      chapter,
      verse,
      source: 'prayer',
      prayerId,
    } as NotifPressPayload);
    // Pop both PrayerDetail + Prayers in one operation → returns directly to Home.
    (navigation as any).pop(2);
  };

  if (!prayer) {
    return (
      <SafeAreaView
        edges={['top']}
        style={[styles.container, {backgroundColor: colors.background}]}>
        <View style={[styles.topBar, {backgroundColor: colors.surface}]}>
          <M3IconButton onPress={() => navigation.goBack()} accessibilityLabel={t('close')}>
            <Icons name="arrow-back" size={24} color={colors.onSurface} />
          </M3IconButton>
        </View>
        <View style={styles.notFound}>
          <Text style={[type.bodyLarge, {color: colors.onSurfaceVariant}]}>
            {t('prayerNotFound')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, {backgroundColor: colors.background}]}>

      {/* Top bar */}
      <View style={[styles.topBar, {backgroundColor: colors.surface}]}>
        <M3IconButton
          onPress={() => navigation.goBack()}
          accessibilityLabel={t('close')}>
          <Icons name="arrow-back" size={24} color={colors.onSurface} />
        </M3IconButton>
        <Text
          style={[
            type.titleMedium,
            {color: colors.onSurface, flex: 1, marginLeft: spacing.sm},
          ]}
          numberOfLines={2}>
          {prayer.title}
        </Text>
      </View>
      <M3Divider />

      <ScrollView contentContainerStyle={styles.body}>

        {/* Tags */}
        {prayer.tags.length > 0 && (
          <View style={styles.tagRow}>
            {prayer.tags.map(tag => (
              <View
                key={tag}
                style={[styles.tag, {backgroundColor: colors.primaryContainer}]}>
                <Text style={[type.labelSmall, {color: colors.onPrimaryContainer}]}>
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Prayer text */}
        {prayer.prayer.trim().length > 0 ? (
          <Text
            style={{
              fontFamily: 'Roboto',
              fontSize,
              lineHeight: fontSize * 1.8,
              color: colors.onSurface,
              letterSpacing: 0.3,
              marginTop: spacing.md,
            }}>
            {prayer.prayer}
          </Text>
        ) : (
          <Text
            style={[
              type.bodyMedium,
              {
                color: colors.onSurfaceVariant,
                marginTop: spacing.md,
                fontStyle: 'italic',
              },
            ]}>
            {t('prayerEmpty', {defaultValue: 'No prayer content yet'})}
          </Text>
        )}

        {/* Psalm references */}
        {(prayer.psalmsReference ?? []).length > 0 && (
          <View style={styles.refsSection}>
            <Text
              style={[
                type.labelMedium,
                {
                  color: colors.onSurfaceVariant,
                  letterSpacing: 1,
                  marginBottom: spacing.sm,
                },
              ]}>
              {t('scriptureReferencesTitle').toUpperCase()}
            </Text>
            <View style={styles.refRow}>
              {prayer.psalmsReference!.map(ref => (
                <M3Pressable
                  key={ref}
                  onPress={() => handleReferencePress(ref)}
                  style={[
                    styles.refChip,
                    {backgroundColor: colors.secondaryContainer},
                  ]}>
                  <Text
                    style={[
                      type.labelMedium,
                      {color: colors.onSecondaryContainer, fontWeight: '700'},
                    ]}>
                    {t('psalmPrefix') + ' ' + ref}
                  </Text>
                </M3Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Share button */}
        {prayer.prayer.trim().length > 0 && (
          <View style={styles.actions}>
            <M3TonalButton onPress={handleShare} label={t('share')} style={{flex: 1}} />
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 56,
  },
  body: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 10,
  },
  refsSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'transparent',
  },
  refRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  refChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  actions: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
