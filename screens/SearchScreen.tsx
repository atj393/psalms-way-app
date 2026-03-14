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
import {useTranslation} from 'react-i18next';
import {shape, spacing, useTheme} from '../theme';
import Icons from '../components/Icons';
import {getChapter} from '../services/psalmsService';
import {useAppSettings} from '../context/AppSettingsContext';
import {M3Divider, M3Pressable} from '../components/M3';

type Result = {chapter: number; verse: number; text: string};

function buildIndex(version: string): Result[] {
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
  const {t} = useTranslation();
  const {colors, type} = useTheme();
  const {bibleVersion} = useAppSettings();

  const [query, setQuery] = useState('');

  const index = useMemo(() => buildIndex(bibleVersion), [bibleVersion]);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) {
      return [];
    }
    return index.filter(r => r.text.toLowerCase().includes(q));
  }, [query, index]);

  const highlight = (text: string, q: string) => {
    if (!q) {
      return [{text, bold: false}];
    }
    const lower = text.toLowerCase();
    const idx = lower.indexOf(q.toLowerCase());
    if (idx === -1) {
      return [{text, bold: false}];
    }
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

      {/* Search bar row */}
      <View style={[styles.searchRow, {backgroundColor: colors.surface, elevation: 2}]}>
        <View
          style={[
            styles.searchBar,
            {backgroundColor: colors.surfaceVariant, borderRadius: shape.full},
          ]}>
          <Icons name="search" size={20} color={colors.onSurfaceVariant} />
          <TextInput
            style={[
              type.bodyLarge,
              styles.searchInput,
              {color: colors.onSurface},
            ]}
            placeholder={t('searchPlaceholder')}
            placeholderTextColor={colors.onSurfaceVariant}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery('')}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
              <Icons name="close" size={18} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.cancelBtn}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Text style={[type.labelLarge, {color: colors.primary}]}>{t('close')}</Text>
        </TouchableOpacity>
      </View>

      {/* Result count */}
      {query.length >= 2 && (
        <View style={styles.countRow}>
          <Text style={[type.labelMedium, {color: colors.onSurfaceVariant}]}>
            {t('searchResults', {count: results.length})}
          </Text>
        </View>
      )}

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={item => `${item.chapter}-${item.verse}`}
        keyboardShouldPersistTaps="handled"
        ItemSeparatorComponent={() => <M3Divider />}
        renderItem={({item}) => {
          const parts = highlight(item.text, query.trim());
          return (
            <M3Pressable
              style={styles.resultItem}
              onPress={() => navigation.goBack()}>
              <Text
                style={[
                  type.labelLarge,
                  styles.resultRef,
                  {color: colors.primary},
                ]}>
                {t('psalmRef', {chapter: item.chapter, verse: item.verse})}
              </Text>
              <Text style={styles.resultText} numberOfLines={2}>
                {parts.map((part, i) => (
                  <Text
                    key={i}
                    style={[
                      type.bodyMedium,
                      {
                        color: part.bold ? colors.primary : colors.onSurface,
                        fontWeight: part.bold ? '700' : '400',
                      },
                    ]}>
                    {part.text}
                  </Text>
                ))}
              </Text>
            </M3Pressable>
          );
        }}
        ListEmptyComponent={
          query.length >= 2 ? (
            <View style={styles.emptyContainer}>
              <Text style={[type.bodyMedium, {color: colors.onSurfaceVariant}]}>
                {t('noResults')}
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    height: 48,
  },
  searchInput: {
    flex: 1,
    padding: 0,
    margin: 0,
  },
  cancelBtn: {
    paddingVertical: spacing.sm,
  },
  countRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  resultItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    gap: 4,
  },
  resultRef: {
    letterSpacing: 1,
  },
  resultText: {},
  emptyContainer: {
    alignItems: 'center',
    paddingTop: spacing.xl * 2,
  },
});
