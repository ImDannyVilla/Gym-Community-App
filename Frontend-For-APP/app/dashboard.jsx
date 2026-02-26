import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";

export default function Dashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Welcome to the Dashboard
      </Text>

      <Pressable
        onPress={() => router.replace("/")}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Logout</Text>
      </Pressable>
      <View style={styles.container2}>
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
        <Pressable style={styles.navButton} onPress={() => router.push("/_profileCom/profile")}>
            <Text style={styles.buttonText}>Profile</Text>
        </Pressable>
        </View>

    </View>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    width: '20%',
  },
  navButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#007BFF",
    borderRadius: 6,
    width: '20%',
    height: '70%'
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
});
