import React, {useMemo, useState} from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {spacing, useTheme} from '../theme';
import Icons from '../components/Icons';
import {getChapter} from '../services/psalmsService';
import {useAppSettings} from '../context/AppSettingsContext';

type Result = {chapter: number; verse: number; text: string};

// Pre-build index at module level to avoid rebuilding on every search
function buildIndex(version: 'modern' | 'kjv'): Result[] {
  const all: Result[] = [];
  for (let ch = 1; ch <= 150; ch++) {
    const verses = getChapter(ch, version);
    verses.forEach((v, i) => {
      all.push({chapter: ch, verse: i + 1, text: v});
    });
  }
  return all;
}

export default function SearchScreen() {
  const navigation = useNavigation();
  const {colors, fontSize} = useTheme();
  const {bibleVersion} = useAppSettings();

  const [query, setQuery] = useState('');

  const index = useMemo(() => buildIndex(bibleVersion), [bibleVersion]);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return index.filter(r => r.text.toLowerCase().includes(q));
  }, [query, index]);

  const highlight = (text: string, q: string) => {
    if (!q) return [{text, bold: false}];
    const lower = text.toLowerCase();
    const idx = lower.indexOf(q.toLowerCase());
    if (idx === -1) return [{text, bold: false}];
    return [
      {text: text.slice(0, idx), bold: false},
      {text: text.slice(idx, idx + q.length), bold: true},
      {text: text.slice(idx + q.length), bold: false},
    ];
  };

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: colors.background}]}
      edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, {borderBottomColor: colors.border}]}>
        <View style={[styles.searchBar, {backgroundColor: colors.surface}]}>
          <Icons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, {color: colors.text, fontSize}]}
            placeholder="Search psalms…"
            placeholderTextColor={colors.textSecondary}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Icons name="close" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.cancelBtn]}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Text style={[styles.cancelText, {color: colors.primary, fontSize: fontSize - 2}]}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results count */}
      {query.length >= 2 && (
        <View style={styles.countRow}>
          <Text style={[styles.countText, {color: colors.textSecondary, fontSize: fontSize - 5}]}>
            {results.length} result{results.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Results list */}
      <FlatList
        data={results}
        keyExtractor={item => `${item.chapter}-${item.verse}`}
        keyboardShouldPersistTaps="handled"
        renderItem={({item}) => {
          const parts = highlight(item.text, query.trim());
          return (
            <TouchableOpacity
              style={[styles.resultItem, {borderBottomColor: colors.border}]}
              onPress={() => navigation.goBack()}>
              <Text style={[styles.resultRef, {color: colors.primary, fontSize: fontSize - 5}]}>
                PSALM {item.chapter}:{item.verse}
              </Text>
              <Text style={[styles.resultText, {fontSize: fontSize - 2}]} numberOfLines={2}>
                {parts.map((part, i) => (
                  <Text
                    key={i}
                    style={{
                      color: part.bold ? colors.primary : colors.text,
                      fontWeight: part.bold ? '700' : '400',
                    }}>
                    {part.text}
                  </Text>
                ))}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          query.length >= 2 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, {color: colors.textSecondary, fontSize}]}>
                No results found
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Roboto',
    padding: 0,
    margin: 0,
  },
  cancelBtn: {paddingVertical: 8},
  cancelText: {fontFamily: 'Roboto', fontWeight: '500'},
  countRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  countText: {fontFamily: 'Roboto'},
  resultItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  resultRef: {fontFamily: 'Roboto', fontWeight: '700', letterSpacing: 1},
  resultText: {fontFamily: 'Roboto'},
  emptyContainer: {
    alignItems: 'center',
    paddingTop: spacing.xl * 2,
  },
  emptyText: {fontFamily: 'Roboto'},
});
