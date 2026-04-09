import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { colors, layout } from "../lib/theme";
import MuscleCard from "./_dashboardCom/_MuscleCard";
import BottomNav from "./_components/BottomNav";
import Header from "./_components/Header";

const chestImage = require("../assets/Chest.png");
const armsImage = require("../assets/Arms.png");
const legsImage = require("../assets/Legs.png");
const shouldersImage = require("../assets/Shoulders.png");
const cardioImage = require("../assets/Cardio.png");
const workoutsImage = require("../assets/workouts_clean.png");

const muscles = [
  { id: 1, title: "Chest", image: chestImage, route: "/programs/chest" },
  { id: 2, title: "Arms", image: armsImage, route: "/programs/arms" },
  { id: 3, title: "Legs", image: legsImage, route: "/programs/legs" },
  { id: 4, title: "Shoulders", image: shouldersImage, route: "/programs/shoulders" },
  { id: 5, title: "Cardio", image: cardioImage, route: "/programs/cardio" },
  { id: 6, title: "Workouts", image: workoutsImage, route: "/programs/workouts" },
];

export default function Dashboard() {
  return (
    <View style={styles.container}>
      <Header title="Muscle Groups" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {muscles.map((muscle) => (
            <MuscleCard
              key={muscle.id}
              title={muscle.title}
              image={muscle.image}
              onPress={() => router.push(muscle.route)}
            />
          ))}
        </View>
      </ScrollView>

      <BottomNav active="dashboard" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: layout.bottomSafeArea,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
});
