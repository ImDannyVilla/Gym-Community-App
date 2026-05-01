import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../lib/theme";
import { getExerciseHistory, searchExercises } from "../lib/workoutApi";

export default function ExerciseDetailScreen() {
  const params = useLocalSearchParams();
  const [exercise, setExercise] = useState(null);
  const [history, setHistory] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const fallbackExercise = useMemo(() => ({
    name: params.name || "Exercise",
    category: params.category || null,
    target: params.target || null,
    equipment: params.equipment || null,
    gif_url: params.gifUrl || null,
    instructions: params.instructions || null,
    secondary_muscles: params.secondaryMuscles || null,
  }), [params]);

  useEffect(() => {
    loadExerciseDetails();
    loadExerciseHistory();
  }, [params.exerciseId, params.name]);

  const loadExerciseDetails = async () => {
    setIsLoadingDetails(true);
    try {
      const results = await searchExercises(params.name || "", null, null, null, 10);
      const matched = results.find((item) => item.exercise_id === params.exerciseId) || results[0];
      setExercise(matched || fallbackExercise);
    } catch (error) {
      console.error("Failed to load exercise details:", error);
      setExercise(fallbackExercise);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const loadExerciseHistory = async () => {
    if (!params.exerciseId) {
      setIsLoadingHistory(false);
      return;
    }

    setIsLoadingHistory(true);
    try {
      const data = await getExerciseHistory(params.exerciseId);
      setHistory(data);
    } catch (error) {
      if (error.status !== 404) console.warn("Failed to load exercise history:", error.message);
      setHistory(null);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const latestSession = history?.[0] ?? null;

  const bestSet = useMemo(() => {
    if (!latestSession?.sets?.length) return null;
    return latestSession.sets.reduce((best, set) => {
      const bestWeight = Number(best.weight_lbs || best.weight || 0);
      const setWeight = Number(set.weight_lbs || set.weight || 0);
      const bestReps = Number(best.reps || 0);
      const setReps = Number(set.reps || 0);
      if (setWeight > bestWeight) return set;
      if (setWeight === bestWeight && setReps > bestReps) return set;
      return best;
    }, latestSession.sets[0]);
  }, [latestSession]);

  const currentExercise = exercise || fallbackExercise;
  const instructionLines = currentExercise.instructions
    ? String(currentExercise.instructions).split(/\n|\. /).filter(Boolean)
    : [];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Exercise Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {currentExercise.gif_url ? (
          <Image source={{ uri: currentExercise.gif_url }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={[styles.heroImage, styles.placeholderImage]}>
            <Ionicons name="barbell-outline" size={56} color={colors.border} />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.title}>{currentExercise.name}</Text>
          <Text style={styles.summary}>
            {currentExercise.target || "Full body"} exercise using {currentExercise.equipment || "available equipment"}.
          </Text>
          <View style={styles.tagsContainer}>
            {[currentExercise.category, currentExercise.target, currentExercise.equipment].filter(Boolean).map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Best</Text>
          {isLoadingHistory ? (
            <ActivityIndicator color={colors.primary} />
          ) : bestSet ? (
            <View style={styles.recordCard}>
              <Text style={styles.recordValue}>{bestSet.weight_lbs || bestSet.weight || 0} lb × {bestSet.reps || 0}</Text>
              <Text style={styles.recordLabel}>Best set from your latest logged session</Text>
            </View>
          ) : (
            <Text style={styles.emptyText}>No personal record yet. Log this exercise in a workout to start tracking it.</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Exercise History</Text>
            {history?.length > 0 && (
              <Pressable onPress={() => router.push({ pathname: "/exercise-history", params: { exerciseId: params.exerciseId, exerciseName: currentExercise.name } })}>
                <Text style={styles.viewAllLink}>View All →</Text>
              </Pressable>
            )}
          </View>
          {latestSession ? (
            <View style={styles.historyCard}>
              <Text style={styles.historyTitle}>Last performed</Text>
              <Text style={styles.historyDate}>{new Date(latestSession.last_performed).toLocaleDateString()}</Text>
              {latestSession.sets?.map((set, index) => (
                <Text key={set.id || index} style={styles.setText}>
                  Set {index + 1}: {set.reps || 0} reps · {set.weight_lbs || set.weight || 0} lb
                </Text>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No history found for this exercise yet.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to perform</Text>
          {isLoadingDetails ? (
            <ActivityIndicator color={colors.primary} />
          ) : instructionLines.length > 0 ? (
            instructionLines.map((line, index) => (
              <Text key={`${line}-${index}`} style={styles.instructionText}>{index + 1}. {line.trim()}</Text>
            ))
          ) : (
            <Text style={styles.emptyText}>No instructions available for this exercise.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: "900", color: colors.text },
  placeholder: { width: 32 },
  content: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  heroImage: { width: "100%", height: 220, backgroundColor: colors.card },
  placeholderImage: { alignItems: "center", justifyContent: "center" },
  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 28, fontWeight: "900", color: colors.text, marginBottom: 8 },
  summary: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: 12, textTransform: "capitalize" },
  tagsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { backgroundColor: `${colors.primary}18`, borderWidth: 1, borderColor: `${colors.primary}40`, borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10 },
  tagText: { color: colors.primary, fontSize: 11, fontWeight: "800", textTransform: "capitalize" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: "800", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 1.4 },
  viewAllLink: { fontSize: 13, fontWeight: "700", color: colors.primary },
  recordCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14 },
  recordValue: { fontSize: 22, fontWeight: "900", color: colors.primary, marginBottom: 4 },
  recordLabel: { fontSize: 12, color: colors.textSecondary },
  historyCard: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14 },
  historyTitle: { fontSize: 12, color: colors.textSecondary, marginBottom: 3 },
  historyDate: { fontSize: 16, fontWeight: "800", color: colors.text, marginBottom: 10 },
  setText: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  instructionText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginBottom: 8 },
  emptyText: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
});