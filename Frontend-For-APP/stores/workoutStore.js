import { create } from 'zustand';
import { getAuthHeader, API_BASE_URL } from '../lib/api';

export const useWorkoutStore = create((set, get) => ({
  isActive: false,
  activeLogId: null,
  pendingExercises: [],
  
  startWorkout: (logId) => set({ isActive: true, activeLogId: logId, pendingExercises: [] }),
  endWorkout: () => set({ isActive: false, activeLogId: null, pendingExercises: [] }),
  
  addExercise: async (exerciseWithConfig) => {
    const { activeLogId } = get();
    
    if (!activeLogId) {
      console.error('No active workout log ID');
      return;
    }

    // Build sets array from config
    const sets = Array.from({ length: exerciseWithConfig.target_sets || 3 }, (_, i) => ({
      set_number: i + 1,
      reps: exerciseWithConfig.target_reps_max || 8,
      weight_lbs: parseFloat(exerciseWithConfig.target_weight_lbs) || 0.0,
      completed: false,
    }));

    try {
      const authHeader = await getAuthHeader();
      const response = await fetch(
        `${API_BASE_URL}/workout-logs/${activeLogId}/exercises`,
        {
          method: 'POST',
          headers: {
            ...authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            exercise_id: exerciseWithConfig.exercise_id,
            name: exerciseWithConfig.name,
            category: exerciseWithConfig.category,
            target: exerciseWithConfig.target,
            equipment: exerciseWithConfig.equipment,
            gif_url: exerciseWithConfig.gif_url,
            order: get().pendingExercises.length + 1,
            sets: sets,
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to add exercise:', error);
        return;
      }

      const updatedLog = await response.json();
      // Update local state with exercises from backend response
      set({ pendingExercises: updatedLog.exercises || [] });

    } catch (error) {
      console.error('Add exercise error:', error);
    }
  },
  
  clearPendingExercises: () => set({ pendingExercises: [] }),
}));
