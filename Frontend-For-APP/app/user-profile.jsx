import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Image } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, layout } from "../lib/theme";
import Header from "./_components/Header";
import { getUserByUsername, followUser, unfollowUser } from "../lib/socialApi";

export default function UserProfile() {
    const { username } = useLocalSearchParams();
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [isFollowLoading, setIsFollowLoading] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                setIsLoading(true);
                const data = await getUserByUsername(username);
                setUser(data);
                setIsFollowing(data.profile?.is_following || false);
                setFollowersCount(data.profile?.followers_count || 0);
            } catch (e) {
                setError("Failed to load profile.");
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        if (username) fetchUser();
    }, [username]);

    const handleFollowToggle = async () => {
        if (!user || isFollowLoading) return;
        setIsFollowLoading(true);
        try {
            if (isFollowing) {
                await unfollowUser(user.id);
                setFollowersCount(prev => prev - 1);
            } else {
                await followUser(user.id);
                setFollowersCount(prev => prev + 1);
            }
            setIsFollowing(prev => !prev);
        } catch (e) {
            console.error("Failed to toggle follow:", e.message);
        } finally {
            setIsFollowLoading(false);
        }
    };

    const backButton = (
        <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
    );

    if (isLoading) {
        return (
            <View style={styles.container}>
                <Header title="Profile" rightComponent={backButton} />
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </View>
        );
    }

    if (error || !user) {
        return (
            <View style={styles.container}>
                <Header title="Profile" rightComponent={backButton} />
                <View style={styles.centered}>
                    <Text style={styles.emptyText}>{error || "User not found."}</Text>
                </View>
            </View>
        );
    }

    const profile = user.profile || {};

    return (
        <View style={styles.container}>
            <Header title={`@${profile.user_name || "profile"}`} rightComponent={backButton} />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Avatar */}
                <View style={styles.avatarContainer}>
                    <Image
                        source={{ uri: profile.avatar_url || "https://via.placeholder.com/400" }}
                        style={styles.avatar}
                        resizeMode="cover"
                    />
                </View>

                {/* Name */}
                <Text style={styles.fullName}>{profile.full_name || profile.user_name}</Text>
                <Text style={styles.username}>@{profile.user_name}</Text>

                {/* Followers/Following counts */}
                <View style={styles.followRow}>
                    <Pressable
                        style={styles.followStat}
                        onPress={() => router.push({ pathname: "/followers", params: { userId: user.id } })}
                    >
                        <Text style={styles.followNumber}>{followersCount}</Text>
                        <Text style={styles.followLabel}>Followers</Text>
                    </Pressable>
                    <Pressable
                        style={styles.followStat}
                        onPress={() => router.push({ pathname: "/following", params: { userId: user.id } })}
                    >
                        <Text style={styles.followNumber}>{profile.following_count || 0}</Text>
                        <Text style={styles.followLabel}>Following</Text>
                    </Pressable>
                </View>

                {/* Follow Button */}
                <Pressable
                    style={[styles.followButton, isFollowing && styles.followingButton]}
                    onPress={handleFollowToggle}
                    disabled={isFollowLoading}
                >
                    {isFollowLoading ? (
                        <ActivityIndicator size="small" color={isFollowing ? colors.textSecondary : "#000"} />
                    ) : (
                        <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                            {isFollowing ? "Following" : "Follow"}
                        </Text>
                    )}
                </Pressable>

                {/* Bio */}
                {profile.bio && (
                    <View style={styles.bioContainer}>
                        <Text style={styles.bioText}>{profile.bio}</Text>
                    </View>
                )}

                {/* Stats */}
                <View style={styles.statsCard}>
                    <Text style={styles.sectionTitle}>Stats</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{profile.total_workouts || 0}</Text>
                            <Text style={styles.statLabel}>Workouts</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{profile.day_streak || 0}</Text>
                            <Text style={styles.statLabel}>Day Streak</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{profile.gym_level || "--"}</Text>
                            <Text style={styles.statLabel}>Level</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.lg },
    backButton: { padding: 4 },
    scrollContent: {
        paddingHorizontal: layout.screenPadding,
        paddingBottom: layout.bottomSafeArea + 40,
        alignItems: "center",
    },

    // Avatar
    avatarContainer: { marginTop: spacing.lg, marginBottom: spacing.sm },
    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: colors.border,
    },

    // Name
    fullName: {
        fontSize: 20,
        fontWeight: "bold",
        color: colors.text,
        marginTop: spacing.sm,
    },
    username: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
    },

    // Follow row
    followRow: {
        flexDirection: "row",
        gap: 32,
        justifyContent: "center",
        paddingVertical: 10,
        marginBottom: spacing.sm,
    },
    followStat: { alignItems: "center" },
    followNumber: {
        fontSize: 18,
        fontWeight: "bold",
        color: colors.text,
    },
    followLabel: {
        fontSize: 12,
        color: colors.textSecondary,
    },

    // Follow button
    followButton: {
        backgroundColor: colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 40,
        borderRadius: 10,
        marginBottom: spacing.md,
        minWidth: 140,
        alignItems: "center",
    },
    followingButton: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: colors.border,
    },
    followButtonText: {
        fontSize: 14,
        fontWeight: "800",
        color: "#000",
    },
    followingButtonText: {
        color: colors.textSecondary,
    },

    // Bio
    bioContainer: {
        width: "100%",
        marginBottom: spacing.md,
    },
    bioText: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: "center",
    },

    // Stats card
    statsCard: {
        width: "100%",
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        marginTop: spacing.sm,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: colors.text,
        marginBottom: spacing.md,
    },
    statsGrid: {
        flexDirection: "row",
        justifyContent: "space-around",
    },
    statItem: { alignItems: "center" },
    statValue: {
        fontSize: 22,
        fontWeight: "bold",
        color: colors.primary,
    },
    statLabel: {
        fontSize: 11,
        color: colors.textSecondary,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginTop: 2,
    },

    // Empty
    emptyText: {
        fontSize: 16,
        color: colors.textSecondary,
        marginTop: 12,
    },
});