import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, layout } from '../lib/theme';

export default function WorkoutComplete() {
  const { totalWorkouts, totalVolume } = useLocalSearchParams();

  const workouts = parseInt(totalWorkouts, 10) || 0;
  const volume = parseInt(totalVolume, 10) || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Ionicons name="trophy" size={72} color={colors.primary} style={styles.icon} />

        <Text style={styles.headline}>You're getting massive!</Text>

        <View style={styles.statsCard}>
          <Text style={styles.stat}>
            <Text style={styles.statNumber}>{workouts}</Text>
            {' '}workout{workouts !== 1 ? 's' : ''} completed
          </Text>
          <View style={styles.divider} />
          <Text style={styles.stat}>
            That's{' '}
            <Text style={styles.statNumber}>{volume.toLocaleString()}</Text>
            {' '}lbs lifted
          </Text>
        </View>
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
