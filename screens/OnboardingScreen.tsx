import React, {useCallback, useRef, useState} from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTranslation} from 'react-i18next';
import {SafeAreaView} from 'react-native-safe-area-context';
import {spacing, useTheme} from '../theme';
import {M3FilledButton} from '../components/M3';
import type {RootStackParamList} from '../App';

export const ONBOARDING_DONE_KEY = 'onboardingDone';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

type Slide = {
  key: string;
  emoji: string;
  titleKey: string;
  descKey: string;
};

const SLIDES: Slide[] = [
  {key: 'welcome',    emoji: '📖', titleKey: 'onboardWelcomeTitle',    descKey: 'onboardWelcomeDesc'},
  {key: 'notif',      emoji: '🔔', titleKey: 'onboardNotifTitle',      descKey: 'onboardNotifDesc'},
  {key: 'challenges', emoji: '🎯', titleKey: 'onboardChallengesTitle', descKey: 'onboardChallengesDesc'},
  {key: 'library',    emoji: '📚', titleKey: 'onboardLibraryTitle',    descKey: 'onboardLibraryDesc'},
  {key: 'badges',     emoji: '🏆', titleKey: 'onboardBadgesTitle',     descKey: 'onboardBadgesDesc'},
  {key: 'ready',      emoji: '✨', titleKey: 'onboardReadyTitle',      descKey: 'onboardReadyDesc'},
];

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

export default function OnboardingScreen() {
  const {t} = useTranslation();
  const {colors, type} = useTheme();
  const navigation = useNavigation<NavProp>();

  const flatListRef = useRef<FlatList<Slide>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const finish = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_DONE_KEY, 'true');
    navigation.replace('Home');
  }, [navigation]);

  const handleNext = useCallback(() => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({index: currentIndex + 1, animated: true});
    } else {
      finish();
    }
  }, [currentIndex, finish]);

  const viewabilityConfig = useRef({viewAreaCoveragePercentThreshold: 50}).current;

  const onViewableItemsChanged = useRef(
    ({viewableItems}: {viewableItems: ViewToken[]}) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
  ).current;

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.container, {backgroundColor: colors.background}]}>

      {/* Skip button — hidden on last slide */}
      <View style={styles.skipRow}>
        {!isLast && (
          <TouchableOpacity onPress={finish} hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
            <Text style={[type.labelLarge, {color: colors.onSurfaceVariant}]}>
              {t('onboardSkip')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={item => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({item}) => (
          <SlideItem
            slide={item}
            colors={colors}
            type={type}
          />
        )}
        style={styles.flatList}
      />

      {/* Dot indicators */}
      <View style={styles.dotsRow}>
        {SLIDES.map((s, i) => (
          <View
            key={s.key}
            style={[
              styles.dot,
              {
                backgroundColor:
                  i === currentIndex ? colors.primary : colors.onSurface + '30',
                width: i === currentIndex ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Next / Get Started button */}
      <View style={styles.btnRow}>
        <M3FilledButton
          label={isLast ? t('onboardGetStarted') : t('onboardNext')}
          onPress={handleNext}
          style={styles.btn}
        />
      </View>
    </SafeAreaView>
  );
}

// ─── Slide item ───────────────────────────────────────────────────────────────

type SlideProps = {
  slide: Slide;
  colors: ReturnType<typeof useTheme>['colors'];
  type: ReturnType<typeof useTheme>['type'];
};

function SlideItem({slide, colors, type}: SlideProps) {
  const {t} = useTranslation();

  return (
    <View style={[styles.slide, {width: SCREEN_WIDTH}]}>
      {/* Top half — emoji in circle */}
      <View style={styles.emojiSection}>
        <View
          style={[
            styles.emojiCircle,
            {backgroundColor: colors.primaryContainer},
          ]}>
          <Text style={styles.emoji}>{slide.emoji}</Text>
        </View>
      </View>

      {/* Bottom half — text */}
      <View style={styles.textSection}>
        <Text
          style={[
            type.headlineSmall,
            styles.title,
            {color: colors.onBackground},
          ]}>
          {t(slide.titleKey)}
        </Text>
        <Text
          style={[
            type.bodyLarge,
            styles.desc,
            {color: colors.onSurfaceVariant},
          ]}>
          {t(slide.descKey)}
        </Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipRow: {
    height: 44,
    paddingHorizontal: spacing.lg,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  flatList: {
    flex: 1,
  },
  slide: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  emojiSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: spacing.xl,
  },
  emojiCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 64,
  },
  textSection: {
    flex: 1,
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  title: {
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  desc: {
    textAlign: 'center',
    lineHeight: 26,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  btnRow: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  btn: {
    width: '100%',
  },
});
