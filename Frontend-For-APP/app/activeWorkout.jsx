import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Modal from "react-native-modal";
import { colors, layout, typography, spacing } from "../lib/theme";
import { startWorkout, updateWorkoutLog, addExerciseToLog, searchExercises } from "../lib/workoutApi";

const EXERCISE_LIST = [
  { category: "Chest", name: "Bench Press" },
  { category: "Chest", name: "Incline Dumbbell Press" },
  { category: "Chest", name: "Push-ups" },
  { category: "Chest", name: "Cable Crossover" },
  { category: "Back", name: "Deadlift" },
  { category: "Back", name: "Pull-ups" },
  { category: "Back", name: "Barbell Row" },
  { category: "Back", name: "Lat Pulldown" },
  { category: "Legs", name: "Barbell Squat" },
  { category: "Legs", name: "Leg Press" },
  { category: "Legs", name: "Lunges" },
  { category: "Legs", name: "Calf Raises" },
  { category: "Arms/Shoulders", name: "Overhead Press" },
  { category: "Arms/Shoulders", name: "Lateral Raises" },
  { category: "Arms/Shoulders", name: "Bicep Curls" },
  { category: "Arms/Shoulders", name: "Tricep Extensions" },
];

export default function ActiveWorkout() {
  const [workoutName, setWorkoutName] = useState("New Workout");
  const [startTime] = useState(Date.now());
  const [timer, setTimer] = useState(0);
  const [exercises, setExercises] = useState([]);
  const [currentLogId, setCurrentLogId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [exerciseList, setExerciseList] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [showCancelAlert, setShowCancelAlert] = useState(false);
  const [showEmptyAlert, setShowEmptyAlert] = useState(false);

  useEffect(() => {
    initWorkout();
  }, []);

  const initWorkout = async () => {
    try {
      const log = await startWorkout(workoutName);
      setCurrentLogId(log.id);
    } catch (e) {
      console.error("Failed to start workout:", e.message);
      Alert.alert("Error", "Failed to start workout session. Please try again.");
    }
  };

  const loadExerciseOptions = async (query = "") => {
    try {
      const data = await searchExercises(query);
      setExerciseList(data || []);
    } catch (e) {
      console.error("Failed to load exercises:", e.message);
      setExerciseList(EXERCISE_LIST);
    }
  };

  const handleOpenModal = () => {
    loadExerciseOptions();
    setModalVisible(true);
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

  const handleAddExercise = (exerciseName) => {
    const newExercise = {
      id: Date.now().toString(),
      name: exerciseName,
      sets: [
        { id: Date.now().toString() + "-1", weight: "", reps: "", completed: false }
      ]
    };
    setExercises([...exercises, newExercise]);
    setModalVisible(false);
  };

  const handleAddSet = (exerciseId) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        const lastSet = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [...ex.sets, { 
            id: Date.now().toString(), 
            weight: lastSet ? lastSet.weight : "", 
            reps: lastSet ? lastSet.reps : "", 
            completed: false 
          }]
        };
      }
      return ex;
    }));
  };

  const handleUpdateSet = (exerciseId, setId, field, value) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(set => set.id === setId ? { ...set, [field]: value } : set)
        };
      }
      return ex;
    }));
  };

  const handleToggleComplete = (exerciseId, setId) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(set => set.id === setId ? { ...set, completed: !set.completed } : set)
        };
      }
      return ex;
    }));
  };

  const handleFinish = async () => {
    const completedExercises = exercises.map(ex => ({
      ...ex,
      sets: ex.sets.filter(s => s.completed && s.weight && s.reps)
    })).filter(ex => ex.sets.length > 0);

    if (completedExercises.length === 0 || !currentLogId) {
      setShowEmptyAlert(true);
      return;
    }

    setIsLoading(true);
    try {
      await updateWorkoutLog(currentLogId, {
        name: workoutName,
        completed_at: new Date().toISOString(),
        duration: timer,
        is_public: false,
      });

      for (const ex of completedExercises) {
        await addExerciseToLog(currentLogId, {
          exercise_id: ex.exercise_id || ex.id,
          name: ex.name,
          category: ex.category,
          target: ex.target,
          equipment: ex.equipment,
          order: exercises.findIndex(e => e.id === ex.id),
          sets: ex.sets.map((s, i) => ({
            set_number: i + 1,
            reps: parseInt(s.reps) || 0,
            weight_lbs: parseFloat(s.weight) || 0,
            completed: s.completed,
          })),
        });
      }

      router.back();
    } catch (e) {
      Alert.alert("Error", "Failed to save workout.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setShowCancelAlert(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleCancel} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Cancel</Text>
          </Pressable>
          <View style={styles.headerCenter}>
            <TextInput
              style={styles.workoutNameInput}
              value={workoutName}
              onChangeText={setWorkoutName}
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
        <ScrollView style={styles.exercisesScroll} contentContainerStyle={styles.exercisesContent}>
          {exercises.map((ex, exIndex) => (
            <View key={ex.id} style={styles.exerciseCard}>
              <Text style={styles.exerciseTitle}>{ex.name}</Text>

              {/* Sets Header */}
              <View style={styles.setRowHeader}>
                <Text style={styles.setColSet}>Set</Text>
                <Text style={styles.setColLbs}>lbs</Text>
                <Text style={styles.setColReps}>Reps</Text>
                <Text style={styles.setColCheck}>✓</Text>
              </View>

              {/* Sets Rows */}
              {ex.sets.map((set, setIndex) => (
                <View key={set.id} style={[styles.setRow, set.completed && styles.setRowCompleted]}>
                  <Text style={styles.setIndex}>{setIndex + 1}</Text>
                  <TextInput
                    style={[styles.inputBox, set.completed && styles.inputBoxCompleted]}
                    keyboardType="numeric"
                    value={set.weight}
                    onChangeText={(val) => handleUpdateSet(ex.id, set.id, "weight", val)}
                    placeholder="-"
                    editable={!set.completed}
                  />
                  <TextInput
                    style={[styles.inputBox, set.completed && styles.inputBoxCompleted]}
                    keyboardType="numeric"
                    value={set.reps}
                    onChangeText={(val) => handleUpdateSet(ex.id, set.id, "reps", val)}
                    placeholder="-"
                    editable={!set.completed}
                  />
                  <Pressable 
                    style={[styles.checkButton, set.completed && styles.checkButtonActive]}
                    onPress={() => handleToggleComplete(ex.id, set.id)}
                  >
                    <Ionicons name="checkmark" size={16} color={set.completed ? "white" : colors.textSecondary} />
                  </Pressable>
                </View>
              ))}

              {/* Add Set Button */}
              <Pressable style={styles.addSetButton} onPress={() => handleAddSet(ex.id)}>
                <Text style={styles.addSetButtonText}>+ Add Set</Text>
              </Pressable>
            </View>
          ))}

          {/* Add Exercise Button */}
          <Pressable 
            style={[styles.addExerciseButton, !currentLogId && styles.addExerciseButtonDisabled]} 
            onPress={handleOpenModal}
            disabled={!currentLogId}
          >
            <Ionicons name="add" size={20} color={colors.primary} />
            <Text style={styles.addExerciseButtonText}>Add Exercise</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Exercise Selector Modal */}
      <Modal
        isVisible={isModalVisible}
        onSwipeComplete={() => setModalVisible(false)}
        swipeDirection="down"
        onBackdropPress={() => setModalVisible(false)}
        style={styles.bottomModal}
        avoidKeyboard
      >
        <View style={styles.modalContent}>
          <View style={styles.dragHandle} />
          <Text style={styles.modalHeader}>Select Exercise</Text>
          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {(exerciseList.length > 0 ? exerciseList : EXERCISE_LIST).map((item, idx) => (
              <Pressable 
                key={idx} 
                style={styles.modalExerciseRow}
                onPress={() => handleAddExercise(item.name)}
              >
                <Text style={styles.modalExerciseName}>{item.name}</Text>
                <Text style={styles.modalExerciseCategory}>{item.target || item.category}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Cancel Workout Alert Modal */}
      <Modal
        isVisible={showCancelAlert}
        backdropOpacity={0.6}
        animationIn="fadeIn"
        animationOut="fadeOut"
        useNativeDriver={true}
        onBackdropPress={() => setShowCancelAlert(false)}
      >
        <View style={styles.alertBox}>
          <Text style={styles.alertTitle}>Cancel Workout</Text>
          <Text style={styles.alertMessage}>Are you sure you want to cancel? This workout will not be saved.</Text>
          <View style={styles.alertButtonRow}>
            <Pressable style={styles.alertCancelBtn} onPress={() => setShowCancelAlert(false)}>
              <Text style={styles.alertCancelBtnText}>Keep Going</Text>
            </Pressable>
            <Pressable style={styles.alertDestructiveBtn} onPress={() => {
              setShowCancelAlert(false);
              router.back();
            }}>
              <Text style={styles.alertDestructiveBtnText}>Discard</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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
            <Pressable style={styles.alertDestructiveBtn} onPress={() => {
              setShowEmptyAlert(false);
              router.back();
            }}>
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
  headerButton: {
    padding: spacing.xs,
  },
  headerButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "500",
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
  exerciseTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  setRowHeader: {
    flexDirection: "row",
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  setColSet: { flex: 1, fontSize: 12, color: colors.textTertiary, fontWeight: "bold", textAlign: "center" },
  setColLbs: { flex: 2, fontSize: 12, color: colors.textTertiary, fontWeight: "bold", textAlign: "center" },
  setColReps: { flex: 2, fontSize: 12, color: colors.textTertiary, fontWeight: "bold", textAlign: "center" },
  setColCheck: { flex: 1, fontSize: 12, color: colors.textTertiary, fontWeight: "bold", textAlign: "center" },
  
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  setRowCompleted: {
    opacity: 0.6,
  },
  setIndex: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "bold",
    color: colors.textSecondary,
  },
  inputBox: {
    flex: 2,
    backgroundColor: colors.background,
    marginHorizontal: spacing.xs,
    borderRadius: 6,
    paddingVertical: 6,
    textAlign: "center",
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputBoxCompleted: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  checkButton: {
    flex: 1,
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