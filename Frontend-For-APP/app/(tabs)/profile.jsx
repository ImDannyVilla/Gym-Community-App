import {useState, useEffect, useCallback} from "react";
import {useRouter, useLocalSearchParams, useFocusEffect} from "expo-router";
import {View, Text, Image, Pressable, StyleSheet, Alert, Platform, ActivityIndicator, ScrollView, FlatList} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as NavigationBar from "expo-navigation-bar";
import Modal from "react-native-modal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import {Tabs, MaterialTabBar} from "react-native-collapsible-tab-view";
import { colors, spacing, layout } from "../../lib/theme";
import { getToken } from "../../lib/tokenStorage";
import { getMyProfile, updateMyProfile } from "../../lib/socialApi";
import { getWorkoutLogs } from "../../lib/workoutApi";
import { API_BASE_URL } from "../../lib/api";

const formatDate = (isoString) => {
    if (!isoString) return "--";
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatTime = (seconds) => {
    if (!seconds) return "--";
    const m = Math.floor(seconds / 60);
    return `${m} min`;
};

const EmptyState = ({ icon, title, subtitle }) => (
    <View style={styles.tabContainer}>
        <Ionicons name={icon} size={48} color={colors.border} />
        <Text style={styles.emptyText}>{title}</Text>
        <Text style={styles.emptySubtext}>{subtitle}</Text>
    </View>
);

function PostsTab() {
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPosts = useCallback(async () => {
        try {
            const logs = await getWorkoutLogs();
            const publicPosts = (logs || []).filter(log => log.is_public);
            setPosts(publicPosts);
        } catch (e) {
            console.error("Failed to load posts", e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchPosts();
        }, [fetchPosts])
    );

    if (isLoading) {
        return (
            <View style={styles.tabContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
            </View>
        );
    }

    if (posts.length === 0) {
        return <EmptyState icon="share-social-outline" title="No posts yet" subtitle="Share a workout to make it public" />;
    }

    return (
        <FlatList
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            data={posts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
                <View style={styles.postCard}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>{item.name}</Text>
                        <Text style={styles.cardDate}>{formatDate(item.started_at)}</Text>
                    </View>
                    {item.caption && (
                        <Text style={styles.caption} numberOfLines={3}>{item.caption}</Text>
                    )}
                    <View style={styles.statsRow}>
                        <View style={styles.statChip}>
                            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                            <Text style={styles.statChipText}>{formatTime(item.duration)}</Text>
                        </View>
                        <Text style={styles.exerciseCount}>
                            {item.exercises?.length || 0} exercises
                        </Text>
                    </View>
                </View>
            )}
        />
    );
}

function WorkoutsTab({ workoutLogs, isLoading }) {
    if (isLoading) {
        return (
            <View style={styles.tabContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
            </View>
        );
    }

    if (workoutLogs.length === 0) {
        return <EmptyState icon="barbell-outline" title="No workouts yet" subtitle="Start a workout to track your progress" />;
    }

    return (
        <FlatList
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            data={workoutLogs}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
                <View style={styles.workoutCard}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>{item.name}</Text>
                        <View style={[
                            styles.badge,
                            item.is_public ? styles.badgePublic : styles.badgePrivate
                        ]}>
                            <Text style={styles.badgeText}>
                                {item.is_public ? 'Public' : 'Private'}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.cardDate}>{formatDate(item.started_at)}</Text>
                    {item.duration && (
                        <Text style={styles.logDuration}>
                             {formatTime(item.duration)}
                        </Text>
                    )}
                    {!item.completed_at && (
                        <Text style={styles.logIncomplete}>Incomplete</Text>
                    )}
                </View>
            )}
        />
    );
}

export default function Profile() {
    // Create router for navigation to editProfile
    const router = useRouter();

    const params = useLocalSearchParams();

    const [name, setName] = useState("")
    const [username, setUsername] = useState("");
    const [about, setAbout] = useState("");
    const [gymLevel, setGymLevel] = useState("");
    const [weight, setWeight] = useState("");
    const [lastWorkout, setLastWorkout] = useState("");
    const [currentWorkout, setCurrentWorkout] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");

    const [workoutLogs, setWorkoutLogs] = useState([]);

    const [isLoading, setIsLoading] = useState(true);

    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
    const currentYear = currentDate.getFullYear();
    const todayNum = currentDate.getDate();

    const daysInMonth = new Date(currentYear, currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentDate.getMonth(), 1).getDay();

    const daysArray = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        daysArray.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        daysArray.push(i);
    }

    useEffect(() => {
        if(params.name) {
            setName(params.name);
        }
        if(params.username) {
            setUsername(params.username);
        }
        if(params.about) {
            setAbout(params.about);
        }
    }, [params.name, params.username, params.about]);

