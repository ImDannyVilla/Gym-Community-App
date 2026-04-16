import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, layout, typography, spacing } from "../../lib/theme";
import Header from "../_components/Header";

export default function Community() {
  const [text, setText] = useState("");
  const [posts, setPosts] = useState([
    { id: "1", content: "Welcome to the community!" },
  ]);

  const handlePost = () => {
    if (text.trim()) {
      setPosts([{ id: Date.now().toString(), content: text.trim() }, ...posts]);
      setText("");
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Community" />
      
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.inputContainer, { paddingHorizontal: layout.screenPadding, paddingVertical: 12 }]}>
          <TextInput
            style={styles.input}
            placeholder="What's on your mind?"
            placeholderTextColor={colors.textTertiary}
            value={text}
            onChangeText={setText}
            multiline
          />
          <Pressable 
            style={styles.postButton}
            onPress={handlePost}
          >
            <Ionicons name="send" size={20} color={colors.text} />
          </Pressable>
        </View>

        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.postCard}>
              <Text style={styles.postText}>{item.content}</Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: typography.body.fontSize,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    maxHeight: 100,
  },
  postButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    marginLeft: spacing.sm,
  },
  listContent: {
    paddingBottom: layout.bottomSafeArea,
  },
  postCard: {
    backgroundColor: colors.surface,
    marginHorizontal: layout.screenPadding,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  postText: {
    color: colors.text,
    fontSize: typography.body.fontSize,
  },
});
