import { View, Text, StyleSheet } from "react-native";
import { Stack } from "expo-router";

export default function Chest() {
  return (
    <>
      <Stack.Screen options={{ title: "Cardio" }} />

      <View style={styles.container}>
        <Text style={styles.text}>Cardio Page</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 24,
  },
});
