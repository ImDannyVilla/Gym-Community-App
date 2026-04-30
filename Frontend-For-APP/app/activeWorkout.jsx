import React, { useState, useEffect, useCallback, memo, useMemo } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, FlatList, SafeAreaView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Modal from "react-native-modal";
import { colors, layout, typography, spacing } from "../lib/theme";
import { startWorkout, updateWorkoutLog, addExerciseToLog, deleteWorkoutLog, getExerciseHistory } from "../lib/workoutApi";
import { saveToCache, CACHE_KEYS } from "../lib/localCache";
import { useWorkoutStore } from "../stores/workoutStore";

const REST_TIMER_OPTIONS = [
  { label: "Off", value: 0 },
  { label: "30s", value: 30 },
  { label: "60s", value: 60 },
  { label: "90s", value: 90 },
  { label: "2 min", value: 120 },
  { label: "3 min", value: 180 },
];

const formatPreviousSet = (set) => {
  if (!set) return "—";
  const weight = set.weight_lbs ?? set.weight;
  const reps = set.reps;
  if ((weight === null || weight === undefined || weight === "") && !reps) return "—";
  return `${weight || 0} × ${reps || 0}`;
};

const hasSetInput = (value) => value !== null && value !== undefined && String(value).trim() !== "";

const normalizeCompletedSet = (set) => {
  const weightValue = set.weight ?? set.weight_lbs;

  if (!set.completed || !hasSetInput(weightValue) || !hasSetInput(set.reps)) {
    return null;
  }

  const reps = Number.parseInt(String(set.reps), 10);
  const weight_lbs = Number.parseFloat(String(weightValue));

  if (Number.isNaN(reps) || Number.isNaN(weight_lbs)) {
    return null;
  }

  return {
    reps,
    weight_lbs,
    completed: true,
  };
};

const getExerciseLibraryId = (exercise) => exercise.exercise_id || exercise.library_exercise_id || null;

// Memoized Set Row to prevent re-renders when other inputs change
const SetRow = memo(({ set, setIndex, exerciseId, exercise, previousSet, handleUpdateSet, handleToggleComplete, handleSetOptions }) => {
  const targetReps = exercise.target_reps_min === exercise.target_reps_max
    ? `${exercise.target_reps_min}`
    : `${exercise.target_reps_min}-${exercise.target_reps_max}`;

  return (
    <View style={[styles.setRow, set.completed && styles.setRowCompleted]}>
      <Pressable style={styles.setIndexButton} onPress={() => handleSetOptions(exerciseId, set.id, set)}>
        <Text style={[styles.setIndex, set.warmup && styles.setIndexWarmup]}>{set.warmup ? "W" : setIndex + 1}</Text>
      </Pressable>
      
      <View style={styles.targetHintContainer}>
        <Text style={styles.targetHintText}>
          {exercise.target_reps_min ? `${targetReps}` : formatPreviousSet(previousSet)}
        </Text>
      </View>

      <TextInput
        style={[styles.inputBox, set.completed && styles.inputBoxCompleted]}
        keyboardType="decimal-pad"
        value={set.weight_lbs > 0 ? set.weight_lbs.toString() : ''}
        onChangeText={(val) => handleUpdateSet(exerciseId, set.id, "weight_lbs", parseFloat(val) || 0)}
        placeholder="-"
        placeholderTextColor="#666"
        editable={!set.completed}
      />
      <TextInput
        style={[styles.inputBox, set.completed && styles.inputBoxCompleted]}
        keyboardType="number-pad"
        value={set.reps > 0 ? set.reps.toString() : ''}
        onChangeText={(val) => handleUpdateSet(exerciseId, set.id, "reps", parseInt(val) || 0)}
        placeholder="-"
        placeholderTextColor="#666"
        editable={!set.completed}
      />
      <Pressable 
        style={[styles.checkButton, set.completed && styles.checkButtonActive]}
        onPress={() => handleToggleComplete(exerciseId, set.id)}
      >
        <Ionicons name="checkmark" size={16} color={set.completed ? "white" : colors.textSecondary} />
      </Pressable>
    </View>
  );
});

