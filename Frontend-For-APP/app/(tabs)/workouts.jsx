import React, { useState, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, FlatList, ScrollView, Image } from "react-native";
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { colors, layout, spacing } from "../../lib/theme";
import Header from "../_components/Header";
import { API_BASE_URL } from "../../lib/api";

const TABS = [
  { key: "muscleGroups", label: "Muscle Groups" },
  { key: "history", label: "History" },
  { key: "explore", label: "Explore" },
];

const muscleGroups = [
  { id: 1, title: "Chest", route: "/programs/chest" },
  { id: 2, title: "Arms", route: "/programs/arms" },
  { id: 3, title: "Legs", route: "/programs/legs" },
  { id: 4, title: "Shoulders", route: "/programs/shoulders" },
  { id: 5, title: "Cardio", route: "/programs/cardio" },
];

const chestImage = require("../../assets/Chest.png");
const armsImage = require("../../assets/Arms.png");
const legsImage = require("../../assets/Legs.png");
const shouldersImage = require("../../assets/Shoulders.png");
const cardioImage = require("../../assets/Cardio.png");
const workoutsImage = require("../../assets/workouts_clean.png");

const muscleImages = {
  Chest: chestImage,
  Arms: armsImage,
  Legs: legsImage,
  Shoulders: shouldersImage,
  Cardio: cardioImage,
  Workouts: workoutsImage,
};

const getMuscleImage = (title) => muscleImages[title] || chestImage;

export default function WorkoutsScreen() {
  const [activeTab, setActiveTab] = useState("muscleGroups");
  const [workouts, setWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exploreWorkouts, setExploreWorkouts] = useState([]);
  const [exploreLoading, setExploreLoading] = useState(true);
  const [exploreError, setExploreError] = useState("");

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

  const fetchExploreWorkouts = useCallback(async () => {
    if (exploreLoading) return;
    setExploreLoading(true);
    setExploreError("");
    
    const timeoutId = setTimeout(() => {
      if (exploreLoading) {
        setExploreError("Server took too long. Try again.");
        setExploreLoading(false);
      }
    }, 10000);
    
    try {
      const controller = new AbortController();
      const signal = controller.signal;
      
      const response = await fetch(`${API_BASE_URL}/workouts/`, {
        signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        setExploreWorkouts(data);
      } else {
        setExploreError("Failed to load workouts");
      }
    } catch (e) {
      if (e.name === 'AbortError') {
        setExploreError("Request timed out");
      } else {
        setExploreError("Could not connect to server");
      }
    } finally {
      setExploreLoading(false);
    }
  }, [exploreLoading]);

  useEffect(() => {
    if (activeTab === "explore") {
      fetchExploreWorkouts();
    }
  }, [activeTab]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    return `${m} min`;
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const renderMuscleGroups = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
      <View style={styles.muscleGrid}>
        {muscleGroups.map((muscle) => (
          <Pressable
            key={muscle.id}
            style={styles.muscleItem}
            onPress={() => router.push(muscle.route)}
          >
            <View style={styles.muscleCard}>
              <Image 
                source={getMuscleImage(muscle.title)} 
                style={styles.muscleImage}
                resizeMode="cover"
              />
              <View style={styles.muscleTextContainer}>
                <Text style={styles.muscleTitle}>{muscle.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );

  const renderHistory = () => (
    <View style={styles.content}>
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
  );

  const renderExplore = () => {
    if (exploreLoading) {
      return (
        <View style={styles.exploreContainer}>
          <View style={styles.exploreEmpty}>
            <Text style={styles.emptyText}>Loading...</Text>
          </View>
        </View>
      );
    }

    if (exploreError) {
      return (
        <View style={styles.exploreContainer}>
          <View style={styles.exploreEmpty}>
            <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
            <Text style={styles.emptyText}>{exploreError}</Text>
            <Pressable onPress={fetchExploreWorkouts} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Tap to retry</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    if (exploreWorkouts.length === 0) {
      return (
        <View style={styles.exploreContainer}>
          <View style={styles.exploreEmpty}>
            <Ionicons name="compass-outline" size={64} color={colors.border} />
            <Text style={styles.emptyText}>No Programs Available</Text>
            <Text style={styles.emptySubtext}>Check back later for new workouts!</Text>
          </View>
        </View>
      );
    }

    return (
      <FlatList
        data={exploreWorkouts}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.exploreList}
        renderItem={({ item }) => (
          <Pressable style={styles.exploreCard} onPress={() => router.push(`/programs/${item.category.toLowerCase()}`)}>
            <View style={styles.exploreCardHeader}>
              <Text style={styles.exploreCardTitle}>{item.name}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </View>
            <View style={styles.exploreCardInfo}>
              <View style={styles.exploreChip}>
                <Text style={styles.exploreChipText}>{item.category}</Text>
              </View>
              <View style={styles.exploreChip}>
                <Text style={styles.exploreChipText}>{item.difficulty}</Text>
              </View>
              {item.duration_minutes && (
                <View style={styles.exploreChip}>
                  <Text style={styles.exploreChipText}>{item.duration_minutes} min</Text>
                </View>
              )}
            </View>
            {item.description && (
              <Text style={styles.exploreCardDesc} numberOfLines={2}>{item.description}</Text>
            )}
          </Pressable>
        )}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Workouts" />
      
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {activeTab === "muscleGroups" && renderMuscleGroups()}
      {activeTab === "history" && renderHistory()}
      {activeTab === "explore" && renderExplore()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textTertiary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
  },
  scrollView: {
    flex: 1,
  },
  muscleGrid: {
    padding: layout.screenPadding,
    gap: spacing.md,
  },
  muscleItem: {
    marginBottom: spacing.md,
  },
  muscleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.sm,
    paddingLeft: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  muscleImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  muscleTextContainer: {
    flex: 1,
    paddingLeft: spacing.md,
  },
  muscleTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
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
    paddingBottom: layout.bottomSafeArea + 80,
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
  exploreContainer: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
  },
  exploreEmpty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  exploreList: {
    paddingTop: spacing.md,
    paddingBottom: layout.bottomSafeArea + 80,
  },
  exploreCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exploreCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  exploreCardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    flex: 1,
  },
  exploreCardInfo: {
    flexDirection: "row",
    marginBottom: spacing.sm,
  },
  exploreChip: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  exploreChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  exploreCardDesc: {
    fontSize: 14,
    color: colors.textTertiary,
    lineHeight: 20,
  },
  retryButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.primary,
    fontWeight: "600",
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
    textAlign: "center",
  }
});