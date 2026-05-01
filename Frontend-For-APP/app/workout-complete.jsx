import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, layout } from '../lib/theme';
import { getWorkoutLog } from '../lib/workoutApi';

export default function WorkoutComplete() {
  const { logId } = useLocalSearchParams();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!logId) { setStats({ exercises: 0, sets: 0, volume: 0 }); return; }
    getWorkoutLog(logId)
      .then(log => {
        const exerciseList = log.exercises ?? [];
        let sets = 0;
        let volume = 0;
        for (const ex of exerciseList) {
          for (const s of ex.sets ?? []) {
            if (s.completed) {
              sets++;
              volume += (s.weight_lbs || 0) * (s.reps || 0);
            }
          }
        }
        setStats({ exercises: exerciseList.length, sets, volume: Math.round(volume) });
      })
      .catch(() => setStats({ exercises: 0, sets: 0, volume: 0 }));
  }, [logId]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Ionicons name="trophy" size={72} color={colors.primary} style={styles.icon} />

        <Text style={styles.headline}>You're getting massive!</Text>

        {!stats ? (
          <ActivityIndicator color={colors.primary} size="large" />
        ) : (
          <View style={styles.statsCard}>
            <Text style={styles.stat}>
              <Text style={styles.statNumber}>{stats.exercises}</Text>
              {' '}exercise{stats.exercises !== 1 ? 's' : ''} performed
            </Text>
            <View style={styles.divider} />
            <Text style={styles.stat}>
              <Text style={styles.statNumber}>{stats.sets}</Text>
              {' '}set{stats.sets !== 1 ? 's' : ''} completed
            </Text>
            <View style={styles.divider} />
            <Text style={styles.stat}>
              <Text style={styles.statNumber}>{stats.volume.toLocaleString()}</Text>
              {' '}lbs lifted
            </Text>
          </View>
        )}
      </View>

      <Pressable
        style={styles.doneBtn}
        onPress={() => router.replace('/(tabs)/community')}
      >
        <Text style={styles.doneBtnText}>Done</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  icon: { marginBottom: 24 },
  headline: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 36,
  },
  statsCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: layout.borderRadius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: 16,
  },
  stat: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  doneBtn: {
    margin: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: layout.borderRadius,
    paddingVertical: 18,
    alignItems: 'center',
  },
  doneBtnText: { color: '#000', fontSize: 17, fontWeight: '800' },
});
