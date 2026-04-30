import {useState, useEffect, useCallback, useMemo} from "react";
import {useRouter, useLocalSearchParams, useFocusEffect} from "expo-router";
import {View, Text, Image, Pressable, StyleSheet, Alert, Platform, ActivityIndicator, ScrollView, FlatList, useWindowDimensions} from "react-native";
import Svg, { Path, Line as SvgLine, Text as SvgText } from 'react-native-svg';
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as NavigationBar from "expo-navigation-bar";
import Modal from "react-native-modal";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, layout } from "../../lib/theme";
import { getToken, clearAllTokens } from "../../lib/tokenStorage";
import { getMyProfile, updateMyProfile } from "../../lib/socialApi";
import { uploadAvatar } from "../../lib/supabaseStorage";
import { logoutUser } from "../../lib/authApi";
import { getWorkoutLogs, getWorkoutStreak } from "../../lib/workoutApi";
import { useWorkoutStore } from "../../stores/workoutStore";

const formatDate = (isoString) => {
    if (!isoString) return "--";
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const formatDateTime = (isoString) => {
    if (!isoString) return "--";
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
};

const formatTime = (seconds) => {
    if (!seconds) return "--";
    const m = Math.floor(seconds / 60);
    return `${m} min`;
};

const formatLastWorkout = (log) => {
    if (!log) return "No completed workouts yet";
    return `${log.name || "Workout"} • ${formatDateTime(log.completed_at || log.started_at)}`;
};

const EmptyState = ({ icon, title, subtitle }) => (
    <View style={styles.tabContainer}>
        <Ionicons name={icon} size={48} color={colors.border} />
        <Text style={styles.emptyText}>{title}</Text>
        <Text style={styles.emptySubtext}>{subtitle}</Text>
    </View>
);

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
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
            data={workoutLogs}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
                const completedExerciseCount = (item.exercises || [])
                    .filter(exercise => exercise.sets?.some(set => set.completed))
                    .length;

                return (
                    <View style={styles.workoutCard}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>{item.name}</Text>
                            <Text style={styles.exerciseCount}>{completedExerciseCount} exercises</Text>
                        </View>
                        <Text style={styles.cardDate}>Finished {formatDateTime(item.completed_at || item.started_at)}</Text>
                        {item.duration && (
                            <Text style={styles.logDuration}>
                                 {formatTime(item.duration)}
                            </Text>
                        )}
                    </View>
                );
            }}
        />
    );
}

const GRAPH_ACCENT = '#DC2626';
const G_H = 100;
const G_PAD = { t: 6, b: 26, l: 4, r: 4 };

