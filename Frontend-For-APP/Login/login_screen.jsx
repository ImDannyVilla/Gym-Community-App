import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Image,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "../utils/api";

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const onLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    // --- START OF HARDCODED TEST USER BYPASS ---
    // If the exact test credentials are provided, bypass the real API
    // This allows UI testing without backend validation rules
    if (email.toLowerCase() === "testuser@gmail.com" && password === "1234") {
      console.log("Test user detected, bypassing real API...");
      // Save a mock token to SecureStore so the app remains in an authenticated state
      await SecureStore.setItemAsync("userToken", "mock_testuser_token_123");
      router.replace("/dashboard");
      return; // Exit early so fetch is not called
    }
    // --- END OF HARDCODED TEST USER BYPASS ---

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.detail
          ? typeof data.detail === "string"
            ? data.detail
            : data.detail[0].msg
          : "Login failed";
        Alert.alert("Login Error", errorMessage);
        return;
      }

      await SecureStore.setItemAsync("userToken", data.access_token);
      router.replace("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Error", "Network error. Please check your connection.");
    }
  };

  return (
    <View style={styles.safe}>
      <View style={styles.container}>
        <Image
          source={{
            uri: "https://reactnative.dev/img/tiny_logo.png",
          }}
          style={styles.logo}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Password</Text>

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />

          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={22}
              color="Black"
            />
          </Pressable>
        </View>

        <Pressable style={styles.button} onPress={onLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </Pressable>

        <Pressable onPress={() => router.push("/signup")}>
          <Text style={styles.signUpText}>Don't have an account? Sign Up</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },

  container: {
    width: "80%",
    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    width: 130,
    height: 130,
    borderRadius: 65,
    marginBottom: 24,
  },

  label: {
    alignSelf: "flex-start",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },

  input: {
    width: "100%",
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
  },

  passwordContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
  },

  passwordInput: {
    flex: 1,
    height: 40,
  },

  showText: {
    color: "black",
    fontWeight: "bold",
    marginLeft: 10,
  },

  button: {
    width: "100%",
    height: 40,
    backgroundColor: "#007BFF",
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  signUpText: {
    marginTop: 15,
    color: "#007BFF",
  },
});

export default LoginScreen;
