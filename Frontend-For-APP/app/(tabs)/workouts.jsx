import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, FlatList } from "react-native";
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { colors, layout, spacing } from "../../lib/theme";
import Header from "../_components/Header";

export default function WorkoutsHistory() {
  const [workouts, setWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWorkouts = async () => {
    try {
      const saved = await AsyncStorage.getItem("@gym_app_workouts");
      if (saved) {
        setWorkouts(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load workouts.");
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWorkouts();
    }, [])
  );

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    return `${m} min`;
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <View style={styles.container}>
      <Header title="My Workouts" />
      
      <View style={styles.content}>
        {/* Start Workout Button */}
        <Pressable 
          style={styles.startButton} 
          onPress={() => router.push("/activeWorkout")}
        >
          <Ionicons name="add-circle" size={24} color="white" />
          <Text style={styles.startButtonText}>Start Empty Workout</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>History</Text>

        {isLoading ? (
          <Text style={styles.emptyText}>Loading...</Text>
        ) : workouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="barbell-outline" size={64} color={colors.border} />
            <Text style={styles.emptyText}>No workouts logged yet.</Text>
            <Text style={styles.emptySubtext}>Time to hit the gym!</Text>
          </View>
        ) : (
          <FlatList
            data={workouts}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const totalSets = item.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
              const exerciseSummary = item.exercises.map(ex => ex.name).join(", ");
              
              return (
                <View style={styles.workoutCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.workoutName}>{item.name}</Text>
                    <Text style={styles.workoutDate}>{formatDate(item.date)}</Text>
                  </View>
                  
                  <View style={styles.cardStats}>
                    <View style={styles.statChip}>
                      <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.statText}>{formatTime(item.duration)}</Text>
                    </View>
                    <View style={styles.statChip}>
                      <Ionicons name="barbell-outline" size={14} color={colors.textSecondary} />
                      <Text style={styles.statText}>{totalSets} Sets</Text>
                    </View>
                  </View>

                  <Text style={styles.exerciseList} numberOfLines={2}>
                    {exerciseSummary}
                  </Text>
                </View>
              );
            }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
  },
  startButton: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.md,
  },
  listContent: {
    paddingBottom: layout.bottomSafeArea + 80, // Extra padding for BottomNav
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
  workoutName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
  },
  workoutDate: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  cardStats: {
    flexDirection: "row",
    marginBottom: spacing.sm,
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  statText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
    fontWeight: "500",
  },
  exerciseList: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textSecondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 8,
  }
});