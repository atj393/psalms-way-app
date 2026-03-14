import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { spacing, useTheme } from '../theme';
import { M3Card, M3Divider, M3IconButton } from '../components/M3';
import Icons from '../components/Icons';
import { getStreak, getLongestStreak } from '../services/streakService';
import { getHistory, type HistoryEntry } from '../services/historyService';
import { getBookmarks } from '../services/bookmarksService';
import { getNotes } from '../services/notesService';
import { getHighlights } from '../services/highlightsService';
import { getFavorites } from '../services/favoritesService';

// ─── Types ───────────────────────────────────────────────────────────────────

type StatsData = {
    streak: number;
    longestStreak: number;
    history: HistoryEntry[];
    bookmarkCount: number;
    noteCount: number;
    highlightCount: number;
    favoriteCount: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
    try {
        const d = new Date(iso);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
        return '';
    }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
    const { colors, type } = useTheme();
    return (
        <Text
            style={[
                type.labelLarge,
                { color: colors.primary, letterSpacing: 1.2, marginBottom: spacing.sm },
            ]}>
            {label}
        </Text>
    );
}

function StatRow({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) {
    const { colors, type } = useTheme();
    return (
        <View style={styles.statRow}>
            {icon ? <View style={styles.statIcon}>{icon}</View> : null}
            <Text style={[type.bodyMedium, { color: colors.onSurface, flex: 1 }]}>{label}</Text>
            <Text style={[type.titleSmall, { color: colors.primary }]}>{value}</Text>
        </View>
    );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function StatsScreen() {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const { colors, type, isDark } = useTheme();

    const [data, setData] = useState<StatsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            getStreak(),
            getLongestStreak(),
            getHistory(),
            getBookmarks(),
            getNotes(),
            getHighlights(),
            getFavorites(),
        ])
            .then(([streak, longestStreak, history, bookmarks, notes, highlights, favorites]) => {
                setData({
                    streak,
                    longestStreak,
                    history,
                    bookmarkCount: bookmarks.length,
                    noteCount: notes.length,
                    highlightCount: highlights.length,
                    favoriteCount: favorites.length,
                });
            })
            .catch(() => { })
            .finally(() => setIsLoading(false));
    }, []);

    // ─── Last 7 days ────────────────────────────────────────────────────────────
    // Note: history dates are UTC ISO strings. The date comparison uses UTC date
    // portions, which may be off by one day for users far from UTC — acceptable
    // for a local analytics screen.
    const last7Days = useMemo(() => {
        if (!data) { return []; }
        const DAY_LABELS = t('daysShort').split('_');
        const readDates = new Set(data.history.map(h => h.date.split('T')[0]));
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const iso = d.toISOString().split('T')[0];
            return { label: DAY_LABELS[d.getDay()], read: readDates.has(iso) };
        });
    }, [data]);

    // ─── Unique chapters ────────────────────────────────────────────────────────
    const uniqueChapters = useMemo(() => {
        if (!data) { return 0; }
        return new Set(data.history.map(h => h.chapter)).size;
    }, [data]);

    // ─── Top 5 chapters by frequency ────────────────────────────────────────────
    const topChapters = useMemo(() => {
        if (!data) { return []; }
        const counts: Record<number, number> = {};
        for (const h of data.history) {
            counts[h.chapter] = (counts[h.chapter] ?? 0) + 1;
        }
        return Object.entries(counts)
            .map(([chapter, count]) => ({ chapter: Number(chapter), count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [data]);

    // ─── Recent activity (last 5) ───────────────────────────────────────────────
    const recentActivity = useMemo(() => {
        if (!data) { return []; }
        return data.history.slice(0, 5);
    }, [data]);

    // ─── Render ─────────────────────────────────────────────────────────────────

    return (
        <SafeAreaView
            edges={['top', 'bottom']}
            style={[styles.safeArea, { backgroundColor: colors.background }]}>

            {/* App bar */}
            <View
                style={[
                    styles.appBar,
                    { backgroundColor: colors.surface, elevation: isDark ? 1 : 2 },
                ]}>
                <View style={styles.appBarTitle}>
                    <Text style={[type.titleLarge, { color: colors.onSurface }]}>
                        {t('statsTitle')}
                    </Text>
                    <Text style={[type.labelMedium, { color: colors.onSurfaceVariant }]}>
                        {t('statsSubtitle')}
                    </Text>
                </View>
                <M3IconButton onPress={() => navigation.goBack()} accessibilityLabel={t('a11yClose')}>
                    <Icons name="close" size={24} color={colors.onSurfaceVariant} />
                </M3IconButton>
            </View>

            {isLoading ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}>

                    {/* ── Streak card ── */}
                    <M3Card variant="elevated" style={styles.card}>
                        <View style={styles.streakTop}>
                            <Icons name="insights" size={32} color={colors.primary} />
                            <View style={styles.streakNumbers}>
                                <View style={styles.streakRow}>
                                    <Text style={[type.displaySmall, { color: colors.primary }]}>
                                        {data?.streak ?? 0}
                                    </Text>
                                    <Text
                                        style={[
                                            type.bodyLarge,
                                            { color: colors.onSurfaceVariant, alignSelf: 'flex-end', marginBottom: 4, marginLeft: spacing.xs },
                                        ]}>
                                        {t('statsDayStreak')}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <M3Divider style={styles.cardDivider} />
                        <Text style={[type.bodyMedium, { color: colors.onSurfaceVariant, paddingTop: spacing.xs }]}>
                            {t('statsLongestStreak', { count: data?.longestStreak ?? 0 })}
                        </Text>
                    </M3Card>

                    {/* ── Last 7 days card ── */}
                    <M3Card variant="elevated" style={styles.card}>
                        <SectionLabel label={t('statsLast7Days')} />
                        <View style={styles.weekRow}>
                            {last7Days.map((day, idx) => (
                                <View key={idx} style={styles.dayCol}>
                                    <View
                                        style={[
                                            styles.dayDot,
                                            day.read
                                                ? { backgroundColor: colors.primary }
                                                : {
                                                    backgroundColor: 'transparent',
                                                    borderWidth: 2,
                                                    borderColor: colors.outlineVariant,
                                                },
                                        ]}
                                    />
                                    <Text
                                        style={[
                                            type.labelSmall,
                                            { color: day.read ? colors.primary : colors.onSurfaceVariant, marginTop: spacing.xs },
                                        ]}>
                                        {day.label}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </M3Card>

                    {/* ── Totals card ── */}
                    <M3Card variant="filled" style={styles.card}>
                        <SectionLabel label={t('statsReadingTotals')} />
                        <StatRow
                            label={t('statsChaptersRead')}
                            value={uniqueChapters}
                            icon={<Icons name="library" size={18} color={colors.onSurfaceVariant} />}
                        />
                        <M3Divider style={styles.rowDivider} />
                        <StatRow
                            label={t('statsTotalSessions')}
                            value={data?.history.length ?? 0}
                            icon={<Icons name="history" size={18} color={colors.onSurfaceVariant} />}
                        />
                        <M3Divider style={styles.rowDivider} />
                        <StatRow
                            label="Bookmarks"
                            value={data?.bookmarkCount ?? 0}
                            icon={<Icons name="bookmark" size={18} color={colors.onSurfaceVariant} />}
                        />
                        <M3Divider style={styles.rowDivider} />
                        <StatRow
                            label="Highlights"
                            value={data?.highlightCount ?? 0}
                            icon={<Icons name="highlight" size={18} color={colors.onSurfaceVariant} />}
                        />
                        <M3Divider style={styles.rowDivider} />
                        <StatRow
                            label="Notes"
                            value={data?.noteCount ?? 0}
                            icon={<Icons name="note" size={18} color={colors.onSurfaceVariant} />}
                        />
                        <M3Divider style={styles.rowDivider} />
                        <StatRow
                            label="Favorites"
                            value={data?.favoriteCount ?? 0}
                            icon={<Icons name="star" size={18} color={colors.onSurfaceVariant} />}
                        />
                    </M3Card>

                    {/* ── Recent activity card ── */}
                    {recentActivity.length > 0 && (
                        <M3Card variant="elevated" style={styles.card}>
                            <SectionLabel label={t('statsRecentActivity')} />
                            {recentActivity.map((item, idx) => (
                                <React.Fragment key={idx}>
                                    {idx > 0 && <M3Divider style={styles.rowDivider} />}
                                    <View style={styles.chapterRow}>
                                        <Text style={[type.bodyMedium, { color: colors.onSurface, flex: 1 }]}>
                                            {item.verse > 0
                                                ? t('psalmSubtitle', { chapter: item.chapter, verse: item.verse })
                                                : t('psalmTitle', { chapter: item.chapter })}
                                        </Text>
                                        <Text style={[type.bodySmall, { color: colors.onSurfaceVariant }]}>
                                            {formatDate(item.date)}
                                        </Text>
                                    </View>
                                </React.Fragment>
                            ))}
                        </M3Card>
                    )}


                    {/* ── Most read card ── */}
                    {topChapters.length > 0 && (
                        <M3Card variant="elevated" style={styles.card}>
                            <SectionLabel label={t('statsMostRead')} />
                            {topChapters.map((item, idx) => (
                                <React.Fragment key={item.chapter}>
                                    {idx > 0 && <M3Divider style={styles.rowDivider} />}
                                    <View style={styles.chapterRow}>
                                        <Text style={[type.bodyMedium, { color: colors.onSurface, flex: 1 }]}>
                                            {t('psalmTitle', { chapter: item.chapter })}
                                        </Text>
                                        <View style={[styles.countPill, { backgroundColor: colors.primaryContainer }]}>
                                            <Text style={[type.labelSmall, { color: colors.onPrimaryContainer }]}>
                                                {item.count}×
                                            </Text>
                                        </View>
                                    </View>
                                </React.Fragment>
                            ))}
                        </M3Card>
                    )}


                    {/* Bottom breathing room */}
                    <View style={styles.bottomPad} />
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    appBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: spacing.xs,
        paddingRight: spacing.md,
        paddingVertical: spacing.xs,
        minHeight: 64,
    },
    appBarTitle: {
        flex: 1,
        marginLeft: spacing.xs,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: spacing.md,
    },
    card: {
        padding: spacing.md,
        marginBottom: spacing.sm,
    },
    cardDivider: {
        marginVertical: spacing.sm,
    },
    rowDivider: {
        marginVertical: spacing.xs,
    },
    // Streak
    streakTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    streakNumbers: {
        flex: 1,
    },
    streakRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    // 7-day grid
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: spacing.xs,
    },
    dayCol: {
        alignItems: 'center',
    },
    dayDot: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },
    // Stat rows
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.xs + 2,
    },
    statIcon: {
        marginRight: spacing.sm,
    },
    // Chapter rows
    chapterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.xs + 2,
    },
    countPill: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: 9999,
    },
    bottomPad: {
        height: spacing.xl,
    },
});
