import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../lib/theme';
import { getFollowers, getFollowing, followUser, unfollowUser } from '../lib/socialApi';

function UserListRow({ user, onFollowChange }) {
  const [isFollowing, setIsFollowing] = useState(user.is_following ?? false);
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    if (loading) return;
    const prev = isFollowing;
    setIsFollowing(!prev);
    setLoading(true);
    try {
      if (prev) await unfollowUser(user.id);
      else await followUser(user.id);
      onFollowChange?.(user.id, !prev);
    } catch (err) {
      setIsFollowing(prev);
      if (!err.message?.includes('409') && !err.message?.toLowerCase().includes('already following')) {
        Alert.alert('Error', err.message || 'Could not update follow status.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      style={styles.row}
      onPress={() => user.user_name && router.push(`/user-profile?username=${user.user_name}`)}
    >
      {user.avatar_url ? (
        <Image source={{ uri: user.avatar_url }} style={styles.avatar} contentFit="cover" />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Ionicons name="person-outline" size={20} color="#555" />
        </View>
      )}
      <View style={styles.userInfo}>
        <Text style={styles.username}>{user.user_name || 'Unknown'}</Text>
        {user.full_name ? <Text style={styles.fullName}>{user.full_name}</Text> : null}
      </View>
      <Pressable
        style={[styles.followBtn, isFollowing && styles.followBtnActive]}
        onPress={handleFollow}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator size="small" color={isFollowing ? colors.textSecondary : colors.text} />
          : <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>}
      </Pressable>
    </Pressable>
  );
}

export default function FollowersList() {
  const { userId, type } = useLocalSearchParams();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const title = type === 'followers' ? 'Followers' : 'Following';

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = type === 'followers'
        ? await getFollowers(userId)
        : await getFollowing(userId);
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to load list:', err.message);
      Alert.alert('Error', `Could not load ${title.toLowerCase()}.`);
    } finally {
      setIsLoading(false);
    }
  }, [userId, type]);

  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <UserListRow user={item} onFollowChange={(id, nowFollowing) => {
              setUsers(prev => prev.map(u => u.id === id ? { ...u, is_following: nowFollowing } : u));
            }} />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={40} color={colors.border} />
              <Text style={styles.emptyText}>No {title.toLowerCase()} yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#2a2a2a' },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  userInfo: { flex: 1 },
  username: { fontSize: 15, fontWeight: '600', color: colors.text },
  fullName: { fontSize: 13, color: colors.textSecondary, marginTop: 1 },
  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.primary,
    minWidth: 80,
    alignItems: 'center',
  },
  followBtnActive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  followBtnText: { fontSize: 13, fontWeight: '700', color: colors.text },
  followBtnTextActive: { color: colors.textSecondary },
  emptyState: { paddingTop: 60, alignItems: 'center', gap: 10 },
  emptyText: { fontSize: 15, color: colors.textSecondary },
});
