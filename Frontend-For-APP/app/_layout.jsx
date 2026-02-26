import { Stack } from "expo-router";
import { View } from "react-native";
export default function Layout() {
  return (
      <View style={{ flex: 1, backgroundColor: "rgb(238, 238, 238)" }}>
        <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="dashboard" options={{ title: "Dashboard" }} />
            <Stack.Screen name="signup" options={{ title: "Sign-Up"}} />
        </Stack>
      </View>
  );
}