// Memoized Exercise Card
const ExerciseCard = memo(({ ex, exerciseHistory, handleUpdateSet, handleToggleComplete, handleAddSet, handleSetOptions, handleOpenExerciseDetails }) => {
  const previousSets = exerciseHistory?.[0]?.sets || [];

  const lastSessionLabel = useMemo(() => {
    if (!previousSets.length) return null;
    const first = previousSets[0];
    const weight = first.weight_lbs ?? 0;
    const reps = first.reps ?? 0;
    return `Last time: ${previousSets.length}×${reps} @ ${weight} lb`;
  }, [previousSets]);

  return (
    <View style={styles.exerciseCard}>
    <Pressable style={styles.exerciseTitleRow} onPress={() => handleOpenExerciseDetails(ex)}>
      <View style={styles.exerciseTitleTextWrap}>
        <Text style={styles.exerciseTitle}>{ex.name}</Text>
        <Text style={styles.exerciseMeta}>Tap for summary, records, and history</Text>
      </View>
      <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
    </Pressable>

    {lastSessionLabel && (
      <Text style={styles.lastSessionLabel}>{lastSessionLabel}</Text>
    )}

    {/* Sets Header */}
    <View style={styles.setRowHeader}>
      <Text style={styles.setColSet}>SET</Text>
      <Text style={styles.setColPrevious}>TARGET</Text>
      <Text style={styles.setColLbs}>LBS</Text>
      <Text style={styles.setColReps}>REPS</Text>
      <Text style={styles.setColCheck}>✓</Text>
    </View>

    {/* Sets Rows */}
    {ex.sets.map((set, setIndex) => (
      <SetRow 
        key={set.id} 
        set={set} 
        setIndex={setIndex} 
        exerciseId={ex.id} 
        exercise={ex}
        previousSet={previousSets[setIndex]}
        handleUpdateSet={handleUpdateSet} 
        handleToggleComplete={handleToggleComplete} 
        handleSetOptions={handleSetOptions}
      />
    ))}

    {/* Add Set Button */}
    <Pressable style={styles.addSetButton} onPress={() => handleAddSet(ex.id)}>
      <Text style={styles.addSetButtonText}>+ Add Set</Text>
    </Pressable>
    </View>
  );
});

