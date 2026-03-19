import {useState, useEffect} from "react";
import {useRouter, useLocalSearchParams} from "expo-router";
import { ScrollView, View, Text, Image, Pressable, StyleSheet, Alert } from "react-native";
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
        <ScrollView style={styles.scrollWindow} contentContainerStyle={styles.container}>
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

            <View style={styles.aboutContainer}>
                <Text style={styles.aboutHeader}>About</Text>
                <Text style={styles.about}>{about}</Text>
            </View>

            <View style={styles.cardContainer}>
                <View style={[styles.testCard, { backgroundColor: 'tomato'}]} />
                <View style={[styles.testCard, { backgroundColor: 'gold' }]} />
                <View style={[styles.testCard, { backgroundColor: 'mediumseagreen' }]} />
                <View style={[styles.testCard, { backgroundColor: 'dodgerblue' }]} />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollWindow:
    {
        flex: 1
    },
    container: {
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: "10%",
        paddingBottom: "10%"
    },

    photoContainer: {
        marginBottom: 16
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
        fontWeight: "bold",
        fontSize: 24,
    },

    userName: {
        marginBottom: 20,
        fontSize: 16
    },

    editProfile: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 24,
        width: "80%"
    },

    editButton: {
        borderWidth: 1,
        borderColor: "black",
        borderStyle: "solid",
        borderRadius: 8,
        width: "50%",
        paddingVertical: "2%"
    },

    edit: {
        textAlign: "center",
    },

    aboutContainer: {
        width: "90%",
        marginBottom: 24
    },
    aboutHeader: {
        fontSize: 18,
        fontWeight: "bold",
        width: "90%",
        textAlign: "left",
    },

    about: {
        fontSize: 16,
        width: "90%",
    },

    cardContainer: 
    {
        flexDirection: "row",
        flexWrap: "wrap",
        width: "90%",
        justifyContent: "space-between",
    },
    testCard: {
        width: "32%", 
        height: 150,  
        marginBottom: "2%", 
        borderRadius: 10,
        borderWidth: 1,
        borderRadius: 10
    }
});
