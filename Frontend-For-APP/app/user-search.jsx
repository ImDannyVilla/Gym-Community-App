import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, Pressable,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, layout } from '../lib/theme';
import { searchUsers } from '../lib/socialApi';

function UserRow({ user }) {
  return (
    <Pressable
      style={styles.userRow}
      onPress={() => user.profile?.user_name && router.push(`/user-profile?username=${user.profile.user_name}`)}
    >
      {user.profile?.avatar_url ? (
        <Image source={{ uri: user.profile.avatar_url }} style={styles.avatar} contentFit="cover" />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Ionicons name="person-outline" size={20} color="#555" />
        </View>
      )}
      <View style={styles.userInfo}>
        <Text style={styles.username}>{user.profile?.user_name || 'Unknown'}</Text>
        {user.profile?.full_name ? (
          <Text style={styles.fullName}>{user.profile.full_name}</Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </Pressable>
  );
}

export default function UserSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef(null);

  const runSearch = useCallback(async (q) => {
    if (!q.trim()) { setResults([]); return; }
    setIsSearching(true);
    try {
      const data = await searchUsers(q.trim());
      setResults(data);
    } catch (err) {
      console.error('Search error:', err.message);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleChangeText = (text) => {
    setQuery(text);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(text), 300);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <TextInput
          style={styles.input}
          placeholder="Search by username..."
          placeholderTextColor={colors.textTertiary}
          value={query}
          onChangeText={handleChangeText}
          autoFocus
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {isSearching && <ActivityIndicator size="small" color={colors.textSecondary} style={{ marginLeft: 8 }} />}
      </View>

      <FlatList
        data={results}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => <UserRow user={item} />}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          query.trim() && !isSearching ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No users found for "{query}"</Text>
            </View>
          ) : null
        }
      />
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
    gap: 8,
  },
  backBtn: { padding: 4 },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    fontSize: 15,
    color: colors.text,
  },
  list: { padding: spacing.md },
  userRow: {
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
  emptyState: { paddingTop: 40, alignItems: 'center' },
  emptyText: { color: colors.textSecondary, fontSize: 14 },
});
