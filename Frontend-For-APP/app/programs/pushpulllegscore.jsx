import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { Stack } from "expo-router";
import BottomNav from "../_components/BottomNav";

export default function PushPullLegs() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "Push-Pull-Legs/Core" }} />

      <View style={styles.content}>
        <Text style={styles.text}>Push Pull Legs Page</Text>
      </View>

      <BottomNav active="workouts" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 24,
    color: "#fff",
  },
});
