import React, { useState, useEffect, memo } from "react";
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator, TextInput } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../lib/theme";
import { API_BASE_URL } from "../lib/api";

// Map workout names to local assets
const WORKOUT_COVERS = {
  'Push Day': require('../assets/workout_covers/Push.png'),
  'Pull Day': require('../assets/workout_covers/Pull.png'),
  'Leg Day': require('../assets/workout_covers/Legs.png'),
  'Upper Body': require('../assets/workout_covers/Upper Body.png'),
  'Lower Body': require('../assets/workout_covers/Lower Body.png'),
  'Chest & Triceps': require('../assets/workout_covers/Chest and Triceps.png'),
  'Back & Biceps': require('../assets/workout_covers/Back and Biceps.png'),
  'Shoulders & Arms': require('../assets/workout_covers/Arms and Delts.png'),
  'Core & Abs': require('../assets/workout_covers/Core and Abs.png'),
};

const WorkoutCard = memo(({ item, onPress }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <View style={styles.workoutCard}>
      <Pressable style={styles.workoutCardContent} onPress={onPress}>
        <View style={styles.imageContainer}>
          {!imageLoaded && <View style={[styles.workoutImage, styles.imageSkeleton]} />}
          <Image
            source={WORKOUT_COVERS[item.name] || { uri: item.cover_image_url }}
            style={[styles.workoutImage, !imageLoaded && styles.imageHidden]}
            contentFit="cover"
            transition={150}
            onLoad={() => setImageLoaded(true)}
          />
        </View>
        <View style={styles.workoutInfo}>
          <Text style={styles.workoutName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.workoutMeta}>{item.difficulty} · {item.duration_minutes} min</Text>
        </View>
      </Pressable>
    </View>
  );
});

export default function ExploreScreen() {
  const [workouts, setWorkouts] = useState([]);
  const [allWorkouts, setAllWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchSeededWorkouts();
  }, []);

  useEffect(() => {
    // Filter workouts based on search query
    if (searchQuery.trim() === "") {
      setWorkouts(allWorkouts);
    } else {
      const filtered = allWorkouts.filter((workout) => {
        const query = searchQuery.toLowerCase();
        return (
          workout.name.toLowerCase().includes(query) ||
          workout.category.toLowerCase().includes(query) ||
          workout.difficulty.toLowerCase().includes(query) ||
          (workout.description && workout.description.toLowerCase().includes(query))
        );
      });
      setWorkouts(filtered);
    }
  }, [searchQuery, allWorkouts]);

  const fetchSeededWorkouts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch from public endpoint (no auth required)
      const response = await fetch(`${API_BASE_URL}/workouts/seeded`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch workouts");
      }

      const data = await response.json();
      setAllWorkouts(data);
      setWorkouts(data);
    } catch (e) {
      console.error("Failed to load seeded workouts:", e.message);
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkoutPress = (workoutId) => {
    router.push(`/programs/pushpulllegscore?id=${workoutId}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Explore Workouts</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search workouts..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading workouts...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.border} />
          <Text style={styles.errorText}>Failed to load workouts</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={fetchSeededWorkouts}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      ) : workouts.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="search-outline" size={48} color={colors.border} />
          <Text style={styles.emptyText}>No workouts found</Text>
          <Text style={styles.emptySubtext}>Try a different search</Text>
        </View>
      ) : (
        <FlatList
          data={workouts}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={9}
          renderItem={({ item }) => (
            <WorkoutCard item={item} onPress={() => handleWorkoutPress(item.id)} />
          )}
          keyExtractor={(item) => item.id}
        />
      )}
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
    fontSize: 32,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: 1,
    lineHeight: 32,
  },
  placeholder: {
    width: 32,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    padding: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
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
  listContent: {
    paddingBottom: 100,
    paddingTop: 16,
  },
  workoutCard: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 16,
    marginBottom: 12,
    height: 120,
    flexDirection: "column",
  },
  workoutCardContent: {
    flexDirection: "row",
    flex: 1,
  },
  imageContainer: {
    width: 120,
    height: 120,
    position: 'relative',
  },
  workoutImage: {
    width: 120,
    height: 120,
    backgroundColor: colors.card,
  },
  imageSkeleton: {
    backgroundColor: '#1a1a1a',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  imageHidden: {
    opacity: 0,
  },
  workoutInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  workoutName: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 4,
  },
  workoutMeta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
