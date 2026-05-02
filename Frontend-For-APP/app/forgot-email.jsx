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
import { typography, colors, layout, spacing } from "../lib/theme";
import { forgotEmailUsername } from "../lib/authApi";
import ScreenContainer from "./_components/ScreenContainer";

const FORM_MAX_WIDTH = 400;

const validateUsername = (username) => {
  if (!username.trim()) return "Username is required";
  if (username.length < 3) return "Username must be at least 3 characters";
  if (!/^[a-zA-Z0-9]+$/.test(username)) return "Username must contain only letters and numbers";
  return "";
};

export default function ForgotEmail() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [foundEmail, setFoundEmail] = useState("");

  const handleFindEmail = async () => {
    const usernameErr = validateUsername(username);
    setUsernameError(usernameErr);

    if (usernameErr) return;

    try {
      setLoading(true);
      setFoundEmail("");
      const data = await forgotEmailUsername({ username: username.trim() });
      const displayEmail = data.masked_email || data.email;
      if (!displayEmail || data.message?.includes("No account")) {
        setUsernameError("No account found with this username");
        setFoundEmail("");
        return;
      }
      setFoundEmail(displayEmail);
    } catch (error) {
      const errorMessage = error.message || "Something went wrong.";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer scrollable={false} keyboardAvoid={true}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>
            Find Email
          </Text>
          <Text style={styles.subtitle}>
            Enter your username to find your associated email
          </Text>
        </View>

        <View style={styles.form}>
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
                if (foundEmail) setFoundEmail("");
              }}
              autoCapitalize="none"
            />
            {usernameError && <Text style={styles.errorText}>{usernameError}</Text>}
          </View>

          {foundEmail ? (
            <View style={styles.emailResult}>
              <Text style={styles.emailLabel}>Associated Email:</Text>
              <Text style={styles.emailText}>{foundEmail}</Text>
            </View>
          ) : null}

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleFindEmail}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.buttonText}>
                Find Email
              </Text>
            )}
          </Pressable>

          <Pressable style={styles.linkButton} onPress={() => router.back()}>
            <Text style={styles.linkText}>
              Back to Login
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
    textAlign: "center",
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
  emailResult: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 12,
    width: "100%",
    marginBottom: spacing.md,
  },
  emailLabel: {
    fontSize: typography.bodySmall.fontSize,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  emailText: {
    fontSize: typography.body.fontSize,
    fontWeight: "600",
    color: colors.text,
  },
});