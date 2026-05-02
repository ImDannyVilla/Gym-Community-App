import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { discardWorkoutLog } from '../lib/workoutApi';

const hasStartedWorkout = (exercises = []) => (
  exercises.some(ex => ex.sets?.some(set => set.started || set.completed))
);

export const useWorkoutStore = create(persist((set, get) => ({
  hasHydrated: false,
  isActive: false,
  activeLogId: null,
  activeWorkoutName: null,
  activeWorkoutStartTime: null,
  activeRoutineId: null,
  exercises: [],
  needsProfileRefresh: false,

  // Non-persisted UI cache — avoids refetch on every tab switch
  cachedRoutines: [],
  cachedStats: { totalWorkouts: 0, setsDone: 0, dayStreak: 0 },
  cachedProfile: null,
  cachedWorkoutLogs: [],
  cachedDayStreak: 0,
  cachedSeededWorkouts: [],

  setHasHydrated: (hasHydrated) => set({ hasHydrated }),
  clearProfileRefresh: () => set({ needsProfileRefresh: false }),
  setCachedRoutines: (routines) => set({ cachedRoutines: routines }),
  setCachedStats: (stats) => set({ cachedStats: stats }),
  setCachedProfile: (profile) => set({ cachedProfile: profile }),
  setCachedWorkoutLogs: (logs) => set({ cachedWorkoutLogs: logs }),
  setCachedDayStreak: (streak) => set({ cachedDayStreak: streak }),
  setCachedSeededWorkouts: (workouts) => set({ cachedSeededWorkouts: workouts }),
  
  startWorkout: (log, startTime = null) => set({
    isActive: true,
    activeLogId: log.id,
    activeWorkoutName: log.name,
    activeWorkoutStartTime: startTime || log.started_at || Date.now(),
    activeRoutineId: log.routine_id || null,
    exercises: log.exercises || []
  }),

  setWorkoutName: (name) => set({ activeWorkoutName: name }),

  hasWorkoutActivity: () => hasStartedWorkout(get().exercises),

  endWorkout: () => set({
    isActive: false,
    activeLogId: null,
    activeWorkoutName: null,
    activeWorkoutStartTime: null,
    activeRoutineId: null,
    exercises: [],
    needsProfileRefresh: true,
  }),
  
  addExercise: (exerciseWithConfig) => {
    const isActiveWorkoutAdd = exerciseWithConfig.workout_mode === true;
    const setCount = isActiveWorkoutAdd ? 1 : exerciseWithConfig.target_sets || 3;
    const exerciseInstanceId = Date.now().toString();

    // Generate a unique ID for the exercise instance
    const newExercise = {
      ...exerciseWithConfig,
      id: exerciseInstanceId,
      sets: Array.from({ length: setCount }, (_, i) => ({
        id: `${exerciseInstanceId}-${i}`,
        set_number: i + 1,
        reps: isActiveWorkoutAdd ? "" : exerciseWithConfig.target_reps_max || "",
        weight_lbs: isActiveWorkoutAdd ? "" : exerciseWithConfig.target_weight_lbs || "",
        completed: false,
        warmup: false,
        started: false,
      }))
    };
    
    set((state) => ({
      exercises: [...state.exercises, newExercise]
    }));
  },
  
  updateSet: (exerciseId, setId, field, value) => {
    set((state) => ({
      exercises: state.exercises.map(ex => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value, started: true } : s)
          };
        }
        return ex;
      })
    }));
  },
  
  toggleSetComplete: (exerciseId, setId) => {
    set((state) => ({
      exercises: state.exercises.map(ex => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            sets: ex.sets.map(s => s.id === setId ? { ...s, completed: !s.completed, started: true } : s)
          };
        }
        return ex;
      })
    }));
  },
  
  addSet: (exerciseId) => {
    set((state) => ({
      exercises: state.exercises.map(ex => {
        if (ex.id === exerciseId) {
          const setId = `${Date.now()}-${ex.sets.length}`;
          return {
            ...ex,
            sets: [
              ...ex.sets,
              { 
                id: setId,
                set_number: ex.sets.length + 1, 
                reps: "", 
                weight_lbs: "", 
                completed: false,
                warmup: false,
                started: false,
              }
            ]
          };
        }
        return ex;
      })
    }));
  },

  removeSet: (exerciseId, setId) => {
    set((state) => ({
      exercises: state.exercises.map(ex => {
        if (ex.id !== exerciseId) return ex;

        const remainingSets = ex.sets.filter(s => s.id !== setId);

        return {
          ...ex,
          sets: remainingSets.map((s, index) => ({
            ...s,
            set_number: index + 1,
          })),
        };
      })
    }));
  },

  toggleWarmupSet: (exerciseId, setId) => {
    set((state) => ({
      exercises: state.exercises.map(ex => {
        if (ex.id !== exerciseId) return ex;

        return {
          ...ex,
          sets: ex.sets.map(s => s.id === setId ? { ...s, warmup: !s.warmup } : s),
        };
      })
    }));
  },
  
  removeExercise: (exerciseId) => {
    set((state) => ({
      exercises: state.exercises.filter(ex => ex.id !== exerciseId)
    }));
  },

  clearExercises: () => set({ exercises: [] }),
}), {
  name: 'active-workout-storage',
  storage: createJSONStorage(() => AsyncStorage),
  partialize: (state) => ({
    isActive: state.isActive,
    activeLogId: state.activeLogId,
    activeWorkoutName: state.activeWorkoutName,
    activeWorkoutStartTime: state.activeWorkoutStartTime,
    activeRoutineId: state.activeRoutineId,
    exercises: state.exercises,
  }),
  onRehydrateStorage: () => (state) => {
    if (!state) return;
    state.setHasHydrated(true);
    const purgeStaleLog = (logId) => {
      if (!logId) return;
      // Best-effort backend cleanup so abandoned WorkoutLog rows don't
      // accumulate indefinitely. The user isn't around to retry — errors
      // are intentionally swallowed.
      discardWorkoutLog(logId).catch(() => {});
    };
    if (state.isActive && state.activeWorkoutStartTime) {
      const age = Date.now() - new Date(state.activeWorkoutStartTime).getTime();
      if (age > 12 * 60 * 60 * 1000) {
        purgeStaleLog(state.activeLogId);
        state.endWorkout();
      }
    } else if (state.isActive && !state.activeWorkoutStartTime) {
      purgeStaleLog(state.activeLogId);
      state.endWorkout();
    }
  },
}));
