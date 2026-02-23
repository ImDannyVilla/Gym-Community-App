import React from "react";
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";

export default function Dashboard() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: 22, fontWeight: "bold" }}>
        Welcome to the Dashboard
      </Text>

      <Pressable
        onPress={() => router.replace("/")}
        style={{
          marginTop: 20,
          padding: 12,
          backgroundColor: "#007BFF",
          borderRadius: 6,
        }}
      >
        <Text style={{ color: "white" }}>Logout</Text>
      </Pressable>
    </View>
  );
}