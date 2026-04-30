import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Image,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { typography, colors, layout, spacing, iconSizes } from "../lib/theme";
import { loginUser } from "../lib/authApi";
import { saveToken, saveRefreshToken } from "../lib/tokenStorage";
import ScreenContainer from "./_components/ScreenContainer";

const APP_ICON_SIZE = 120;
const ICON_BORDER_RADIUS = 24;
const FORM_MAX_WIDTH = 400;

const validateEmail = (email) => {
  if (!email.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Invalid email format";
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
  const [serverError, setServerError] = useState("");

  const passwordRef = useRef(null);

  const handleLogin = async () => {
    Keyboard.dismiss();
    setServerError("");

    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    setEmailError(emailErr);
    setPasswordError(passwordErr);

    if (emailErr || passwordErr) return;

    try {
      setLoading(true);
      const data = await loginUser({
        email: email.trim(),
        password: password,
      });

      if (data.access_token) {
        await saveToken(data.access_token);
        if (data.refresh_token) await saveRefreshToken(data.refresh_token);
        router.replace("/workouts");
      } else {
        setServerError("No access token received. Please try again.");
      }
    } catch (error) {
      const msg = error.message || "Something went wrong.";
      // Show user-friendly messages for common errors
      if (msg.toLowerCase().includes("invalid credentials")) {
        setServerError("Incorrect email or password. Please try again.");
      } else if (msg.toLowerCase().includes("network") || msg.toLowerCase().includes("fetch")) {
        setServerError("Unable to connect to the server. Check your internet connection.");
      } else {
        setServerError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer scrollable={true} keyboardAvoid={true}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.content}>
          <View style={styles.appIconWrapper}>
            <Image
              source={require("../assets/AppIcon.png")}
              style={styles.appIcon}
              resizeMode="contain"
            />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          <View style={styles.form}>
            {serverError !== "" && (
              <View style={styles.serverErrorContainer}>
                <Ionicons name="alert-circle" size={18} color={colors.error} />
                <Text style={styles.serverErrorText}>{serverError}</Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, emailError ? styles.inputError : null]}
                placeholder="Enter your email"
                placeholderTextColor={colors.textTertiary}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError("");
                  if (serverError) setServerError("");
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
                textContentType="emailAddress"
                autoComplete="email"
              />
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.passwordContainer, passwordError ? styles.inputError : null]}>
                <TextInput
                  ref={passwordRef}
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textTertiary}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) setPasswordError("");
                    if (serverError) setServerError("");
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="go"
                  onSubmitEditing={handleLogin}
                  textContentType="password"
                  autoComplete="password"
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={iconSizes.navIcon}
                    color={colors.textTertiary}
                  />
                </Pressable>
              </View>
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                loading && styles.buttonDisabled,
                pressed && !loading && styles.buttonPressed,
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.linkButton}
              onPress={() => router.push("/signup")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.linkText}>
                Don't have an account? Sign Up
              </Text>
            </Pressable>

            <View style={styles.forgotRow}>
              <Pressable
                onPress={() => router.push("/forgot-password")}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.xl,
    minHeight: "100%",
  },
  appIconWrapper: {
    width: APP_ICON_SIZE,
    height: APP_ICON_SIZE,
    borderRadius: ICON_BORDER_RADIUS,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    overflow: "hidden",
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
  serverErrorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 59, 59, 0.1)",
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.md,
    width: "100%",
    gap: spacing.sm,
  },
  serverErrorText: {
    color: colors.error,
    fontSize: typography.bodySmall.fontSize,
    lineHeight: typography.bodySmall.lineHeight,
    flex: 1,
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
  buttonPressed: {
    backgroundColor: colors.primaryDark,
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
  forgotRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  forgotText: {
    color: colors.primary,
    fontSize: typography.bodySmall.fontSize,
    fontWeight: "600",
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
