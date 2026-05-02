import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ScrollView, Alert, Platform, ActionSheetIOS, ActivityIndicator, Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, layout } from '../lib/theme';
import { finalizeWorkout } from '../lib/workoutApi';
import { uploadWorkoutMedia } from '../lib/supabaseStorage';
import { getMyProfile } from '../lib/socialApi';
import { saveToCache, CACHE_KEYS } from '../lib/localCache';
import { useWorkoutStore } from '../stores/workoutStore';

const normalizeCompletedSet = (set) => {
  const weight = set.weight ?? set.weight_lbs;
  if (
    !set.completed ||
    weight === null || weight === undefined || String(weight).trim() === '' ||
    set.reps === null || set.reps === undefined || String(set.reps).trim() === ''
  ) return null;
  const reps = Number.parseInt(String(set.reps), 10);
  const weight_lbs = Number.parseFloat(String(weight));
  if (Number.isNaN(reps) || Number.isNaN(weight_lbs)) return null;
  return { reps, weight_lbs, completed: true };
};

const getExerciseLibraryId = (ex) => ex.exercise_id || ex.library_exercise_id || null;

const formatDuration = (seconds) => {
  if (!seconds) return '0m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const formatVolume = (vol) => {
  if (!vol) return '0';
  return Math.round(vol).toLocaleString();
};

