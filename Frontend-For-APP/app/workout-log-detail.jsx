import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getWorkoutLog, getExerciseRecords } from '../lib/workoutApi';

const formatDate = (isoString) => {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
};

const formatDuration = (seconds) => {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
};

const detectPRs = (exercise, records) => {
  const completedSets = (exercise.sets || []).filter(s => s.completed);
  if (!completedSets.length) return { newWeightPR: false, newRepsPR: false, newVolumePR: false };

  const maxWeight = Math.max(...completedSets.map(s => s.weight_lbs || 0));
  const maxReps = Math.max(...completedSets.map(s => s.reps || 0));
  const totalVolume = completedSets.reduce((sum, s) => sum + (s.weight_lbs || 0) * (s.reps || 0), 0);

  if (!records) {
    return {
      newWeightPR: maxWeight > 0,
      newRepsPR: maxReps > 0,
      newVolumePR: totalVolume > 0,
      maxWeight,
      maxReps,
    };
  }

  return {
    newWeightPR: maxWeight > 0 && maxWeight >= records.best_weight_lbs,
    newRepsPR: maxReps > 0 && maxReps >= records.best_reps,
    newVolumePR: totalVolume > 0 && totalVolume >= records.best_volume,
    maxWeight,
    maxReps,
  };
};

