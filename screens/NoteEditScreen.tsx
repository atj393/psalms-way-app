import React, {useEffect, useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import {shape, spacing, useTheme} from '../theme';
import Icons from '../components/Icons';
import {getNoteForVerse, saveNote, deleteNote} from '../services/notesService';
import {getChapter} from '../services/psalmsService';
import {useAppSettings} from '../context/AppSettingsContext';
import type {RootStackParamList} from '../App';
import {M3Card, M3FilledButton, M3IconButton} from '../components/M3';

type NoteEditRoute = RouteProp<RootStackParamList, 'NoteEdit'>;

export default function NoteEditScreen() {
  const navigation = useNavigation();
  const route = useRoute<NoteEditRoute>();
  const {chapter, verse} = route.params;
  const {colors, type, fontSize, isDark} = useTheme();
  const {bibleVersion} = useAppSettings();

  const [text, setText] = useState('');
  const [existingNote, setExistingNote] = useState(false);

  const verseText = getChapter(chapter, bibleVersion)[verse - 1] ?? '';

  useEffect(() => {
    getNoteForVerse(chapter, verse)
      .then(note => {
        if (note) {
          setText(note.text);
          setExistingNote(true);
        }
      })
      .catch(() => {});
  }, [chapter, verse]);

  const handleSave = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      Alert.alert('Empty note', 'Please write something before saving.');
      return;
    }
    await saveNote(chapter, verse, trimmed);
    navigation.goBack();
  };

  const handleDelete = () => {
    Alert.alert('Delete note', 'Are you sure you want to delete this note?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteNote(chapter, verse);
          navigation.goBack();
        },
      },
    ]);
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
        <View style={styles.titleGroup}>
          <Text style={[type.titleLarge, {color: colors.onSurface}]}>Note</Text>
          <Text style={[type.labelMedium, {color: colors.onSurfaceVariant}]}>
            Psalm {chapter}:{verse}
          </Text>
        </View>
        <View style={styles.appBarActions}>
          {existingNote && (
            <M3IconButton
              onPress={handleDelete}
              accessibilityLabel="Delete note">
              <Icons name="trash" size={22} color={colors.onSurfaceVariant} />
            </M3IconButton>
          )}
          <M3IconButton
            onPress={() => navigation.goBack()}
            accessibilityLabel="Close">
            <Icons name="close" size={22} color={colors.onSurfaceVariant} />
          </M3IconButton>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Verse context card */}
        <M3Card variant="filled" style={styles.verseCard}>
          <Text
            style={[
              type.labelLarge,
              {color: colors.primary, letterSpacing: 1.5},
            ]}>
            PSALM {chapter}:{verse}
          </Text>
          <Text
            style={[type.bodyMedium, {color: colors.onSurface, marginTop: spacing.xs}]}
            numberOfLines={3}>
            {verseText}
          </Text>
        </M3Card>

        {/* Note input — MD3 filled text field style */}
        <TextInput
          style={[
            styles.noteInput,
            {
              backgroundColor: colors.surfaceVariant,
              color: colors.onSurface,
              fontSize,
              lineHeight: fontSize * 1.6,
              borderBottomColor: colors.primary,
            },
          ]}
          placeholder="Write a note for this verse…"
          placeholderTextColor={colors.onSurfaceVariant}
          value={text}
          onChangeText={setText}
          multiline
          textAlignVertical="top"
          autoFocus={!existingNote}
        />

        {/* Save button */}
        <M3FilledButton
          label="Save"
          onPress={handleSave}
          style={styles.saveBtn}
        />
      </KeyboardAvoidingView>
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
  titleGroup: {
    flex: 1,
    gap: 2,
    paddingHorizontal: spacing.xs,
  },
  appBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  body: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  verseCard: {
    padding: spacing.md,
  },
  noteInput: {
    flex: 1,
    borderTopLeftRadius: shape.extraSmall,
    borderTopRightRadius: shape.extraSmall,
    borderBottomWidth: 2,
    padding: spacing.md,
    fontFamily: 'Roboto',
    minHeight: 120,
  },
  saveBtn: {
    alignSelf: 'stretch',
  },
});
