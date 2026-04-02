import React from 'react';
import {Dimensions, FlatList, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {getShadowStyle, shape, spacing, useTheme} from '../theme';
import Icons from '../components/Icons';
import type {RootStackParamList} from '../App';
import {M3IconButton, M3Pressable} from '../components/M3';

const NUM_COLUMNS = 5;
const GRID_PADDING = spacing.md;
const TILE_GAP = spacing.sm;
const screenWidth = Dimensions.get('window').width;
const TILE_SIZE = Math.floor(
  (screenWidth - GRID_PADDING * 2 - TILE_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS,
);

const chapters = Array.from({length: 150}, (_, i) => i + 1);

type ChapterSelectRoute = RouteProp<RootStackParamList, 'ChapterSelect'>;

export default function ChapterSelectScreen() {
  const navigation = useNavigation();
  const route = useRoute<ChapterSelectRoute>();
  const {onSelect} = route.params;
  const {t} = useTranslation();
  const {colors, type, isDark} = useTheme();

  const handleSelect = (chapter: number) => {
    onSelect(chapter);
    navigation.goBack();
  };

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: colors.background}]}
      edges={['top', 'bottom']}>

      {/* MD3 Top App Bar */}
      <View
        style={[
          styles.appBar,
          {backgroundColor: colors.surface, ...getShadowStyle(isDark ? 1 : 2)},
        ]}>
        <View style={styles.titleGroup}>
          <Text style={[type.titleLarge, {color: colors.onSurface}]}>{t('selectPsalm')}</Text>
          <Text style={[type.labelMedium, {color: colors.onSurfaceVariant}]}>{t('psalms150')}</Text>
        </View>
        <M3IconButton
          onPress={() => navigation.goBack()}
          accessibilityLabel={t('a11yClose')}>
          <Icons name="close" size={22} color={colors.onSurfaceVariant} />
        </M3IconButton>
      </View>

      {/* Chapter grid */}
      <FlatList
        data={chapters}
        keyExtractor={item => String(item)}
        numColumns={NUM_COLUMNS}
        getItemLayout={(_, index) => ({
          length: TILE_SIZE + TILE_GAP,
          offset: (TILE_SIZE + TILE_GAP) * Math.floor(index / NUM_COLUMNS),
          index,
        })}
        initialNumToRender={50}
        contentContainerStyle={[styles.grid, {padding: GRID_PADDING, gap: TILE_GAP}]}
        columnWrapperStyle={{gap: TILE_GAP}}
        renderItem={({item}) => (
          <M3Pressable
            onPress={() => handleSelect(item)}
            accessibilityLabel={t('a11ySelectChapter')}
            style={[
              styles.tile,
              {
                width: TILE_SIZE,
                height: TILE_SIZE,
                backgroundColor: colors.surfaceVariant,
              },
            ]}>
            <Text style={[type.titleSmall, {color: colors.onSurface}]}>{item}</Text>
          </M3Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    minHeight: 64,
  },
  titleGroup: {
    flex: 1,
    gap: 2,
    paddingHorizontal: spacing.xs,
  },
  grid: {},
  tile: {
    borderRadius: shape.medium,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
