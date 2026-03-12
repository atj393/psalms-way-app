import React, {useEffect, useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, type RouteProp} from '@react-navigation/native';
import {spacing, useTheme} from '../theme';
import Icons from '../components/Icons';
import {getNoteForVerse, saveNote, deleteNote} from '../services/notesService';
import {getChapter} from '../services/psalmsService';
import {useAppSettings} from '../context/AppSettingsContext';
import type {RootStackParamList} from '../App';

type NoteEditRoute = RouteProp<RootStackParamList, 'NoteEdit'>;

export default function NoteEditScreen() {
  const navigation = useNavigation();
  const route = useRoute<NoteEditRoute>();
  const {chapter, verse} = route.params;
  const {colors, fontSize} = useTheme();
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
      {/* Header */}
      <View style={[styles.header, {borderBottomColor: colors.border}]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, {color: colors.text, fontSize: fontSize + 2}]}>
            Note
          </Text>
          <Text style={[styles.headerSub, {color: colors.textSecondary, fontSize: fontSize - 5}]}>
            Psalm {chapter}:{verse}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {existingNote && (
            <TouchableOpacity
              onPress={handleDelete}
              style={[styles.iconBtn, {backgroundColor: colors.surface}]}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
              accessibilityLabel="Delete note">
              <Icons name="trash" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.iconBtn, {backgroundColor: colors.surface}]}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
            accessibilityLabel="Close">
            <Icons name="close" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        {/* Verse reference card */}
        <View style={[styles.verseCard, {backgroundColor: colors.surface}]}>
          <Text style={[styles.verseRef, {color: colors.primary, fontSize: fontSize - 5}]}>
            PSALM {chapter}:{verse}
          </Text>
          <Text style={[styles.verseText, {color: colors.text, fontSize: fontSize - 2}]} numberOfLines={3}>
            {verseText}
          </Text>
        </View>

        {/* Note input */}
        <TextInput
          style={[
            styles.noteInput,
            {
              backgroundColor: colors.surface,
              color: colors.text,
              fontSize,
              borderColor: colors.border,
            },
          ]}
          placeholder="Write a note for this verse…"
          placeholderTextColor={colors.textSecondary}
          value={text}
          onChangeText={setText}
          multiline
          textAlignVertical="top"
          autoFocus={!existingNote}
        />

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, {backgroundColor: colors.primary}]}
          onPress={handleSave}
          accessibilityLabel="Save note">
          <Text style={[styles.saveBtnText, {fontSize}]}>Save</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
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
  headerSub: {fontFamily: 'Roboto'},
  headerActions: {flexDirection: 'row', gap: spacing.sm},
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  verseCard: {
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.xs,
  },
  verseRef: {fontFamily: 'Roboto', fontWeight: '700', letterSpacing: 1.5},
  verseText: {fontFamily: 'Roboto', lineHeight: 22},
  noteInput: {
    flex: 1,
    borderRadius: 12,
    padding: spacing.md,
    fontFamily: 'Roboto',
    lineHeight: 24,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 120,
  },
  saveBtn: {
    borderRadius: 12,
    paddingVertical: spacing.sm + 4,
    alignItems: 'center',
  },
  saveBtnText: {
    fontFamily: 'Roboto',
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
