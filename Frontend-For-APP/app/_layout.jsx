import "react-native-reanimated";
import { Stack, useRouter, useSegments, usePathname } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import ActiveWorkoutMiniWidget from "./_components/ActiveWorkoutMiniWidget";
import BottomNav from "./_components/BottomNav";
import { useWorkoutStore } from "../stores/workoutStore";
import { getToken } from "../lib/tokenStorage";
import { useEffect, useState, useCallback } from "react";

export default function Layout() {
  const isWorkoutActive = useWorkoutStore(state => state.isActive);
  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const isActiveWorkoutScreen = pathname === '/activeWorkout';
  const isWorkoutSummaryScreen = pathname === '/workout-summary';
  const isWorkoutLogDetailScreen = pathname === '/workout-log-detail';
  const isPostWorkoutShareScreen = pathname === '/post-workout-share';

  // Re-check auth token whenever the route changes (covers post-login/register navigation)
  const checkAuth = useCallback(async () => {
    const token = await getToken();
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [pathname, checkAuth]);

  useEffect(() => {
    if (isAuthenticated === null) return;
    
    const authScreens = ['index', 'signup', 'forgot-password', 'forgot-email'];
    const inAuthGroup = authScreens.includes(segments[0]) || segments.length === 0;
    
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/workouts');
    }
  }, [isAuthenticated, segments]);

  if (isAuthenticated === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="forgot-email" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="explore" />
          <Stack.Screen name="programs/chest" />
          <Stack.Screen name="programs/arms" />
          <Stack.Screen name="programs/legs" />
          <Stack.Screen name="programs/shoulders" />
          <Stack.Screen name="programs/cardio" />
          <Stack.Screen name="programs/workouts" />
          <Stack.Screen name="programs/pushpulllegscore" />
          <Stack.Screen name="activeWorkout" />
          <Stack.Screen name="create-routine" />
          <Stack.Screen name="exercise-search" />
          <Stack.Screen name="exercise-history" />
          <Stack.Screen name="workout-summary" />
          <Stack.Screen name="workout-log-detail" />
          <Stack.Screen name="post-workout-share" />
          <Stack.Screen name="user-search" />
          <Stack.Screen name="user-profile" />
        </Stack>
        {isWorkoutActive && isAuthenticated && !isActiveWorkoutScreen && !isWorkoutSummaryScreen && !isWorkoutLogDetailScreen && !isPostWorkoutShareScreen && <ActiveWorkoutMiniWidget />}
        {isAuthenticated && !isActiveWorkoutScreen && !isWorkoutSummaryScreen && !isWorkoutLogDetailScreen && !isPostWorkoutShareScreen && <BottomNav />}
      </View>
    </SafeAreaProvider>
  );
}
