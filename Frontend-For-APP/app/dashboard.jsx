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
     // bounces={false}
      //overScrollMode="never"
      >
      <Text style={styles.title}>
        Welcome to the Dashboard
      </Text>
      
      <WeekStrip />

      <View style={styles.grid}>
        <MuscleCard
            title="chest"
            onPress={() => {}}
        />
        <MuscleCard
            title="shoulders"
            onPress={() => {}}
        />
        <MuscleCard
            title="back"
            onPress={() => {}}
        />
        <MuscleCard
            title="arms"
            onPress={() => {}}
        />
        <MuscleCard
            title="legs"
            onPress={() => {}}
        />
        <MuscleCard
            title="core"
            onPress={() => {}}
        />
      </View>


      
      <Text style={styles.buttonText}>Logout</Text>
      <View style={styles.container2}>
        <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Number 1</Text>
        </Pressable>
        <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Number 2</Text>
        </Pressable>
        <Pressable style={styles.button}>

            <Text style={styles.buttonText}>Dashboard</Text> 
      
      </Pressable>
        <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Number 4</Text>
        </Pressable>
        <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Profile</Text>
        </Pressable>
        </View>

    </ScrollView>

  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  
  container2:{
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginTop: "auto",
    width: "auto",
  },
  
  title: {
    fontSize: 22,
    fontWeight: "bold",
  },
  
  button: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#007BFF",
    borderRadius: 6,
  },
  
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
  
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "80%",     // parent width for 48% cards
    //height: "80%",
    alignSelf: "center",
    marginTop: 20,

  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 20,
    paddingBottom: 60,
  },

});
