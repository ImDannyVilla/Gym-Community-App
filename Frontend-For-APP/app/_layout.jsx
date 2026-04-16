import "react-native-reanimated";
import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="programs/chest" />
      <Stack.Screen name="programs/arms" />
      <Stack.Screen name="programs/legs" />
      <Stack.Screen name="programs/shoulders" />
      <Stack.Screen name="programs/cardio" />
      <Stack.Screen name="programs/workouts" />
      <Stack.Screen name="activeWorkout" />
    </Stack>
  );
}
