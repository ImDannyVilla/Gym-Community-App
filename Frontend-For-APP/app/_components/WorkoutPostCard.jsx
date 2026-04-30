import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, layout } from '../../lib/theme';
import { followUser, unfollowUser } from '../../lib/socialApi';
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

export default function WorkoutPostCard({ post, currentUserId, isFollowing: initialIsFollowing, onFollowChange, onPress }) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followLoading, setFollowLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const setCachedRoutines = useWorkoutStore(state => state.setCachedRoutines);

  const isOwnPost = currentUserId && String(post.user_id) === String(currentUserId);

  const handleFollowToggle = async () => {
    if (isOwnPost || followLoading) return;
    const prev = isFollowing;
    setIsFollowing(!prev);
    setFollowLoading(true);
    try {
      if (prev) {
        await unfollowUser(post.user_id);
      } else {
        await followUser(post.user_id);
      }
      onFollowChange?.(post.user_id, !prev);
    } catch (err) {
      setIsFollowing(prev);
      if (!err.message?.includes('409') && !err.message?.toLowerCase().includes('already following')) {
        Alert.alert('Error', err.message || 'Could not update follow status.');
      }
    } finally {
      setFollowLoading(false);
    }
  };

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
      <View style={styles.cardHeader}>
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

        {!isOwnPost && (
          <Pressable
            style={[styles.followBtn, isFollowing && styles.followBtnActive]}
            onPress={handleFollowToggle}
            disabled={followLoading}
          >
            {followLoading
              ? <ActivityIndicator size="small" color={isFollowing ? colors.textSecondary : colors.text} />
              : <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>}
          </Pressable>
        )}
      </View>

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

      {/* Save to Library */}
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
                  {saved ? 'Saved to Library' : 'Save to Library'}
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
  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  followBtnActive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  followBtnText: { fontSize: 13, fontWeight: '700', color: colors.text },
  followBtnTextActive: { color: colors.textSecondary },
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
