import React, { useState, useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { View, Text, Image, Pressable, StyleSheet, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";

export default function Profile() {
    const params = useLocalSearchParams();

    // Local state for the profile UI
    const [profilePhotoUri, setProfilePhotoUri] = useState("https://picsum.photos/800/400");
    const [name, setName] = useState("Name");
    const [username, setUsername] = useState("Username");
    const [aboutText, setAboutText] = useState(
        "This is just a sample about paragraph for the user. This is just a sample about paragraph for the user. This is just a sample about paragraph for the user."
    );

    // Update state when we navigate back from the edit screen with new parameters
    useEffect(() => {
        if (params.newName) {
            setName(params.newName);
        }
        if (params.newUsername) {
            setUsername(params.newUsername);
        }
        if (params.newAbout) {
            setAboutText(params.newAbout);
        }
    }, [params.newName, params.newUsername, params.newAbout]);

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
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled && result.assets?.length) {
            setProfilePhotoUri(result.assets[0].uri);
        }
    };

    const handleEditProfile = () => {
        router.push({
            pathname: "/_profileCom/edit/editProfile",
            params: { 
                currentName: name,
                currentUsername: username,
                currentAbout: aboutText 
            }
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.photoContainer}>
                <Image
                    source={{ uri: profilePhotoUri }}
                    style={styles.profilePhoto}
                    resizeMode="cover"
                />

                <Pressable style={styles.editProfilePhoto} onPress={changeProfilePhoto}>
                    <Text style={styles.plusIcon}>+</Text>
                </Pressable>
            </View>

            <Text style={styles.name}>{name}</Text>
            <Text style={styles.userName}>@{username}</Text>

            <View style={styles.editProfileContainer}>
                <Pressable style={styles.editButton} onPress={handleEditProfile}>
                    <Text style={styles.editButtonText}>Edit Profile</Text>
                </Pressable>
            </View>

            <View style={styles.aboutContainer}>
                <Text style={styles.aboutHeader}>About</Text>
                <Text style={styles.about}>
                    {aboutText}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        backgroundColor: "white",
    },

    photoContainer: {
        marginTop: "15%",
        marginBottom: 10,
    },

    profilePhoto: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#ccc",
    },

    editProfilePhoto: {
        position: "absolute",
        bottom: 0,
        right: 0,
        borderRadius: 18,
        width: 32,
        height: 32,
        backgroundColor: "#007BFF",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "white",
    },

    plusIcon: {
        fontSize: 22,
        fontWeight: "bold",
        color: "white",
        lineHeight: 22,
    },

    name: {
        fontWeight: "bold",
        fontSize: 24,
        marginTop: 10,
    },

    userName: {
        fontSize: 16,
        color: "#666",
        marginTop: 4,
    },

    editProfileContainer: {
        width: "50%",
        marginTop: 20,
    },

    editButton: {
        borderWidth: 1.5,
        borderColor: "#007BFF",
        borderRadius: 8,
        paddingVertical: 10,
        alignItems: "center",
        backgroundColor: "#f0f8ff", // very light blue tint
    },

    editButtonText: {
        fontWeight: "bold",
        color: "#007BFF",
    },

    aboutContainer: {
        width: "90%",
        marginTop: 35,
        alignItems: "flex-start",
    },

    aboutHeader: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 8,
        color: "#333",
    },

    about: {
        fontSize: 16,
        color: "#444",
        lineHeight: 24,
    },
});