export default function ActiveWorkout() {
  const [workoutName, setWorkoutName] = useState("New Workout");
  const [startTime, setStartTime] = useState(Date.now());
  const [timer, setTimer] = useState(0);
  const [currentLogId, setCurrentLogId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmptyAlert, setShowEmptyAlert] = useState(false);
  const [exerciseHistoryById, setExerciseHistoryById] = useState({});
  const [restDuration, setRestDuration] = useState(90);
  const [restRemaining, setRestRemaining] = useState(0);
  const [showRestTimer, setShowRestTimer] = useState(false);
  
  const { 
    activeLogId,
    activeWorkoutName,
    activeWorkoutStartTime,
    exercises, 
    updateSet, 
    toggleSetComplete, 
    addSet, 
    removeSet,
    toggleWarmupSet,
    endWorkout,
    startWorkout: storeStartWorkout,
    setWorkoutName: setStoreWorkoutName,
  } = useWorkoutStore();

  const getStartTimeMs = useCallback((value) => {
    if (!value) return Date.now();
    const parsedTime = new Date(value).getTime();
    return Number.isNaN(parsedTime) ? Date.now() : parsedTime;
  }, []);

  const handleWorkoutNameChange = useCallback((name) => {
    setWorkoutName(name);
    setStoreWorkoutName(name);
  }, [setStoreWorkoutName]);

  const handleUpdateSet = useCallback((exerciseId, setId, field, value) => {
    // Convert 'weight' from old UI to 'weight_lbs' if necessary
    const targetField = field === 'weight' ? 'weight_lbs' : field;
    updateSet(exerciseId, setId, targetField, value);
  }, [updateSet]);

  const handleToggleComplete = useCallback((exerciseId, setId) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    const targetSet = exercise?.sets?.find(set => set.id === setId);
    const shouldStartRest = targetSet && !targetSet.completed && restDuration > 0;

    toggleSetComplete(exerciseId, setId);

    if (shouldStartRest) {
      setRestRemaining(restDuration);
      setShowRestTimer(true);
    }
  }, [exercises, restDuration, toggleSetComplete]);

  const handleSetOptions = useCallback((exerciseId, setId, set) => {
    Alert.alert("Set Options", "Choose an action for this set.", [
      {
        text: set?.warmup ? "Remove Warmup Label" : "Mark as Warmup",
        onPress: () => toggleWarmupSet(exerciseId, setId),
      },
      {
        text: "Remove Set",
        style: "destructive",
        onPress: () => removeSet(exerciseId, setId),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  }, [removeSet, toggleWarmupSet]);

  const handleOpenExerciseDetails = useCallback((exercise) => {
    router.push({
      pathname: "/exercise-detail",
      params: {
        exerciseId: exercise.exercise_id || exercise.id,
        name: exercise.name,
        category: exercise.category || "",
        target: exercise.target || "",
        equipment: exercise.equipment || "",
        gifUrl: exercise.gif_url || "",
        instructions: exercise.instructions || "",
        secondaryMuscles: exercise.secondary_muscles || "",
      },
    });
  }, []);

  const handleSkipRestTimer = useCallback(() => {
    setShowRestTimer(false);
    setRestRemaining(0);
  }, []);

  const handleAddSet = useCallback((exerciseId) => {
    addSet(exerciseId);
  }, [addSet]);

  useEffect(() => {
    let isMounted = true;
    const exerciseIds = [...new Set(exercises.map(ex => ex.exercise_id).filter(Boolean))];
    const missingExerciseIds = exerciseIds.filter(id => !Object.prototype.hasOwnProperty.call(exerciseHistoryById, id));

    if (missingExerciseIds.length === 0) return undefined;

    const loadExerciseHistory = async () => {
      const historyEntries = await Promise.all(missingExerciseIds.map(async (exerciseId) => {
        try {
          const history = await getExerciseHistory(exerciseId);
          return [exerciseId, history];
        } catch (error) {
          console.error("Failed to load exercise history:", error);
          return [exerciseId, null];
        }
      }));

      if (isMounted) {
        setExerciseHistoryById(prev => ({
          ...prev,
          ...Object.fromEntries(historyEntries),
        }));
      }
    };

    loadExerciseHistory();

    return () => {
      isMounted = false;
    };
  }, [exercises]);

  useEffect(() => {
    let isMounted = true;
    
    const initWorkout = async () => {
      // If we already have a log ID from workouts.jsx, just use it
      if (activeLogId) {
        if (isMounted) {
          setCurrentLogId(activeLogId);
          if (activeWorkoutName) setWorkoutName(activeWorkoutName);
          if (activeWorkoutStartTime) setStartTime(getStartTimeMs(activeWorkoutStartTime));
        }
        return;
      }

      try {
        const log = await startWorkout(workoutName);
        if (isMounted) {
          const workoutStartTime = log.started_at || Date.now();
          setCurrentLogId(log.id);
          setWorkoutName(log.name);
          setStartTime(getStartTimeMs(workoutStartTime));
          storeStartWorkout(log, workoutStartTime);
        }
      } catch (e) {
        console.error("Failed to start workout:", e.message);
        if (isMounted) {
          Alert.alert("Error", "Failed to start workout session. Please try again.");
        }
      }
    };

    initWorkout();
    
    return () => {
      isMounted = false;
    };
  }, [activeLogId, activeWorkoutName, activeWorkoutStartTime, getStartTimeMs]);

  const handleOpenModal = () => {
    router.push({
      pathname: '/exercise-search',
      params: { context: 'active-workout' }
    });
  };

  // Timer logic
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  useEffect(() => {
    if (!showRestTimer) return undefined;

    if (restRemaining <= 0) {
      setShowRestTimer(false);
      return undefined;
    }

    const interval = setInterval(() => {
      setRestRemaining(prev => {
        if (prev <= 1) {
          setShowRestTimer(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showRestTimer, restRemaining]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };
  const handleFinish = async () => {
    const completedExercises = exercises.map(ex => ({
      ...ex,
      sets: ex.sets.map(normalizeCompletedSet).filter(Boolean)
    })).filter(ex => ex.sets.length > 0);

    if (completedExercises.length === 0 || !currentLogId) {
      setShowEmptyAlert(true);
      return;
    }

    setIsLoading(true);
    try {
      const completedAt = new Date().toISOString();

      for (const ex of completedExercises) {
        const exerciseLibraryId = getExerciseLibraryId(ex);

        if (!exerciseLibraryId) {
          throw new Error(`Missing exercise library id for ${ex.name || "exercise"}`);
        }

        await addExerciseToLog(currentLogId, {
          exercise_id: exerciseLibraryId,
          name: ex.name,
          category: ex.category,
          target: ex.target,
          equipment: ex.equipment,
          order: exercises.findIndex(e => e.id === ex.id),
          target_sets: ex.target_sets,
          target_reps_min: ex.target_reps_min,
          target_reps_max: ex.target_reps_max,
          target_weight_lbs: ex.target_weight_lbs,
          sets: ex.sets.map((s, i) => ({
            set_number: i + 1,
            reps: s.reps,
            weight_lbs: s.weight_lbs,
            completed: s.completed,
          })),
        });
      }

      await updateWorkoutLog(currentLogId, {
        name: workoutName,
        completed_at: completedAt,
        duration: timer,
        is_public: false,
      });

      // Invalidate profile caches so next visit fetches fresh logs + streak
      await Promise.all([
        saveToCache(CACHE_KEYS.WORKOUT_LOGS, null),
        saveToCache(CACHE_KEYS.STREAK, null),
      ]).catch(() => {});

      endWorkout();
      router.back();
    } catch (e) {
      console.error("Failed to save workout:", e.message);
      Alert.alert("Error", "Failed to save workout.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMinimize = () => {
    router.replace("/(tabs)/workouts");
  };

  const handleDiscardWorkout = async () => {
    const logIdToDiscard = currentLogId || activeLogId;

    setIsLoading(true);
    try {
      if (logIdToDiscard) {
        await deleteWorkoutLog(logIdToDiscard);
      }
      setShowEmptyAlert(false);
      endWorkout();
      router.replace("/(tabs)/workouts");
    } catch (e) {
      if (e.status === 404) {
        setShowEmptyAlert(false);
        endWorkout();
        router.replace("/(tabs)/workouts");
        return;
      }

      console.error("Failed to discard workout:", e.message);
      Alert.alert("Error", "Failed to discard workout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleMinimize} style={styles.minimizeButton} accessibilityLabel="Minimize workout">
            <Ionicons name="chevron-down" size={24} color={colors.primary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <TextInput
              style={styles.workoutNameInput}
              value={workoutName}
              onChangeText={handleWorkoutNameChange}
              placeholder="Workout Name"
              placeholderTextColor={colors.textTertiary}
            />
            <Text style={styles.timerText}>{formatTime(timer)}</Text>
          </View>
          <Pressable onPress={handleFinish} style={styles.finishButton}>
            <Text style={styles.finishButtonText}>Finish</Text>
          </Pressable>
        </View>

        {/* Exercises List */}
        <FlatList
          style={styles.exercisesScroll}
          contentContainerStyle={styles.exercisesContent}
          data={exercises}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ExerciseCard 
              ex={item} 
              exerciseHistory={exerciseHistoryById[item.exercise_id]}
              handleUpdateSet={handleUpdateSet} 
              handleToggleComplete={handleToggleComplete} 
              handleAddSet={handleAddSet} 
              handleSetOptions={handleSetOptions}
              handleOpenExerciseDetails={handleOpenExerciseDetails}
            />
          )}
          ListFooterComponent={
            <View style={styles.footerControls}>
              {showRestTimer && (
                <View style={styles.restTimerCard}>
                  <View>
                    <Text style={styles.restTimerLabel}>Rest Timer</Text>
                    <Text style={styles.restTimerValue}>{formatTime(restRemaining)}</Text>
                  </View>
                  <Pressable style={styles.skipRestButton} onPress={handleSkipRestTimer}>
                    <Text style={styles.skipRestButtonText}>Skip</Text>
                  </Pressable>
                </View>
              )}

              <View style={styles.restSettingsCard}>
                <Text style={styles.restSettingsTitle}>Rest Timer</Text>
                <View style={styles.restOptionsRow}>
                  {REST_TIMER_OPTIONS.map(option => (
                    <Pressable
                      key={option.value}
                      style={[styles.restOption, restDuration === option.value && styles.restOptionActive]}
                      onPress={() => setRestDuration(option.value)}
                    >
                      <Text style={[styles.restOptionText, restDuration === option.value && styles.restOptionTextActive]}>{option.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Pressable 
                style={[styles.addExerciseButton, !currentLogId && styles.addExerciseButtonDisabled]} 
                onPress={handleOpenModal}
                disabled={!currentLogId}
              >
                <Ionicons name="add" size={20} color={colors.primary} />
                <Text style={styles.addExerciseButtonText}>Add Exercise</Text>
              </Pressable>
            </View>
          }
        />
      </KeyboardAvoidingView>

      {/* Empty Workout Alert Modal */}
      <Modal
        isVisible={showEmptyAlert}
        backdropOpacity={0.6}
        animationIn="fadeIn"
        animationOut="fadeOut"
        useNativeDriver={true}
        onBackdropPress={() => setShowEmptyAlert(false)}
      >
        <View style={styles.alertBox}>
          <Text style={styles.alertTitle}>Empty Workout</Text>
          <Text style={styles.alertMessage}>You haven't completed any sets! Are you sure you want to finish without saving?</Text>
          <View style={styles.alertButtonRow}>
            <Pressable style={styles.alertCancelBtn} onPress={() => setShowEmptyAlert(false)}>
              <Text style={styles.alertCancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.alertDestructiveBtn} onPress={handleDiscardWorkout} disabled={isLoading}>
              <Text style={styles.alertDestructiveBtnText}>Discard</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  minimizeButton: {
    padding: spacing.xs,
    minWidth: 48,
    alignItems: "flex-start",
  },
  finishButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  finishButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  headerCenter: {
    alignItems: "center",
    flex: 1,
  },
  workoutNameInput: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center",
  },
  timerText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  exercisesScroll: {
    flex: 1,
  },
  exercisesContent: {
    padding: layout.screenPadding,
    paddingBottom: 40,
  },
  exerciseCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  exerciseTitleTextWrap: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
  },
  exerciseMeta: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },
  lastSessionLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  setRowHeader: {
    flexDirection: "row",
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  setColSet: { flex: 0.9, fontSize: 11, color: colors.textTertiary, fontWeight: "bold", textAlign: "center" },
  setColPrevious: { flex: 1.7, fontSize: 11, color: colors.textTertiary, fontWeight: "bold", textAlign: "center" },
  setColLbs: { flex: 1.4, fontSize: 11, color: colors.textTertiary, fontWeight: "bold", textAlign: "center" },
  setColReps: { flex: 1.4, fontSize: 11, color: colors.textTertiary, fontWeight: "bold", textAlign: "center" },
  setColCheck: { flex: 0.9, fontSize: 11, color: colors.textTertiary, fontWeight: "bold", textAlign: "center" },
  
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  setRowCompleted: {
    opacity: 0.6,
  },
  setIndexButton: {
    flex: 0.9,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 30,
  },
  setIndex: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "bold",
    color: colors.textSecondary,
  },
  setIndexWarmup: {
    color: colors.warning || colors.primary,
  },
  targetHintContainer: {
    flex: 1.7,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: spacing.xs,
  },
  targetHintText: {
    textAlign: "center",
    fontSize: 12,
    color: colors.textSecondary,
  },
  inputBox: {
    flex: 1.4,
    backgroundColor: "#1a1a1a",
    marginHorizontal: spacing.xs,
    borderRadius: 8,
    paddingVertical: 10,
    textAlign: "center",
    fontSize: 16,
    color: "#fff",
  },
  inputBoxCompleted: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  checkButton: {
    flex: 0.9,
    alignItems: "center",
    justifyContent: "center",
    height: 30,
    backgroundColor: colors.border,
    borderRadius: 6,
    marginHorizontal: spacing.xs,
  },
  checkButtonActive: {
    backgroundColor: colors.success || "#34C759",
  },
  addSetButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  addSetButtonText: {
    color: colors.textTertiary,
    fontSize: 14,
    fontWeight: "bold",
  },
  footerControls: {
    gap: spacing.md,
  },
  restTimerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: `${colors.primary}18`,
    borderWidth: 1,
    borderColor: `${colors.primary}40`,
    borderRadius: 12,
    padding: spacing.md,
  },
  restTimerLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  restTimerValue: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: "900",
    marginTop: 2,
  },
  skipRestButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  skipRestButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  restSettingsCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  restSettingsTitle: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "bold",
    marginBottom: spacing.sm,
  },
  restOptionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  restOption: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  restOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  restOptionText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "bold",
  },
  restOptionTextActive: {
    color: "white",
  },
  addExerciseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    backgroundColor: "rgba(0, 123, 255, 0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    marginTop: spacing.md,
  },
  addExerciseButtonDisabled: {
    opacity: 0.5,
    backgroundColor: colors.border,
    borderColor: colors.border,
  },
  addExerciseButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  bottomModal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 16,
    height: "60%",
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center",
    marginBottom: 16,
  },
  modalScroll: {
    flex: 1,
  },
  modalExerciseRow: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalExerciseName: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 4,
  },
  modalExerciseCategory: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  alertBox: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 12,
  },
  alertMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  alertButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  alertCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  alertCancelBtnText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "bold",
  },
  alertDestructiveBtn: {
    flex: 1,
    paddingVertical: 14,
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  alertDestructiveBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});