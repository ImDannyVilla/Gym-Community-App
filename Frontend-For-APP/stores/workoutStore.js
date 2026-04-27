import { create } from 'zustand';

export const useWorkoutStore = create((set, get) => ({
  isActive: false,
  activeLogId: null,
  exercises: [],
  
  startWorkout: (log) => set({ isActive: true, activeLogId: log.id, exercises: log.exercises || [] }),
  endWorkout: () => set({ isActive: false, activeLogId: null, exercises: [] }),
  
  addExercise: (exerciseWithConfig) => {
    // Generate a unique ID for the exercise instance
    const newExercise = {
      ...exerciseWithConfig,
      id: Date.now().toString(),
      sets: Array.from({ length: exerciseWithConfig.target_sets || 3 }, (_, i) => ({
        id: Date.now().toString() + "-" + i,
        set_number: i + 1,
        reps: exerciseWithConfig.target_reps_max || "",
        weight_lbs: exerciseWithConfig.target_weight_lbs || "",
        completed: false,
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
            sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s)
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
            sets: ex.sets.map(s => s.id === setId ? { ...s, completed: !s.completed } : s)
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
          return {
            ...ex,
            sets: [
              ...ex.sets,
              { 
                id: Date.now().toString() + "-" + ex.sets.length, 
                set_number: ex.sets.length + 1, 
                reps: "", 
                weight_lbs: "", 
                completed: false 
              }
            ]
          };
        }
        return ex;
      })
    }));
  },
  
  clearExercises: () => set({ exercises: [] }),
}));
