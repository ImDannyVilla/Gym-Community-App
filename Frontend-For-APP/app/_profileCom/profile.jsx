import {useState, useEffect} from "react";
import {useRouter, useLocalSearchParams} from "expo-router";
import {ScrollView, View, Text, Image, Pressable, StyleSheet, Alert} from "react-native";
import * as ImagePicker from "expo-image-picker";

export default function Profile() {
    // Create router for navigation to editProfile
    const router = useRouter();

    const params = useLocalSearchParams();

    const [username, setUsername] = useState("Username");
    const [about, setAbout] = useState("This is a little about me. This is a little about me. This is a little about me. This is a little about me. This is a little about me. This is a little about me. ");
    const [weight, setWeight] = useState("185 lbs");
    const [calorieIntake, setCalorieIntake] = useState("2,500 kcal");
    const [lastWorkout, setLastWorkout] = useState("Chest & Triceps");
    const [currentWorkout, setCurrentWorkout] = useState("Back & Biceps");
    
    useEffect(() => {
        if(params.username) {
            setUsername(params.username);
        }
        if(params.about) {
            setAbout(params.about);
        }
        if(params.weight) {
            setWeight(params.weight);
        }
        if(params.calorieIntake) {
            setCalorieIntake(params.calorieIntake);
        }
        if(params.lastWorkout) {
            setLastWorkout(params.lastWorkout);
        }
        if(params.currentWorkout) {
            setCurrentWorkout(params.currentWorkout);
        }
    }, [params.username, params.about, params.weight, params.calorieIntake, params.lastWorkout, params.currentWorkout]);

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
                <Pressable style={styles.editButton} onPress={() => {router.push({ pathname: "/_profileCom/edit/editProfile", params: {username, about, weight, calorieIntake, lastWorkout, currentWorkout}})}}>
                    <Text style={styles.edit}>Edit Profile</Text>
                </Pressable>
            </View>

            <View style={styles.cardContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.cardTitle} adjustsFontSizeToFit numberOfLines={1}>Weight</Text>
                    <Text style={styles.cardValue} adjustsFontSizeToFit numberOfLines={1}>{weight}</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.cardTitle} adjustsFontSizeToFit numberOfLines={1}>Daily Calorie Intake</Text>
                    <Text style={styles.cardValue} adjustsFontSizeToFit numberOfLines={1}>{calorieIntake}</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.cardTitle} adjustsFontSizeToFit numberOfLines={1}>Last Workout</Text>
                    <Text style={styles.cardValue} adjustsFontSizeToFit numberOfLines={1}>{lastWorkout}</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.cardTitle} adjustsFontSizeToFit numberOfLines={1}>Current Workout</Text>
                    <Text style={styles.cardValue} adjustsFontSizeToFit numberOfLines={1}>{currentWorkout}</Text>
                </View>
            </View>

            <View style={styles.aboutContainer}>
                <Text style={styles.aboutHeader}>About</Text>
                <Text style={styles.about}>{about}</Text>
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
        paddingTop: "5%",
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
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderColor: "#E0E0E0",
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 24
    },
    statCard: {
        width: "50%", 
        backgroundColor: "#FFFFFF",
        padding: 16,
        justifyContent: "center",
        alignItems: "center",
        borderBottomWidth: 1,
        borderRightWidth: 1,
        borderColor: "#E0E0E0",
    },
    cardTitle: {
        fontSize: 14,
        color: "#666666",
        marginBottom: 8,
        textAlign: "center",
    },
    cardValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#000000",
        textAlign: "center",
    }
});
