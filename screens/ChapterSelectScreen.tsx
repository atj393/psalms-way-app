import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import {useTheme} from '../theme';
import Icons from '../components/Icons';
import type {RootStackParamList} from '../App';

const TILE_SIZE = 60;
const NUM_COLUMNS = 5;
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
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View style={[styles.header, {borderBottomColor: colors.border}]}>
        <Text style={[styles.headerTitle, {color: colors.text, fontSize: fontSize}]}>
          Select a Psalm
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
          accessibilityLabel="Close">
          <Icons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Grid */}
      <FlatList
        data={chapters}
        keyExtractor={item => String(item)}
        numColumns={NUM_COLUMNS}
        getItemLayout={(_, index) => ({
          length: TILE_SIZE,
          offset: TILE_SIZE * Math.floor(index / NUM_COLUMNS),
          index,
        })}
        initialNumToRender={30}
        contentContainerStyle={styles.grid}
        renderItem={({item}) => (
          <TouchableOpacity
            style={[
              styles.tile,
              {
                width: TILE_SIZE,
                height: TILE_SIZE,
                backgroundColor: colors.surface,
                borderColor: colors.border,
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
    </View>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontFamily: 'Roboto',
    fontWeight: '600',
  },
  grid: {
    padding: 10,
    gap: 6,
  },
  tile: {
    margin: 3,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: {
    fontFamily: 'Roboto',
    fontWeight: '500',
  },
});
