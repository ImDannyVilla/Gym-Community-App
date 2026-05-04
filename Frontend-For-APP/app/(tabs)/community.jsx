import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet,
  ActivityIndicator, TextInput, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, layout } from '../../lib/theme';
import { getPublicFeed, getMyProfile } from '../../lib/socialApi';
import WorkoutPostCard from '../_components/WorkoutPostCard';

const PAGE_SIZE = 20;

export default function Community() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const isFetchingMore = useRef(false);

  const loadInitial = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [profile, feed] = await Promise.all([
        getMyProfile(),
        getPublicFeed(0, PAGE_SIZE),
      ]);

      setCurrentUserId(String(profile.id));
      setPosts(feed);
      setHasMore(feed.length === PAGE_SIZE);
    } catch (err) {
      console.error('Community feed load error:', err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadInitial(true);
  };

  const loadMore = async () => {
    if (!hasMore || isLoadingMore || isFetchingMore.current) return;
    isFetchingMore.current = true;
    setIsLoadingMore(true);
    try {
      const more = await getPublicFeed(posts.length, PAGE_SIZE);
      setPosts(prev => [...prev, ...more]);
      setHasMore(more.length === PAGE_SIZE);
    } catch (err) {
      console.error('Load more error:', err.message);
    } finally {
      setIsLoadingMore(false);
      isFetchingMore.current = false;
    }
  };

  const renderItem = ({ item }) => (
    <WorkoutPostCard
      post={item}
      currentUserId={currentUserId}
    />
  );

  const renderFooter = () => {
    if (!isLoadingMore) return <View style={{ height: layout.bottomSafeArea + 80 }} />;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search bar header */}
      <Pressable style={styles.searchBar} onPress={() => router.push('/user-search')}>
        <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
        <Text style={styles.searchPlaceholder}>Find people...</Text>
      </Pressable>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="people-outline" size={48} color={colors.border} />
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptySubtitle}>Complete a workout and share it to be the first!</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  searchPlaceholder: { fontSize: 15, color: colors.textTertiary },
  list: { padding: spacing.md, paddingTop: spacing.sm },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textSecondary },
  emptySubtitle: { fontSize: 14, color: colors.textTertiary, textAlign: 'center', paddingHorizontal: 32 },
  footerLoader: { paddingVertical: 20, alignItems: 'center' },
});
