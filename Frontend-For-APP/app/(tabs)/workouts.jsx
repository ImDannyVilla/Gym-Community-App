import React, { useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, layout, spacing } from "../../lib/theme";
import { getMyRoutines, startWorkout, getWorkoutStreak } from "../../lib/workoutApi";
import { getMyProfile } from "../../lib/socialApi";
import { useWorkoutStore } from "../../stores/workoutStore";

export default function WorkoutsScreen() {
  const insets = useSafeAreaInsets();
  const [routines, setRoutines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    setsDone: 0,
    dayStreak: 0,
  });
  const { startWorkout: setWorkoutActive } = useWorkoutStore();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch routines
      const routinesData = await getMyRoutines();
      setRoutines(routinesData || []);

      // Fetch stats (gracefully handle if endpoint not deployed yet)
      try {
        const streakData = await getWorkoutStreak();
        if (streakData) {
          setStats({
            totalWorkouts: streakData.total_workouts || 0,
            setsDone: streakData.total_sets || 0,
            dayStreak: streakData.day_streak || 0,
          });
        }
      } catch (streakError) {
        // Don't show error for 401 — fetchWithAuth handles the redirect
        if (!streakError.message?.includes("Session expired")) {
          console.log("Streak endpoint not available yet:", streakError.message);
        }
        // Keep default stats (0 values) if endpoint not deployed or auth fails
      }
    } catch (e) {
      // Don't show error for 401 — fetchWithAuth handles the redirect
      if (!e.message?.includes("Session expired")) {
        console.error("Failed to load data:", e.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const getCurrentDate = () => {
    const date = new Date();
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const handleStartEmptyWorkout = async () => {
    try {
      const log = await startWorkout("My Workout", null, false);
      setWorkoutActive(log);
      router.push("/activeWorkout");
    } catch (e) {
      console.error("Failed to start workout:", e.message);
      Alert.alert("Error", "Failed to start workout. Please try again.");
    }
  };

  const handleStartRoutine = async (routineId, routineName) => {
    try {
      const log = await startWorkout(routineName, routineId, false);
      setWorkoutActive(log);
      router.push("/activeWorkout");
    } catch (e) {
      console.error("Failed to start routine:", e.message);
      Alert.alert("Error", "Failed to start routine. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
        <Text style={styles.dateText}>{getCurrentDate()}</Text>
        <Text style={styles.titleText}>MY WORKOUTS</Text>
      </View>

      {/* Stats Bubble */}
      <View style={styles.statsContainer}>
        <View style={styles.statBubble}>
          <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
          <Text style={styles.statLabel}>Workouts</Text>
        </View>
        <View style={styles.statBubble}>
          <Text style={styles.statValue}>{stats.setsDone}</Text>
          <Text style={styles.statLabel}>Sets Done</Text>
        </View>
        <View style={styles.statBubble}>
          <Text style={styles.statValue}>{stats.dayStreak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
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
          <Text style={styles.quickStartSubtitle}>Find programs</Text>
        </Pressable>
      </View>

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
                <Text style={styles.routineExercises}>
                  {routine.exercises?.length || 0} exercises
                </Text>
              </View>
              <View style={styles.routineActions}>
                <Pressable 
                  style={styles.editButton}
                  onPress={() => router.push({ pathname: "/create-routine", params: { routineId: routine.id } })}
                >
                  <Ionicons name="pencil" size={16} color={colors.textSecondary} />
                </Pressable>
                <Pressable 
                  style={styles.startButton}
                  onPress={() => handleStartRoutine(routine.id, routine.name)}
                >
                  <Text style={styles.startButtonText}>Start</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>
      </ScrollView>

      {/* Add Routine Button - Fixed above bottom nav */}
      <Pressable 
        style={[styles.addRoutineButton, { bottom: 60 + insets.bottom + 12 }]}
        onPress={() => router.push("/create-routine")}
      >
        <Text style={styles.addRoutineButtonText}>+ Add Routine</Text>
      </Pressable>
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
  statsContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
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
  routineExercises: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  routineActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editButton: {
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
    position: "absolute",
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    zIndex: 100,
    elevation: 5,
  },
  addRoutineButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});