import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, ScrollView, TextInput, Dimensions
} from 'react-native';
import { Image } from 'expo-image';
import { colors } from '../../lib/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const REST_OPTIONS = [
  { label: 'Off', value: null },
  { label: '30s', value: 30 },
  { label: '45s', value: 45 },
  { label: '60s', value: 60 },
  { label: '90s', value: 90 },
  { label: '2 min', value: 120 },
  { label: '3 min', value: 180 },
  { label: '5 min', value: 300 },
];

export default function ExerciseConfigSheet({ exercise, visible, onClose, onAdd, context, isEditing = false }) {
  const [sets, setSets] = useState(exercise?.target_sets ?? 3);
  const [weightLbs, setWeightLbs] = useState(exercise?.target_weight_lbs?.toString() ?? '');
  const [reps, setReps] = useState(exercise?.target_reps?.toString() ?? '10');
  const [restSeconds, setRestSeconds] = useState(exercise?.rest_seconds ?? null);

  useEffect(() => {
    if (exercise) {
      setSets(exercise.target_sets ?? 3);
      setWeightLbs(exercise.target_weight_lbs?.toString() ?? '');
      setReps(exercise.target_reps?.toString() ?? '10');
      setRestSeconds(exercise.rest_seconds ?? null);
    }
  }, [exercise]);

  if (!exercise) return null;

  const handleAdd = () => {
    onAdd({
      exercise_id: exercise.exercise_id,
      name: exercise.name,
      gif_url: exercise.gif_url,
      category: exercise.category,
      target: exercise.target,
      equipment: exercise.equipment,
      target_sets: sets,
      target_reps: parseInt(reps) || 10,
      target_weight_lbs: weightLbs ? parseInt(weightLbs) : null,
      notes: restSeconds ? `Rest ${restSeconds}s` : null,
      rest_seconds: restSeconds,
    });

    setSets(3);
    setWeightLbs('');
    setReps('10');
    setRestSeconds(null);
    onClose();
  };

  const buttonLabel = context === 'active-workout' ? 'Add to Workout' : 'Add to Routine';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={styles.sheet}>
        <View style={styles.handle} />

        {/* Exercise Header */}
        <View style={styles.exerciseHeader}>
          <Image
            source={{ uri: exercise.gif_url }}
            style={styles.exerciseGif}
            contentFit="cover"
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.exerciseName} numberOfLines={2}>
              {exercise.name}
            </Text>
            <Text style={styles.exerciseMeta}>
              {exercise.target} · {exercise.equipment}
            </Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Sets */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Sets</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setSets(Math.max(1, sets - 1))}
              >
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.stepValue}>{sets}</Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setSets(Math.min(20, sets + 1))}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Reps */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Reps</Text>
            <View style={styles.repRangeRow}>
              <TextInput
                style={styles.repInput}
                value={reps}
                onChangeText={setReps}
                keyboardType="number-pad"
                placeholder="10"
                placeholderTextColor="#666"
                maxLength={3}
              />
              <Text style={styles.repUnit}>reps</Text>
            </View>
          </View>

          {/* Weight */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Starting Weight <Text style={styles.optional}>(optional)</Text></Text>
            <View style={styles.weightRow}>
              <TextInput
                style={styles.weightInput}
                value={weightLbs}
                onChangeText={setWeightLbs}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor="#666"
                maxLength={6}
              />
              <Text style={styles.weightUnit}>lbs</Text>
            </View>
          </View>

          {/* Rest Timer */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              Rest Timer <Text style={styles.optional}>(default: Off)</Text>
            </Text>
            <View style={styles.restGrid}>
              {REST_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.label}
                  style={[
                    styles.restChip,
                    restSeconds === opt.value && styles.restChipActive
                  ]}
                  onPress={() => setRestSeconds(opt.value)}
                >
                  <Text style={[
                    styles.restChipText,
                    restSeconds === opt.value && styles.restChipTextActive
                  ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

        </ScrollView>

        {/* Add Button */}
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Text style={styles.addBtnText}>{buttonLabel}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#111',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.85,
    paddingHorizontal: 16,
    paddingBottom: 34,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
  },
  exerciseGif: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#222',
  },
  exerciseName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  exerciseMeta: {
    color: '#999',
    fontSize: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  optional: {
    color: '#666',
    fontSize: 13,
    fontWeight: '400',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  stepBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '300',
  },
  stepValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    minWidth: 40,
    textAlign: 'center',
  },
  repRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  repInput: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    borderRadius: 10,
    padding: 12,
    width: 70,
    textAlign: 'center',
  },
  repUnit: {
    color: '#666',
    fontSize: 14,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weightInput: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    borderRadius: 10,
    padding: 12,
    width: 100,
    textAlign: 'center',
  },
  weightUnit: {
    color: '#666',
    fontSize: 14,
  },
  restGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  restChip: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  restChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  restChipText: {
    color: '#999',
    fontSize: 14,
  },
  restChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
