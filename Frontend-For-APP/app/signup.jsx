import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { typography, colors, layout, spacing, iconSizes } from "../lib/theme";
import { registerUser } from "../lib/authApi";
import ScreenContainer from "./_components/ScreenContainer";

const FORM_MAX_WIDTH = 400;

const passwordRequirements = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "One number", test: (p) => /[0-9]/.test(p) },
  { label: "One symbol (!@#$%)", test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

const getPasswordStrength = (password) => {
  const metCount = passwordRequirements.filter((req) => req.test(password)).length;
  if (metCount <= 1) return { level: "Weak", color: colors.error };
  if (metCount <= 3) return { level: "Medium", color: colors.warning };
  return { level: "Strong", color: colors.success };
};

const validateEmail = (email) => {
  if (!email.trim()) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Invalid email format";
  return "";
};

const validateUsername = (username) => {
  if (!username.trim()) return "Username is required";
  if (username.length < 3) return "Username must be at least 3 characters";
  if (username.length > 20) return "Username must be less than 20 characters";
  return "";
};

const validatePassword = (password) => {
  if (!password) return "Password is required";
  const metCount = passwordRequirements.filter((req) => req.test(password)).length;
  if (metCount < 5) return "Password does not meet all requirements";
  return "";
};

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const passwordStrength = getPasswordStrength(password);

  const handleCreateAccount = async () => {
    const emailErr = validateEmail(email);
    const usernameErr = validateUsername(username);
    const passwordErr = validatePassword(password);

    setEmailError(emailErr);
    setUsernameError(usernameErr);
    setPasswordError(passwordErr);

    if (emailErr || usernameErr || passwordErr) return;

    // Mariano's code starts here -----------------------------------------
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[^\s]{8,}$/;
    if (!passwordRegex.test(password)) {
      Alert.alert(
        "Invalid Password",
        "Password must be at least 8 characters and include uppercase, lowercase, number, special character, and no spaces."
      );
      return;
    }
    
    // Mariano's code ends here --------------------------------------------

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
      Alert.alert("Sign Up Failed", error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };



  return (
    <ScreenContainer scrollable={false} keyboardAvoid={true}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>
            Create Account
          </Text>
          <Text style={styles.subtitle}>
            Sign up to get started
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
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
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={[styles.input, usernameError && styles.inputError]}
              placeholder="Enter your username"
              placeholderTextColor={colors.textTertiary}
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                if (usernameError) setUsernameError("");
              }}
              autoCapitalize="none"
            />
            {usernameError && <Text style={styles.errorText}>{usernameError}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
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
            
            {password.length > 0 && (
              <View style={styles.passwordSection}>
                <View style={styles.strengthBar}>
                  <View
                    style={[
                      styles.strengthFill,
                      { backgroundColor: passwordStrength.color, width: passwordStrength.level === "Weak" ? "33%" : passwordStrength.level === "Medium" ? "66%" : "100%" },
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
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleCreateAccount}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.buttonText}>
                Create Account
              </Text>
            )}
          </Pressable>

          <Pressable style={styles.linkButton} onPress={() => router.back()}>
            <Text style={styles.linkText}>
              Already have an account? Login
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
