import { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../lib/theme';
import { searchExercises } from '../lib/workoutApi';
import { useRoutineStore } from '../stores/routineStore';
import { useWorkoutStore } from '../stores/workoutStore';
import ExerciseConfigSheet from './_components/ExerciseConfigSheet';

// Available filter options matching our exercise library
const CATEGORIES = ['strength', 'cardio', 'plyometrics', 'powerlifting', 'olympic weightlifting', 'stretching', 'strongman'];
const EQUIPMENT = ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell', 'band', 'ez barbell'];
const TARGETS = ['chest', 'lats', 'middle back', 'lower back', 'shoulders', 'biceps', 'triceps', 'forearms', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'abdominals', 'traps'];

export default function ExerciseSearchScreen() {
  const router = useRouter();
  const { context } = useLocalSearchParams();
  const addExerciseToRoutine = useRoutineStore(state => state.addExercise);
  const addExerciseToWorkout = useWorkoutStore(state => state.addExercise);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showConfig, setShowConfig] = useState(false);

  const handleSearch = useCallback(async (q, category, equipment, target) => {
    setIsLoading(true);
    try {
      const data = await searchExercises(q, category, equipment, target, 30);
      setResults(data);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleQueryChange = (text) => {
    setQuery(text);
    if (text.length >= 2 || selectedCategory || selectedEquipment || selectedTarget) {
      handleSearch(text, selectedCategory, selectedEquipment, selectedTarget);
    } else if (text.length === 0) {
      setResults([]);
    }
  };

  const handleFilterSelect = (type, value) => {
    const newCategory = type === 'category' ? (selectedCategory === value ? null : value) : selectedCategory;
    const newEquipment = type === 'equipment' ? (selectedEquipment === value ? null : value) : selectedEquipment;
    const newTarget = type === 'target' ? (selectedTarget === value ? null : value) : selectedTarget;

    if (type === 'category') setSelectedCategory(newCategory);
    if (type === 'equipment') setSelectedEquipment(newEquipment);
    if (type === 'target') setSelectedTarget(newTarget);

    handleSearch(query, newCategory, newEquipment, newTarget);
  };

  const handleSelectExercise = (exercise) => {
    if (context === 'active-workout') {
      addExerciseToWorkout({
        exercise_id: exercise.exercise_id || exercise.id,
        name: exercise.name,
        gif_url: exercise.gif_url,
        category: exercise.category,
        target: exercise.target,
        equipment: exercise.equipment,
        instructions: exercise.instructions,
        secondary_muscles: exercise.secondary_muscles,
        target_sets: 1,
        target_reps: null,
        target_weight_lbs: null,
        rest_seconds: null,
        workout_mode: true,
      });
      router.back();
      return;
    }

    setSelectedExercise(exercise);
    setShowConfig(true);
  };

  const handleAddWithConfig = (exerciseWithConfig) => {
    if (context === 'create-routine') {
      addExerciseToRoutine(exerciseWithConfig);
    } else if (context === 'active-workout') {
      addExerciseToWorkout(exerciseWithConfig);
    }
    setShowConfig(false);
    setSelectedExercise(null);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add Exercise</Text>
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
          <Text style={[styles.filterBtn, (selectedCategory || selectedEquipment || selectedTarget) && styles.filterActive]}>
            Filter {(selectedCategory || selectedEquipment || selectedTarget) ? '●' : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#666" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor="#666"
          value={query}
          onChangeText={handleQueryChange}
          autoFocus
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]) }}>
            <Ionicons name="close-circle" size={18} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          {/* Target Muscle Filter */}
          <Text style={styles.filterLabel}>Muscle Group</Text>
          <FlatList
            horizontal
            data={TARGETS}
            keyExtractor={item => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.filterChip, selectedTarget === item && styles.filterChipActive]}
                onPress={() => handleFilterSelect('target', item)}
              >
                <Text style={[styles.filterChipText, selectedTarget === item && styles.filterChipTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />

          {/* Equipment Filter */}
          <Text style={styles.filterLabel}>Equipment</Text>
          <FlatList
            horizontal
            data={EQUIPMENT}
            keyExtractor={item => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.filterChip, selectedEquipment === item && styles.filterChipActive]}
                onPress={() => handleFilterSelect('equipment', item)}
              >
                <Text style={[styles.filterChipText, selectedEquipment === item && styles.filterChipTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />

          {/* Category Filter */}
          <Text style={styles.filterLabel}>Category</Text>
          <FlatList
            horizontal
            data={CATEGORIES}
            keyExtractor={item => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.filterChip, selectedCategory === item && styles.filterChipActive]}
                onPress={() => handleFilterSelect('category', item)}
              >
                <Text style={[styles.filterChipText, selectedCategory === item && styles.filterChipTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Results */}
      {isLoading ? (
        <ActivityIndicator color="#DC2626" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.exercise_id}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {query.length >= 2 ? 'No exercises found' : 'Search for an exercise above'}
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.exerciseRow}
              onPress={() => handleSelectExercise(item)}
            >
              <Image
                source={{ uri: item.gif_url }}
                style={styles.exerciseGif}
                resizeMode="cover"
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.exerciseName}>{item.name}</Text>
                <Text style={styles.exerciseMeta}>
                  {item.target} · {item.equipment}
                </Text>
              </View>
              <Ionicons name="add-circle" size={24} color="#DC2626" />
            </TouchableOpacity>
          )}
        />
      )}

      <ExerciseConfigSheet
        exercise={selectedExercise}
        visible={showConfig}
        onClose={() => {
          setShowConfig(false);
          setSelectedExercise(null);
        }}
        onAdd={handleAddWithConfig}
        context={context}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  cancel: { color: '#999', fontSize: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  filterBtn: { color: '#999', fontSize: 15 },
  filterActive: { color: '#DC2626' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', marginHorizontal: 16, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8, marginTop: 12, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, color: '#fff', fontSize: 15 },
  filtersContainer: { backgroundColor: '#111', paddingTop: 8, marginBottom: 8 },
  filterLabel: { color: '#666', fontSize: 12, paddingHorizontal: 16, marginBottom: 4, marginTop: 4 },
  filterChip: { backgroundColor: '#1a1a1a', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: '#333' },
  filterChipActive: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  filterChipText: { color: '#999', fontSize: 13 },
  filterChipTextActive: { color: '#fff', fontWeight: '600' },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a', gap: 12 },
  exerciseGif: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#1a1a1a' },
  exerciseName: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 2 },
  exerciseMeta: { color: '#999', fontSize: 12 },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 60, fontSize: 15 },
});
