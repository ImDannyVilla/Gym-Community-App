import React, { useState, useEffect, useCallback, memo, useMemo, useRef } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from "expo-image";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Modal from "react-native-modal";
import { colors, layout, typography, spacing } from "../lib/theme";
import { startWorkout, deleteWorkoutLog, getExerciseHistory } from "../lib/workoutApi";
import { useWorkoutStore } from "../stores/workoutStore";
import RestTimer from "./_components/RestTimer";

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
const SetRow = memo(({ set, setIndex, exerciseId, exercise, previousSet, handleUpdateSet, handleToggleComplete, handleSetOptions, exerciseIndex, handleInputFocus }) => {
  const handleWeightChange = useCallback((val) => {
    const cleaned = val.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    const formatted = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
    const [whole, decimal] = formatted.split('.');
    const limitedWhole = whole.slice(0, 4);
    const limitedFormatted = decimal !== undefined
      ? `${limitedWhole}.${decimal.slice(0, 2)}`
      : limitedWhole;
    if (parseFloat(limitedFormatted) > 9999) return;
    handleUpdateSet(exerciseId, set.id, 'weight_lbs', limitedFormatted);
  }, [exerciseId, set.id, handleUpdateSet]);

  const handleRepsChange = useCallback((val) => {
    const cleaned = val.replace(/[^0-9]/g, '');
    if (parseInt(cleaned) > 999) return;
    handleUpdateSet(exerciseId, set.id, 'reps', cleaned);
  }, [exerciseId, set.id, handleUpdateSet]);

  return (
    <View style={[styles.setRow, set.completed && styles.setRowCompleted]}>
      <Pressable style={styles.setIndexButton} onPress={() => handleSetOptions(exerciseId, set.id, set)}>
        <Text style={[styles.setIndex, set.warmup && styles.setIndexWarmup]}>{set.warmup ? "W" : setIndex + 1}</Text>
      </Pressable>

      <View style={styles.targetHintContainer}>
        <Text style={styles.targetHintText}>
          {formatPreviousSet(previousSet)}
        </Text>
      </View>

      <TextInput
        style={[styles.inputBox, set.completed && styles.inputBoxCompleted]}
        keyboardType="decimal-pad"
        maxLength={7}
        value={set.weight_lbs > 0 ? set.weight_lbs.toString() : ''}
        onChangeText={handleWeightChange}
        onFocus={() => handleInputFocus(exerciseIndex)}
        placeholder="-"
        placeholderTextColor="#666"
        editable={!set.completed}
      />
      <TextInput
        style={[styles.inputBox, set.completed && styles.inputBoxCompleted]}
        keyboardType="number-pad"
        maxLength={3}
        value={set.reps > 0 ? set.reps.toString() : ''}
        onChangeText={handleRepsChange}
        onFocus={() => handleInputFocus(exerciseIndex)}
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
const ExerciseCard = memo(({ ex, exerciseIndex, exerciseHistory, handleUpdateSet, handleToggleComplete, handleAddSet, handleSetOptions, handleOpenExerciseDetails, handleInputFocus, handleDeleteExercise }) => {
  const previousSets = exerciseHistory?.[0]?.sets || [];
  const restTimerTriggerRef = useRef(null);

  const lastSessionLabel = useMemo(() => {
    if (!previousSets.length) return null;
    const first = previousSets[0];
    const weight = first.weight_lbs ?? 0;
    const reps = first.reps ?? 0;
    return `Last time: ${previousSets.length}×${reps} @ ${weight} lb`;
  }, [previousSets]);

  const handleToggleCompleteWithTimer = useCallback((exerciseId, setId) => {
    const targetSet = ex.sets?.find(s => s.id === setId);
    const willComplete = targetSet && !targetSet.completed;
    handleToggleComplete(exerciseId, setId);
    if (willComplete) restTimerTriggerRef.current?.();
  }, [ex.sets, handleToggleComplete]);

  return (
    <View style={styles.exerciseCard}>
    <View style={styles.exerciseTitleRow}>
      <Pressable style={styles.exerciseTitlePressable} onPress={() => handleOpenExerciseDetails(ex)}>
        <Image
          source={{ uri: ex.gif_url }}
          style={styles.exerciseThumb}
          contentFit="cover"
        />
        <View style={styles.exerciseTitleTextWrap}>
          <Text style={styles.exerciseTitle}>{ex.name}</Text>
          <Text style={styles.exerciseMeta}>Tap for summary, records, and history</Text>
        </View>
        <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
      </Pressable>
      <RestTimer onSetComplete={restTimerTriggerRef} />
      <Pressable
        onPress={() => handleDeleteExercise(ex)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.deleteExerciseBtn}
      >
        <Ionicons name="trash-outline" size={18} color="#555" />
      </Pressable>
    </View>

    {lastSessionLabel && (
      <Text style={styles.lastSessionLabel}>{lastSessionLabel}</Text>
    )}

    {/* Sets Header */}
    <View style={styles.setRowHeader}>
      <Text style={styles.setColSet}>SET</Text>
      <Text style={styles.setColPrevious}>PREVIOUS</Text>
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
        handleToggleComplete={handleToggleCompleteWithTimer}
        handleSetOptions={handleSetOptions}
        exerciseIndex={exerciseIndex}
        handleInputFocus={handleInputFocus}
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
  
  const flatListRef = useRef(null);
  const deletingIdsRef = useRef(new Set());

  const {
    activeLogId,
    activeWorkoutName,
    activeWorkoutStartTime,
    activeRoutineId,
    exercises,
    updateSet,
    toggleSetComplete,
    addSet,
    removeSet,
    removeExercise,
    toggleWarmupSet,
    endWorkout,
    startWorkout: storeStartWorkout,
    setWorkoutName: setStoreWorkoutName,
  } = useWorkoutStore();

  const handleInputFocus = useCallback((exerciseIndex) => {
    flatListRef.current?.scrollToIndex({
      index: exerciseIndex,
      animated: true,
      viewOffset: 100,
    });
  }, []);

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
    toggleSetComplete(exerciseId, setId);
  }, [toggleSetComplete]);

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

  const handleDeleteExercise = useCallback((ex) => {
    if (deletingIdsRef.current.has(ex.id)) return;
    deletingIdsRef.current.add(ex.id);
    Alert.alert(
      'Remove Exercise',
      `Remove ${ex.name} from this workout?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => deletingIdsRef.current.delete(ex.id),
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            removeExercise(ex.id);
            deletingIdsRef.current.delete(ex.id);
          },
        },
      ]
    );
  }, [removeExercise, activeLogId]);

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
          // 404 = no history yet — expected for new exercises, not an error
          if (error.status !== 404) {
            console.warn("Failed to load exercise history:", error.message);
          }
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

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };
  const handleFinish = () => {
    const completedExercises = exercises.map(ex => ({
      ...ex,
      sets: ex.sets.map(normalizeCompletedSet).filter(Boolean)
    })).filter(ex => ex.sets.length > 0);

    if (completedExercises.length === 0 || !currentLogId) {
      setShowEmptyAlert(true);
      return;
    }

    router.push('/save-workout');
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
      useWorkoutStore.persist.clearStorage();
      router.replace("/(tabs)/workouts");
    } catch (e) {
      if (e.status === 404) {
        setShowEmptyAlert(false);
        endWorkout();
        useWorkoutStore.persist.clearStorage();
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
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        
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
          ref={flatListRef}
          style={styles.exercisesScroll}
          contentContainerStyle={styles.exercisesContent}
          data={exercises}
          keyExtractor={(item) => item.id}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          renderItem={({ item, index }) => (
            <ExerciseCard
              ex={item}
              exerciseIndex={index}
              exerciseHistory={exerciseHistoryById[item.exercise_id]}
              handleUpdateSet={handleUpdateSet}
              handleToggleComplete={handleToggleComplete}
              handleAddSet={handleAddSet}
              handleSetOptions={handleSetOptions}
              handleOpenExerciseDetails={handleOpenExerciseDetails}
              handleInputFocus={handleInputFocus}
              handleDeleteExercise={handleDeleteExercise}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="barbell-outline" size={48} color="#333" />
              <Text style={styles.emptyTitle}>No exercises yet</Text>
              <Text style={styles.emptySubtitle}>Tap "Add Exercise" to get started</Text>
            </View>
          }
          ListFooterComponent={
            <View style={styles.footerControls}>
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
    paddingBottom: 200,
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
    marginBottom: spacing.sm,
    gap: 8,
  },
  exerciseTitlePressable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
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
  deleteExerciseBtn: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  exerciseThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    marginRight: 10,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },

  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#666',
    fontSize: 14,
  },
  footerControls: {
    gap: spacing.md,
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
  finishSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
  },
  finishSheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  finishSheetTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  finishTitleInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveBtnStyle: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveBtnTextStyle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelBtnStyle: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnTextStyle: {
    color: colors.textSecondary,
    fontSize: 15,
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