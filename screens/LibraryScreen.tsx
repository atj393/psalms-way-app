import React, {useCallback, useEffect, useState} from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import {spacing, useTheme} from '../theme';
import type {RootStackParamList} from '../App';
import Icons from '../components/Icons';
import {getBookmarks, type Bookmark} from '../services/bookmarksService';
import {getFavorites} from '../services/favoritesService';
import {getHistory, type HistoryEntry} from '../services/historyService';
import {getNotes, type Note} from '../services/notesService';

type Tab = 'bookmarks' | 'favorites' | 'history' | 'notes';

const TABS: {id: Tab; label: string}[] = [
  {id: 'bookmarks', label: 'Bookmarks'},
  {id: 'favorites', label: 'Favorites'},
  {id: 'history', label: 'History'},
  {id: 'notes', label: 'Notes'},
];

type LibraryRoute = RouteProp<RootStackParamList, 'Library'>;

export default function LibraryScreen() {
  const navigation = useNavigation();
  const route = useRoute<LibraryRoute>();
  const {onSelect} = route.params;
  const {colors, fontSize} = useTheme();

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
      <Text style={[styles.emptyText, {color: colors.textSecondary, fontSize: fontSize - 2}]}>
        {msg}
      </Text>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'bookmarks':
        if (bookmarks.length === 0) return renderEmpty('No bookmarks yet');
        return (
          <FlatList
            data={bookmarks}
            keyExtractor={item => `${item.chapter}-${item.verse}`}
            renderItem={({item}) => (
              <TouchableOpacity
                style={[styles.listItem, {borderBottomColor: colors.border}]}
                onPress={() => handleSelect(item.chapter)}>
                <Icons name="bookmark" size={16} color={colors.primary} />
                <Text style={[styles.listItemText, {color: colors.text, fontSize}]}>
                  Psalm {item.chapter}:{item.verse}
                </Text>
                <Icons name="chevron-right" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          />
        );

      case 'favorites':
        if (favorites.length === 0) return renderEmpty('No favorites yet');
        return (
          <FlatList
            data={favorites}
            keyExtractor={item => String(item)}
            renderItem={({item}) => (
              <TouchableOpacity
                style={[styles.listItem, {borderBottomColor: colors.border}]}
                onPress={() => handleSelect(item)}>
                <Icons name="star" size={16} color={colors.primary} />
                <Text style={[styles.listItemText, {color: colors.text, fontSize}]}>
                  Psalm {item}
                </Text>
                <Icons name="chevron-right" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          />
        );

      case 'history':
        if (history.length === 0) return renderEmpty('No history yet');
        return (
          <FlatList
            data={history}
            keyExtractor={(item, i) => `${i}-${item.chapter}-${item.date}`}
            renderItem={({item}) => (
              <TouchableOpacity
                style={[styles.listItem, {borderBottomColor: colors.border}]}
                onPress={() => handleSelect(item.chapter)}>
                <Icons name="history" size={16} color={colors.primary} />
                <View style={styles.listItemBody}>
                  <Text style={[styles.listItemText, {color: colors.text, fontSize}]}>
                    Psalm {item.chapter}
                  </Text>
                  <Text
                    style={[
                      styles.listItemSub,
                      {color: colors.textSecondary, fontSize: fontSize - 5},
                    ]}>
                    {new Date(item.date).toLocaleDateString()}
                  </Text>
                </View>
                <Icons name="chevron-right" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          />
        );

      case 'notes':
        if (notes.length === 0) return renderEmpty('No notes yet');
        return (
          <FlatList
            data={notes}
            keyExtractor={item => `${item.chapter}-${item.verse}`}
            renderItem={({item}) => (
              <View style={[styles.noteItem, {borderBottomColor: colors.border}]}>
                <Text
                  style={[styles.noteRef, {color: colors.primary, fontSize: fontSize - 5}]}>
                  PSALM {item.chapter}:{item.verse}
                </Text>
                <Text
                  style={[styles.noteText, {color: colors.text, fontSize: fontSize - 2}]}
                  numberOfLines={2}>
                  {item.text}
                </Text>
                <Text
                  style={[
                    styles.noteDate,
                    {color: colors.textSecondary, fontSize: fontSize - 6},
                  ]}>
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
      {/* Header */}
      <View style={[styles.header, {borderBottomColor: colors.border}]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, {color: colors.text, fontSize: fontSize + 2}]}>
            Library
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.closeBtn, {backgroundColor: colors.surface}]}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
          accessibilityLabel="Close library">
          <Icons name="close" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, {borderBottomColor: colors.border, backgroundColor: colors.background}]}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={[styles.tab, isActive && {borderBottomColor: colors.primary, borderBottomWidth: 2}]}>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? colors.primary : colors.textSecondary,
                    fontSize: fontSize - 4,
                  },
                ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      <View style={styles.content}>{renderContent()}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {gap: 2},
  headerTitle: {fontFamily: 'Roboto', fontWeight: '700'},
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabLabel: {fontFamily: 'Roboto', fontWeight: '600'},
  content: {flex: 1},
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  listItemText: {flex: 1, fontFamily: 'Roboto', fontWeight: '500'},
  listItemBody: {flex: 1, gap: 2},
  listItemSub: {fontFamily: 'Roboto'},
  noteItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  noteRef: {fontFamily: 'Roboto', fontWeight: '700', letterSpacing: 1},
  noteText: {fontFamily: 'Roboto'},
  noteDate: {fontFamily: 'Roboto'},
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {fontFamily: 'Roboto', textAlign: 'center'},
});
