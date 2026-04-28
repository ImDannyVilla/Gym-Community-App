import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { typography, colors, layout, spacing, iconSizes } from "../lib/theme";
import { registerUser } from "../lib/authApi";
import ScreenContainer from "./_components/ScreenContainer";

const FORM_MAX_WIDTH = 400;

// Matches backend validate_password() rules exactly:
// 8-20 chars, uppercase, lowercase, digit, special char, no spaces
const passwordRequirements = [
  { label: "8-20 characters", test: (p) => p.length >= 8 && p.length <= 20 },
  { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "One number", test: (p) => /[0-9]/.test(p) },
  { label: "One special character", test: (p) => /[^A-Za-z0-9\s]/.test(p) },
  { label: "No spaces", test: (p) => p.length > 0 && !/\s/.test(p) },
];

const getPasswordStrength = (password) => {
  if (!password) return { level: "", color: colors.textTertiary, width: "0%" };
  const metCount = passwordRequirements.filter((req) => req.test(password)).length;
  if (metCount <= 2) return { level: "Weak", color: colors.error, width: "33%" };
  if (metCount <= 4) return { level: "Medium", color: colors.warning, width: "66%" };
  return { level: "Strong", color: colors.success, width: "100%" };
};

const validateName = (name) => {
  if (!name.trim()) return "Name is required";
  if (name.trim().length < 2) return "Name must be at least 2 characters";
  return "";
};

const validateEmail = (email) => {
  if (!email.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Invalid email format";
  return "";
};

// Matches backend validate_username(): 3-20 chars, alphanumeric + underscore + hyphen
const validateUsername = (username) => {
  if (!username.trim()) return "Username is required";
  if (username.trim().length < 3) return "Username must be at least 3 characters";
  if (username.trim().length > 20) return "Username must be 20 characters or less";
  if (!/^[a-zA-Z0-9_-]+$/.test(username.trim())) {
    return "Only letters, numbers, underscores, and hyphens allowed";
  }
  return "";
};

// Matches backend validate_password() exactly
const validatePassword = (password) => {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (password.length > 20) return "Password must be 20 characters or less";
  if (/\s/.test(password)) return "Password must not contain spaces";
  const allMet = passwordRequirements.every((req) => req.test(password));
  if (!allMet) return "Password does not meet all requirements";
  return "";
};

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [serverError, setServerError] = useState("");

  const emailRef = useRef(null);
  const usernameRef = useRef(null);
  const passwordRef = useRef(null);

  const passwordStrength = getPasswordStrength(password);

  const handleCreateAccount = async () => {
    Keyboard.dismiss();
    setServerError("");

    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const usernameErr = validateUsername(username);
    const passwordErr = validatePassword(password);

    setNameError(nameErr);
    setEmailError(emailErr);
    setUsernameError(usernameErr);
    setPasswordError(passwordErr);

    if (nameErr || emailErr || usernameErr || passwordErr) return;

    try {
      setLoading(true);
      await registerUser({
        full_name: name.trim(),
        email: email.trim(),
        username: username.trim(),
        password: password,
      });
      router.replace({
        pathname: "/",
        params: { registered: "true" },
      });
    } catch (error) {
      const msg = error.message || "Something went wrong.";
      // Show user-friendly messages for common backend errors
      if (msg.toLowerCase().includes("username") && msg.toLowerCase().includes("taken")) {
        setUsernameError("This username is already taken");
      } else if (msg.toLowerCase().includes("email") && (msg.toLowerCase().includes("taken") || msg.toLowerCase().includes("exists") || msg.toLowerCase().includes("registered"))) {
        setEmailError("An account with this email already exists");
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
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>
          </View>

          <View style={styles.form}>
            {serverError !== "" && (
              <View style={styles.serverErrorContainer}>
                <Ionicons name="alert-circle" size={18} color={colors.error} />
                <Text style={styles.serverErrorText}>{serverError}</Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={[styles.input, nameError ? styles.inputError : null]}
                placeholder="Enter your full name"
                placeholderTextColor={colors.textTertiary}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  if (nameError) setNameError("");
                  if (serverError) setServerError("");
                }}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                blurOnSubmit={false}
                textContentType="name"
                autoComplete="name"
              />
              {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                ref={emailRef}
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
                onSubmitEditing={() => usernameRef.current?.focus()}
                blurOnSubmit={false}
                textContentType="emailAddress"
                autoComplete="email"
              />
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Username</Text>
              <TextInput
                ref={usernameRef}
                style={[styles.input, usernameError ? styles.inputError : null]}
                placeholder="Letters, numbers, _ and - only"
                placeholderTextColor={colors.textTertiary}
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  if (usernameError) setUsernameError("");
                  if (serverError) setServerError("");
                }}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
                maxLength={20}
                textContentType="username"
                autoComplete="username-new"
              />
              {usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.passwordContainer, passwordError ? styles.inputError : null]}>
                <TextInput
                  ref={passwordRef}
                  style={styles.passwordInput}
                  placeholder="Create a strong password"
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
                  onSubmitEditing={handleCreateAccount}
                  maxLength={20}
                  textContentType="newPassword"
                  autoComplete="password-new"
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

              {password.length > 0 && (
                <View style={styles.passwordSection}>
                  <View style={styles.strengthBar}>
                    <View
                      style={[
                        styles.strengthFill,
                        {
                          backgroundColor: passwordStrength.color,
                          width: passwordStrength.width,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                    {passwordStrength.level}
                  </Text>

                  <View style={styles.requirementsList}>
                    {passwordRequirements.map((req, index) => {
                      const met = req.test(password);
                      return (
                        <View key={index} style={styles.requirementItem}>
                          <Ionicons
                            name={met ? "checkmark-circle" : "close-circle"}
                            size={14}
                            color={met ? colors.success : colors.error}
                          />
                          <Text
                            style={[
                              styles.requirementText,
                              { color: met ? colors.success : colors.textTertiary },
                            ]}
                          >
                            {req.label}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                loading && styles.buttonDisabled,
                pressed && !loading && styles.buttonPressed,
              ]}
              onPress={handleCreateAccount}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.linkButton}
              onPress={() => router.back()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.linkText}>
                Already have an account? Login
              </Text>
            </Pressable>
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
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.caption.fontSize,
    marginTop: spacing.xs,
  },
  passwordSection: {
    marginTop: spacing.sm,
  },
  strengthBar: {
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: spacing.xs,
  },
  strengthFill: {
    height: "100%",
    borderRadius: 2,
  },
  strengthText: {
    fontSize: typography.caption.fontSize,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  requirementsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  requirementText: {
    fontSize: 12,
  },
});
