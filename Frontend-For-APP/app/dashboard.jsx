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

      <WeekStrip />

      <View style={styles.grid}>
        <MuscleCard title="chest" onPress={() => {}} />
        <MuscleCard title="shoulders" onPress={() => {}} />
        <MuscleCard title="back" onPress={() => {}} />
        <MuscleCard title="arms" onPress={() => {}} />
        <MuscleCard title="legs" onPress={() => {}} />
        <MuscleCard title="core" onPress={() => {}} />
      </View>

      <Pressable onPress={() => router.replace("/")} style={styles.logoutButton}>
        <Text style={styles.buttonText}>Logout</Text>
      </Pressable>

      <View style={styles.navRow}>
        <Pressable style={styles.navButton}>
          <Text style={styles.buttonText}>Number 1</Text>
        </Pressable>

        <Pressable style={styles.navButton}>
          <Text style={styles.buttonText}>Number 2</Text>
        </Pressable>

        <Pressable style={styles.navButton}>
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

  navRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
    marginTop: 20,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },

  navButton: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: "#007BFF",
    borderRadius: 6,
    minWidth: 70,
    alignItems: "center",
  },

  buttonText: {
    color: "white",
    fontWeight: "600",
  },
});