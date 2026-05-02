import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWorkoutStore } from '../../stores/workoutStore';
import { colors, spacing, layout } from '../../lib/theme';

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export default function ActiveWorkoutMiniWidget() {
  const { activeWorkoutName, activeWorkoutStartTime } = useWorkoutStore();
  const insets = useSafeAreaInsets();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Number(activeWorkoutStartTime) || Date.now();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeWorkoutStartTime]);

  return (
    <Pressable
      style={[styles.widget, { bottom: insets.bottom + layout.bottomNavHeight + spacing.sm }]}
      onPress={() => router.push('/activeWorkout')}
    >
      <View style={styles.indicator} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {activeWorkoutName || 'Active Workout'}
        </Text>
        <Text style={styles.timer}>{formatTime(elapsed)}</Text>
      </View>
      <Ionicons name="chevron-up" size={18} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  widget: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  timer: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
});
