import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loginUser } from "../lib/authApi";
import { saveToken } from "../lib/tokenStorage";

const validateEmail = (email) => {
  if (!email.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Invalid email format";
  return "";
};

const validatePassword = (password) => {
  if (!password) return "Password is required";
  return "";
};

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const onLogin = async () => {
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    setEmailError(emailErr);
    setPasswordError(passwordErr);

    if (emailErr || passwordErr) return;

    try {
      setLoading(true);

      const data = await loginUser({
        email: email.trim(),
        password: password.trim(),
      });

      if (data.access_token) {
        await saveToken(data.access_token);
        router.replace("/dashboard");
      } else {
        Alert.alert("Login failed", "No access token received.");
      }
    } catch (error) {
      Alert.alert("Login failed", error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.safe}>
      <View style={styles.container}>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, emailError && styles.inputError]}
          placeholder="Enter your email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (emailError) setEmailError("");
          }}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        {emailError && <Text style={styles.errorText}>{emailError}</Text>}

        <Text style={styles.label}>Password</Text>

        <View style={[styles.passwordContainer, passwordError && styles.inputError]}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Enter your password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (passwordError) setPasswordError("");
            }}
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
        {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={onLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
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

  button: {
    width: "100%",
    height: 40,
    backgroundColor: "#007BFF",
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  buttonDisabled: {
    opacity: 0.7,
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
  inputError: {
    borderColor: "#EF4444",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
  },
});

export default LoginScreen;