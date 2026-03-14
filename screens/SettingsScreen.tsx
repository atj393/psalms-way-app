import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { shape, spacing, useTheme, type ThemeMode } from '../theme';
import { useAppSettings, type AppLanguage } from '../context/AppSettingsContext';
import { getAllVersions, type PsalmMetadata } from '../services/psalmsService';

const ALL_VERSIONS: PsalmMetadata[] = getAllVersions();
function getVersionLabel(module: string): string {
    return ALL_VERSIONS.find(v => v.module === module)?.name ?? module;
}
import Icons from '../components/Icons';
import i18n, { getDeviceLanguage } from '../i18n';
import {
    requestNotificationPermission,
    scheduleDailyNotification,
    cancelDailyNotification,
} from '../services/notificationService';
import { M3Card, M3Divider, M3IconButton, M3Pressable, M3SegmentedButton, M3TextButton } from '../components/M3';
// M3SegmentedButton still used for TEXT SIZE and THEME sections

// ─── Constants ───────────────────────────────────────────────────────────────

const FONT_SIZES: { label: string; size: number; a11y: string }[] = [
    { label: 'A', size: 16, a11y: 'Small text' },
    { label: 'A', size: 20, a11y: 'Medium text' },
    { label: 'A', size: 24, a11y: 'Large text' },
];

const THEME_MODES: { label: string; value: ThemeMode; a11y: string }[] = [
    { label: 'Auto', value: 'auto', a11y: 'Follow system theme' },
    { label: 'Light', value: 'light', a11y: 'Light theme' },
    { label: 'Dark', value: 'dark', a11y: 'Dark theme' },
];

type LangOption = { label: string; value: AppLanguage | 'auto' };
const LANGUAGES: LangOption[] = [
    { label: 'Auto (device)', value: 'auto' },
    { label: 'English', value: 'en' },
    { label: 'Deutsch', value: 'de' },
    { label: 'Français', value: 'fr' },
    { label: 'Español', value: 'es' },
    { label: 'हिन्दी', value: 'hi' },
    { label: 'தமிழ்', value: 'ta' },
    { label: 'తెలుగు', value: 'te' },
    { label: 'ಕನ್ನಡ', value: 'kn' },
    { label: 'മലയാളം', value: 'ml' },
];

function getLangLabel(value: AppLanguage | 'auto'): string {
    return LANGUAGES.find(l => l.value === value)?.label ?? 'Auto (device)';
}