function ProgressGraph({ data, label, graphWidth }) {
  const pW = graphWidth - G_PAD.l - G_PAD.r;
  const pH = G_H - G_PAD.t - G_PAD.b;
  const n = data.length;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const xPos = (i) => G_PAD.l + (n > 1 ? (i / (n - 1)) * pW : pW / 2);
  const yPos = (v) => G_PAD.t + pH * (1 - v / maxVal);
  const pathD = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xPos(i).toFixed(1)},${yPos(d.value).toFixed(1)}`).join(' ');

  return (
    <View style={graphStyles.card}>
      <Text style={graphStyles.label}>{label}</Text>
      <Svg width={graphWidth} height={G_H}>
        <SvgLine x1={G_PAD.l} y1={G_PAD.t + pH} x2={G_PAD.l + pW} y2={G_PAD.t + pH} stroke="#333" strokeWidth={1} />
        <Path d={pathD} stroke={GRAPH_ACCENT} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => {
          if (i % 4 !== 0 && i !== n - 1) return null;
          return (
            <SvgText key={i} x={xPos(i)} y={G_H - 4} fontSize={8} fill="#888" textAnchor="middle">{d.label}</SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

const graphStyles = StyleSheet.create({
  card: {
    width: '100%',
    marginBottom: 12,
    backgroundColor: colors.surface,
    borderRadius: layout.borderRadius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    paddingBottom: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
});

export default function Profile() {
    const router = useRouter();
    const { width: screenWidth } = useWindowDimensions();

    const params = useLocalSearchParams();

    const [name, setName] = useState("")
    const [username, setUsername] = useState("");
    const [about, setAbout] = useState("");
    const [gymLevel, setGymLevel] = useState("");
    const [weight, setWeight] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");

    const [workoutLogs, setWorkoutLogs] = useState([]);
    const [dayStreak, setDayStreak] = useState(0);

    const [isLoading, setIsLoading] = useState(true);

    const needsProfileRefresh = useWorkoutStore(state => state.needsProfileRefresh);
    const clearProfileRefresh = useWorkoutStore(state => state.clearProfileRefresh);

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

    const handleLogout = async () => {
        await clearAllTokens();
        logoutUser(); // fire-and-forget server-side invalidation
        router.replace("/");
    };

const loadProfileData = async () => {
        try {
            setIsLoading(true);
            const token = await getToken();
            if (!token) return;

            const data = await getMyProfile();
            if (data.profile) {
                setUsername(data.profile.user_name || "Username");
                setName(data.profile.full_name || "Name");
                setAbout(data.profile.bio || "This is a little about me.");
                setGymLevel(data.profile.gym_level || "");
                setWeight(data.profile.weight?.toString() || "");
                setAvatarUrl(data.profile.avatar_url || "");
            }

            const [logsData, streakData] = await Promise.all([
                getWorkoutLogs(),
                getWorkoutStreak().catch(() => null),
            ]);
            const completedLogs = (logsData || [])
                .filter(log => log.completed_at)
                .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
            setWorkoutLogs(completedLogs);
            if (streakData) setDayStreak(streakData.day_streak ?? 0);
            clearProfileRefresh();
        } catch (error) {
            console.log("Failed to load profile data (Network error)", error);
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (workoutLogs.length === 0 || needsProfileRefresh) {
                loadProfileData();
            }
        }, [needsProfileRefresh])
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
            const localUri = result.assets[0].uri;

            try {
                const publicUrl = await uploadAvatar(localUri);
                await updateMyProfile({ avatar_url: publicUrl });
                setAvatarUrl(publicUrl);
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
                    <Pressable style={styles.editButton} onPress={() => {router.push({ pathname: "../edit/editProfile", params: {name, username, about, gymLevel, weight}})}}>
                        <Text style={styles.edit}>Edit Profile</Text>
                    </Pressable>
                    <Pressable style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutText}>Log Out</Text>
                    </Pressable>
                </View>

                <View style={styles.aboutContainer}>
                    <Text style={styles.aboutHeader}>About</Text>
                    <Text style={styles.about}>{about}</Text>
                </View>
            </View>
        );
    };

    const completedWorkouts = workoutLogs;
    const totalDuration = completedWorkouts.reduce((total, log) => total + (log.duration || 0), 0);
    const lastCompletedWorkout = [...completedWorkouts].sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))[0];

    const last14Days = useMemo(() => {
        const days = [];
        for (let i = 13; i >= 0; i--) {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() - i);
            days.push(d);
        }
        return days;
    }, []);

    const volumeData = useMemo(() => last14Days.map(day => {
        const ds = day.toISOString().slice(0, 10);
        const vol = completedWorkouts
            .filter(log => log.completed_at && new Date(log.completed_at).toISOString().slice(0, 10) === ds)
            .reduce((t, log) => t + (log.exercises || []).reduce((et, ex) =>
                et + (ex.sets || []).filter(s => s.completed).reduce((st, s) =>
                    st + (s.weight_lbs || 0) * (s.reps || 0), 0), 0), 0);
        return { value: Math.round(vol), label: day.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1) };
    }), [completedWorkouts, last14Days]);

    const repsData = useMemo(() => last14Days.map(day => {
        const ds = day.toISOString().slice(0, 10);
        const reps = completedWorkouts
            .filter(log => log.completed_at && new Date(log.completed_at).toISOString().slice(0, 10) === ds)
            .reduce((t, log) => t + (log.exercises || []).reduce((et, ex) =>
                et + (ex.sets || []).filter(s => s.completed).reduce((st, s) =>
                    st + (s.reps || 0), 0), 0), 0);
        return { value: reps, label: day.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1) };
    }), [completedWorkouts, last14Days]);

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.scrollWindow, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]} edges={['top']}>
                <ActivityIndicator size="large" color={colors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.scrollWindow, { backgroundColor: colors.background }]} edges={['top']}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.profileContent} showsVerticalScrollIndicator={false}>
                {profileHeader()}

                <View style={styles.progressSection}>
                    <Text style={styles.sectionTitle}>My Progress</Text>

                    <View style={styles.summaryRow}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>{completedWorkouts.length}</Text>
                            <Text style={styles.summaryLabel}>Workouts</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>{dayStreak}</Text>
                            <Text style={styles.summaryLabel}>Day Streak</Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryValue}>{Math.floor(totalDuration / 60)}</Text>
                            <Text style={styles.summaryLabel}>Minutes</Text>
                        </View>
                    </View>

                    <View style={styles.lastWorkoutCard}>
                        <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                        <View style={styles.lastWorkoutTextWrap}>
                            <Text style={styles.dashboardLabel}>Last workout</Text>
                            <Text style={styles.lastWorkoutText}>{formatLastWorkout(lastCompletedWorkout)}</Text>
                        </View>
                    </View>

                    {isLoading ? (
                        <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
                    ) : (
                        <>
                            <ProgressGraph
                                data={volumeData}
                                label="Volume (lbs)"
                                graphWidth={screenWidth * 0.9 - 24}
                            />
                            <ProgressGraph
                                data={repsData}
                                label="Total Reps"
                                graphWidth={screenWidth * 0.9 - 24}
                            />
                        </>
                    )}
                </View>

                <View style={styles.historySection}>
                    <Text style={styles.sectionTitle}>Workout History</Text>
                    <WorkoutsTab workoutLogs={workoutLogs} isLoading={isLoading} />
                </View>
            </ScrollView>
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

    profileContent: {
        paddingTop: 10,
        paddingBottom: 120,
        alignItems: "center",
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
        gap: 8,
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

    logoutButton: {
        borderRadius: 8,
        width: "45%",
        paddingVertical: "2%",
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.border,
    },

    logoutText: {
        textAlign: "center",
        color: colors.textSecondary,
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

    progressSection: {
        width: "90%",
        marginBottom: spacing.lg,
    },

    summaryRow: {
        flexDirection: "row",
        backgroundColor: colors.surface,
        borderRadius: layout.borderRadius,
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: spacing.md,
        marginBottom: spacing.sm,
        alignItems: "center",
    },
    summaryItem: {
        flex: 1,
        alignItems: "center",
    },
    summaryDivider: {
        width: 1,
        height: 32,
        backgroundColor: colors.border,
    },
    summaryValue: {
        fontSize: 24,
        fontWeight: "900",
        color: colors.primary,
        lineHeight: 26,
    },
    summaryLabel: {
        fontSize: 10,
        color: colors.textSecondary,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginTop: 2,
    },

    sectionTitle: {
        color: colors.text,
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: spacing.md,
    },

    dashboardGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: spacing.sm,
        marginBottom: spacing.md,
    },

    dashboardStat: {
        flexBasis: "48%",
        backgroundColor: colors.background,
        borderRadius: layout.borderRadius,
        padding: spacing.md,
        alignItems: "center",
    },

    dashboardValue: {
        color: colors.primary,
        fontSize: 24,
        fontWeight: "bold",
    },

    dashboardLabel: {
        color: colors.textSecondary,
        fontSize: 12,
        marginTop: 2,
    },

    lastWorkoutCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        backgroundColor: colors.background,
        borderRadius: layout.borderRadius,
        padding: spacing.md,
    },

    lastWorkoutTextWrap: {
        flex: 1,
    },

    lastWorkoutText: {
        color: colors.text,
        fontSize: 14,
        fontWeight: "600",
        marginTop: 2,
    },

    historySection: {
        width: "90%",
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
