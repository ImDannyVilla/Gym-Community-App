import "react-native-reanimated";
import { Stack, useRouter, useSegments, usePathname } from "expo-router";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import BottomNav from "./_components/BottomNav";
import { useWorkoutStore } from "../stores/workoutStore";
import { getToken } from "../lib/tokenStorage";
import { useEffect, useState, useCallback } from "react";

export default function Layout() {
  const isWorkoutActive = useWorkoutStore(state => state.isActive);
  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();
  // Start as false so login screen renders immediately (not a blank screen)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  // Re-check auth token whenever the route changes (covers post-login/register navigation)
  const checkAuth = useCallback(async () => {
    const token = await getToken();
    setIsAuthenticated(!!token);
    setHasCheckedAuth(true);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [pathname, checkAuth]);

  useEffect(() => {
    if (!hasCheckedAuth) return;
    
    const authScreens = ['index', 'signup', 'forgot-password', 'forgot-email'];
    const inAuthGroup = authScreens.includes(segments[0]) || segments.length === 0;
    
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/workouts');
    }
  }, [isAuthenticated, hasCheckedAuth, segments]);

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
        </Stack>
        {!isWorkoutActive && isAuthenticated && <BottomNav />}
      </View>
    </SafeAreaProvider>
  );
}