export default function WorkoutLogDetail() {
  const { logId } = useLocalSearchParams();
  const [log, setLog] = useState(null);
  const [recordsMap, setRecordsMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const logData = await getWorkoutLog(logId);
      setLog(logData);

      const recordResults = await Promise.allSettled(
        logData.exercises.map(ex => getExerciseRecords(ex.exercise_id))
      );

      const map = {};
      logData.exercises.forEach((ex, i) => {
        const r = recordResults[i];
        map[ex.exercise_id] = r.status === 'fulfilled' ? r.value : null;
      });
      setRecordsMap(map);
    } catch (e) {
      console.error('Failed to load workout detail:', e.message);
      Alert.alert('Error', 'Failed to load workout detail.');
    } finally {
      setIsLoading(false);
    }
  }, [logId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingHeader}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
        </View>
        <ActivityIndicator size="large" color="#DC2626" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (!log) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingHeader}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
        </View>
        <View style={styles.errorState}>
          <Text style={styles.errorText}>Could not load this workout.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const exercisesWithPRs = log.exercises.map(ex => ({
    ...ex,
    prs: detectPRs(ex, recordsMap[ex.exercise_id]),
  }));

  const totalPRCount = exercisesWithPRs.filter(
    ex => ex.prs.newWeightPR || ex.prs.newRepsPR
  ).length;

  const completedSets = log.exercises.flatMap(ex => (ex.sets || []).filter(s => s.completed));
  const totalSets = completedSets.length;
  const totalReps = completedSets.reduce((sum, s) => sum + (s.reps || 0), 0);
  const totalVolume = completedSets.reduce((sum, s) => sum + (s.weight_lbs || 0) * (s.reps || 0), 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{log.name}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.dateText}>{formatDate(log.completed_at || log.started_at)}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statChipValue}>
              {log.completed_at ? formatDuration(log.duration) || '—' : 'Incomplete'}
            </Text>
            <Text style={styles.statChipLabel}>Duration</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statChipValue}>{log.exercises.length}</Text>
            <Text style={styles.statChipLabel}>Exercises</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={styles.statChipValue}>{totalSets}</Text>
            <Text style={styles.statChipLabel}>Sets</Text>
          </View>
          <View style={styles.statChip}>
            <Text style={[styles.statChipValue, styles.volumeValue]}>
              {totalVolume > 0 ? Math.round(totalVolume).toLocaleString() : '—'}
            </Text>
            <Text style={styles.statChipLabel}>lbs vol.</Text>
          </View>
        </View>

        {totalPRCount > 0 && (
          <View style={styles.prBanner}>
            <Text style={styles.prBannerText}>
              🏆 You hit {totalPRCount} personal record{totalPRCount > 1 ? 's' : ''} this workout!
            </Text>
          </View>
        )}

        {exercisesWithPRs.map(ex => {
          const completedExSets = (ex.sets || []).filter(s => s.completed);
          const hasPR = ex.prs.newWeightPR || ex.prs.newRepsPR;

          return (
            <View key={ex.id} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                {ex.gif_url ? (
                  <Image
                    source={{ uri: ex.gif_url }}
                    style={styles.exerciseGif}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.exerciseGifPlaceholder}>
                    <Ionicons name="barbell-outline" size={20} color="#555" />
                  </View>
                )}
                <View style={styles.exerciseTitleWrap}>
                  <Text style={styles.exerciseName}>{ex.name}</Text>
                  {hasPR && (
                    <View style={styles.prBadge}>
                      <Text style={styles.prBadgeText}>🏆 PR</Text>
                    </View>
                  )}
                </View>
              </View>

              {completedExSets.length > 0 ? (
                <View style={styles.setsTable}>
                  <View style={[styles.setRow, styles.setsHeader]}>
                    <Text style={[styles.setCell, styles.setHeaderText]}>SET</Text>
                    <Text style={[styles.setCell, styles.setHeaderText]}>REPS</Text>
                    <Text style={[styles.setCell, styles.setHeaderText]}>WEIGHT</Text>
                    <Text style={[styles.setCell, styles.setHeaderText]}>VOLUME</Text>
                  </View>
                  {completedExSets.map((set, idx) => (
                    <View
                      key={set.id}
                      style={[styles.setRow, idx % 2 === 0 ? styles.setRowEven : styles.setRowOdd]}
                    >
                      <Text style={styles.setCell}>{set.set_number}</Text>
                      <Text style={styles.setCell}>{set.reps}</Text>
                      <Text style={styles.setCell}>{set.weight_lbs} lbs</Text>
                      <Text style={[styles.setCell, styles.volumeCell]}>
                        {((set.reps || 0) * (set.weight_lbs || 0)).toFixed(0)} lbs
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noSetsText}>No completed sets</Text>
              )}

              {ex.prs.newWeightPR && (
                <Text style={styles.prDetail}>🏆 New weight PR: {ex.prs.maxWeight} lbs</Text>
              )}
              {ex.prs.newRepsPR && !ex.prs.newWeightPR && (
                <Text style={styles.prDetail}>🏆 New reps PR: {ex.prs.maxReps} reps</Text>
              )}
            </View>
          );
        })}

        {log.exercises.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No exercises logged.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  backBtn: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSpacer: {
    width: 32,
  },
  scroll: {
    padding: 16,
    paddingBottom: 48,
  },
  dateText: {
    fontSize: 13,
    color: '#888',
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statChip: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statChipValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  statChipLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  volumeValue: {
    color: '#DC2626',
  },
  prBanner: {
    backgroundColor: '#78350F',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    alignItems: 'center',
  },
  prBannerText: {
    color: '#F59E0B',
    fontSize: 15,
    fontWeight: '700',
  },
  exerciseCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseGif: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#2a2a2a',
  },
  exerciseGifPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  prBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  prBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a0a00',
  },
  setsTable: {
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 6,
  },
  setsHeader: {
    backgroundColor: '#111',
  },
  setRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  setRowEven: {
    backgroundColor: '#111',
  },
  setRowOdd: {
    backgroundColor: '#1a1a1a',
  },
  setHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#666',
    textTransform: 'uppercase',
  },
  setCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    color: '#ccc',
  },
  volumeCell: {
    color: '#DC2626',
    fontWeight: '600',
  },
  noSetsText: {
    fontSize: 13,
    color: '#555',
    fontStyle: 'italic',
  },
  prDetail: {
    fontSize: 13,
    color: '#F59E0B',
    fontWeight: '600',
    marginTop: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#666',
    fontSize: 14,
  },
});