const loadProfileData = async () => {
        try {
            setIsLoading(true);
            const token = await getToken();
            if (!token) return;

            // Fetch user profile using socialApi
            const data = await getMyProfile();
            
            if (data.profile) {
                setUsername(data.profile.user_name || "Username");
                setName(data.profile.full_name || "Name");
                setAbout(data.profile.bio || "This is a little about me.");
                setGymLevel(data.profile.gym_level || "");
                setWeight(data.profile.weight?.toString() || "");
                setLastWorkout(data.profile.last_workout || "");
                setCurrentWorkout(data.profile.current_workout || "");
                setAvatarUrl(data.profile.avatar_url || "");
            }

            // Fetch workout logs
            const logsResponse = await fetch(`${API_BASE_URL}/workout-logs/me`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (logsResponse.ok) {
                const logsData = await logsResponse.json();
                setWorkoutLogs(logsData || []);
            }
        } catch (error) {
            console.log("Failed to load profile data (Network error)", error);
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadProfileData();
        }, [])
    );

    // Force navigation bar to be dark
    useEffect(() => {
        if (Platform.OS === 'android') {
            NavigationBar.setBackgroundColorAsync(colors.background);
            NavigationBar.setButtonStyleAsync("light");
        }
    }, []);

    // Request photo permissions on mount if not granted
    useEffect(() => {
        (async () => {
            const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
            if (status !== "granted") {
                await ImagePicker.requestMediaLibraryPermissionsAsync();
            }
        })();
    }, []);

    const changeProfilePhoto = async () => {
        // Ask permission
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert(
                "Permission needed",
                "Please allow photo library access to upload a profile picture."
            );
            return;
        }

        // Open gallery
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'], // Only allows images for upload
            allowsEditing: true, // lets them crop
            aspect: [1, 1], // square crop
            quality: 1,
        });

        if (!result.canceled && result.assets?.length) {
            const newUri = result.assets[0].uri;
            
            try {
                // Update avatar_url in backend
                await updateMyProfile({ avatar_url: newUri });
                setAvatarUrl(newUri);
                Alert.alert("Success", "Profile photo updated!");
            } catch (error) {
                console.error("Failed to update profile photo:", error);
                Alert.alert("Error", "Failed to update profile photo. Please try again.");
            }
        }
    };

    const profileHeader = () => {
        return (
            <View style={{width: "100%", alignItems: "center"}}>
                <View style={styles.photoContainer}>
                    <Image
                        source={{ uri: avatarUrl || "https://via.placeholder.com/400" }}
                        style={styles.profilePhoto}
                        resizeMode="cover"
                    />

                    <Pressable style={styles.editProfilePhoto} onPress={changeProfilePhoto}>
                        <Text style={styles.plusIcon}>+</Text>
                    </Pressable>
                </View>

                <Text style={styles.name}>{name}</Text>
                <Text style={styles.userName}>@{username}</Text>

                <View style={styles.editProfile}>
                    <Pressable style={styles.editButton} onPress={() => {router.push({ pathname: "../edit/editProfile", params: {name, username, about, gymLevel, weight, lastWorkout, currentWorkout}})}}>
                        <Text style={styles.edit}>Edit Profile</Text>
                    </Pressable>
                </View>

                <View style={styles.aboutContainer}>
                    <Text style={styles.aboutHeader}>About</Text>
                    <Text style={styles.about}>{about}</Text>
                </View>
            </View>
        );
    };

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.scrollWindow, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]} edges={['top']}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.scrollWindow, { backgroundColor: colors.background }]} edges={['top']}>
            <Tabs.Container
                renderHeader={profileHeader}
                headerContainerStyle={{paddingTop: 10, backgroundColor: colors.background, elevation: 0, shadowOpacity: 0}}
                renderTabBar={(props) => (
                    <MaterialTabBar
                        {...props}
                        activeColor={colors.text}
                        inactiveColor={colors.textSecondary}
                        indicatorStyle={{
                            backgroundColor: colors.primary,
                            height: 3,
                            borderRadius: 4,
                        }}
                        style={{ backgroundColor: colors.background }}
                    />
                )}
            >
                <Tabs.Tab name="posts" label="Posts">
                    <PostsTab/>
                </Tabs.Tab>

                <Tabs.Tab name="workouts" label="Workouts">
                    <WorkoutsTab workoutLogs={workoutLogs} isLoading={isLoading} />
                </Tabs.Tab>
            </Tabs.Container>

            <Modal
                isVisible={isStreakModalVisible}
                onSwipeComplete={() => setStreakModalVisible(false)}
                swipeDirection="down"
                onBackdropPress={() => setStreakModalVisible(false)}
                style={styles.bottomModal}
            >
                <View style={styles.modalContent}>
                    <View style={styles.dragHandle} />

                    <View style={styles.calendarContainer}>
                        <Text style={styles.monthTitle}>{currentMonth} {currentYear}</Text>

                        <View style={styles.weekDaysRow}>
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                                <Text key={index} style={styles.weekDayText}>{day}</Text>
                            ))}
                        </View>

                        <View style={styles.daysGrid}>
                            {daysArray.map((day, index) => {
                                const isToday = day === todayNum;
                                return (
                                    <View key={index} style={styles.dayCell}>
                                        <View style={[styles.dayCircle, isToday && styles.currentDayCircle]}>
                                            <Text style={[styles.dayText, isToday && styles.currentDayText]}>
                                                {day !== null ? day : ''}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    scrollWindow:
    {
        flex: 1
    },
    container: {
        flexGrow: 1,
        // justifyContent: "center",
        alignItems: "center",
        paddingTop: "5%",
        paddingBottom: "10%",
        backgroundColor: colors.background
    },

    photoContainer: {
        marginBottom: 8
    },

    profilePhoto: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#ccc",
    },

    editProfilePhoto: {
        position: "absolute",
        bottom: 0,
        right: 0,
        borderRadius: 12,
        width: 24,
        height: 24,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },

    plusIcon: {
        fontSize: 20,
        fontWeight: "bold",
        color: colors.text,
        lineHeight: 20,
    },

    name: {
        color: colors.text,
        fontWeight: "bold",
        fontSize: 20,
    },

    userName: {
        marginBottom: 8,
        fontSize: 14,
        color: colors.textSecondary,
    },

    topStatsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 64,
        width: "90%",
        marginBottom: 12,
    },
    topStatItem: {
        alignItems: "center",
        maxWidth: 90,
    },
    topStatValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: colors.text,
        marginBottom: 2,
        textAlign: "center",
    },
    topStatLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        textAlign: "center",
    },

    editProfile: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 12,
        width: "80%"
    },

    editButton: {
        backgroundColor: colors.primary,
        borderRadius: 8,
        width: "45%",
        paddingVertical: "2%",
        alignItems: "center",
    },

    edit: {
        textAlign: "center",
        color: "white",
        fontWeight: "bold",
        fontSize: 13,
    },

    aboutContainer: {
        width: "90%",
        marginBottom: 12
    },
    aboutHeader: {
        fontSize: 18,
        fontWeight: "bold",
        width: "90%",
        textAlign: "left",
        color: colors.text,
    },

    about: {
        fontSize: 16,
        width: "90%",
        color: colors.textSecondary,
    },

    cardContainer: 
    {
        flexDirection: "row",
        flexWrap: "wrap",
        width: "90%",
        /* borderTopWidth: 1,
        borderLeftWidth: 1, */
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 12
    },
    statCard: {
        width: "50%", 
        backgroundColor: colors.surface,
        padding: 10,
        justifyContent: "center",
        alignItems: "center",
        borderBottomWidth: 1,
        borderRightWidth: 1,
        borderColor: colors.border,
    },
    cardTitle: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 4,
        textAlign: "center",
    },
    cardValue: {
        fontSize: 16,
        fontWeight: "bold",
        color: colors.text,
        textAlign: "center",
    },

    bottomModal: {
        justifyContent: "flex-end",
        margin: 0,
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 40,
        height: "50%",
        alignItems: "center",
    },
    dragHandle: {
        width: 40,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: colors.border,
        marginBottom: 24,
    },
    calendarContainer: {
        width: "100%",
        marginTop: 10,
    },
    monthTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: colors.text,
        textAlign: "center",
        marginBottom: 16,
    },
    weekDaysRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    weekDayText: {
        width: "14.28%",
        textAlign: "center",
        color: colors.textSecondary,
        fontSize: 14,
        fontWeight: "600",
    },
    daysGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    dayCell: {
        width: "14.28%",
        aspectRatio: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    dayCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
    },
    currentDayCircle: {
        backgroundColor: colors.primary,
    },
    dayText: {
        fontSize: 16,
        color: colors.text,
    },
    currentDayText: {
        color: colors.text,
        fontWeight: "bold",
    },

    tabContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: colors.background,
        padding: spacing.lg,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: "bold",
        color: colors.textSecondary,
        marginTop: spacing.md,
    },
    emptySubtext: {
        fontSize: 14,
        color: colors.textTertiary,
        marginTop: spacing.xs,
    },
    listContent: {
        padding: layout.screenPadding,
        paddingBottom: layout.bottomSafeArea + 80,
    },
    postCard: {
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: 12,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    workoutCard: {
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: 12,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: spacing.sm,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: colors.text,
        flex: 1,
    },
    cardDate: {
        fontSize: 12,
        color: colors.textTertiary,
    },
    caption: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: spacing.sm,
        lineHeight: 20,
    },
    statsRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    statChip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.background,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    statChipText: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: "500",
    },
    exerciseCount: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    scrollView: {
        flex: 1,
        backgroundColor: colors.background,
    },
    streakStatsRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingVertical: 16,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#222',
    },
    statBox: {
        alignItems: "center",
    },
    statNumber: {
        fontSize: 22,
        fontWeight: "bold",
        color: colors.text,
    },
    statLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    followRow: {
        flexDirection: "row",
        gap: 24,
        justifyContent: "center",
        paddingVertical: 12,
    },
    followStat: {
        alignItems: "center",
    },
    followNumber: {
        fontSize: 18,
        fontWeight: "bold",
        color: colors.text,
    },
    followLabel: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    badge: {
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    badgePublic: {
        backgroundColor: '#052e16',
    },
    badgePrivate: {
        backgroundColor: '#1c1917',
    },
    badgeText: {
        fontSize: 11,
        color: '#999',
    },
    logDuration: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    logIncomplete: {
        fontSize: 12,
        color: '#F59E0B',
        marginTop: 4,
    },
});
