import { Slot, useRouter } from "expo-router";
import { View, Pressable, Text, StyleSheet } from "react-native";

export default function MainLayout() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Slot />
      </View>

      <View style={styles.navRow}>
        <Pressable
          style={styles.navButton}
          onPress={() => router.push("/media/media-page")}
        >
          <Text style={styles.buttonText}>Media</Text>
        </Pressable>

        <Pressable
          style={styles.navButton}
          onPress={() => router.push("/my-workouts/my-workout-page")}
        >
          <Text style={styles.buttonText}>MyWorkouts</Text>
        </Pressable>

        <Pressable
          style={styles.navButton}
          onPress={() => router.push("/dashboard")}
        >
          <Text style={styles.buttonText}>Dashboard</Text>
        </Pressable>

        <Pressable style={styles.navButton}>
          <Text style={styles.buttonText}>Number 4</Text>
        </Pressable>

        <Pressable
          style={styles.navButton}
          onPress={() => router.push("/_profileCom/profile")}
        >
          <Text style={styles.buttonText}>Profile</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "white",
  },
  navButton: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: "#007BFF",
    borderRadius: 6,
    minWidth: 70,
    alignItems: "center",
    marginHorizontal: 4,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
});