import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { colors, layout } from "../../lib/theme";
import Header from "../_components/Header";
import PlaceholderCard from "../_dashboardCom/_PlaceholderCard";

const exercises = [
  "Exercise 1",
  "Exercise 2",
  "Exercise 3",
  "Exercise 4",
  "Exercise 5",
  "Exercise 6",
];

export default function Cardio() {
  return (
    <View style={styles.container}>
      <Header title="Cardio Workouts" showBack={true} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.grid}>
          {exercises.map((exercise, index) => (
            <PlaceholderCard key={index} title={exercise} />
          ))}
        </View>
      </ScrollView>

      <BottomNav active="workouts" />
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
