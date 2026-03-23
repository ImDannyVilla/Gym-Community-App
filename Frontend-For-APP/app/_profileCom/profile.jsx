import {useState, useEffect} from "react";
import {useRouter, useLocalSearchParams} from "expo-router";
import {ScrollView, View, Text, Image, Pressable, StyleSheet, Alert} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Modal from "react-native-modal";

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

    const [totalWorkouts, setTotalWorkouts] = useState("847");
    const [dayStreak, setDayStreak] = useState("45");
    const [totalCalories, setTotalCalories] = useState("18k");

    const [isStreakModalVisible, setStreakModalVisible] = useState(false);

    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
    const currentYear = currentDate.getFullYear();
    const todayNum = currentDate.getDate();

    const daysInMonth = new Date(currentYear, currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentDate.getMonth(), 1).getDay();

    const daysArray = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        daysArray.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        daysArray.push(i);
    }

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

            <View style={styles.topStatsContainer}>
                <View style={styles.topStatItem}>
                    <Text style={styles.topStatValue} adjustsFontSizeToFit numberOfLines={1}>{totalWorkouts}</Text>
                    <Text style={styles.topStatLabel} adjustsFontSizeToFit numberOfLines={1}>Workouts</Text>
                </View>
                <Pressable style={styles.topStatItem} onPress={() => setStreakModalVisible(true)}>
                    <Text style={styles.topStatValue} adjustsFontSizeToFit numberOfLines={1}>{dayStreak}</Text>
                    <Text style={styles.topStatLabel} adjustsFontSizeToFit numberOfLines={1}>Day Streak</Text>
                </Pressable>
                <View style={styles.topStatItem}>
                    <Text style={styles.topStatValue} adjustsFontSizeToFit numberOfLines={1}>{totalCalories}</Text>
                    <Text style={styles.topStatLabel} adjustsFontSizeToFit numberOfLines={1}>Calories</Text>
                </View>
            </View>

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

            <Modal
                isVisible={isStreakModalVisible}
                onSwipeComplete={() => setStreakModalVisible(false)}
                swipeDirection="down"
                onBackdropPress={() => setStreakModalVisible(false)}
                style={styles.bottomModal}
            >
                <View style={styles.modalContent}>
                    <View style={styles.dragHandle} />

                    <View style={styles.calendarContainer}>
                        <Text style={styles.monthTitle}>{currentMonth} {currentYear}</Text>

                        <View style={styles.weekDaysRow}>
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                                <Text key={index} style={styles.weekDayText}>{day}</Text>
                            ))}
                        </View>

                        <View style={styles.daysGrid}>
                            {daysArray.map((day, index) => {
                                const isToday = day === todayNum;
                                return (
                                    <View key={index} style={styles.dayCell}>
                                        <View style={[styles.dayCircle, isToday && styles.currentDayCircle]}>
                                            <Text style={[styles.dayText, isToday && styles.currentDayText]}>
                                                {day !== null ? day : ''}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                </View>
            </Modal>
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

    topStatsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 32,
        width: "90%",
        marginBottom: 24,
    },
    topStatItem: {
        alignItems: "center",
        maxWidth: 90,
    },
    topStatValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#0F172A",
        marginBottom: 2,
        textAlign: "center",
    },
    topStatLabel: {
        fontSize: 12,
        color: "#64748B",
        textAlign: "center",
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
    },

    bottomModal: {
        justifyContent: "flex-end",
        margin: 0,
    },
    modalContent: {
        backgroundColor: "white",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 40,
        height: "50%",
        alignItems: "center",
    },
    dragHandle: {
        width: 40,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: "#ccc",
        marginBottom: 24,
    },
    calendarContainer: {
        width: "100%",
        marginTop: 10,
    },
    monthTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#0F172A",
        textAlign: "center",
        marginBottom: 16,
    },
    weekDaysRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    weekDayText: {
        width: "14.28%", // 100% / 7
        textAlign: "center",
        color: "#64748B",
        fontSize: 14,
        fontWeight: "600",
    },
    daysGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    dayCell: {
        width: "14.28%",
        aspectRatio: 1, // Keeps the cells perfectly square
        justifyContent: "center",
        alignItems: "center",
    },
    dayCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
    },
    currentDayCircle: {
        backgroundColor: "#007BFF", // Blue highlight
    },
    dayText: {
        fontSize: 16,
        color: "#0F172A",
    },
    currentDayText: {
        color: "white",
        fontWeight: "bold",
    }
});
