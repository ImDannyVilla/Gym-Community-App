import React, { useState } from "react";
import { View, Text, Image, Pressable, StyleSheet, Alert, ScrollView } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { colors, layout, typography, spacing } from "../lib/theme";
import BottomNav from "./_components/BottomNav";
import Header from "./_components/Header";

const PHOTO_SIZE = 120;
const EDIT_BUTTON_SIZE = 28;

export default function Profile() {
  const [profilePhotoUri, setProfilePhotoUri] = useState(
    "https://picsum.photos/800/400"
  );

  const changeProfilePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow photo library access to upload a profile picture."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets?.length) {
      setProfilePhotoUri(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Profile" />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.photoContainer}>
            <Image
              source={{ uri: profilePhotoUri }}
              style={styles.profilePhoto}
              resizeMode="cover"
            />

            <Pressable 
              style={styles.editProfilePhoto}
              onPress={changeProfilePhoto}
            >
              <Text style={styles.plusIcon}>+</Text>
            </Pressable>
          </View>

          <Text style={styles.name}>Name</Text>
          <Text style={styles.userName}>@Username</Text>

          <Text style={styles.aboutHeader}>About</Text>
          <Text style={styles.about}>
            This is just a sample about paragraph for the user. This is just a sample
            about paragraph for the user. This is just a sample about paragraph for
            the user.
          </Text>
        </View>
      </ScrollView>

      <BottomNav active="profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: layout.bottomSafeArea,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.md,
  },
  photoContainer: {
    alignItems: "center",
  },
  profilePhoto: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
    backgroundColor: colors.surface,
  },
  editProfilePhoto: {
    position: "absolute",
    bottom: 0,
    right: PHOTO_SIZE / 2 - EDIT_BUTTON_SIZE / 2 + 10,
    width: EDIT_BUTTON_SIZE,
    height: EDIT_BUTTON_SIZE,
    borderRadius: EDIT_BUTTON_SIZE / 2,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  plusIcon: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    lineHeight: 18,
  },
  name: {
    fontSize: typography.h3.fontSize,
    fontWeight: "bold",
    color: colors.text,
    marginTop: spacing.md,
  },
  userName: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  aboutHeader: {
    fontSize: typography.body.fontSize,
    fontWeight: "bold",
    color: colors.text,
    width: "100%",
    textAlign: "left",
    marginTop: spacing.lg,
  },
  about: {
    fontSize: typography.body.fontSize,
    color: colors.textSecondary,
    width: "100%",
    textAlign: "left",
    marginTop: spacing.sm,
    lineHeight: typography.body.lineHeight,
  },
});
