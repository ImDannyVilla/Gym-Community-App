import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, layout, spacing } from "../lib/theme";
import Header from "./_components/Header";
import { getWorkoutLog } from "../lib/workoutApi";
 
const formatDateTime = (isoString) => {
    if (!isoString) return "--";
    const date = new Date(isoString);
    return date.toLocaleString("en-US", {
        weekday: "short", month: "short", day: "numeric",
        hour: "numeric", minute: "2-digit",
    });
};
 
const formatDuration = (seconds) => {
    if (!seconds) return "--";
    const m = Math.floor(seconds / 60);
    const h = Math.floor(m / 60);
    return h > 0 ? `${h}h ${m % 60}m` : `${m} min`;
};
 
export default function WorkoutDetail() {
    const { logId } = useLocalSearchParams();
    const router = useRouter();
    const [log, setLog] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
 
    useEffect(() => {
        const fetchLog = async () => {
            try {
                setIsLoading(true);
                const data = await getWorkoutLog(logId);
                setLog(data);
            } catch (e) {
                setError("Failed to load workout details.");
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        if (logId) fetchLog();
    }, [logId]);
 
    const backButton = (
        <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
    );
 
    if (isLoading) {
        return (
            <View style={styles.container}>
                <Header title="Workout Details" rightComponent={backButton} />
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </View>
        );
    }
 
    if (error || !log) {
        return (
            <View style={styles.container}>
                <Header title="Workout Details" rightComponent={backButton} />
                <View style={styles.centered}>
                    <Text style={styles.emptyText}>{error || "Workout not found."}</Text>
                </View>
            </View>
        );
    }
 
    const completedExercises = (log.exercises || []).filter(ex =>
        ex.sets?.some(set => set.completed)
    );
 
    const totalSets = completedExercises.reduce((total, ex) =>
        total + (ex.sets || []).filter(s => s.completed).length, 0
    );
 
    const totalVolume = completedExercises.reduce((total, ex) =>
        total + (ex.sets || []).filter(s => s.completed).reduce((t, s) =>
            t + ((s.weight_lbs || 0) * (s.reps || 0)), 0
        ), 0
    );
 
    return (
        <View style={styles.container}>
            <Header
                title={log.name || "Workout"}
                subtitle={formatDateTime(log.completed_at || log.started_at)}
                rightComponent={backButton}
            />
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Summary Card */}
                <View style={styles.summaryCard}>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Ionicons name="time-outline" size={18} color={colors.primary} />
                            <Text style={styles.statValue}>{formatDuration(log.duration)}</Text>
                            <Text style={styles.statLabel}>Duration</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Ionicons name="barbell-outline" size={18} color={colors.primary} />
                            <Text style={styles.statValue}>{completedExercises.length}</Text>
                            <Text style={styles.statLabel}>Exercises</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Ionicons name="layers-outline" size={18} color={colors.primary} />
                            <Text style={styles.statValue}>{totalSets}</Text>
                            <Text style={styles.statLabel}>Sets</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Ionicons name="trending-up-outline" size={18} color={colors.primary} />
                            <Text style={styles.statValue}>
                                {totalVolume > 0 ? totalVolume.toLocaleString() : "--"}
                            </Text>
                            <Text style={styles.statLabel}>Vol (lbs)</Text>
                        </View>
                    </View>
                </View>
 
                {/* Exercise Cards */}
                <Text style={styles.sectionTitle}>Exercises</Text>
 
                {completedExercises.length === 0 ? (
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>No completed exercises recorded.</Text>
                    </View>
                ) : (
                    <View style={styles.grid}>
                        {completedExercises.map((exercise, index) => {
                            const completedSets = (exercise.sets || []).filter(s => s.completed);
                            const heaviestSet = completedSets.reduce(
                                (best, s) => (s.weight_lbs || 0) > (best.weight_lbs || 0) ? s : best,
                                completedSets[0] || {}
                            );
                            const oneRepMax = heaviestSet.weight_lbs && heaviestSet.reps ? Math.round(heaviestSet.weight_lbs * (1 + heaviestSet.reps / 30)) : null;
 
                            return (
                                <View key={exercise.id || index} style={styles.workoutCard}>
                                    <Text style={styles.workoutTitle}>{exercise.name}</Text>
                                    <Text style={styles.workoutInfo}>
                                        {[exercise.category, exercise.target, exercise.equipment]
                                            .filter(Boolean).join(" • ")}
                                    </Text>
 
                                    {/* Best Set Highlight */}
                                    {oneRepMax && (
                                        <View style={styles.oneRmRow}>
                                        <Ionicons name="stats-chart-outline" size={13} color={colors.primary} />
                                        <Text style={styles.oneRmText}>Est. 1RM: {oneRepMax} lbs</Text>
                                        </View>
                                    )}
 
                                    {/* Sets Table Header */}
                                    <View style={styles.tableHeader}>
                                        <Text style={[styles.tableHeaderText, { flex: 0.6 }]}>SET</Text>
                                        <Text style={[styles.tableHeaderText, { flex: 1.5 }]}>WEIGHT</Text>
                                        <Text style={[styles.tableHeaderText, { flex: 1 }]}>REPS</Text>
                                        <Text style={[styles.tableHeaderText, { flex: 1 }]}>VOLUME</Text>
                                    </View>
 
                                    {/* Sets Rows */}
                                    {completedSets.map((set, si) => (
                                        <View
                                            key={set.id || si}
                                            style={[
                                                styles.tableRow,
                                                si === completedSets.length - 1 && styles.tableRowLast,
                                            ]}
                                        >
                                            <Text style={[styles.tableCell, styles.tableCellMuted, { flex: 0.6 }]}>
                                                {set.set_number || si + 1}
                                            </Text>
                                            <Text style={[styles.tableCell, { flex: 1.5 }]}>
                                                {set.weight_lbs ? `${set.weight_lbs} lbs` : "Bodyweight"}
                                            </Text>
                                            <Text style={[styles.tableCell, { flex: 1 }]}>
                                                {set.reps ?? "--"}
                                            </Text>
                                            <Text style={[styles.tableCell, styles.tableCellMuted, { flex: 1 }]}>
                                                {set.weight_lbs && set.reps
                                                    ? (set.weight_lbs * set.reps).toLocaleString()
                                                    : "--"}
                                            </Text>
                                        </View>
                                    ))}
 
                                    {/* Totals footer */}
                                    <View style={styles.totalsRow}>
                                        <Text style={styles.totalsLabel}>
                                            {completedSets.length} set{completedSets.length !== 1 ? "s" : ""} completed
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
 
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollView: { flex: 1 },
    scrollContent: {
        paddingHorizontal: layout.screenPadding,
        paddingBottom: layout.bottomSafeArea + 40,
    },
    centered: { flex: 1, justifyContent: "center", alignItems: "center", marginTop: 60 },
 
    backButton: {
        padding: 4,
    },
 
    // Summary card
    summaryCard: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
    },
    statItem: { alignItems: "center", flex: 1, gap: 3 },
    statValue: { fontSize: 18, fontWeight: "bold", color: colors.text },
    statLabel: {
        fontSize: 10,
        color: colors.textSecondary,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    statDivider: { width: 1, height: 40, backgroundColor: colors.border },
 
    // Section title
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: colors.text,
        marginBottom: spacing.md,
    },
 
    // Exercise cards
    grid: { gap: spacing.md },
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
        textTransform: "capitalize",
    },
 
    // One Rep Max
    oneRmRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: spacing.sm,
    marginTop: 2,
},
oneRmText: { fontSize: 12, color: colors.primary, fontWeight: "600" },
 
    // Sets table
    tableHeader: {
        flexDirection: "row",
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        marginTop: spacing.xs,
    },
    tableHeaderText: {
        fontSize: 10,
        fontWeight: "700",
        color: colors.textSecondary,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    tableRow: {
        flexDirection: "row",
        paddingVertical: 9,
        borderBottomWidth: 1,
        borderBottomColor: colors.border + "55",
    },
    tableRowLast: { borderBottomWidth: 0 },
    tableCell: { fontSize: 14, color: colors.text },
    tableCellMuted: { color: colors.textSecondary },
 
    // Totals footer
    totalsRow: {
        marginTop: spacing.sm,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    totalsLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: "500" },
 
    // Empty state
    empty: { alignItems: "center", marginTop: 40 },
    emptyText: { color: colors.textSecondary, fontSize: 16 },
});