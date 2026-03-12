import React, { useState } from "react";
import {
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  View,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

export default function EditProfile() {
  const params = useLocalSearchParams();
  
  // Initialize state with passed parameters or default empty strings
  const [name, setName] = useState(params.currentName || "");
  const [username, setUsername] = useState(params.currentUsername || "");
  const [about, setAbout] = useState(params.currentAbout || "");
  
  const MAX_ABOUT_CHARS = 150;

  const saveProfile = () => {
    // Navigate back to the profile page and pass the new values
    router.navigate({
      pathname: "/_profileCom/profile",
      params: { 
        newName: name,
        newUsername: username,
        newAbout: about 
      },
    });
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.screenContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleCancel} style={styles.iconButton}>
            <Ionicons name="close" size={32} color="black" />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <Pressable onPress={saveProfile} style={styles.iconButton}>
            <MaterialCommunityIcons name="check-bold" size={32} color="#007BFF" />
          </Pressable>
        </View>

        {/* Scrollable Form Content */}
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          
          {/* Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              onChangeText={setName}
              value={name}
              placeholder="Your display name"
              placeholderTextColor="#999"
              autoCapitalize="words"
            />
          </View>

          {/* Username Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              onChangeText={setUsername}
              value={username}
              placeholder="e.g. gorlockthedestroyer"
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
            />
            <Text style={styles.hint}>
              Must be unique. Letters, numbers, or underscores only.
            </Text>
          </View>

          {/* About Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>About You</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              onChangeText={setAbout}
              value={about}
              placeholder="Tell us a bit about yourself..."
              placeholderTextColor="#999"
              multiline={true}
              textAlignVertical="top"
              maxLength={MAX_ABOUT_CHARS}
            />
            <Text style={styles.charCount}>
              {about.length} / {MAX_ABOUT_CHARS}
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  iconButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  content: {
    padding: 24,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    height: 50,
    width: "100%",
    borderWidth: 1.5,
    borderColor: "#007BFF",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
    color: "black",
  },
  multilineInput: {
    height: 120,
    paddingTop: 16,
  },
  hint: {
    marginTop: 6,
    fontSize: 12,
    color: "#666",
  },
  charCount: {
    marginTop: 6,
    fontSize: 12,
    color: "#666",
    textAlign: "right",
  },
});