function formatTime(hour: number, minute: number): string {
    const h = hour % 12 || 12;
    const m = String(minute).padStart(2, '0');
    const ampm = hour < 12 ? 'AM' : 'PM';
    return `${h}:${m} ${ampm}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SettingsScreen() {
    const navigation = useNavigation();
    const { t } = useTranslation();
    const { colors, type, isDark } = useTheme();
    const {
        themeMode,
        setThemeMode,
        fontSize,
        setFontSize,
        bibleVersion,
        setBibleVersion,
        language,
        setLanguage,
        notificationEnabled,
        notificationHour,
        notificationMinute,
        setNotificationEnabled,
        setNotificationTime,
    } = useAppSettings();

    const [showTimePicker, setShowTimePicker] = useState(false);
    const [langModalVisible, setLangModalVisible] = useState(false);
    const [bibleModalVisible, setBibleModalVisible] = useState(false);

    const handleSetLanguage = (lang: AppLanguage | 'auto') => {
        setLanguage(lang);
        setLangModalVisible(false);
        const resolved = lang === 'auto' ? getDeviceLanguage() : lang;
        i18n.changeLanguage(resolved).catch(() => { });
    };

    const handleNotificationToggle = async (value: boolean) => {
        if (value) {
            const granted = await requestNotificationPermission();
            if (!granted) {
                Alert.alert(
                    'Permission required',
                    'Please allow notifications for Psalms Way in your device settings.',
                );
                return;
            }
            await scheduleDailyNotification(notificationHour, notificationMinute, bibleVersion);
            setNotificationEnabled(true);
        } else {
            await cancelDailyNotification();
            setNotificationEnabled(false);
        }
    };

    const handleTimeChange = async (_event: DateTimePickerEvent, date?: Date) => {
        if (Platform.OS === 'android') {
            setShowTimePicker(false);
        }
        if (date) {
            const hour = date.getHours();
            const minute = date.getMinutes();
            setNotificationTime(hour, minute);
            if (notificationEnabled) {
                await scheduleDailyNotification(hour, minute, bibleVersion).catch(() => { });
            }
        }
    };

    const pickerDate = new Date();
    pickerDate.setHours(notificationHour, notificationMinute, 0, 0);

    const SectionLabel = ({ label }: { label: string }) => (
        <Text style={[type.labelLarge, styles.sectionLabel, { color: colors.primary }]}>
            {label}
        </Text>
    );

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: colors.background }]}
            edges={['top', 'bottom']}>

            {/* Top App Bar */}
            <View
                style={[
                    styles.appBar,
                    { backgroundColor: colors.surface, elevation: isDark ? 1 : 2 },
                ]}>
                <View style={styles.titleGroup}>
                    <Text style={[type.titleLarge, { color: colors.onSurface }]}>{t('settings')}</Text>
                    <Text style={[type.labelMedium, { color: colors.onSurfaceVariant }]}>{t('appearance')}</Text>
                </View>
                <M3IconButton
                    onPress={() => navigation.goBack()}
                    accessibilityLabel="Close settings">
                    <Icons name="close" size={22} color={colors.onSurfaceVariant} />
                </M3IconButton>
            </View>

            <ScrollView contentContainerStyle={styles.body}>

                {/* TEXT SIZE */}
                <SectionLabel label={t('textSize')} />
                <M3Card variant="filled" style={styles.sectionCard}>
                    <M3SegmentedButton
                        options={FONT_SIZES.map(opt => ({
                            label: opt.label,
                            value: String(opt.size),
                            a11y: opt.a11y,
                        }))}
                        value={String(fontSize)}
                        onChange={v => setFontSize(Number(v))}
                    />
                </M3Card>

                {/* THEME */}
                <SectionLabel label={t('theme')} />
                <M3Card variant="filled" style={styles.sectionCard}>
                    <M3SegmentedButton
                        options={THEME_MODES.map(opt => ({
                            label: opt.label,
                            value: opt.value,
                            a11y: opt.a11y,
                        }))}
                        value={themeMode}
                        onChange={v => setThemeMode(v as ThemeMode)}
                    />
                </M3Card>

                {/* BIBLE VERSION */}
                <SectionLabel label={t('bibleVersion')} />
                <M3Card variant="filled" style={styles.notifCard}>
                    <TouchableOpacity
                        style={styles.settingsRow}
                        onPress={() => setBibleModalVisible(true)}
                        accessibilityLabel="Select bible version">
                        <View style={styles.settingsRowLeft}>
                            <Text style={[type.titleSmall, { color: colors.onSurface }]}>{t('bibleVersion')}</Text>
                        </View>
                        <View style={styles.settingsRowRight}>
                            <Text style={[type.labelLarge, { color: colors.primary }]}>
                                {getVersionLabel(bibleVersion)}
                            </Text>
                            <Icons name="chevron-right" size={18} color={colors.onSurfaceVariant} />
                        </View>
                    </TouchableOpacity>
                </M3Card>

                {/* LANGUAGE */}
                <SectionLabel label={t('language')} />
                <M3Card variant="filled" style={styles.notifCard}>
                    <TouchableOpacity
                        style={styles.settingsRow}
                        onPress={() => setLangModalVisible(true)}
                        accessibilityLabel="Select language">
                        <View style={styles.settingsRowLeft}>
                            <Text style={[type.titleSmall, { color: colors.onSurface }]}>{t('language')}</Text>
                            <Text style={[type.bodySmall, { color: colors.onSurfaceVariant }]}>
                                {t('languageApplies')}
                            </Text>
                        </View>
                        <View style={styles.settingsRowRight}>
                            <Text style={[type.labelLarge, { color: colors.primary }]}>
                                {getLangLabel(language)}
                            </Text>
                            <Icons name="chevron-right" size={18} color={colors.onSurfaceVariant} />
                        </View>
                    </TouchableOpacity>
                </M3Card>

                {/* DAILY VERSE */}
                <SectionLabel label={t('dailyVerse')} />
                <M3Card variant="filled" style={styles.notifCard}>
                    <View style={styles.settingsRow}>
                        <View style={styles.settingsRowLeft}>
                            <Text style={[type.titleSmall, { color: colors.onSurface }]}>
                                {t('dailyVerseReminder')}
                            </Text>
                            <Text style={[type.bodySmall, { color: colors.onSurfaceVariant }]}>
                                {t('dailyVerseDesc')}
                            </Text>
                        </View>
                        <Switch
                            value={notificationEnabled}
                            onValueChange={handleNotificationToggle}
                            trackColor={{ false: colors.outlineVariant, true: colors.primary }}
                            thumbColor="#FFFFFF"
                        />
                    </View>

                    {notificationEnabled && (
                        <>
                            <M3Divider style={styles.rowDivider} />
                            <TouchableOpacity
                                style={styles.settingsRow}
                                onPress={() => setShowTimePicker(true)}
                                accessibilityLabel="Change notification time">
                                <View style={styles.settingsRowLeft}>
                                    <Text style={[type.titleSmall, { color: colors.onSurface }]}>
                                        {t('reminderTime')}
                                    </Text>
                                    <Text style={[type.bodyMedium, { color: colors.primary }]}>
                                        {t('everyDayAt', {time: formatTime(notificationHour, notificationMinute)})}
                                    </Text>
                                </View>
                                <Icons name="chevron-right" size={20} color={colors.onSurfaceVariant} />
                            </TouchableOpacity>
                        </>
                    )}
                </M3Card>

                {showTimePicker && (
                    <DateTimePicker
                        value={pickerDate}
                        mode="time"
                        is24Hour={false}
                        display="default"
                        onChange={handleTimeChange}
                    />
                )}
            </ScrollView>

            {/* ─── Bible version picker modal ────────────────────────────────── */}
            <Modal
                visible={bibleModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setBibleModalVisible(false)}>
                <TouchableOpacity
                    style={[styles.modalBackdrop, { backgroundColor: colors.scrim + '99' }]}
                    activeOpacity={1}
                    onPress={() => setBibleModalVisible(false)}
                />
                <View
                    style={[
                        styles.modalSheet,
                        {
                            backgroundColor: colors.surface,
                            borderTopLeftRadius: shape.extraLarge,
                            borderTopRightRadius: shape.extraLarge,
                        },
                    ]}>
                    <View style={styles.modalHandle} />
                    <Text style={[type.titleMedium, styles.modalTitle, { color: colors.onSurface }]}>
                        {t('bibleVersion')}
                    </Text>
                    <M3Divider />
                    <FlatList
                        data={ALL_VERSIONS}
                        keyExtractor={item => item.module}
                        style={styles.modalList}
                        renderItem={({ item }: { item: PsalmMetadata }) => {
                            const isSelected = bibleVersion === item.module;
                            return (
                                <M3Pressable
                                    onPress={() => {
                                        setBibleVersion(item.module);
                                        setBibleModalVisible(false);
                                    }}
                                    style={[
                                        styles.langRow,
                                        {
                                            backgroundColor: isSelected
                                                ? colors.secondaryContainer
                                                : 'transparent',
                                        },
                                    ]}>
                                    <View style={{ flex: 1 }}>
                                        <Text
                                            style={[
                                                type.bodyLarge,
                                                { color: isSelected ? colors.onSecondaryContainer : colors.onSurface },
                                            ]}>
                                            {item.name}
                                        </Text>
                                        {item.lang ? (
                                            <Text style={[type.bodySmall, { color: colors.onSurfaceVariant }]}>
                                                {item.lang}{item.year ? ` · ${item.year}` : ''}
                                            </Text>
                                        ) : null}
                                    </View>
                                    {isSelected && (
                                        <Icons name="check" size={20} color={colors.primary} />
                                    )}
                                </M3Pressable>
                            );
                        }}
                    />
                    <M3Divider />
                    <View style={styles.modalFooter}>
                        <M3TextButton label={t('close')} onPress={() => setBibleModalVisible(false)} />
                    </View>
                </View>
            </Modal>

            {/* ─── Language picker modal ─────────────────────────────────────── */}
            <Modal
                visible={langModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setLangModalVisible(false)}>
                {/* Backdrop */}
                <TouchableOpacity
                    style={[styles.modalBackdrop, { backgroundColor: colors.scrim + '99' }]}
                    activeOpacity={1}
                    onPress={() => setLangModalVisible(false)}
                />

                {/* Sheet */}
                <View
                    style={[
                        styles.modalSheet,
                        {
                            backgroundColor: colors.surface,
                            borderTopLeftRadius: shape.extraLarge,
                            borderTopRightRadius: shape.extraLarge,
                        },
                    ]}>
                    <View style={styles.modalHandle} />
                    <Text style={[type.titleMedium, styles.modalTitle, { color: colors.onSurface }]}>
                        {t('selectLanguage')}
                    </Text>
                    <M3Divider />

                    <FlatList
                        data={LANGUAGES}
                        keyExtractor={item => item.value}
                        style={styles.modalList}
                        renderItem={({ item }) => {
                            const isSelected = language === item.value;
                            return (
                                <M3Pressable
                                    onPress={() => handleSetLanguage(item.value)}
                                    style={[
                                        styles.langRow,
                                        {
                                            backgroundColor: isSelected
                                                ? colors.secondaryContainer
                                                : 'transparent',
                                        },
                                    ]}>
                                    <Text
                                        style={[
                                            type.bodyLarge,
                                            {
                                                flex: 1,
                                                color: isSelected ? colors.onSecondaryContainer : colors.onSurface,
                                            },
                                        ]}>
                                        {item.label}
                                    </Text>
                                    {isSelected && (
                                        <Icons name="check" size={20} color={colors.primary} />
                                    )}
                                </M3Pressable>
                            );
                        }}
                    />

                    <M3Divider />
                    <View style={styles.modalFooter}>
                        <M3TextButton label={t('close')} onPress={() => setLangModalVisible(false)} />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1 },
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
    body: {
        padding: spacing.md,
        gap: spacing.sm,
        paddingBottom: spacing.xl,
    },
    sectionLabel: {
        letterSpacing: 1.2,
        marginTop: spacing.md,
        marginBottom: spacing.xs,
    },
    sectionCard: {
        padding: spacing.sm,
    },
    notifCard: {
        overflow: 'hidden',
    },
    settingsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm + 4,
        gap: spacing.md,
    },
    settingsRowLeft: {
        flex: 1,
        gap: 2,
    },
    settingsRowRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    rowDivider: {
        marginHorizontal: spacing.md,
    },
    // Modal
    modalBackdrop: {
        flex: 1,
    },
    modalSheet: {
        maxHeight: '70%',
    },
    modalHandle: {
        width: 32,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#9E9E9E',
        alignSelf: 'center',
        marginTop: spacing.sm,
        marginBottom: spacing.sm,
    },
    modalTitle: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.sm,
    },
    modalList: {
        flexGrow: 0,
    },
    langRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm + 4,
        gap: spacing.md,
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: spacing.sm,
    },
});
