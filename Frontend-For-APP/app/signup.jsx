import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { registerUser } from "../lib/authApi";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const onCreateAccount = async () => {
    if (!email.trim() || !username.trim() || !password.trim()) {
      Alert.alert("Missing info", "Enter your email, username, and password.");
      return;
    }

    try {
      setLoading(true);

      await registerUser({
        email: email.trim(),
        username: username.trim(),
        password: password.trim(),
      });

      Alert.alert("Success", "Account created. Please log in.");
      router.replace("/");
    } catch (error) {
      Alert.alert("Sign up failed", error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Sign Up</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />

          <Pressable onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={22}
              color="black"
            />
          </Pressable>
        </View>

        <Pressable
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={onCreateAccount}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? "Creating..." : "Create Account"}
          </Text>
        </Pressable>

        <Pressable style={styles.linkButton} onPress={() => router.back()}>
          <Text style={styles.linkText}>Back to Login</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 18,
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    height: 44,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  passwordContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 14,
    paddingHorizontal: 12,
  },
  passwordInput: {
    flex: 1,
    height: 40,
  },
  primaryButton: {
    height: 44,
    borderRadius: 8,
    backgroundColor: "#007BFF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  linkButton: {
    marginTop: 14,
    alignItems: "center",
  },
  linkText: {
    color: "#007BFF",
    fontWeight: "700",
  },
});