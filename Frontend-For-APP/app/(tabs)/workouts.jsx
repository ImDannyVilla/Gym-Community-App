import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, layout, spacing } from "../../lib/theme";
import { getMyRoutines, startWorkout, getWorkoutStreak, deleteWorkoutLog, getRoutine, deleteRoutine, getSeededWorkouts } from "../../lib/workoutApi";
import { loadFromCache, saveToCache, CACHE_KEYS } from "../../lib/localCache";
import { getMyProfile } from "../../lib/socialApi";
import { useWorkoutStore } from "../../stores/workoutStore";

export default function WorkoutsScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [startingRoutineId, setStartingRoutineId] = useState(null);
  const {
    isActive: hasActiveWorkout,
    activeLogId,
    startWorkout: setWorkoutActive,
    endWorkout,
    hasWorkoutActivity,
    needsProfileRefresh,
    clearProfileRefresh,
    cachedRoutines: routines,
    cachedStats: stats,
    setCachedRoutines,
    setCachedStats,
  } = useWorkoutStore();

  const fetchData = async () => {
    // 1. Load from AsyncStorage immediately — no spinner if cache exists
    const [cachedRoutinesData, cachedStreakData] = await Promise.all([
      loadFromCache(CACHE_KEYS.ROUTINES),
      loadFromCache(CACHE_KEYS.STREAK),
    ]);
    if (cachedRoutinesData?.length > 0) {
      setCachedRoutines(cachedRoutinesData);
    } else {
      setIsLoading(true);
    }
    if (cachedStreakData) {
      setCachedStats({
        totalWorkouts: cachedStreakData.workouts_this_week || 0,
        setsDone: cachedStreakData.total_sets || 0,
        dayStreak: cachedStreakData.day_streak || 0,
      });
    }

    // 2. Fetch fresh in background — update UI and cache silently
    try {
      const [routinesData, streakData] = await Promise.all([
        getMyRoutines(),
        getWorkoutStreak().catch(() => null),
      ]);
      setCachedRoutines(routinesData || []);
      await saveToCache(CACHE_KEYS.ROUTINES, routinesData || []);
      if (streakData) {
        setCachedStats({
          totalWorkouts: streakData.workouts_this_week || 0,
          setsDone: streakData.total_sets || 0,
          dayStreak: streakData.day_streak || 0,
        });
        await saveToCache(CACHE_KEYS.STREAK, streakData);
      }
      // Prefetch seeded workouts so Explore screen loads instantly
      const { cachedSeededWorkouts, setCachedSeededWorkouts } = useWorkoutStore.getState();
      if (cachedSeededWorkouts.length === 0) {
        getSeededWorkouts().then(data => {
          if (data?.length) setCachedSeededWorkouts(data);
        }).catch(() => {});
      }
    } catch (e) {
      console.warn("Background refresh failed:", e.message);
    } finally {
      setIsLoading(false);
      clearProfileRefresh();
    }
  };

  useFocusEffect(
    useCallback(() => {
      // Read directly from store to avoid stale closure over `routines`
      const { cachedRoutines, needsProfileRefresh: refresh } = useWorkoutStore.getState();
      if (cachedRoutines.length === 0 || refresh) {
        fetchData();
      }
    }, [])
  );

  const getCurrentDate = () => {
    const date = new Date();
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const startNewWorkout = async (name, routineId, errorMessage) => {
    setStartingRoutineId(routineId);
    try {
      // 1. Create the workout log (empty — exercises are NOT pre-added to the backend)
      const log = await startWorkout(name, routineId, false);

      // 2. For routines, build exercise objects locally in the same shape the store uses.
      //    doSaveWorkout adds them to the backend at save time — pre-adding here caused
      //    duplicates because doSaveWorkout would add them a second time on finish.
      let exercises = [];
      if (routineId) {
        const routine = await getRoutine(routineId);
        if (routine?.exercises?.length) {
          const sorted = [...routine.exercises].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
          exercises = sorted.map((ex, idx) => {
            const instanceId = `${Date.now()}-${idx}`;
            return {
              id: instanceId,
              exercise_id: ex.exercise_id,
              name: ex.name,
              category: ex.category,
              target: ex.target,
              equipment: ex.equipment,
              gif_url: ex.gif_url,
              order: ex.order,
              target_sets: ex.target_sets,
              target_reps_min: ex.target_reps_min,
              target_reps_max: ex.target_reps_max,
              target_weight_lbs: ex.target_weight_lbs,
              sets: Array.from({ length: ex.target_sets || 3 }, (_, i) => ({
                id: `${instanceId}-${i}`,
                set_number: i + 1,
                reps: '',
                weight_lbs: '',
                completed: false,
                warmup: false,
                started: false,
              })),
            };
          });
        }
      }

      setWorkoutActive({ ...log, exercises });
      router.push('/activeWorkout');
    } catch (e) {
      console.error(errorMessage, e.message);
      Alert.alert('Error', `${errorMessage}. Please try again.`);
    } finally {
      setStartingRoutineId(null);
    }
  };

  const discardActiveWorkout = async () => {
    if (activeLogId) {
      try {
        await deleteWorkoutLog(activeLogId);
      } catch (e) {
        if (e.status !== 404) throw e;
      }
    }
    endWorkout();
  };

  const confirmStartWorkout = (name, routineId, errorMessage) => {
    if (!hasActiveWorkout) {
      startNewWorkout(name, routineId, errorMessage);
      return;
    }

    const activeWorkoutHasActivity = hasWorkoutActivity();

    Alert.alert(
      "Workout in Progress",
      activeWorkoutHasActivity
        ? "You have a workout in progress. If you start a new workout, your old workout will be permanently deleted."
        : "You have an empty workout in progress. If you start a new workout, the empty workout will be discarded without being saved.",
      [
        {
          text: "Resume workout in progress",
          onPress: () => router.push("/activeWorkout"),
        },
        {
          text: "Start new workout",
          style: "destructive",
          onPress: async () => {
            try {
              await discardActiveWorkout();
              await startNewWorkout(name, routineId, errorMessage);
            } catch (e) {
              console.error("Failed to delete workout in progress:", e.message);
              Alert.alert("Error", "Failed to delete the workout in progress. Please try again.");
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleStartEmptyWorkout = () => {
    confirmStartWorkout("My Workout", null, "Failed to start workout");
  };

  const handleStartRoutine = (routineId, routineName) => {
    confirmStartWorkout(routineName, routineId, "Failed to start routine");
  };

  const handleDeleteRoutine = (routineId) => {
    Alert.alert(
      'Delete Routine',
      'Are you sure you want to delete this routine? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRoutine(routineId);
              const updated = routines.filter(r => r.id !== routineId);
              setCachedRoutines(updated);
              await saveToCache(CACHE_KEYS.ROUTINES, updated);
            } catch (e) {
              console.error('Failed to delete routine:', e.message);
              Alert.alert('Error', 'Failed to delete routine. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => { setRefreshing(true); await fetchData(); setRefreshing(false); }}
            tintColor="#DC2626"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
        <Text style={styles.dateText}>{getCurrentDate()}</Text>
        <Text style={styles.titleText}>WORKOUT</Text>
      </View>

      {/* Stats Bubble */}
      <Text style={styles.thisWeekLabel}>THIS WEEK</Text>
      <View style={styles.statsContainer}>
        <View style={styles.statBubble}>
          <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
          <Text style={styles.statLabel}>Workouts</Text>
        </View>
        <View style={styles.statBubble}>
          <Text style={styles.statValue}>{stats.setsDone}</Text>
          <Text style={styles.statLabel}>Sets</Text>
        </View>
        <View style={styles.statBubble}>
          <Text style={styles.statValue}>{stats.dayStreak}</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
      </View>

      {/* Quick Start Buttons */}
      <View style={styles.quickStartContainer}>
        <Pressable 
          style={styles.quickStartButtonDashed}
          onPress={handleStartEmptyWorkout}
        >
          <Text style={styles.quickStartTitle}>Empty Workout</Text>
          <Text style={styles.quickStartSubtitle}>Start fresh</Text>
        </Pressable>

        <Pressable 
          style={styles.quickStartButton}
          onPress={() => router.push("/explore")}
        >
          <Text style={styles.quickStartTitle}>Explore</Text>
          <Text style={styles.quickStartSubtitle}>Find Workout</Text>
        </Pressable>
      </View>

      <Pressable 
        style={styles.addRoutineButton}
        onPress={() => router.push("/create-routine")}
      >
        <Text style={styles.addRoutineButtonText}>+ Add Routine</Text>
      </Pressable>

      {/* My Routines */}
      <View style={styles.routinesSection}>
        <View style={styles.routinesHeader}>
          <Text style={styles.routinesTitle}>My Routines</Text>
        </View>

        {isLoading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : routines.length === 0 ? (
          <View style={styles.emptyRoutines}>
            <Ionicons name="barbell-outline" size={48} color={colors.border} />
            <Text style={styles.emptyText}>No routines yet</Text>
            <Text style={styles.emptySubtext}>Create your first routine to get started</Text>
          </View>
        ) : (
          routines.map((routine) => (
            <View key={routine.id} style={styles.routineCard}>
              <View style={styles.routineInfo}>
                <Text style={styles.routineName}>{routine.name}</Text>
                {!!routine.description && (
                  <Text style={styles.routineDescription} numberOfLines={2}>{routine.description}</Text>
                )}
                <Text style={styles.routineExercises}>
                  {routine.exercises?.length || 0} exercises
                </Text>
              </View>
              <View style={styles.routineActions}>
                <Pressable
                  style={styles.iconButton}
                  onPress={() => handleDeleteRoutine(routine.id)}
                >
                  <Ionicons name="trash-outline" size={16} color="#DC2626" />
                </Pressable>
                <Pressable
                  style={styles.iconButton}
                  onPress={() => router.push({ pathname: "/create-routine", params: { routineId: routine.id } })}
                >
                  <Ionicons name="pencil" size={16} color={colors.textSecondary} />
                </Pressable>
                <Pressable
                  style={styles.startButton}
                  onPress={() => handleStartRoutine(routine.id, routine.name)}
                  disabled={startingRoutineId === routine.id}
                >
                  {startingRoutineId === routine.id
                    ? <ActivityIndicator size="small" color={colors.text} />
                    : <Text style={styles.startButtonText}>Start</Text>}
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingBottom: 80,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
  },
  dateText: {
    fontSize: 11,
    color: colors.textSecondary,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  titleText: {
    fontSize: 32,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: 1,
    lineHeight: 32,
  },
  thisWeekLabel: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 4,
    fontSize: 10,
    fontWeight: "800",
    color: colors.textSecondary,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  statsContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statBubble: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 4,
  },
  statValue: {
    fontSize: 30,
    fontWeight: "900",
    color: colors.primary,
    lineHeight: 30,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  quickStartContainer: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: "row",
    gap: 10,
  },
  quickStartButtonDashed: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  quickStartButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  quickStartEmoji: {
    fontSize: 26,
    marginBottom: 4,
  },
  quickStartTitle: {
    fontWeight: "800",
    fontSize: 13,
    color: colors.text,
  },
  quickStartSubtitle: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 3,
  },
  routinesSection: {
    paddingHorizontal: 16,
  },
  routinesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  routinesTitle: {
    fontWeight: "900",
    fontSize: 15,
    color: colors.text,
  },
  createButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  createButtonText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  routineCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 13,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  routineInfo: {
    flex: 1,
  },
  routineName: {
    fontWeight: "800",
    fontSize: 14,
    color: colors.text,
  },
  routineDescription: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  routineExercises: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },
  routineActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  startButtonText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "800",
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 20,
  },
  emptyRoutines: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
  },
  addRoutineButton: {
    marginHorizontal: 16,
    marginBottom: 18,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  addRoutineButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});