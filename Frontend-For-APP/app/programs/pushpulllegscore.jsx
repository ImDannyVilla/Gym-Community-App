import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../lib/theme";
import { API_BASE_URL } from "../../lib/api";
import { saveSeededWorkoutAsRoutine } from "../../lib/workoutApi";

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams();
  const [workout, setWorkout] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      fetchWorkoutDetail();
    }
  }, [id]);

  const fetchWorkoutDetail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch from public endpoint (no auth required)
      const response = await fetch(`${API_BASE_URL}/workouts/seeded/${id}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch workout details");
      }

      const data = await response.json();
      setWorkout(data);
    } catch (e) {
      console.error("Failed to load workout details:", e.message);
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Workout Detail</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading workout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !workout) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Workout Detail</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.border} />
          <Text style={styles.errorText}>Failed to load workout</Text>
          <Text style={styles.errorSubtext}>{error || "Workout not found"}</Text>
          <Pressable style={styles.retryButton} onPress={fetchWorkoutDetail}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const handleSaveRoutine = async () => {
    try {
      await saveSeededWorkoutAsRoutine(id);
      Alert.alert(
        "Success",
        `"${workout.name}" has been saved to your routines!`,
        [
          { text: "View Routines", onPress: () => router.push("/(tabs)/workouts") },
          { text: "OK", style: "cancel" }
        ]
      );
    } catch (error) {
      console.error("Failed to save routine:", error);
      Alert.alert("Error", "Failed to save routine. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Workout Detail</Text>
        <Pressable style={styles.bookmarkButton} onPress={handleSaveRoutine}>
          <Ionicons name="bookmark-outline" size={24} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        {workout.cover_image_url ? (
          <Image
            source={{ uri: workout.cover_image_url }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.coverImage, styles.placeholderCover]}>
            <Ionicons name="barbell-outline" size={64} color={colors.border} />
          </View>
        )}

        {/* Workout Info */}
        <View style={styles.infoSection}>
          <Text style={styles.workoutTitle}>{workout.name}</Text>
          <Text style={styles.workoutDescription}>
            {workout.description || "No description available"}
          </Text>

          {/* Tags */}
          <View style={styles.tagsContainer}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{workout.category}</Text>
            </View>
            <View style={[styles.tag, styles.tagSecondary]}>
              <Text style={[styles.tagText, styles.tagTextSecondary]}>
                {workout.difficulty}
              </Text>
            </View>
            <View style={[styles.tag, styles.tagSecondary]}>
              <Text style={[styles.tagText, styles.tagTextSecondary]}>
                {workout.duration_minutes} min
              </Text>
            </View>
            <View style={[styles.tag, styles.tagSecondary]}>
              <Text style={[styles.tagText, styles.tagTextSecondary]}>
                {workout.exercises?.length || 0} exercises
              </Text>
            </View>
          </View>
        </View>

        {/* Exercises List */}
        <View style={styles.exercisesSection}>
          <Text style={styles.sectionTitle}>Exercises</Text>
          {workout.exercises && workout.exercises.length > 0 ? (
            workout.exercises
              .sort((a, b) => a.order - b.order)
              .map((exercise, index) => (
                <View key={exercise.id} style={styles.exerciseCard}>
                  {/* Exercise Header */}
                  <View style={styles.exerciseHeader}>
                    <View style={styles.exerciseNumber}>
                      <Text style={styles.exerciseNumberText}>{exercise.order}</Text>
                    </View>
                    <View style={styles.exerciseHeaderInfo}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <View style={styles.exerciseMetaTags}>
                        {exercise.category && (
                          <Text style={styles.exerciseMetaText}>{exercise.category}</Text>
                        )}
                        {exercise.target && (
                          <>
                            <Text style={styles.exerciseMetaDot}>•</Text>
                            <Text style={styles.exerciseMetaText}>{exercise.target}</Text>
                          </>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Exercise GIF */}
                  {exercise.gif_url && (
                    <Image
                      source={{ uri: exercise.gif_url }}
                      style={styles.exerciseGif}
                      resizeMode="cover"
                    />
                  )}

                  {/* Exercise Details */}
                  <View style={styles.exerciseDetails}>
                    <View style={styles.exerciseDetailRow}>
                      <View style={styles.exerciseDetailItem}>
                        <Ionicons name="repeat-outline" size={16} color={colors.primary} />
                        <Text style={styles.exerciseDetailLabel}>Sets</Text>
                        <Text style={styles.exerciseDetailValue}>{exercise.sets || "—"}</Text>
                      </View>
                      <View style={styles.exerciseDetailItem}>
                        <Ionicons name="fitness-outline" size={16} color={colors.primary} />
                        <Text style={styles.exerciseDetailLabel}>Reps</Text>
                        <Text style={styles.exerciseDetailValue}>{exercise.reps || "—"}</Text>
                      </View>
                      <View style={styles.exerciseDetailItem}>
                        <Ionicons name="time-outline" size={16} color={colors.primary} />
                        <Text style={styles.exerciseDetailLabel}>Rest</Text>
                        <Text style={styles.exerciseDetailValue}>
                          {exercise.rest_period_seconds ? `${exercise.rest_period_seconds}s` : "—"}
                        </Text>
                      </View>
                    </View>

                    {/* Notes */}
                    {exercise.notes && (
                      <View style={styles.notesContainer}>
                        <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
                        <Text style={styles.notesText}>{exercise.notes}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
          ) : (
            <View style={styles.emptyExercises}>
              <Ionicons name="barbell-outline" size={32} color={colors.border} />
              <Text style={styles.emptyText}>No exercises in this workout</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Button */}
      <View style={styles.bottomAction}>
        <Pressable style={styles.saveButton} onPress={handleSaveRoutine}>
          <Text style={styles.saveButtonText}>Save Program</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.text,
  },
  bookmarkButton: {
    padding: 4,
  },
  placeholder: {
    width: 32,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 12,
  },
  errorSubtext: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 32,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 16,
  },
  retryButtonText: {
    color: "#000",
    fontSize: 13,
    fontWeight: "800",
  },
  content: {
    flex: 1,
  },
  coverImage: {
    width: "100%",
    height: 200,
    backgroundColor: colors.card,
  },
  placeholderCover: {
    alignItems: "center",
    justifyContent: "center",
  },
  infoSection: {
    padding: 16,
  },
  workoutTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: 1,
    lineHeight: 32,
    marginBottom: 8,
  },
  workoutDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  tag: {
    backgroundColor: `${colors.primary}18`,
    borderWidth: 1,
    borderColor: `${colors.primary}40`,
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  tagSecondary: {
    backgroundColor: `${colors.textSecondary}18`,
    borderColor: `${colors.textSecondary}40`,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
  },
  tagTextSecondary: {
    color: colors.textSecondary,
  },
  exercisesSection: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  exerciseCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    marginBottom: 10,
    overflow: "hidden",
  },
  exerciseHeader: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: "center",
  },
  exerciseNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  exerciseNumberText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  exerciseHeaderInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.primary,
    marginBottom: 2,
  },
  exerciseMetaTags: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  exerciseMetaText: {
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: "capitalize",
  },
  exerciseMetaDot: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  exerciseGif: {
    width: "100%",
    height: 200,
    backgroundColor: colors.card,
  },
  exerciseDetails: {
    padding: 12,
  },
  exerciseDetailRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  exerciseDetailItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  exerciseDetailLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  exerciseDetailValue: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
  notesContainer: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 10,
    gap: 8,
    alignItems: "flex-start",
  },
  notesText: {
    flex: 1,
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  emptyExercises: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  bottomAction: {
    padding: 12,
    paddingBottom: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
