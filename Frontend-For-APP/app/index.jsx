import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { typography, colors, layout, spacing, iconSizes } from "../lib/theme";
import { loginUser } from "../lib/authApi";
import { saveToken } from "../lib/tokenStorage";
import ScreenContainer from "./_components/ScreenContainer";

const APP_ICON_SIZE = 120;
const ICON_BORDER_RADIUS = 24;
const FORM_MAX_WIDTH = 400;

const validateEmail = (email) => {
  if (!email.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Invalid email format";
  return "";
};

const validatePassword = (password) => {
  if (!password) return "Password is required";
  return "";
};

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleLogin = async () => {
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
        Alert.alert("Login Failed", "No access token received.");
      }
    } catch (error) {
      Alert.alert("Login Failed", error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer scrollable={false} keyboardAvoid={true}>
      <View style={styles.content}>
        <View style={styles.appIconWrapper}>
          <Image
            source={require("../assets/AppIcon.png")}
            style={styles.appIcon}
            resizeMode="contain"
          />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>
            Welcome Back
          </Text>
          <Text style={styles.subtitle}>
            Sign in to continue
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Email
            </Text>
            <TextInput
              style={[styles.input, emailError && styles.inputError]}
              placeholder="Enter your email"
              placeholderTextColor={colors.textTertiary}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError("");
              }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            {emailError && <Text style={styles.errorText}>{emailError}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Password
            </Text>
            <View style={[styles.passwordContainer, passwordError && styles.inputError]}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password"
                placeholderTextColor={colors.textTertiary}
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
                  size={iconSizes.navIcon}
                  color={colors.textTertiary}
                />
              </Pressable>
            </View>
            {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
          </View>

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.buttonText}>
                Login
              </Text>
            )}
          </Pressable>

          <Pressable style={styles.linkButton} onPress={() => router.push("/signup")}>
            <Text style={styles.linkText}>
              Don't have an account? Sign Up
            </Text>
          </Pressable>

          <Pressable style={styles.adminButton} onPress={() => router.replace("/dashboard")}>
            <Text style={styles.adminButtonText}>
              Admin Pass
            </Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: layout.screenPadding,
  },
  appIconWrapper: {
    width: APP_ICON_SIZE,
    height: APP_ICON_SIZE,
    borderRadius: ICON_BORDER_RADIUS,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  appIcon: {
    width: APP_ICON_SIZE,
    height: APP_ICON_SIZE,
    borderRadius: ICON_BORDER_RADIUS,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  title: {
    fontWeight: "bold",
    fontSize: typography.h1.fontSize,
    lineHeight: typography.h1.lineHeight,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    color: colors.textSecondary,
  },
  form: {
    width: "100%",
    maxWidth: FORM_MAX_WIDTH,
    alignItems: "center",
  },
  inputContainer: {
    width: "100%",
    marginBottom: spacing.md,
  },
  label: {
    fontWeight: "600",
    fontSize: typography.label.fontSize,
    lineHeight: typography.label.lineHeight,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: typography.body.fontSize,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passwordContainer: {
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passwordInput: {
    flex: 1,
    color: colors.text,
    fontSize: typography.body.fontSize,
  },
  button: {
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontWeight: "bold",
    fontSize: typography.body.fontSize,
    color: colors.text,
  },
  linkButton: {
    alignItems: "center",
    marginTop: spacing.md,
  },
  linkText: {
    color: colors.primary,
    fontSize: typography.bodySmall.fontSize,
    fontWeight: "600",
  },
  adminButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.textTertiary,
    borderRadius: 8,
  },
  adminButtonText: {
    color: colors.textTertiary,
    fontSize: typography.bodySmall.fontSize,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.caption.fontSize,
    marginTop: spacing.xs,
  },
});
