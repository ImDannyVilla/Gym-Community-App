import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, layout } from "../lib/theme";
import { getExerciseHistory } from "../lib/workoutApi";

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
};

export default function ExerciseHistoryScreen() {
  const { exerciseId, exerciseName } = useLocalSearchParams();
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!exerciseId) {
      setIsLoading(false);
      return;
    }
    getExerciseHistory(exerciseId)
      .then(setSessions)
      .catch((err) => {
        if (err.status !== 404) console.warn("Failed to load exercise history:", err.message);
        // 404 = no history yet — sessions stays [] and shows "No history yet"
      })
      .finally(() => setIsLoading(false));
  }, [exerciseId]);

  const renderSession = ({ item, index }) => (
    <View style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionDate}>{formatDate(item.last_performed)}</Text>
        <Text style={styles.sessionCount}>{item.sets?.length ?? 0} sets</Text>
      </View>
      {item.sets?.map((set, i) => (
        <View key={set.id || i} style={styles.setRow}>
          <Text style={styles.setLabel}>Set {set.set_number ?? i + 1}</Text>
          <Text style={styles.setDetail}>{set.reps ?? 0} reps</Text>
          <Text style={styles.setDetail}>{set.weight_lbs ?? 0} lb</Text>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{exerciseName || "History"}</Text>
        <View style={styles.placeholder} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="barbell-outline" size={48} color={colors.border} />
          <Text style={styles.emptyTitle}>No history yet</Text>
          <Text style={styles.emptyText}>Log this exercise in a workout to start tracking it.</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderSession}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: "900", color: colors.text, flex: 1, textAlign: "center", marginHorizontal: 8 },
  placeholder: { width: 32 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.lg },
  emptyTitle: { fontSize: 18, fontWeight: "bold", color: colors.textSecondary, marginTop: spacing.md },
  emptyText: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.xs, textAlign: "center" },
  list: { padding: 16, paddingBottom: 40 },
  sessionCard: {
    backgroundColor: colors.surface,
    borderRadius: layout.borderRadius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sessionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  sessionDate: { fontSize: 15, fontWeight: "700", color: colors.text },
  sessionCount: { fontSize: 12, color: colors.textSecondary },
  setRow: { flexDirection: "row", gap: 16, paddingVertical: 4, borderTopWidth: 1, borderTopColor: colors.border },
  setLabel: { fontSize: 13, color: colors.textSecondary, width: 44 },
  setDetail: { fontSize: 13, color: colors.text, fontWeight: "600" },
});
