import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, spacing } from '../../lib/theme';
import { deleteWorkoutLog } from '../../lib/workoutApi';
import { useWorkoutStore } from '../../stores/workoutStore';

const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0');

  return hours > 0 ? `${hours}:${minutes}:${remainingSeconds}` : `${minutes}:${remainingSeconds}`;
};

export default function ActiveWorkoutMiniWidget() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const pulseValue = useRef(new Animated.Value(1)).current;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const {
    activeLogId,
    activeWorkoutName,
    activeWorkoutStartTime,
    exercises,
    endWorkout,
    hasWorkoutActivity,
  } = useWorkoutStore();

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.35,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [pulseValue]);

  useEffect(() => {
    const updateElapsedSeconds = () => {
      if (!activeWorkoutStartTime) {
        setElapsedSeconds(0);
        return;
      }

      const startTime = new Date(activeWorkoutStartTime).getTime();
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));
    };

    updateElapsedSeconds();
    const interval = setInterval(updateElapsedSeconds, 1000);
    return () => clearInterval(interval);
  }, [activeWorkoutStartTime]);

  const currentExerciseName = useMemo(() => {
    const currentExercise = exercises.find(ex => ex.sets?.some(set => !set.completed)) || exercises[0];
    return currentExercise?.name || 'No exercise added yet';
  }, [exercises]);

  const handleResume = () => {
    router.push('/activeWorkout');
  };

  const discardWorkout = () => {
    endWorkout();
    router.replace('/(tabs)/workouts');
    if (activeLogId) {
      deleteWorkoutLog(activeLogId).catch(e => {
        if (e.status !== 404) console.warn('Failed to delete workout log:', e.message);
      });
    }
  };

  const handleDiscard = () => {
    const activeWorkoutHasActivity = hasWorkoutActivity();

    Alert.alert(
      'Discard workout?',
      activeWorkoutHasActivity
        ? 'This workout in progress will be permanently deleted.'
        : 'This empty workout will be discarded without being saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: discardWorkout },
      ]
    );
  };

  return (
    <View style={[styles.widget, { bottom: insets.bottom + layout.bottomNavHeight + spacing.md }]}>
      <Pressable style={styles.resumeButton} onPress={handleResume}>
        <Ionicons name="chevron-up" size={24} color={colors.text} />
      </Pressable>

      <Pressable style={styles.info} onPress={handleResume}>
        <View style={styles.timerRow}>
          <Animated.View style={[styles.pulseDot, { transform: [{ scale: pulseValue }] }]} />
          <Text style={styles.timer}>{formatTime(elapsedSeconds)}</Text>
        </View>
        <Text style={styles.workoutName} numberOfLines={1}>{activeWorkoutName || 'Workout in Progress'}</Text>
        <Text style={styles.exerciseName} numberOfLines={1}>{currentExerciseName}</Text>
      </Pressable>

      <TouchableOpacity
        style={styles.discardButton}
        onPress={handleDiscard}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="trash" size={20} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  widget: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceLight,
  },
  resumeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  info: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  timer: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  workoutName: {
    marginTop: 2,
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  exerciseName: {
    marginTop: 1,
    color: colors.textSecondary,
    fontSize: 12,
  },
  discardButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
  },
});