import "react-native-reanimated";
import { Stack } from "expo-router";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import BottomNav from "./_components/BottomNav";
import { useWorkoutStore } from "../stores/workoutStore";

export default function Layout() {
  const isWorkoutActive = useWorkoutStore(state => state.isActive);

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
        {!isWorkoutActive && <BottomNav />}
      </View>
    </SafeAreaProvider>
  );
}
