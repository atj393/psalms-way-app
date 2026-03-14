import React, {useCallback, useEffect, useState} from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {spacing, useTheme} from '../theme';
import type {RootStackParamList} from '../App';
import Icons from '../components/Icons';
import {getBookmarks, type Bookmark} from '../services/bookmarksService';
import {getFavorites} from '../services/favoritesService';
import {getHistory, type HistoryEntry} from '../services/historyService';
import {getNotes, type Note} from '../services/notesService';
import {M3Divider, M3IconButton, M3Pressable, M3TabBar} from '../components/M3';

type Tab = 'bookmarks' | 'favorites' | 'history' | 'notes';

// Tab labels resolved inside component via useTranslation
const TAB_IDS: Tab[] = ['bookmarks', 'favorites', 'history', 'notes'];

type LibraryRoute = RouteProp<RootStackParamList, 'Library'>;

export default function LibraryScreen() {
  const navigation = useNavigation();
  const route = useRoute<LibraryRoute>();
  const {onSelect} = route.params;
  const {t} = useTranslation();
  const {colors, type, isDark} = useTheme();
  const TABS = TAB_IDS.map(id => ({id, label: t(id)}));

  const [activeTab, setActiveTab] = useState<Tab>('bookmarks');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    getBookmarks().then(setBookmarks).catch(() => {});
    getFavorites().then(setFavorites).catch(() => {});
    getHistory().then(setHistory).catch(() => {});
    getNotes().then(setNotes).catch(() => {});
  }, []);

  const handleSelect = useCallback(
    (chapter: number) => {
      onSelect(chapter);
      navigation.goBack();
    },
    [navigation, onSelect],
  );

  const renderEmpty = (msg: string) => (
    <View style={styles.emptyContainer}>
      <Text style={[type.bodyMedium, {color: colors.onSurfaceVariant}]}>{msg}</Text>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'bookmarks':
        if (bookmarks.length === 0) {
          return renderEmpty(t('noBookmarks'));
        }
        return (
          <FlatList
            data={bookmarks}
            keyExtractor={item => `${item.chapter}-${item.verse}`}
            ItemSeparatorComponent={() => <M3Divider />}
            renderItem={({item}) => (
              <M3Pressable
                style={styles.listItem}
                onPress={() => handleSelect(item.chapter)}>
                <Icons name="bookmark" size={18} color={colors.primary} />
                <Text style={[type.bodyLarge, styles.listItemText, {color: colors.onSurface}]}>
                  {t('psalmSubtitle', {chapter: item.chapter, verse: item.verse})}
                </Text>
                <Icons name="chevron-right" size={18} color={colors.onSurfaceVariant} />
              </M3Pressable>
            )}
          />
        );

      case 'favorites':
        if (favorites.length === 0) {
          return renderEmpty(t('noFavorites'));
        }
        return (
          <FlatList
            data={favorites}
            keyExtractor={item => String(item)}
            ItemSeparatorComponent={() => <M3Divider />}
            renderItem={({item}) => (
              <M3Pressable
                style={styles.listItem}
                onPress={() => handleSelect(item)}>
                <Icons name="star" size={18} color={colors.primary} />
                <Text style={[type.bodyLarge, styles.listItemText, {color: colors.onSurface}]}>
                  {t('psalmTitle', {chapter: item})}
                </Text>
                <Icons name="chevron-right" size={18} color={colors.onSurfaceVariant} />
              </M3Pressable>
            )}
          />
        );

      case 'history':
        if (history.length === 0) {
          return renderEmpty(t('noHistory'));
        }
        return (
          <FlatList
            data={history}
            keyExtractor={(item, i) => `${i}-${item.chapter}-${item.date}`}
            ItemSeparatorComponent={() => <M3Divider />}
            renderItem={({item}) => (
              <M3Pressable
                style={styles.listItem}
                onPress={() => handleSelect(item.chapter)}>
                <Icons name="history" size={18} color={colors.primary} />
                <View style={styles.listItemBody}>
                  <Text style={[type.bodyLarge, {color: colors.onSurface}]}>
                    {t('psalmTitle', {chapter: item.chapter})}
                  </Text>
                  <Text style={[type.bodySmall, {color: colors.onSurfaceVariant}]}>
                    {new Date(item.date).toLocaleDateString()}
                  </Text>
                </View>
                <Icons name="chevron-right" size={18} color={colors.onSurfaceVariant} />
              </M3Pressable>
            )}
          />
        );

      case 'notes':
        if (notes.length === 0) {
          return renderEmpty(t('noNotes'));
        }
        return (
          <FlatList
            data={notes}
            keyExtractor={item => `${item.chapter}-${item.verse}`}
            ItemSeparatorComponent={() => <M3Divider />}
            renderItem={({item}) => (
              <View style={styles.noteItem}>
                <Text
                  style={[
                    type.labelLarge,
                    {color: colors.primary, letterSpacing: 1},
                  ]}>
                  {t('psalmRef', {chapter: item.chapter, verse: item.verse})}
                </Text>
                <Text
                  style={[type.bodyMedium, {color: colors.onSurface}]}
                  numberOfLines={2}>
                  {item.text}
                </Text>
                <Text style={[type.bodySmall, {color: colors.onSurfaceVariant}]}>
                  {new Date(item.date).toLocaleDateString()}
                </Text>
              </View>
            )}
          />
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: colors.background}]}
      edges={['top', 'bottom']}>

      {/* MD3 Top App Bar */}
      <View
        style={[
          styles.appBar,
          {backgroundColor: colors.surface, elevation: isDark ? 1 : 2},
        ]}>
        <Text
          style={[
            type.titleLarge,
            styles.appBarTitle,
            {color: colors.onSurface},
          ]}>
          {t('library')}
        </Text>
        <M3IconButton
          onPress={() => navigation.goBack()}
          accessibilityLabel={t('a11yCloseLibrary')}>
          <Icons name="close" size={22} color={colors.onSurfaceVariant} />
        </M3IconButton>
      </View>

      {/* MD3 Tab Bar */}
      <M3TabBar
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={id => setActiveTab(id as Tab)}
      />

      {/* Content */}
      <View style={styles.content}>{renderContent()}</View>
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
  appBarTitle: {
    flex: 1,
    paddingHorizontal: spacing.xs,
  },
  content: {flex: 1},
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    gap: spacing.md,
  },
  listItemText: {flex: 1},
  listItemBody: {flex: 1, gap: 2},
  noteItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    gap: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
});
