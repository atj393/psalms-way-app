import React, {useCallback, useState} from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {spacing, useTheme} from '../theme';
import {M3Divider, M3IconButton, M3Pressable} from '../components/M3';
import Icons from '../components/Icons';
import {
  getCategories,
  getPrayersByCategory,
  type Prayer,
  type PrayerCategory,
} from '../services/prayersService';
import type {RootStackParamList} from '../App';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

// ─── Category Tab ────────────────────────────────────────────────────────────

function CategoryTab({
  cat,
  isActive,
  onPress,
}: {
  cat: PrayerCategory;
  isActive: boolean;
  onPress: () => void;
}) {
  const {colors, type} = useTheme();

  return (
    <M3Pressable onPress={onPress} style={styles.tab}>
      <Text
        style={[
          type.labelLarge,
          {color: isActive ? colors.primary : colors.onSurfaceVariant},
        ]}
        numberOfLines={1}>
        {cat.name}
      </Text>
      <View
        style={[
          styles.tabIndicator,
          {backgroundColor: isActive ? colors.primary : 'transparent'},
        ]}
      />
    </M3Pressable>
  );
}

// ─── Prayer Card ─────────────────────────────────────────────────────────────

type PrayerCardProps = {
  prayer: Prayer;
  onPress: () => void;
};

function PrayerCard({prayer, onPress}: PrayerCardProps) {
  const {t} = useTranslation();
  const {colors, type} = useTheme();
  const hasRefs = (prayer.psalmsReference ?? []).length > 0;

  return (
    <M3Pressable
      onPress={onPress}
      style={[styles.prayerCard, {backgroundColor: colors.surface, borderColor: colors.outlineVariant}]}>
      <View style={styles.prayerRow}>
        <View style={styles.prayerInfo}>
          <Text
            style={[type.titleSmall, {color: colors.onSurface}]}
            numberOfLines={2}>
            {prayer.title}
          </Text>
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
          {hasRefs && (
            <Text style={[type.labelSmall, {color: colors.onSurfaceVariant, marginTop: 4}]}>
              {prayer.psalmsReference!.map(r => t('psalmPrefix') + ' ' + r).join('  ·  ')}
            </Text>
          )}
        </View>
        <Icons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
      </View>
    </M3Pressable>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

const categories = getCategories();

type PrayersNav = NativeStackNavigationProp<RootStackParamList, 'Prayers'>;

export default function PrayersScreen() {
  const navigation = useNavigation<PrayersNav>();
  const {t} = useTranslation();
  const {colors, type} = useTheme();

  const [activeCategory, setActiveCategory] = useState(categories[0].id);

  const prayers = getPrayersByCategory(activeCategory);

  const renderPrayer = useCallback(
    ({item}: {item: Prayer}) => (
      <PrayerCard
        prayer={item}
        onPress={() => navigation.navigate('PrayerDetail', {prayerId: item.id})}
      />
    ),
    [navigation],
  );

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
            type.titleLarge,
            {color: colors.onSurface, flex: 1, marginLeft: spacing.sm},
          ]}>
          {t('prayers', {defaultValue: 'Prayers'})}
        </Text>
      </View>
      <M3Divider />

      {/* Scrollable category tabs — matches M3TabBar style */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.tabBar,
          {borderBottomColor: colors.outlineVariant},
        ]}
        style={{flexGrow: 0, backgroundColor: colors.surface}}>
        {categories.map(cat => (
          <CategoryTab
            key={cat.id}
            cat={cat}
            isActive={activeCategory === cat.id}
            onPress={() => setActiveCategory(cat.id)}
          />
        ))}
      </ScrollView>

      {/* Prayer list */}
      <FlatList
        data={prayers}
        keyExtractor={item => item.id}
        renderItem={renderPrayer}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{height: spacing.sm}} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={[type.bodyLarge, {color: colors.onSurfaceVariant}]}>
              {t('prayerEmpty', {defaultValue: 'No prayers in this category yet'})}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {flex: 1},
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 56,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    alignItems: 'center',
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    gap: 4,
    overflow: 'hidden',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  prayerCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  prayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  prayerInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: 2,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 80,
  },
});
