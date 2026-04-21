import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, layout, spacing } from "../../lib/theme";
import Header from "../_components/Header";
import { getSeededWorkouts } from "../../lib/workoutApi";

export default function Chest() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChestWorkouts();
  }, []);

  const fetchChestWorkouts = async () => {
    try {
      const data = await getSeededWorkouts("Chest");
      setWorkouts(data || []);
    } catch (e) {
      console.error("Failed to load chest workouts:", e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartWorkout = (workout) => {
    router.push({
      pathname: "/activeWorkout",
      params: { routineId: workout.id, name: workout.name }
    });
  };

  return (
    <View style={styles.container}>
      <Header title="Chest Workouts" showBack={true} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : workouts.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No chest workouts available</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {workouts.map((workout) => (
              <Pressable 
                key={workout.id} 
                style={styles.workoutCard}
                onPress={() => handleStartWorkout(workout)}
              >
                <Text style={styles.workoutTitle}>{workout.name}</Text>
                <Text style={styles.workoutInfo}>{workout.difficulty} • {workout.duration_minutes} min</Text>
                {workout.description && (
                  <Text style={styles.workoutDesc} numberOfLines={2}>{workout.description}</Text>
                )}
                <View style={styles.startRow}>
                  <Text style={styles.startText}>Start Workout</Text>
                  <Ionicons name="play-circle" size={20} color={colors.primary} />
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: layout.bottomSafeArea,
  },
  grid: {
    gap: spacing.md,
  },
  workoutCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  workoutInfo: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  workoutDesc: {
    fontSize: 14,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  startRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  startText: {
    color: colors.primary,
    fontWeight: "bold",
    marginRight: spacing.xs,
  },
  loadingText: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 40,
  },
  empty: {
    alignItems: "center",
    marginTop: 40,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
});
