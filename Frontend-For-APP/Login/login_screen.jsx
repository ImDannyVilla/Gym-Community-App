import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Image,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.safe}>
      <View style={styles.container}>
        <Image
          source={{
            uri: "https://reactnative.dev/img/tiny_logo.png",
          }}
          style={styles.logo}
        />

        <Text style={styles.label}>Username / Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your username or email"
          value={email}
          onChangeText={setEmail}
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
  />

  <Pressable onPress={() => setShowPassword(!showPassword)}>
    <Ionicons
      name={showPassword ? "eye-off" : "eye"}
      size={22}
      color="Black"
    />
  </Pressable>
</View>

        <Pressable
          style={styles.button}
          onPress={() => router.replace("/dashboard")}
        >
          <Text style={styles.buttonText}>Login</Text>
        </Pressable>

        <Pressable onPress={() => router.push("/signup")}>
          <Text style={styles.signUpText}>
            Don't have an account? Sign Up
          </Text>
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
    width: "500px",
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

  /* password styles */
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