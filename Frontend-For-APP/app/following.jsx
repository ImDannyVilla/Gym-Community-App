import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Image, TextInput } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, layout } from "../lib/theme";
import Header from "./_components/Header";
import { getFollowing, followUser, unfollowUser } from "../lib/socialApi";

export default function Following() {
    const { userId } = useLocalSearchParams();
    const router = useRouter();
    const [following, setFollowing] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchFollowing = async () => {
            try {
                setIsLoading(true);
                const data = await getFollowing(userId);
                setFollowing(data || []);
            } catch (e) {
                setError("Failed to load following.");
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        if (userId) fetchFollowing();
    }, [userId]);

    const handleFollowToggle = async (item) => {
        try {
            if (item.is_following) {
                await unfollowUser(item.id);
            } else {
                await followUser(item.id);
            }
            setFollowing(prev =>
                prev.map(f =>
                    f.id === item.id ? { ...f, is_following: !f.is_following } : f
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

    const filteredFollowing = following.filter(f => {
        const query = searchQuery.toLowerCase();
        return (
            (f.user_name || "").toLowerCase().includes(query) ||
            (f.full_name || "").toLowerCase().includes(query)
        );
    });

    if (isLoading) {
        return (
            <View style={styles.container}>
                <Header title="Following" rightComponent={backButton} />
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Header title="Following" rightComponent={backButton} />
                <View style={styles.centered}>
                    <Text style={styles.emptyText}>{error}</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Header title="Following" rightComponent={backButton} />
            <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={18} color={colors.textSecondary} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search following..."
                    placeholderTextColor={colors.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                    <Pressable onPress={() => setSearchQuery("")}>
                        <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                    </Pressable>
                )}
            </View>
            <FlatList
                data={filteredFollowing}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <Ionicons name="people-outline" size={48} color={colors.border} />
                        <Text style={styles.emptyText}>Not following anyone yet</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <Pressable
                        style={styles.userCard}
                        onPress={() => router.push({ pathname: "/user-profile", params: { username: item.user_name } })}
                    >
                        <Image
                            source={{ uri: item.avatar_url || "https://via.placeholder.com/400" }}
                            style={styles.avatar}
                        />
                        <View style={styles.userInfo}>
                            <Text style={styles.fullName}>{item.full_name || item.user_name}</Text>
                            <Text style={styles.username}>@{item.user_name}</Text>
                            {item.bio && (
                                <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>
                            )}
                        </View>
                        <Pressable
                            style={[styles.followButton, item.is_following && styles.followingButton]}
                            onPress={() => handleFollowToggle(item)}
                        >
                            <Text style={[styles.followButtonText, item.is_following && styles.followingButtonText]}>
                                {item.is_following ? "Following" : "Follow"}
                            </Text>
                        </Pressable>
                    </Pressable>
                )}
            />
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
        paddingVertical: spacing.md,
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
    },
});