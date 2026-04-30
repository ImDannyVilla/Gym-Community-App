import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { colors } from '../lib/theme';
import { useRoutineStore } from '../stores/routineStore';
import { createRoutine, getRoutine, updateRoutine, getMyRoutines } from '../lib/workoutApi';
import { saveToCache, CACHE_KEYS } from '../lib/localCache';
import ExerciseConfigSheet from './_components/ExerciseConfigSheet';

export default function CreateRoutineScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const routineId = params.routineId;
  const isEditMode = !!routineId;
  
  const exercises = useRoutineStore(state => state.pendingExercises);
  const clearExercises = useRoutineStore(state => state.clearExercises);
  const removeExercise = useRoutineStore(state => state.removeExercise);
  const updateExercise = useRoutineStore(state => state.updateExercise);
  const setExercises = useRoutineStore(state => state.setExercises);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRoutine, setIsLoadingRoutine] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [showConfig, setShowConfig] = useState(false);

  // Load existing routine if in edit mode
  useEffect(() => {
    if (isEditMode) {
      loadRoutine();
    }
  }, [routineId]);

  const loadRoutine = async () => {
    setIsLoadingRoutine(true);
    try {
      const routine = await getRoutine(routineId);
      setName(routine.name);
      setDescription(routine.description || '');
      setIsPublic(routine.is_public);
      
      // Convert routine exercises to the format expected by the store
      const formattedExercises = routine.exercises.map(ex => ({
        exercise_id: ex.exercise_id,
        name: ex.name,
        gif_url: ex.gif_url,
        category: ex.category,
        target: ex.target,
        equipment: ex.equipment,
        target_sets: ex.target_sets,
        target_reps_min: ex.target_reps_min,
        target_reps_max: ex.target_reps_max,
        target_weight_lbs: ex.target_weight_lbs,
        notes: ex.notes,
      }));
      setExercises(formattedExercises);
    } catch (error) {
      console.error('Failed to load routine:', error);
      Alert.alert('Error', 'Failed to load routine. Please try again.');
      router.back();
    } finally {
      setIsLoadingRoutine(false);
    }
  };

  const handleAddExercise = () => {
    router.push({
      pathname: '/exercise-search',
      params: { context: 'create-routine' }
    });
  };

  const handleSaveRoutine = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a routine name');
      return;
    }
    if (exercises.length === 0) {
      Alert.alert('Error', 'Please add at least one exercise');
      return;
    }

    setIsLoading(true);
    try {
      if (isEditMode) {
        // Update existing routine
        await updateRoutine(routineId, {
          name: name.trim(),
          description: description.trim() || null,
          is_public: isPublic,
        });

        // Refresh + persist routines cache
        const freshRoutines = await getMyRoutines().catch(() => null);
        if (freshRoutines) await saveToCache(CACHE_KEYS.ROUTINES, freshRoutines);

        clearExercises();
        Alert.alert('Success', 'Routine updated successfully', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/workouts') }
        ]);
      } else {
        // Create new routine
        const exercisesData = exercises.map((ex, index) => ({
          exercise_id: ex.exercise_id,
          name: ex.name,
          gif_url: ex.gif_url,
          category: ex.category,
          target: ex.target,
          equipment: ex.equipment,
          order: index + 1,
          target_sets: ex.target_sets || 3,
          target_reps_min: ex.target_reps_min || 8,
          target_reps_max: ex.target_reps_max || 12,
          target_weight_lbs: ex.target_weight_lbs || null,
          notes: ex.notes || null,
        }));

        await createRoutine(name.trim(), description.trim() || null, isPublic, exercisesData);

        // Refresh + persist routines cache so workouts screen loads instantly
        const freshRoutines = await getMyRoutines().catch(() => null);
        if (freshRoutines) await saveToCache(CACHE_KEYS.ROUTINES, freshRoutines);

        clearExercises();
        Alert.alert('Success', 'Routine created successfully', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/workouts') }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to ${isEditMode ? 'update' : 'create'} routine. Please try again.`);
      console.error(`${isEditMode ? 'Update' : 'Create'} routine error:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (exercises.length > 0 || name.trim() || description.trim()) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: () => {
              clearExercises();
              router.back();
            }
          }
        ]
      );
    } else {
      router.back();
    }
  };

  const handleEditExercise = (exercise, index) => {
    setEditingExercise(exercise);
    setEditingIndex(index);
    setShowConfig(true);
  };

  const handleSaveEdit = (updatedExercise) => {
    updateExercise(editingIndex, updatedExercise);
    setShowConfig(false);
    setEditingExercise(null);
    setEditingIndex(null);
  };

  if (isLoadingRoutine) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading routine...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{isEditMode ? 'Edit Routine' : 'New Routine'}</Text>
        <TouchableOpacity onPress={handleSaveRoutine} disabled={isLoading}>
          <Text style={[styles.save, isLoading && { opacity: 0.5 }]}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Routine Name */}
      <TextInput
        style={styles.input}
        placeholder="Routine Name (e.g. Push Day)"
        placeholderTextColor="#666"
        value={name}
        onChangeText={setName}
        maxLength={50}
      />

      {/* Description */}
      <TextInput
        style={[styles.input, { height: 80 }]}
        placeholder="Description (optional)"
        placeholderTextColor="#666"
        value={description}
        onChangeText={setDescription}
        multiline
        maxLength={200}
      />

      {/* Public Toggle */}
      <TouchableOpacity
        style={styles.toggle}
        onPress={() => setIsPublic(!isPublic)}
      >
        <Text style={styles.toggleLabel}>Make Public</Text>
        <View style={[styles.toggleSwitch, isPublic && styles.toggleActive]}>
          <Text style={{ color: '#fff', fontSize: 12 }}>{isPublic ? 'ON' : 'OFF'}</Text>
        </View>
      </TouchableOpacity>

      {/* Exercise List */}
      <FlatList
        data={exercises}
        keyExtractor={(item, index) => `${item.exercise_id}-${index}`}
        renderItem={({ item, index }) => {
          const repsDisplay = item.target_reps_min === item.target_reps_max
            ? `${item.target_reps_min} reps`
            : `${item.target_reps_min}-${item.target_reps_max} reps`;
          
          return (
            <TouchableOpacity
              style={styles.exerciseRow}
              onPress={() => handleEditExercise(item, index)}
              activeOpacity={0.7}
            >
              <Image
                source={{ uri: item.gif_url }}
                style={styles.exerciseGif}
                contentFit="cover"
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.exerciseName}>{item.name}</Text>
                <Text style={styles.exerciseMeta}>
                  {item.target_sets} sets · {repsDisplay}
                  {item.target_weight_lbs ? ` · ${item.target_weight_lbs} lbs` : ''}
                  {item.rest_seconds ? ` · ${item.rest_seconds}s rest` : ''}
                </Text>
              </View>
              <Text style={{ color: '#666', fontSize: 12 }}>Edit</Text>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  removeExercise(index);
                }}
                style={{ paddingLeft: 12 }}
              >
                <Text style={{ color: '#DC2626', fontSize: 18 }}>X</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
        ListFooterComponent={
          <TouchableOpacity style={styles.addExerciseBtn} onPress={handleAddExercise}>
            <Text style={styles.addExerciseText}>+ Add Exercise</Text>
          </TouchableOpacity>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      <ExerciseConfigSheet
        exercise={editingExercise}
        visible={showConfig}
        context="create-routine"
        isEditing={editingIndex !== null}
        onClose={() => {
          setShowConfig(false);
          setEditingExercise(null);
          setEditingIndex(null);
        }}
        onAdd={handleSaveEdit}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#0a0a0a', 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancel: { 
    color: '#999', 
    fontSize: 16 
  },
  title: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  save: { 
    color: '#DC2626', 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  input: { 
    backgroundColor: '#1a1a1a', 
    color: '#fff', 
    borderRadius: 10, 
    padding: 14, 
    marginHorizontal: 16, 
    marginBottom: 12, 
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggle: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginHorizontal: 16, 
    marginBottom: 16, 
    backgroundColor: '#1a1a1a', 
    padding: 14, 
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleLabel: { 
    color: '#fff', 
    fontSize: 15 
  },
  toggleSwitch: { 
    backgroundColor: '#444', 
    borderRadius: 6, 
    paddingHorizontal: 10, 
    paddingVertical: 4 
  },
  toggleActive: { 
    backgroundColor: '#DC2626' 
  },
  exerciseRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#1a1a1a', 
    marginHorizontal: 16, 
    marginBottom: 8, 
    padding: 14, 
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  exerciseGif: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#222',
  },
  exerciseName: { 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: '600' 
  },
  exerciseMeta: { 
    color: '#999', 
    fontSize: 12, 
    marginTop: 2 
  },
  addExerciseBtn: { 
    marginHorizontal: 16, 
    marginTop: 8, 
    borderWidth: 1, 
    borderColor: '#DC2626', 
    borderRadius: 10, 
    padding: 14, 
    alignItems: 'center', 
    borderStyle: 'dashed' 
  },
  addExerciseText: { 
    color: '#DC2626', 
    fontSize: 15, 
    fontWeight: '600' 
  },
});
