import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Image, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, layout } from "../lib/theme";
import Header from "./_components/Header";
import { searchUsers, followUser, unfollowUser } from "../lib/socialApi";

export default function UserSearch() {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async (text) => {
        setQuery(text);
        if (text.trim().length < 2) {
            setResults([]);
            setHasSearched(false);
            return;
        }
        setIsLoading(true);
        try {
            const data = await searchUsers(text.trim());
            setResults(data || []);
            setHasSearched(true);
        } catch (e) {
            console.error("Search failed:", e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFollowToggle = async (item) => {
        try {
            if (item.profile?.is_following) {
                await unfollowUser(item.id);
            } else {
                await followUser(item.id);
            }
            setResults(prev =>
                prev.map(u =>
                    u.id === item.id
                        ? { ...u, profile: { ...u.profile, is_following: !u.profile?.is_following } }
                        : u
                )
            );
        } catch (e) {
            console.error("Failed to toggle follow:", e.message);
        }
    };

    const backButton = (
        <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
    );

    return (
        <View style={styles.container}>
            <Header title="Find People" rightComponent={backButton} />

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={18} color={colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by username..."
                    placeholderTextColor={colors.textSecondary}
                    value={query}
                    onChangeText={handleSearch}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus={true}
                />
                {query.length > 0 && (
                    <Pressable onPress={() => { setQuery(""); setResults([]); setHasSearched(false); }}>
                        <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                    </Pressable>
                )}
            </View>

            {/* Results */}
            {isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : hasSearched && results.length === 0 ? (
                <View style={styles.centered}>
                    <Ionicons name="person-outline" size={48} color={colors.border} />
                    <Text style={styles.emptyText}>No users found</Text>
                    <Text style={styles.emptySubtext}>Try a different username</Text>
                </View>
            ) : !hasSearched ? (
                <View style={styles.centered}>
                    <Ionicons name="search-outline" size={48} color={colors.border} />
                    <Text style={styles.emptyText}>Search for people</Text>
                    <Text style={styles.emptySubtext}>Type at least 2 characters</Text>
                </View>
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <Pressable
                            style={styles.userCard}
                            onPress={() => router.push({ pathname: "/user-profile", params: { username: item.profile?.user_name } })}
                        >
                            <Image
                                source={{ uri: item.profile?.avatar_url || "https://via.placeholder.com/400" }}
                                style={styles.avatar}
                            />
                            <View style={styles.userInfo}>
                                <Text style={styles.fullName}>{item.profile?.full_name || item.profile?.user_name}</Text>
                                <Text style={styles.username}>@{item.profile?.user_name}</Text>
                                {item.profile?.bio && (
                                    <Text style={styles.bio} numberOfLines={1}>{item.profile.bio}</Text>
                                )}
                            </View>
                            <Pressable
                                style={[styles.followButton, item.profile?.is_following && styles.followingButton]}
                                onPress={() => handleFollowToggle(item)}
                            >
                                <Text style={[styles.followButtonText, item.profile?.is_following && styles.followingButtonText]}>
                                    {item.profile?.is_following ? "Following" : "Follow"}
                                </Text>
                            </Pressable>
                        </Pressable>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.lg },
    backButton: { padding: 4 },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: spacing.md,
        marginHorizontal: layout.screenPadding,
        marginVertical: spacing.sm,
        height: 44,
    },
    searchIcon: { marginRight: spacing.sm },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: colors.text,
    },
    listContent: {
        paddingHorizontal: layout.screenPadding,
        paddingVertical: spacing.sm,
        paddingBottom: layout.bottomSafeArea + 40,
    },
    userCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.border,
    },
    userInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    fullName: {
        fontSize: 15,
        fontWeight: "700",
        color: colors.text,
    },
    username: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 1,
    },
    bio: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 3,
    },
    followButton: {
        backgroundColor: colors.primary,
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 10,
    },
    followingButton: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: colors.border,
    },
    followButtonText: {
        fontSize: 12,
        fontWeight: "800",
        color: "#000",
    },
    followingButtonText: {
        color: colors.textSecondary,
    },
    emptyText: {
        fontSize: 16,
        color: colors.textSecondary,
        marginTop: 12,
        fontWeight: "600",
    },
    emptySubtext: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 4,
    },
});