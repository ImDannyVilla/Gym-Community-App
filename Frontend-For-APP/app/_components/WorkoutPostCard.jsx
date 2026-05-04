import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, layout } from '../../lib/theme';
import { copyWorkoutLogAsRoutine } from '../../lib/workoutApi';
import { useWorkoutStore } from '../../stores/workoutStore';
import { saveToCache, CACHE_KEYS } from '../../lib/localCache';

const formatDuration = (seconds) => {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
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

export default function WorkoutPostCard({ post, currentUserId, onPress, showAuthor = true }) {
  const [saveLoading, setSaveLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const setCachedRoutines = useWorkoutStore(state => state.setCachedRoutines);

  const isOwnPost = currentUserId && String(post.user_id) === String(currentUserId);

  const handleSaveToLibrary = async () => {
    if (saveLoading || saved) return;
    setSaveLoading(true);
    try {
      await copyWorkoutLogAsRoutine(post.id);
      setCachedRoutines([]);
      await saveToCache(CACHE_KEYS.ROUTINES, []).catch(() => {});
      setSaved(true);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not save workout.');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <View style={styles.card}>
      {/* Header: avatar + username + follow button */}
      {showAuthor && <View style={styles.cardHeader}>
        <Pressable
          style={styles.userRow}
          onPress={() => post.user_name && router.push(`/user-profile?username=${post.user_name}`)}
        >
          {post.avatar_url ? (
            <Image source={{ uri: post.avatar_url }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person-outline" size={16} color="#555" />
            </View>
          )}
          <View>
            <Text style={styles.username}>{post.user_name || 'Unknown'}</Text>
            {post.full_name ? <Text style={styles.fullName}>{post.full_name}</Text> : null}
          </View>
        </Pressable>
      </View>}

      {/* Tappable card body: media + workout info */}
      <Pressable onPress={() => onPress ? onPress() : router.push(`/post-detail?logId=${post.id}`)}>
        {post.media_url && (
          <Image source={{ uri: post.media_url }} style={styles.media} contentFit="cover" />
        )}
        <View style={styles.cardBody}>
          <Text style={styles.workoutName}>{post.name}</Text>
          <View style={styles.statsRow}>
            {post.exercise_count > 0 && (
              <View style={styles.chip}>
                <Ionicons name="barbell-outline" size={12} color={colors.textSecondary} />
                <Text style={styles.chipText}>{post.exercise_count} exercises</Text>
              </View>
            )}
            {post.duration ? (
              <View style={styles.chip}>
                <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                <Text style={styles.chipText}>{formatDuration(post.duration)}</Text>
              </View>
            ) : null}
            <Text style={styles.timestamp}>{formatTimeAgo(post.completed_at)}</Text>
          </View>
          {post.caption ? <Text style={styles.caption}>{post.caption}</Text> : null}
        </View>
      </Pressable>

      {/* Copy Routine */}
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
                  size={14}
                  color={saved ? colors.success : colors.textSecondary}
                />
                <Text style={[styles.saveBtnText, saved && { color: colors.success }]}>
                  {saved ? 'Routine Copied' : 'Copy Routine'}
                </Text>
              </>}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    paddingBottom: 10,
  },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#2a2a2a' },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  username: { fontSize: 14, fontWeight: '700', color: colors.text },
  fullName: { fontSize: 12, color: colors.textSecondary },
  media: { width: '100%', height: 220 },
  cardBody: { padding: spacing.md, paddingTop: 10 },
  workoutName: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6 },
  statsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  chipText: { fontSize: 12, color: colors.textSecondary },
  timestamp: { fontSize: 12, color: colors.textTertiary, marginLeft: 'auto' },
  caption: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: spacing.md,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveBtnDone: {},
  saveBtnText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
});
