import React, { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  ActivityIndicator, Alert, Switch, ScrollView, Platform, ActionSheetIOS,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, layout } from '../lib/theme';
import { updateWorkoutLog } from '../lib/workoutApi';
import { uploadWorkoutMedia } from '../lib/supabaseStorage';
import { getMyProfile } from '../lib/socialApi';

export default function PostWorkoutShare() {
  const { logId } = useLocalSearchParams();
  const [isPublic, setIsPublic] = useState(false);
  const [caption, setCaption] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  const [isSharing, setIsSharing] = useState(false);

  const handlePhotoPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Take Photo', 'Choose from Library'], cancelButtonIndex: 0 },
        (i) => { if (i === 1) takePhoto(); if (i === 2) pickPhoto(); }
      );
    } else {
      Alert.alert('Add Photo', 'Choose an option', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Library', onPress: pickPhoto },
      ]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera access to attach a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length) setPhotoUri(result.assets[0].uri);
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to attach a photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.length) setPhotoUri(result.assets[0].uri);
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      let mediaUrl = null;
      if (photoUri) {
        const profile = await getMyProfile();
        const userId = String(profile.id);
        mediaUrl = await uploadWorkoutMedia(photoUri, userId, logId);
      }
      await updateWorkoutLog(logId, {
        is_public: true,
        caption: caption.trim() || null,
        media_url: mediaUrl,
        media_type: mediaUrl ? 'photo' : null,
      });
      router.replace('/(tabs)/workouts');
    } catch (err) {
      console.error('Share failed:', err.message);
      Alert.alert('Share Failed', err.message || 'Could not share workout. Please try again.', [
        { text: 'Try Again', onPress: () => setIsSharing(false) },
        { text: 'Skip', onPress: () => router.replace('/(tabs)/workouts') },
      ]);
      setIsSharing(false);
    }
  };

  const handleSkip = () => router.replace('/(tabs)/workouts');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Ionicons name="checkmark-circle" size={36} color={colors.primary} />
          <Text style={styles.title}>Workout Complete</Text>
          <Text style={styles.subtitle}>Share your progress with the community</Text>
        </View>

        {/* Public toggle */}
        <View style={styles.row}>
          <View>
            <Text style={styles.rowLabel}>Post publicly</Text>
            <Text style={styles.rowHint}>Others can see this in the community feed</Text>
          </View>
          <Switch
            value={isPublic}
            onValueChange={setIsPublic}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.text}
          />
        </View>

        {isPublic && (
          <>
            {/* Photo picker */}
            <Pressable style={styles.photoPicker} onPress={handlePhotoPress}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photoPreview} contentFit="cover" />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="camera-outline" size={32} color={colors.textTertiary} />
                  <Text style={styles.photoPlaceholderText}>Add a photo (optional)</Text>
                </View>
              )}
            </Pressable>

            {photoUri && (
              <Pressable style={styles.removePhoto} onPress={() => setPhotoUri(null)}>
                <Text style={styles.removePhotoText}>Remove photo</Text>
              </Pressable>
            )}

            {/* Caption */}
            <TextInput
              style={styles.captionInput}
              placeholder="Write a caption... (optional)"
              placeholderTextColor={colors.textTertiary}
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={500}
            />
          </>
        )}

        <View style={styles.buttons}>
          {isPublic && (
            <Pressable
              style={[styles.shareBtn, isSharing && { opacity: 0.6 }]}
              onPress={handleShare}
              disabled={isSharing}
            >
              {isSharing
                ? <ActivityIndicator size="small" color={colors.text} />
                : <Text style={styles.shareBtnText}>Share</Text>}
            </Pressable>
          )}
          <Pressable style={styles.skipBtn} onPress={handleSkip} disabled={isSharing}>
            <Text style={styles.skipBtnText}>{isPublic ? 'Skip' : 'Done'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: 48 },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginTop: 12 },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: layout.borderRadius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  rowLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowHint: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  photoPicker: {
    height: 180,
    borderRadius: layout.borderRadius,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoPreview: { width: '100%', height: '100%' },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoPlaceholderText: { fontSize: 14, color: colors.textTertiary },
  removePhoto: { alignSelf: 'flex-end', marginBottom: spacing.md },
  removePhotoText: { fontSize: 13, color: colors.textSecondary },
  captionInput: {
    backgroundColor: colors.surface,
    borderRadius: layout.borderRadius,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    padding: spacing.md,
    fontSize: 15,
    minHeight: 90,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  buttons: { gap: 12, marginTop: spacing.sm },
  shareBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  shareBtnText: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  skipBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  skipBtnText: { color: colors.textSecondary, fontSize: 16, fontWeight: '600' },
});
