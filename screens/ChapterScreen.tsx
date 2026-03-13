import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FlatList,
    Modal,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { shape, spacing, useTheme } from '../theme';
import { getChapter } from '../services/psalmsService';
import { toggleBookmark, isBookmarked } from '../services/bookmarksService';
import {
    getHighlightForVerse,
    setHighlight,
    clearHighlight,
    HIGHLIGHT_COLORS,
    type HighlightColor,
} from '../services/highlightsService';
import { getNoteForVerse } from '../services/notesService';
import { useAppSettings } from '../context/AppSettingsContext';
import Icons from '../components/Icons';
import { M3Divider, M3Pressable, M3TextButton } from '../components/M3';

// ─── Types ───────────────────────────────────────────────────────────────────

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

type ActionSheet = { verse: number; text: string } | null;

// ─── Component ───────────────────────────────────────────────────────────────

export default function ChapterScreen({ chapter, highlightVerse, onOpenNoteEdit }: Props) {
    const { t } = useTranslation();
    const { colors, type, fontSize, isDark } = useTheme();
    const { bibleVersion } = useAppSettings();

    const [verses, setVerses] = useState<string[]>([]);
    const [verseStates, setVerseStates] = useState<Record<number, VerseState>>({});

    // Modal state
    const [actionSheet, setActionSheet] = useState<ActionSheet>(null);
    const [highlightSheet, setHighlightSheet] = useState<number | null>(null);

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
            } catch { }
        },
        [chapter],
    );

    useEffect(() => {
        verses.forEach((_, i) => loadVerseState(i + 1));
    }, [verses, loadVerseState]);

    // ─── Action handlers ───────────────────────────────────────────────────────

    const handleBookmarkToggle = useCallback(
        async (verseNumber: number) => {
            const next = await toggleBookmark(chapter, verseNumber);
            setVerseStates(prev => ({
                ...prev,
                [verseNumber]: {
                    ...(prev[verseNumber] ?? { bookmarked: false, highlight: null, hasNote: false }),
                    bookmarked: next,
                },
            }));
            setActionSheet(null);
        },
        [chapter],
    );

    const handleHighlightApply = useCallback(
        async (verseNumber: number, color: HighlightColor) => {
            await setHighlight(chapter, verseNumber, color);
            setVerseStates(prev => ({
                ...prev,
                [verseNumber]: {
                    ...(prev[verseNumber] ?? { bookmarked: false, highlight: null, hasNote: false }),
                    highlight: color,
                },
            }));
            setHighlightSheet(null);
        },
        [chapter],
    );

    const handleHighlightRemove = useCallback(
        async (verseNumber: number) => {
            await clearHighlight(chapter, verseNumber);
            setVerseStates(prev => ({
                ...prev,
                [verseNumber]: {
                    ...(prev[verseNumber] ?? { bookmarked: false, highlight: null, hasNote: false }),
                    highlight: null,
                },
            }));
            setHighlightSheet(null);
        },
        [chapter],
    );

    const handleLongPress = useCallback((verseNumber: number, verseText: string) => {
        setActionSheet({ verse: verseNumber, text: verseText });
    }, []);

    // ─── Highlight background ──────────────────────────────────────────────────

    const getHighlightBg = (color: HighlightColor | null) => {
        if (!color) {
            return undefined;
        }
        const found = HIGHLIGHT_COLORS.find(c => c.color === color);
        return found ? (isDark ? found.darkHex : found.hex) : undefined;
    };

    // ─── Shared sheet styles (used by both modals) ─────────────────────────────

    const sheetBg = colors.surface;
    const backdropColor = colors.scrim + '99';

    // ─── Render ────────────────────────────────────────────────────────────────

    return (
        <>
            <FlatList
                data={verses}
                keyExtractor={(_, i) => String(i)}
                style={[styles.list, { backgroundColor: colors.background }]}
                contentContainerStyle={styles.content}
                renderItem={({ item, index }) => {
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
                                hlBg ? { backgroundColor: hlBg } : null,
                            ]}>
                            <Text
                                style={[
                                    type.labelLarge,
                                    styles.verseNumber,
                                    { color: colors.primary },
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

            {/* ─── Action sheet modal ──────────────────────────────────────────── */}
            <Modal
                visible={actionSheet !== null}
                transparent
                animationType="slide"
                onRequestClose={() => setActionSheet(null)}>
                <TouchableOpacity
                    style={[styles.backdrop, { backgroundColor: backdropColor }]}
                    activeOpacity={1}
                    onPress={() => setActionSheet(null)}
                />
                <View
                    style={[
                        styles.sheet,
                        {
                            backgroundColor: sheetBg,
                            borderTopLeftRadius: shape.extraLarge,
                            borderTopRightRadius: shape.extraLarge,
                        },
                    ]}>
                    {/* Handle */}
                    <View style={styles.handle} />

                    {/* Title */}
                    <Text style={[type.titleMedium, styles.sheetTitle, { color: colors.onSurface }]}>
                        Psalm {chapter}:{actionSheet?.verse}
                    </Text>
                    <M3Divider />

                    {/* Actions */}
                    <M3Pressable
                        style={styles.sheetRow}
                        onPress={() => actionSheet && handleBookmarkToggle(actionSheet.verse)}>
                        <Icons
                            name={
                                actionSheet && verseStates[actionSheet.verse]?.bookmarked
                                    ? 'bookmark'
                                    : 'bookmark-outline'
                            }
                            size={22}
                            color={
                                actionSheet && verseStates[actionSheet.verse]?.bookmarked
                                    ? colors.primary
                                    : colors.onSurfaceVariant
                            }
                        />
                        <Text style={[type.bodyLarge, { color: colors.onSurface }]}>
                            {actionSheet && verseStates[actionSheet.verse]?.bookmarked
                                ? t('removeBookmark', 'Remove Bookmark')
                                : t('bookmark')}
                        </Text>
                    </M3Pressable>

                    <M3Pressable
                        style={styles.sheetRow}
                        onPress={() => {
                            if (!actionSheet) {
                                return;
                            }
                            const v = actionSheet.verse;
                            setActionSheet(null);
                            setHighlightSheet(v);
                        }}>
                        <Icons name="highlight" size={22} color={colors.onSurfaceVariant} />
                        <Text style={[type.bodyLarge, { color: colors.onSurface }]}>{t('highlight')}</Text>
                    </M3Pressable>

                    <M3Pressable
                        style={styles.sheetRow}
                        onPress={() => {
                            if (!actionSheet) {
                                return;
                            }
                            const v = actionSheet.verse;
                            setActionSheet(null);
                            onOpenNoteEdit(v);
                        }}>
                        <Icons name="note-outline" size={22} color={colors.onSurfaceVariant} />
                        <Text style={[type.bodyLarge, { color: colors.onSurface }]}>{t('note')}</Text>
                    </M3Pressable>

                    <M3Pressable
                        style={styles.sheetRow}
                        onPress={() => {
                            if (!actionSheet) {
                                return;
                            }
                            const { verse, text } = actionSheet;
                            setActionSheet(null);
                            Share.share({
                                message: `${text}\n\n— Psalm ${chapter}:${verse} (Psalms Way)`,
                            });
                        }}>
                        <Icons name="share" size={22} color={colors.onSurfaceVariant} />
                        <Text style={[type.bodyLarge, { color: colors.onSurface }]}>{t('share')}</Text>
                    </M3Pressable>

                    <M3Divider style={styles.sheetDivider} />

                    <View style={styles.sheetFooter}>
                        <M3TextButton label={t('close')} onPress={() => setActionSheet(null)} />
                    </View>
                </View>
            </Modal>

            {/* ─── Highlight picker modal ──────────────────────────────────────── */}
            <Modal
                visible={highlightSheet !== null}
                transparent
                animationType="slide"
                onRequestClose={() => setHighlightSheet(null)}>
                <TouchableOpacity
                    style={[styles.backdrop, { backgroundColor: backdropColor }]}
                    activeOpacity={1}
                    onPress={() => setHighlightSheet(null)}
                />
                <View
                    style={[
                        styles.sheet,
                        {
                            backgroundColor: sheetBg,
                            borderTopLeftRadius: shape.extraLarge,
                            borderTopRightRadius: shape.extraLarge,
                        },
                    ]}>
                    {/* Handle */}
                    <View style={styles.handle} />

                    {/* Title */}
                    <Text style={[type.titleMedium, styles.sheetTitle, { color: colors.onSurface }]}>
                        Highlight colour
                    </Text>
                    <M3Divider />

                    {/* Colour swatches */}
                    <View style={styles.swatchRow}>
                        {HIGHLIGHT_COLORS.map(c => {
                            const bg = isDark ? c.darkHex : c.hex;
                            const isSelected = highlightSheet !== null &&
                                verseStates[highlightSheet]?.highlight === c.color;
                            return (
                                <TouchableOpacity
                                    key={c.color}
                                    onPress={() =>
                                        highlightSheet !== null && handleHighlightApply(highlightSheet, c.color)
                                    }
                                    style={styles.swatchOuter}
                                    accessibilityLabel={c.color}>
                                    <View
                                        style={[
                                            styles.swatch,
                                            { backgroundColor: bg },
                                            isSelected && {
                                                borderWidth: 3,
                                                borderColor: colors.primary,
                                            },
                                        ]}
                                    />
                                    <Text style={[type.labelSmall, { color: colors.onSurfaceVariant, marginTop: 4 }]}>
                                        {c.color.charAt(0).toUpperCase() + c.color.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <M3Divider style={styles.sheetDivider} />

                    {/* Remove (only if currently highlighted) */}
                    {highlightSheet !== null && verseStates[highlightSheet]?.highlight && (
                        <M3Pressable
                            style={styles.sheetRow}
                            onPress={() =>
                                highlightSheet !== null && handleHighlightRemove(highlightSheet)
                            }>
                            <Icons name="close" size={22} color={colors.error} />
                            <Text style={[type.bodyLarge, { color: colors.error }]}>{t('removeHighlight', 'Remove highlight')}</Text>
                        </M3Pressable>
                    )}

                    <View style={styles.sheetFooter}>
                        <M3TextButton label={t('close')} onPress={() => setHighlightSheet(null)} />
                    </View>
                </View>
            </Modal>
        </>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    list: { flex: 1 },
    content: { paddingBottom: spacing.xl },
    verseRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: spacing.sm + 8,
        paddingVertical: spacing.sm + 4,
        //  gap: spacing.sm,
    },
    verseNumber: {
        width: 16,
        textAlign: 'left',
        paddingTop: spacing.xs + 2,
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
    // Modals
    backdrop: {
        flex: 1,
    },
    sheet: {
        paddingBottom: spacing.xl,
    },
    handle: {
        width: 32,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#9E9E9E',
        alignSelf: 'center',
        marginTop: spacing.sm,
        marginBottom: spacing.sm,
    },
    sheetTitle: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
    },
    sheetRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm + 4,
        gap: spacing.md,
    },
    sheetDivider: {
        marginVertical: spacing.xs,
    },
    sheetFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: spacing.sm,
        paddingTop: spacing.xs,
    },
    // Highlight swatches
    swatchRow: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.lg,
    },
    swatchOuter: {
        alignItems: 'center',
        gap: 4,
    },
    swatch: {
        width: 52,
        height: 52,
        borderRadius: 26,
    },
});
