import AsyncStorage from '@react-native-async-storage/async-storage';

export const CACHE_KEYS = {
  ROUTINES: 'cache_routines',
  WORKOUT_LOGS: 'cache_workout_logs',
  STREAK: 'cache_streak',
  PROFILE: 'cache_profile',
};

export const saveToCache = async (key, data) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify({ data, cachedAt: Date.now() }));
  } catch (e) {
    console.warn('Cache save failed:', e);
  }
};

export const loadFromCache = async (key) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const { data } = JSON.parse(raw);
    return data;
  } catch (e) {
    return null;
  }
};

export const clearCache = async () => {
  try {
    await AsyncStorage.multiRemove(Object.values(CACHE_KEYS));
  } catch (e) {
    console.warn('Cache clear failed:', e);
  }
};
