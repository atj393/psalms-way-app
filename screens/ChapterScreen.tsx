import React, {useCallback, useEffect, useState} from 'react';
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  Platform,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {spacing, useTheme} from '../theme';
import {getChapter} from '../services/psalmsService';
import {toggleBookmark, isBookmarked} from '../services/bookmarksService';
import {
  getHighlightForVerse,
  setHighlight,
  clearHighlight,
  HIGHLIGHT_COLORS,
  type HighlightColor,
} from '../services/highlightsService';
import {getNoteForVerse} from '../services/notesService';
import {useAppSettings} from '../context/AppSettingsContext';
import Icons from '../components/Icons';
import {M3Pressable, M3Divider} from '../components/M3';

type Props = {
  chapter: number;
  highlightVerse: number;
  onOpenNoteEdit: (verse: number) => void;
};

type VerseState = {
  bookmarked: boolean;
  highlight: HighlightColor | null;
  hasNote: boolean;
};

export default function ChapterScreen({chapter, highlightVerse, onOpenNoteEdit}: Props) {
  const {colors, type, fontSize, isDark} = useTheme();
  const {bibleVersion} = useAppSettings();

  const [verses, setVerses] = useState<string[]>([]);
  const [verseStates, setVerseStates] = useState<Record<number, VerseState>>({});

  useEffect(() => {
    setVerses(getChapter(chapter, bibleVersion));
    setVerseStates({});
  }, [chapter, bibleVersion]);

  const loadVerseState = useCallback(
    async (verseNumber: number) => {
      try {
        const [bm, hl, note] = await Promise.all([
          isBookmarked(chapter, verseNumber),
          getHighlightForVerse(chapter, verseNumber),
          getNoteForVerse(chapter, verseNumber),
        ]);
        setVerseStates(prev => ({
          ...prev,
          [verseNumber]: {
            bookmarked: bm,
            highlight: hl?.color ?? null,
            hasNote: note !== null,
          },
        }));
      } catch {}
    },
    [chapter],
  );

  useEffect(() => {
    verses.forEach((_, i) => loadVerseState(i + 1));
  }, [verses, loadVerseState]);

  const handleBookmarkToggle = useCallback(
    async (verseNumber: number) => {
      const next = await toggleBookmark(chapter, verseNumber);
      setVerseStates(prev => ({
        ...prev,
        [verseNumber]: {
          ...(prev[verseNumber] ?? {bookmarked: false, highlight: null, hasNote: false}),
          bookmarked: next,
        },
      }));
    },
    [chapter],
  );

  const showHighlightPicker = useCallback(
    (verseNumber: number) => {
      const options = HIGHLIGHT_COLORS.map(
        c => c.color.charAt(0).toUpperCase() + c.color.slice(1),
      );
      const currentHighlight = verseStates[verseNumber]?.highlight;

      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: [
              ...options,
              currentHighlight ? 'Remove highlight' : 'Cancel',
              'Cancel',
            ],
            cancelButtonIndex: options.length + (currentHighlight ? 1 : 0),
            destructiveButtonIndex: currentHighlight ? options.length : undefined,
          },
          async index => {
            if (index < options.length) {
              const color = HIGHLIGHT_COLORS[index].color;
              await setHighlight(chapter, verseNumber, color);
              setVerseStates(prev => ({
                ...prev,
                [verseNumber]: {
                  ...(prev[verseNumber] ?? {bookmarked: false, highlight: null, hasNote: false}),
                  highlight: color,
                },
              }));
            } else if (currentHighlight && index === options.length) {
              await clearHighlight(chapter, verseNumber);
              setVerseStates(prev => ({
                ...prev,
                [verseNumber]: {
                  ...(prev[verseNumber] ?? {bookmarked: false, highlight: null, hasNote: false}),
                  highlight: null,
                },
              }));
            }
          },
        );
      } else {
        const alertOptions = HIGHLIGHT_COLORS.map(c => ({
          text: c.color.charAt(0).toUpperCase() + c.color.slice(1),
          onPress: async () => {
            await setHighlight(chapter, verseNumber, c.color);
            setVerseStates(prev => ({
              ...prev,
              [verseNumber]: {
                ...(prev[verseNumber] ?? {bookmarked: false, highlight: null, hasNote: false}),
                highlight: c.color,
              },
            }));
          },
        }));
        if (currentHighlight) {
          alertOptions.push({
            text: 'Remove',
            onPress: async () => {
              await clearHighlight(chapter, verseNumber);
              setVerseStates(prev => ({
                ...prev,
                [verseNumber]: {
                  ...(prev[verseNumber] ?? {bookmarked: false, highlight: null, hasNote: false}),
                  highlight: null,
                },
              }));
            },
          });
        }
        Alert.alert('Highlight color', '', [
          ...alertOptions,
          {text: 'Cancel', onPress: () => {}},
        ]);
      }
    },
    [chapter, verseStates],
  );

  const handleLongPress = useCallback(
    (verseNumber: number, verseText: string) => {
      const actions = ['Bookmark', 'Highlight', 'Note', 'Share', 'Cancel'];
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {options: actions, cancelButtonIndex: actions.length - 1},
          async index => {
            if (index === 0) {
              await handleBookmarkToggle(verseNumber);
            } else if (index === 1) {
              showHighlightPicker(verseNumber);
            } else if (index === 2) {
              onOpenNoteEdit(verseNumber);
            } else if (index === 3) {
              Share.share({
                message: `${verseText}\n\n— Psalm ${chapter}:${verseNumber} (Psalms Way)`,
              });
            }
          },
        );
      } else {
        Alert.alert(`Psalm ${chapter}:${verseNumber}`, '', [
          {text: 'Bookmark', onPress: () => handleBookmarkToggle(verseNumber)},
          {text: 'Highlight', onPress: () => showHighlightPicker(verseNumber)},
          {text: 'Note', onPress: () => onOpenNoteEdit(verseNumber)},
          {
            text: 'Share',
            onPress: () =>
              Share.share({
                message: `${verseText}\n\n— Psalm ${chapter}:${verseNumber} (Psalms Way)`,
              }),
          },
          {text: 'Cancel', style: 'cancel'},
        ]);
      }
    },
    [chapter, handleBookmarkToggle, showHighlightPicker, onOpenNoteEdit],
  );

  const getHighlightBg = (color: HighlightColor | null) => {
    if (!color) {
      return undefined;
    }
    const found = HIGHLIGHT_COLORS.find(c => c.color === color);
    return found ? (isDark ? found.darkHex : found.hex) : undefined;
  };

  return (
    <FlatList
      data={verses}
      keyExtractor={(_, i) => String(i)}
      style={[styles.list, {backgroundColor: colors.background}]}
      contentContainerStyle={styles.content}
      renderItem={({item, index}) => {
        const verseNumber = index + 1;
        const isHighlighted = highlightVerse === verseNumber;
        const state = verseStates[verseNumber];
        const hlBg = getHighlightBg(state?.highlight ?? null);

        return (
          <M3Pressable
            onLongPress={() => handleLongPress(verseNumber, item)}
            delayLongPress={400}
            style={[
              styles.verseRow,
              isHighlighted && {
                backgroundColor: colors.primaryContainer,
                borderLeftColor: colors.primary,
                borderLeftWidth: 3,
              },
              hlBg ? {backgroundColor: hlBg} : null,
            ]}>
            <Text
              style={[
                type.labelLarge,
                styles.verseNumber,
                {color: colors.primary},
              ]}>
              {verseNumber}
            </Text>
            <Text
              style={{
                flex: 1,
                fontFamily: 'Roboto',
                fontSize,
                color: colors.onSurface,
                lineHeight: fontSize * 1.75,
                letterSpacing: 0.5,
              }}>
              {item}
            </Text>
            <View style={styles.verseIcons}>
              {state?.bookmarked && (
                <Icons name="bookmark" size={12} color={colors.primary} />
              )}
              {state?.highlight && (
                <View
                  style={[
                    styles.highlightDot,
                    {
                      backgroundColor:
                        HIGHLIGHT_COLORS.find(c => c.color === state.highlight)?.hex ??
                        colors.primary,
                    },
                  ]}
                />
              )}
              {state?.hasNote && (
                <Icons name="note" size={12} color={colors.onSurfaceVariant} />
              )}
            </View>
          </M3Pressable>
        );
      }}
      ItemSeparatorComponent={() => <M3Divider style={styles.divider} />}
    />
  );
}

const styles = StyleSheet.create({
  list: {flex: 1},
  content: {paddingBottom: spacing.xl},
  verseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm + 4,
    gap: spacing.sm,
  },
  verseNumber: {
    width: 32,
    textAlign: 'right',
    paddingTop: 2,
  },
  verseIcons: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 3,
    minWidth: 16,
  },
  highlightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  divider: {
    marginLeft: 44,
  },
});
