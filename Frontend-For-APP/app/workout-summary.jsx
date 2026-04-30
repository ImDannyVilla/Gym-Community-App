import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  ActivityIndicator, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getWorkoutLog, saveLogAsRoutine } from '../lib/workoutApi';

const formatDuration = (seconds) => {
  if (!seconds) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
};

const formatDate = (isoString) => {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
};

export default function WorkoutSummary() {
  const { logId } = useLocalSearchParams();
  const [log, setLog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingRoutine, setIsSavingRoutine] = useState(false);

  const fetchLog = useCallback(async () => {
    try {
      const data = await getWorkoutLog(logId);
      setLog(data);
    } catch (e) {
      console.error('Failed to fetch workout log:', e.message);
      Alert.alert('Error', 'Failed to load workout summary.');
    } finally {
      setIsLoading(false);
    }
  }, [logId]);

  useEffect(() => {
    fetchLog();
  }, [fetchLog]);

  const handleSaveAsRoutine = async () => {
    setIsSavingRoutine(true);
    try {
      await saveLogAsRoutine(logId);
      Alert.alert('Saved!', 'Workout saved as a routine.');
    } catch (e) {
      console.error('Failed to save as routine:', e.message);
      Alert.alert('Error', 'Failed to save as routine.');
    } finally {
      setIsSavingRoutine(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#DC2626" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (!log) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorState}>
          <Text style={styles.errorText}>Unable to load workout summary.</Text>
          <Pressable style={styles.doneBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.doneBtnText}>Go Home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const completedSets = log.exercises.flatMap(ex => ex.sets.filter(s => s.completed));
  const totalSets = completedSets.length;
  const totalReps = completedSets.reduce((sum, s) => sum + (s.reps || 0), 0);
  const totalVolume = completedSets.reduce((sum, s) => sum + ((s.weight_lbs || 0) * (s.reps || 0)), 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="checkmark-circle" size={40} color="#DC2626" />
          <Text style={styles.workoutTitle}>{log.name}</Text>
          <Text style={styles.workoutDate}>{formatDate(log.completed_at || log.started_at)}</Text>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatDuration(log.duration)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalSets}</Text>
            <Text style={styles.statLabel}>Sets</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalReps}</Text>
            <Text style={styles.statLabel}>Reps</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalVolume > 0 ? `${Math.round(totalVolume).toLocaleString()}` : '—'}</Text>
            <Text style={styles.statLabel}>Volume (lbs)</Text>
          </View>
        </View>

        {/* Exercises */}
        {log.exercises.map((ex) => (
          <View key={ex.id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              {ex.gif_url ? (
                <Image source={{ uri: ex.gif_url }} style={styles.exerciseGif} contentFit="cover" />
              ) : (
                <View style={styles.exerciseGifPlaceholder}>
                  <Ionicons name="barbell-outline" size={24} color="#444" />
                </View>
              )}
              <Text style={styles.exerciseName}>{ex.name}</Text>
            </View>

            {ex.sets.filter(s => s.completed).map((set) => (
              <View key={set.id} style={styles.setRow}>
                <Text style={styles.setLabel}>Set {set.set_number}</Text>
                <Text style={styles.setDetails}>
                  {set.reps} reps @ {set.weight_lbs} lbs
                </Text>
              </View>
            ))}

            {ex.sets.filter(s => s.completed).length === 0 && (
              <Text style={styles.noSetsText}>No completed sets</Text>
            )}
          </View>
        ))}

        {/* Buttons */}
        <View style={styles.buttonSection}>
          {!log.routine_id && (
            <Pressable
              style={[styles.saveRoutineBtn, isSavingRoutine && { opacity: 0.6 }]}
              onPress={handleSaveAsRoutine}
              disabled={isSavingRoutine}
            >
              {isSavingRoutine
                ? <ActivityIndicator size="small" color="#DC2626" />
                : <Text style={styles.saveRoutineBtnText}>Save as Routine</Text>
              }
            </Pressable>
          )}

          <Pressable style={styles.doneBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.doneBtnText}>Done</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scroll: {
    padding: 20,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  workoutTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
    textAlign: 'center',
  },
  workoutDate: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
    textAlign: 'center',
  },
  exerciseCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseGif: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#2a2a2a',
  },
  exerciseGifPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  setLabel: {
    fontSize: 13,
    color: '#888',
  },
  setDetails: {
    fontSize: 13,
    color: '#ccc',
    fontWeight: '500',
  },
  noSetsText: {
    fontSize: 13,
    color: '#555',
    fontStyle: 'italic',
    marginTop: 4,
  },
  buttonSection: {
    marginTop: 12,
    gap: 12,
  },
  saveRoutineBtn: {
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveRoutineBtnText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
  },
  doneBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  errorText: {
    color: '#888',
    fontSize: 15,
  },
});
