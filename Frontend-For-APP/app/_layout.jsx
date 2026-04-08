import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="community" />
      <Stack.Screen name="programs/chest" />
      <Stack.Screen name="programs/arms" />
      <Stack.Screen name="programs/legs" />
      <Stack.Screen name="programs/shoulders" />
      <Stack.Screen name="programs/cardio" />
      <Stack.Screen name="programs/workouts" />
      <Stack.Screen name="programs/upperlower" />
    </Stack>
  );
}
