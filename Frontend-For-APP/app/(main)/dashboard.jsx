import React from "react";
import { ScrollView, View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import WeekStrip from "./_dashboardCom/_Weekstrip";
import MuscleCard from "./_dashboardCom/_MuscleCard";

export default function Dashboard() {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.scrollContainer}
    >
      <Text style={styles.title}>Welcome to the Dashboard</Text>

      <View>
        <WeekStrip />
      </View>

      <View style={styles.grid}>
        <MuscleCard
          title="Upper/Lower"
          onPress={() => router.push("/programs/upperlower")}
        />
        <MuscleCard
          title="back"
          onPress={() => router.push("/programs/cardio")}
        />
      </View>

      <Pressable
        onPress={() => router.replace("/")}
        style={styles.logoutButton}
      >
        <Text style={styles.buttonText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 20,
    paddingBottom: 24,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "80%",
    alignSelf: "center",
    marginTop: 20,
    marginBottom: 20,
  },

  logoutButton: {
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#007BFF",
    borderRadius: 6,
  },

  buttonText: {
    color: "white",
    fontWeight: "600",
  },
});