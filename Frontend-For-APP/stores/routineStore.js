import { create } from 'zustand';

export const useRoutineStore = create((set, get) => ({
  pendingExercises: [],

  addExercise: (exercise) => set(state => ({
    pendingExercises: [...state.pendingExercises, exercise]
  })),

  updateExercise: (index, updatedExercise) => set(state => ({
    pendingExercises: state.pendingExercises.map((ex, i) =>
      i === index ? { ...ex, ...updatedExercise } : ex
    )
  })),

  removeExercise: (index) => set(state => ({
    pendingExercises: state.pendingExercises.filter((_, i) => i !== index)
  })),

  clearExercises: () => set({ pendingExercises: [] }),
}));
