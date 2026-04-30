import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../lib/theme';
import { getPublicWorkoutLog } from '../lib/socialApi';
import { copyWorkoutLogAsRoutine } from '../lib/workoutApi';
import { getMyProfile } from '../lib/socialApi';
import { useWorkoutStore } from '../stores/workoutStore';
import { saveToCache, CACHE_KEYS } from '../lib/localCache';

const formatDate = (isoString) => {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
};

const formatTimeAgo = (isoString) => {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatDuration = (seconds) => {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};

export default function PostDetail() {
  const { logId } = useLocalSearchParams();
  const [log, setLog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const setCachedRoutines = useWorkoutStore(state => state.setCachedRoutines);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [logData, meData] = await Promise.all([
        getPublicWorkoutLog(logId),
        getMyProfile().catch(() => null),
      ]);
      setLog(logData);
      if (meData?.id) setCurrentUserId(String(meData.id));
    } catch (err) {
      console.error('Post detail load error:', err.message);
      Alert.alert('Error', 'Could not load workout.');
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [logId]);

  useEffect(() => { load(); }, [load]);

  const handleSaveToLibrary = async () => {
    if (saveLoading || saved) return;
    setSaveLoading(true);
    try {
      await copyWorkoutLogAsRoutine(logId);
      setCachedRoutines([]);
      await saveToCache(CACHE_KEYS.ROUTINES, []).catch(() => {});
      setSaved(true);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not save workout.');
    } finally {
      setSaveLoading(false);
    }
  };

  const isOwnPost = log && currentUserId && String(log.user_id) === currentUserId;

  const totalSets = (log?.exercises || []).reduce((sum, ex) => sum + (ex.sets?.length || 0), 0);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.navBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!log) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.navBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.navTitle} numberOfLines={1}>{log.name}</Text>
        {!isOwnPost && (
          <Pressable
            style={[styles.saveNavBtn, saved && styles.saveNavBtnDone]}
            onPress={handleSaveToLibrary}
            disabled={saveLoading || saved}
          >
            {saveLoading
              ? <ActivityIndicator size="small" color={colors.textSecondary} />
              : <Ionicons
                  name={saved ? 'checkmark-circle-outline' : 'bookmark-outline'}
                  size={22}
                  color={saved ? colors.primary : colors.textSecondary}
                />}
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Poster info */}
        <Pressable
          style={styles.posterRow}
          onPress={() => log.user_name && router.push(`/user-profile?username=${log.user_name}`)}
        >
          {log.avatar_url ? (
            <Image source={{ uri: log.avatar_url }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person-outline" size={18} color="#555" />
            </View>
          )}
          <View>
            <Text style={styles.posterUsername}>{log.user_name || 'Unknown'}</Text>
            {log.full_name ? <Text style={styles.posterFullName}>{log.full_name}</Text> : null}
          </View>
          <Text style={styles.timestamp}>{formatTimeAgo(log.completed_at)}</Text>
        </Pressable>

        {/* Workout stats */}
        <Text style={styles.workoutName}>{log.name}</Text>
        <Text style={styles.workoutDate}>{formatDate(log.completed_at)}</Text>

        <View style={styles.statsRow}>
          {log.duration ? (
            <View style={styles.statChip}>
              <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.statChipText}>{formatDuration(log.duration)}</Text>
            </View>
          ) : null}
          <View style={styles.statChip}>
            <Ionicons name="barbell-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.statChipText}>{log.exercises.length} exercises</Text>
          </View>
          <View style={styles.statChip}>
            <Ionicons name="layers-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.statChipText}>{totalSets} sets</Text>
          </View>
        </View>

        {log.caption ? <Text style={styles.caption}>{log.caption}</Text> : null}

        {/* Exercise breakdown */}
        {log.exercises.map((ex) => (
          <View key={ex.id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              {ex.gif_url ? (
                <Image source={{ uri: ex.gif_url }} style={styles.gif} contentFit="cover" />
              ) : (
                <View style={[styles.gif, styles.gifPlaceholder]}>
                  <Ionicons name="barbell-outline" size={16} color="#555" />
                </View>
              )}
              <Text style={styles.exerciseName}>{ex.name}</Text>
            </View>

            {ex.sets?.length > 0 ? (
              <View style={styles.setsTable}>
                <View style={styles.setsHeaderRow}>
                  <Text style={[styles.setCell, styles.setHeaderText]}>SET</Text>
                  <Text style={[styles.setCell, styles.setHeaderText]}>WEIGHT</Text>
                  <Text style={[styles.setCell, styles.setHeaderText]}>REPS</Text>
                </View>
                {ex.sets.map((set, idx) => (
                  <View key={set.id} style={[styles.setDataRow, idx % 2 === 0 ? styles.setRowEven : styles.setRowOdd]}>
                    <Text style={styles.setCell}>{set.set_number}</Text>
                    <Text style={styles.setCell}>{set.weight_lbs} lbs</Text>
                    <Text style={styles.setCell}>{set.reps}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ))}

        {!isOwnPost && (
          <Pressable
            style={[styles.saveBtn, saved && styles.saveBtnDone]}
            onPress={handleSaveToLibrary}
            disabled={saveLoading || saved}
          >
            {saveLoading
              ? <ActivityIndicator size="small" color={colors.textSecondary} />
              : <>
                  <Ionicons
                    name={saved ? 'checkmark-circle-outline' : 'bookmark-outline'}
                    size={16}
                    color={saved ? colors.primary : colors.textSecondary}
                  />
                  <Text style={[styles.saveBtnText, saved && { color: colors.primary }]}>
                    {saved ? 'Saved to Library' : 'Save to Library'}
                  </Text>
                </>}
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  backBtn: { padding: 4 },
  navTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  saveNavBtn: { padding: 4 },
  saveNavBtnDone: {},
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.md, paddingBottom: 60 },
  posterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#2a2a2a' },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  posterUsername: { fontSize: 14, fontWeight: '700', color: colors.text },
  posterFullName: { fontSize: 12, color: colors.textSecondary },
  timestamp: { marginLeft: 'auto', fontSize: 12, color: colors.textTertiary },
  workoutName: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 4 },
  workoutDate: { fontSize: 13, color: colors.textSecondary, marginBottom: 12 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statChipText: { fontSize: 13, color: colors.textSecondary },
  caption: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 16 },
  exerciseCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  gif: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#2a2a2a' },
  gifPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  exerciseName: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
  setsTable: { borderRadius: 6, overflow: 'hidden' },
  setsHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#111',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  setDataRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 4 },
  setRowEven: { backgroundColor: '#111' },
  setRowOdd: { backgroundColor: colors.surface },
  setHeaderText: { fontSize: 10, fontWeight: '800', color: '#666', textTransform: 'uppercase' },
  setCell: { flex: 1, textAlign: 'center', fontSize: 13, color: colors.textSecondary },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  saveBtnDone: { borderColor: colors.primary },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
});
