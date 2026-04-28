import "react-native-reanimated";
import { Stack, useRouter, useSegments, usePathname } from "expo-router";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import BottomNav from "./_components/BottomNav";
import { useWorkoutStore } from "../stores/workoutStore";
import { getToken, removeToken } from "../lib/tokenStorage";
import { API_BASE_URL } from "../lib/api";
import { useEffect, useState, useCallback } from "react";

export default function Layout() {
  const isWorkoutActive = useWorkoutStore(state => state.isActive);
  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();
  // Start as false so login screen renders immediately (not a blank screen)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  // Check token exists AND is still valid by hitting /users/me
  const checkAuth = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setIsAuthenticated(false);
      setHasCheckedAuth(true);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setIsAuthenticated(true);
      } else {
        // Token is expired or invalid — clear it
        await removeToken();
        setIsAuthenticated(false);
      }
    } catch {
      // Network error — keep token but don't auto-redirect
      // User will see login, can retry
      setIsAuthenticated(false);
    }
    setHasCheckedAuth(true);
  }, []);

  // Check auth on mount and whenever the pathname changes to an auth screen
  // (i.e., after login calls router.replace, or after logout)
  useEffect(() => {
    const authScreens = ['/', '/signup', '/forgot-password', '/forgot-email'];
    // Only validate token on mount or when arriving at an auth screen (post-login/logout)
    if (!hasCheckedAuth || authScreens.includes(pathname) || pathname.includes('/workouts')) {
      checkAuth();
    }
  }, [pathname]);

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
