import {useState, useEffect} from "react";
import {useRouter, useLocalSearchParams} from "expo-router";
import { View, Text, Image, Pressable, StyleSheet, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";

export default function Profile() {
    // Create router for navigation to editProfile
    const router = useRouter();

    const params = useLocalSearchParams();

    const [username, setUsername] = useState("Username");
    const [about, setAbout] = useState("This is a little about me. This is a little about me. This is a little about me. This is a little about me. This is a little about me. This is a little about me. ");
    
    useEffect(() => {
        if(params.username)
        {
            setUsername(params.username);
        }
        if(params.about)
        {
            setAbout(params.about);
        }
    }, [params.username, params.about]);

    const [profilePhotoUri, setProfilePhotoUri] = useState(
        "https://picsum.photos/800/400"
    );

    const changeProfilePhoto = async () => {
        // Ask permission
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert(
                "Permission needed",
                "Please allow photo library access to upload a profile picture."
            );
            return;
        }

        // Open gallery
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'], // Only allows images for upload
            allowsEditing: true, // lets them crop
            aspect: [1, 1], // square crop
            quality: 1,
        });

        if (!result.canceled && result.assets?.length) {
            setProfilePhotoUri(result.assets[0].uri);
        }
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

            <Text style={styles.name}>Name</Text>
            <Text style={styles.userName}>@{username}</Text>

            <View style={styles.editProfile}>
                {/* Pass in username and about variables into the editProfile page */}
                <Pressable style={styles.editButton} onPress={() => {router.push({ pathname: "/_profileCom/edit/editProfile", params: {username, about}})}}>
                    <Text style={styles.edit}>Edit Profile</Text>
                </Pressable>
            </View>

            <Text style={styles.aboutHeader}>About</Text>
            <Text style={styles.about}>{about}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    photoContainer: {
        flex: 1,
        position: "absolute",
        top: "5%",
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
        width: 28,
        height: 28,
        backgroundColor: "#007BFF",
        alignItems: "center",
        justifyContent: "center",
    },

    plusIcon: {
        fontSize: 20,
        fontWeight: "bold",
        color: "white",
        lineHeight: 20,
    },

    name: {
        position: "absolute",
        top: "25%",
        fontWeight: "bold",
        fontSize: 24,
    },

    userName: {
        position: "absolute",
        top: "30%",
        fontSize: 16,
    },

    editProfile: {
        position: "absolute",
        flexDirection: "row",
        justifyContent: "center",
        top: "35%",
        width: "80%",
    },

    editButton: {
        borderWidth: 1,
        borderColor: "black",
        borderStyle: "solid",
        borderRadius: 8,
        width: "50%",
    },

    edit: {
        textAlign: "center",
    },

    aboutHeader: {
        position: "absolute",
        top: "40%",
        fontSize: 18,
        fontWeight: "bold",
        width: "90%",
        textAlign: "left",
    },

    about: {
        position: "absolute",
        fontSize: 16,
        top: "45%",
        width: "90%",
    },
});
