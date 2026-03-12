import React from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import {spacing, useTheme} from '../theme';
import Icons from '../components/Icons';
import type {RootStackParamList} from '../App';

const NUM_COLUMNS = 5;
const GRID_PADDING = spacing.md;
const TILE_GAP = 6;
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
  const {colors, fontSize} = useTheme();

  const handleSelect = (chapter: number) => {
    onSelect(chapter);
    navigation.goBack();
  };

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: colors.background}]}
      edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, {borderBottomColor: colors.border}]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, {color: colors.text, fontSize: fontSize + 2}]}>
            Select a Psalm
          </Text>
          <Text style={[styles.headerSub, {color: colors.textSecondary, fontSize: fontSize - 5}]}>
            150 psalms
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.closeBtn, {backgroundColor: colors.surface}]}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
          accessibilityLabel="Close">
          <Icons name="close" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Grid */}
      <FlatList
        data={chapters}
        keyExtractor={item => String(item)}
        numColumns={NUM_COLUMNS}
        getItemLayout={(_, index) => ({
          length: TILE_SIZE + TILE_GAP,
          offset: (TILE_SIZE + TILE_GAP) * Math.floor(index / NUM_COLUMNS),
          index,
        })}
        initialNumToRender={40}
        contentContainerStyle={[styles.grid, {padding: GRID_PADDING, gap: TILE_GAP}]}
        columnWrapperStyle={{gap: TILE_GAP}}
        renderItem={({item}) => (
          <TouchableOpacity
            style={[
              styles.tile,
              {
                width: TILE_SIZE,
                height: TILE_SIZE,
                backgroundColor: colors.surface,
              },
            ]}
            onPress={() => handleSelect(item)}
            accessibilityLabel={`Psalm ${item}`}>
            <Text style={[styles.tileText, {color: colors.text, fontSize: fontSize - 4}]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    gap: 2,
  },
  headerTitle: {
    fontFamily: 'Roboto',
    fontWeight: '700',
  },
  headerSub: {
    fontFamily: 'Roboto',
    fontWeight: '400',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    // padding and gap set dynamically above
  },
  tile: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: {
    fontFamily: 'Roboto',
    fontWeight: '600',
  },
});