const todayLabel = () => {
  const d = new Date();
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

export default function SaveWorkout() {
  const {
    exercises,
    activeLogId,
    activeWorkoutName,
    activeWorkoutStartTime,
    endWorkout,
  } = useWorkoutStore();

  const completedExercises = useMemo(() =>
    exercises
      .map(ex => ({ ...ex, sets: ex.sets.map(normalizeCompletedSet).filter(Boolean) }))
      .filter(ex => ex.sets.length > 0),
    [exercises]
  );

  const elapsedSeconds = useMemo(() => {
    if (!activeWorkoutStartTime) return 0;
    return Math.floor((Date.now() - Number(activeWorkoutStartTime)) / 1000);
  }, [activeWorkoutStartTime]);

  const stats = useMemo(() => {
    const sets = completedExercises.reduce((acc, ex) => acc + ex.sets.length, 0);
    const volume = completedExercises.reduce((acc, ex) =>
      acc + ex.sets.reduce((s, set) => s + (set.weight_lbs || 0) * (set.reps || 0), 0), 0);
    return { sets, volume };
  }, [completedExercises]);

  const defaultTitle = activeWorkoutName ||
    `Workout — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [photoUri, setPhotoUri] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Date selection state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDateModal, setShowDateModal] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  const dateLabel = (d) =>
    d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const handlePhotoPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Take Photo', 'Choose from Library'], cancelButtonIndex: 0 },
        (i) => { if (i === 1) takePhoto(); if (i === 2) pickPhoto(); }
      );
    } else {
      Alert.alert('Add Photo', 'Choose an option', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickPhoto },
      ]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow camera access to attach a photo.'); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8 });
    if (!result.canceled && result.assets?.length) setPhotoUri(result.assets[0].uri);
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed', 'Allow photo library access to attach a photo.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8 });
    if (!result.canceled && result.assets?.length) setPhotoUri(result.assets[0].uri);
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const logId = activeLogId;
    try {
      const completedAt = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        new Date().getHours(),
        new Date().getMinutes(),
      ).toISOString();

      let mediaUrl = null;
      if (photoUri) {
        const profile = await getMyProfile();
        mediaUrl = await uploadWorkoutMedia(photoUri, String(profile.id), logId);
      }

      const finalizeExercises = completedExercises.map((ex) => {
        const exerciseLibraryId = getExerciseLibraryId(ex);
        if (!exerciseLibraryId) throw new Error(`Missing exercise id for ${ex.name || 'exercise'}`);
        return {
          exercise_id: exerciseLibraryId,
          name: ex.name,
          gif_url: ex.gif_url || null,
          category: ex.category,
          target: ex.target,
          equipment: ex.equipment,
          order: exercises.findIndex(e => e.id === ex.id),
          target_sets: ex.target_sets,
          target_reps_min: ex.target_reps_min,
          target_reps_max: ex.target_reps_max,
          target_weight_lbs: ex.target_weight_lbs,
          sets: ex.sets.map((s, i) => ({
            set_number: i + 1,
            reps: s.reps,
            weight_lbs: s.weight_lbs,
            completed: s.completed,
          })),
        };
      });

      await finalizeWorkout(logId, {
        name: title.trim() || defaultTitle,
        completed_at: completedAt,
        duration: elapsedSeconds,
        is_public: isPublic,
        caption: description.trim() || null,
        media_url: mediaUrl,
        media_type: mediaUrl ? 'photo' : null,
        exercises: finalizeExercises,
      });

      endWorkout();
      await useWorkoutStore.persist.clearStorage();

      await Promise.all([
        saveToCache(CACHE_KEYS.WORKOUT_LOGS, null),
        saveToCache(CACHE_KEYS.STREAK, null),
      ]).catch(() => {});

      router.replace(`/workout-complete?logId=${logId}`);
    } catch (e) {
      console.error('Save workout failed:', e.message);
      Alert.alert('Error', 'Failed to save workout. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    Alert.alert(
      'Discard Workout',
      'This will permanently delete your workout. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            const { deleteWorkoutLog } = await import('../lib/workoutApi');
            try {
              if (activeLogId) await deleteWorkoutLog(activeLogId).catch(() => {});
            } finally {
              endWorkout();
              await useWorkoutStore.persist.clearStorage();
              router.replace('/(tabs)/workouts');
            }
          },
        },
      ]
    );
  };

  const adjustDate = (days) => {
    const d = new Date(tempDate);
    d.setDate(d.getDate() + days);
    setTempDate(d);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Save Workout</Text>
        <Pressable
          style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving
            ? <ActivityIndicator size="small" color="#000" />
            : <Text style={styles.saveBtnText}>Save</Text>}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Title */}
        <TextInput
          style={styles.titleInput}
          value={title}
          onChangeText={setTitle}
          placeholder="Workout name"
          placeholderTextColor={colors.textTertiary}
          maxLength={80}
        />

        {/* 2. Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatDuration(elapsedSeconds)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatVolume(stats.volume)}</Text>
            <Text style={styles.statLabel}>Volume (lbs)</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.sets}</Text>
            <Text style={styles.statLabel}>Sets</Text>
          </View>
        </View>

        {/* 3. When */}
        <Pressable style={styles.field} onPress={() => { setTempDate(selectedDate); setShowDateModal(true); }}>
          <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.fieldLabel}>When</Text>
          <Text style={styles.fieldValue}>{dateLabel(selectedDate)}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
        </Pressable>

        {/* 4. Add a photo */}
        <Pressable style={styles.photoPicker} onPress={handlePhotoPress}>
          {photoUri ? (
            <>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} contentFit="cover" />
              <Pressable style={styles.removePhoto} onPress={() => setPhotoUri(null)}>
                <Ionicons name="close-circle" size={22} color="#fff" />
              </Pressable>
            </>
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera-outline" size={28} color={colors.textTertiary} />
              <Text style={styles.photoPlaceholderText}>Add a photo (optional)</Text>
            </View>
          )}
        </Pressable>

        {/* 5. Description */}
        <TextInput
          style={styles.descriptionInput}
          placeholder="Description (optional)"
          placeholderTextColor={colors.textTertiary}
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={500}
          textAlignVertical="top"
        />

        {/* 6. Visibility */}
        <View style={styles.visibilitySection}>
          <Text style={styles.visibilityLabel}>Visibility</Text>
          <View style={styles.visibilityToggle}>
            <Pressable
              style={[styles.visibilityOption, !isPublic && styles.visibilityOptionActive]}
              onPress={() => setIsPublic(false)}
            >
              <Ionicons name="lock-closed-outline" size={14} color={!isPublic ? '#000' : colors.textSecondary} />
              <Text style={[styles.visibilityOptionText, !isPublic && styles.visibilityOptionTextActive]}>Private</Text>
            </Pressable>
            <Pressable
              style={[styles.visibilityOption, isPublic && styles.visibilityOptionActive]}
              onPress={() => setIsPublic(true)}
            >
              <Ionicons name="globe-outline" size={14} color={isPublic ? '#000' : colors.textSecondary} />
              <Text style={[styles.visibilityOptionText, isPublic && styles.visibilityOptionTextActive]}>Everyone</Text>
            </Pressable>
          </View>
        </View>

        {/* 7. Discard */}
        <Pressable style={styles.discardBtn} onPress={handleDiscard}>
          <Text style={styles.discardBtnText}>Discard Workout</Text>
        </Pressable>
      </ScrollView>

      {/* Date picker modal */}
      <Modal
        visible={showDateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDateModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowDateModal(false)}>
          <Pressable style={styles.dateModal} onPress={e => e.stopPropagation()}>
            <Text style={styles.dateModalTitle}>Select Date</Text>
            <View style={styles.dateRow}>
              <Pressable style={styles.dateArrow} onPress={() => adjustDate(-1)}>
                <Ionicons name="chevron-back" size={24} color={colors.text} />
              </Pressable>
              <Text style={styles.dateModalValue}>{dateLabel(tempDate)}</Text>
              <Pressable
                style={[styles.dateArrow, tempDate >= new Date() && { opacity: 0.3 }]}
                onPress={() => { if (tempDate < new Date()) adjustDate(1); }}
                disabled={tempDate >= new Date()}
              >
                <Ionicons name="chevron-forward" size={24} color={colors.text} />
              </Pressable>
            </View>
            <View style={styles.datePresets}>
              {[0, -1, -2].map(offset => {
                const d = new Date(); d.setDate(d.getDate() + offset);
                return (
                  <Pressable key={offset} style={styles.presetBtn} onPress={() => setTempDate(d)}>
                    <Text style={styles.presetBtnText}>
                      {offset === 0 ? 'Today' : offset === -1 ? 'Yesterday' : dateLabel(d)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable style={styles.dateConfirmBtn} onPress={() => { setSelectedDate(tempDate); setShowDateModal(false); }}>
              <Text style={styles.dateConfirmBtnText}>Confirm</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: 4, minWidth: 48 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 64,
    alignItems: 'center',
  },
  saveBtnText: { color: '#000', fontWeight: '800', fontSize: 15 },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.md, paddingBottom: 60 },
  titleInput: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 10,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: layout.borderRadius,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },
  statValue: { fontSize: 20, fontWeight: '900', color: colors.primary },
  statLabel: { fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: layout.borderRadius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  fieldLabel: { fontSize: 14, color: colors.textSecondary, flex: 1 },
  fieldValue: { fontSize: 14, fontWeight: '600', color: colors.text, marginRight: 4 },
  photoPicker: {
    height: 160,
    borderRadius: layout.borderRadius,
    overflow: 'hidden',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  photoPreview: { width: '100%', height: '100%' },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoPlaceholderText: { fontSize: 13, color: colors.textTertiary },
  removePhoto: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  descriptionInput: {
    backgroundColor: colors.surface,
    borderRadius: layout.borderRadius,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    padding: spacing.md,
    fontSize: 15,
    minHeight: 90,
    marginBottom: spacing.md,
  },
  visibilitySection: { marginBottom: spacing.lg },
  visibilityLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  visibilityToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: layout.borderRadius,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  visibilityOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  visibilityOptionActive: { backgroundColor: colors.primary },
  visibilityOptionText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  visibilityOptionTextActive: { color: '#000' },
  discardBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: layout.borderRadius,
    borderWidth: 1,
    borderColor: '#991B1B',
    marginTop: spacing.sm,
  },
  discardBtnText: { fontSize: 15, fontWeight: '700', color: '#DC2626' },
  // Date modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateModal: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  dateModalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 20 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  dateArrow: { padding: 8 },
  dateModalValue: { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1, textAlign: 'center' },
  datePresets: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  presetBtn: {
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetBtnText: { fontSize: 12, color: colors.textSecondary },
  dateConfirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  dateConfirmBtnText: { color: '#000', fontWeight: '800', fontSize: 15 },
});
