import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, layout } from '../lib/theme';
import {
  getUserByUsername, getMyProfile,
  followUser, unfollowUser, getFollowing,
  getUserPublicLogs,
} from '../lib/socialApi';
import WorkoutPostCard from './_components/WorkoutPostCard';

const GYM_LEVEL_COLOR = { Beginner: '#22C55E', Intermediate: '#F59E0B', Advanced: '#DC2626' };

export default function UserProfile() {
  const { username } = useLocalSearchParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [followersCount, setFollowersCount] = useState(0);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [meData, userData] = await Promise.all([
        getMyProfile(),
        getUserByUsername(username),
      ]);

      const myId = String(meData.id);
      setCurrentUserId(myId);

      const p = userData.profile || {};
      setProfile({ ...p, id: String(userData.id) });
      setFollowersCount(p.followers_count ?? 0);

      // Check follow state
      const following = await getFollowing(myId).catch(() => []);
      const isAlreadyFollowing = following.some(u => String(u.id) === String(userData.id));
      setIsFollowing(isAlreadyFollowing);

      // Load public posts
      const userPosts = await getUserPublicLogs(String(userData.id)).catch(() => []);
      setPosts(userPosts);
    } catch (err) {
      console.error('Profile load error:', err.message);
      Alert.alert('Error', 'Could not load profile.');
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  useEffect(() => { load(); }, [load]);

  const handleFollowToggle = async () => {
    if (!profile || followLoading) return;
    const prev = isFollowing;
    setIsFollowing(!prev);
    setFollowersCount(c => c + (prev ? -1 : 1));
    setFollowLoading(true);
    try {
      if (prev) await unfollowUser(profile.id);
      else await followUser(profile.id);
    } catch (err) {
      setIsFollowing(prev);
      setFollowersCount(c => c + (prev ? 1 : -1));
      if (!err.message?.includes('409') && !err.message?.toLowerCase().includes('already following')) {
        Alert.alert('Error', err.message || 'Could not update follow status.');
      }
    } finally {
      setFollowLoading(false);
    }
  };

  const isOwnProfile = profile && currentUserId && profile.id === currentUserId;

  const renderHeader = () => (
    <View style={styles.profileHeader}>
      {profile?.avatar_url ? (
        <Image source={{ uri: profile.avatar_url }} style={styles.avatar} contentFit="cover" />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Ionicons name="person-outline" size={36} color="#555" />
        </View>
      )}

      {profile?.full_name ? <Text style={styles.fullName}>{profile.full_name}</Text> : null}
      <Text style={styles.username}>@{profile?.user_name || username}</Text>

      {profile?.gym_level ? (
        <View style={[styles.levelChip, { backgroundColor: GYM_LEVEL_COLOR[profile.gym_level] + '22' }]}>
          <Text style={[styles.levelText, { color: GYM_LEVEL_COLOR[profile.gym_level] }]}>
            {profile.gym_level}
          </Text>
        </View>
      ) : null}

      {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

      <View style={styles.followStats}>
        <Pressable
          style={styles.followStat}
          onPress={() => profile?.id && router.push(`/followers-list?userId=${profile.id}&type=followers`)}
        >
          <Text style={styles.followNumber}>{followersCount}</Text>
          <Text style={styles.followLabel}>Followers</Text>
        </Pressable>
        <View style={styles.followDivider} />
        <Pressable
          style={styles.followStat}
          onPress={() => profile?.id && router.push(`/followers-list?userId=${profile.id}&type=following`)}
        >
          <Text style={styles.followNumber}>{profile?.following_count ?? 0}</Text>
          <Text style={styles.followLabel}>Following</Text>
        </Pressable>
      </View>

      {!isOwnProfile && (
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

      {posts.length > 0 && (
        <Text style={styles.postsHeader}>Workouts</Text>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.backRow}>
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.backRow}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{profile?.user_name || username}</Text>
      </View>

      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <WorkoutPostCard
            post={item}
            currentUserId={currentUserId}
            isFollowing={isFollowing}
            onFollowChange={(_, nowFollowing) => {
              setIsFollowing(nowFollowing);
              setFollowersCount(c => c + (nowFollowing ? 1 : -1));
            }}
          />
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyPosts}>
            <Ionicons name="barbell-outline" size={32} color={colors.border} />
            <Text style={styles.emptyPostsText}>No public workouts yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.md, paddingBottom: layout.bottomSafeArea + 80 },
  profileHeader: { alignItems: 'center', marginBottom: spacing.lg },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#2a2a2a', marginBottom: 10 },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  fullName: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  username: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  levelChip: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginTop: 8,
  },
  levelText: { fontSize: 12, fontWeight: '700' },
  bio: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
    marginTop: 8,
    lineHeight: 20,
  },
  followStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
    gap: 24,
  },
  followStat: { alignItems: 'center' },
  followDivider: { width: 1, height: 28, backgroundColor: colors.border },
  followNumber: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  followLabel: { fontSize: 12, color: colors.textSecondary },
  followBtn: {
    paddingHorizontal: 40,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: colors.primary,
    marginBottom: 16,
  },
  followBtnActive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  followBtnText: { fontSize: 15, fontWeight: '700', color: colors.text },
  followBtnTextActive: { color: colors.textSecondary },
  postsHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 4,
  },
  emptyPosts: { alignItems: 'center', paddingTop: 40, gap: 8 },
  emptyPostsText: { fontSize: 14, color: colors.textSecondary },
});
