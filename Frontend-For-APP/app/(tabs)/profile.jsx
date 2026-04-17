import {useState, useEffect} from "react";
import {useRouter, useLocalSearchParams} from "expo-router";
import {View, Text, Image, Pressable, StyleSheet, Alert, Platform} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as NavigationBar from "expo-navigation-bar";
import Modal from "react-native-modal";
import {Tabs, MaterialTabBar} from "react-native-collapsible-tab-view";
import Posts from "../posts";
import Workouts from "../workouts"
import { colors } from "../../lib/theme";

export default function Profile() {
    // Create router for navigation to editProfile
    const router = useRouter();

    const params = useLocalSearchParams();

    const [name, setName] = useState("Name")
    const [username, setUsername] = useState("Username");
    const [about, setAbout] = useState("This is a little about me.");
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
        if(params.name) {
            setName(params.name);
        }
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
    }, [params.name, params.username, params.about, params.weight, params.lastWorkout, params.currentWorkout]);

    // Force navigation bar to be dark
    useEffect(() => {
        if (Platform.OS === 'android') {
            NavigationBar.setBackgroundColorAsync(colors.background);
            NavigationBar.setButtonStyleAsync("light");
        }
    }, []);

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

    const profileHeader = () => {
        return (
            <View style={{width: "100%", alignItems: "center"}}>
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

                <View style={styles.topStatsContainer}>
                    <View style={styles.topStatItem}>
                        <Text style={styles.topStatValue} adjustsFontSizeToFit numberOfLines={1}>{totalWorkouts}</Text>
                        <Text style={styles.topStatLabel} adjustsFontSizeToFit numberOfLines={1}>Workouts</Text>
                    </View>
                    <Pressable style={styles.topStatItem} onPress={() => setStreakModalVisible(true)}>
                        <Text style={styles.topStatValue} adjustsFontSizeToFit numberOfLines={1}>{dayStreak}</Text>
                        <Text style={styles.topStatLabel} adjustsFontSizeToFit numberOfLines={1}>Day Streak</Text>
                    </Pressable>
                </View>

                <View style={styles.editProfile}>
                    {/* Pass in username and about variables into the editProfile page */}
                    <Pressable style={styles.editButton} onPress={() => {router.push({ pathname: "../edit/editProfile", params: {name, username, about, weight, lastWorkout, currentWorkout}})}}>
                        <Text style={styles.edit}>Edit Profile</Text>
                    </Pressable>
                </View>

                <View style={styles.cardContainer} pointerEvents="none">
                    <View style={[styles.statCard, { width: "100%", borderBottomWidth: 1, borderRightWidth: 0 }]}>
                        <Text style={styles.cardTitle} adjustsFontSizeToFit numberOfLines={1}>Weight</Text>
                        <Text style={styles.cardValue} adjustsFontSizeToFit numberOfLines={1}>{weight}</Text>
                    </View>
                    <View style={[styles.statCard, { borderBottomWidth: 0 }]}>
                        <Text style={styles.cardTitle} adjustsFontSizeToFit numberOfLines={1}>Last Workout</Text>
                        <Text style={styles.cardValue} adjustsFontSizeToFit numberOfLines={1}>{lastWorkout}</Text>
                    </View>
                    <View style={[styles.statCard, { borderBottomWidth: 0, borderRightWidth: 0 }]}>
                        <Text style={styles.cardTitle} adjustsFontSizeToFit numberOfLines={1}>Current Workout</Text>
                        <Text style={styles.cardValue} adjustsFontSizeToFit numberOfLines={1}>{currentWorkout}</Text>
                    </View>
                </View>

                <View style={styles.aboutContainer}>
                    <Text style={styles.aboutHeader}>About</Text>
                    <Text style={styles.about}>{about}</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.scrollWindow, { backgroundColor: colors.background }]} edges={['top']}>
            <Tabs.Container
                renderHeader={profileHeader}
                headerContainerStyle={{paddingTop: 10, backgroundColor: colors.background, elevation: 0, shadowOpacity: 0}}
                renderTabBar={(props) => (
                    <MaterialTabBar
                        {...props}
                        activeColor={colors.text}
                        inactiveColor={colors.textSecondary}
                        indicatorStyle={{
                            backgroundColor: colors.primary,
                            height: 3,
                            borderRadius: 4,
                        }}
                        style={{ backgroundColor: colors.background }}
                    />
                )}
            >
                <Tabs.Tab name="posts" label="Posts">
                    <Posts/>
                </Tabs.Tab>

                <Tabs.Tab name="workouts" label="Workouts">
                    <Workouts/>
                </Tabs.Tab>
            </Tabs.Container>

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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    scrollWindow:
    {
        flex: 1
    },
    container: {
        flexGrow: 1,
        // justifyContent: "center",
        alignItems: "center",
        paddingTop: "5%",
        paddingBottom: "10%",
        backgroundColor: colors.background
    },

    photoContainer: {
        marginBottom: 8
    },

    profilePhoto: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#ccc",
    },

    editProfilePhoto: {
        position: "absolute",
        bottom: 0,
        right: 0,
        borderRadius: 12,
        width: 24,
        height: 24,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
    },

    plusIcon: {
        fontSize: 20,
        fontWeight: "bold",
        color: colors.text,
        lineHeight: 20,
    },

    name: {
        color: colors.text,
        fontWeight: "bold",
        fontSize: 20,
    },

    userName: {
        marginBottom: 8,
        fontSize: 14,
        color: colors.textSecondary,
    },

    topStatsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 64,
        width: "90%",
        marginBottom: 12,
    },
    topStatItem: {
        alignItems: "center",
        maxWidth: 90,
    },
    topStatValue: {
        fontSize: 18,
        fontWeight: "bold",
        color: colors.text,
        marginBottom: 2,
        textAlign: "center",
    },
    topStatLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        textAlign: "center",
    },

    editProfile: {
        flexDirection: "row",
        justifyContent: "center",
        marginBottom: 12,
        width: "80%"
    },

    editButton: {
        backgroundColor: colors.primary,
        borderRadius: 8,
        width: "45%",
        paddingVertical: "2%",
        alignItems: "center",
    },

    edit: {
        textAlign: "center",
        color: "white",
        fontWeight: "bold",
        fontSize: 13,
    },

    aboutContainer: {
        width: "90%",
        marginBottom: 12
    },
    aboutHeader: {
        fontSize: 18,
        fontWeight: "bold",
        width: "90%",
        textAlign: "left",
        color: colors.text,
    },

    about: {
        fontSize: 16,
        width: "90%",
        color: colors.textSecondary,
    },

    cardContainer: 
    {
        flexDirection: "row",
        flexWrap: "wrap",
        width: "90%",
        /* borderTopWidth: 1,
        borderLeftWidth: 1, */
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 12
    },
    statCard: {
        width: "50%", 
        backgroundColor: colors.surface,
        padding: 10,
        justifyContent: "center",
        alignItems: "center",
        borderBottomWidth: 1,
        borderRightWidth: 1,
        borderColor: colors.border,
    },
    cardTitle: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 4,
        textAlign: "center",
    },
    cardValue: {
        fontSize: 16,
        fontWeight: "bold",
        color: colors.text,
        textAlign: "center",
    },

    bottomModal: {
        justifyContent: "flex-end",
        margin: 0,
    },
    modalContent: {
        backgroundColor: colors.surface,
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
        backgroundColor: colors.border,
        marginBottom: 24,
    },
    calendarContainer: {
        width: "100%",
        marginTop: 10,
    },
    monthTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: colors.text,
        textAlign: "center",
        marginBottom: 16,
    },
    weekDaysRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    weekDayText: {
        width: "14.28%",
        textAlign: "center",
        color: colors.textSecondary,
        fontSize: 14,
        fontWeight: "600",
    },
    daysGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    dayCell: {
        width: "14.28%",
        aspectRatio: 1,
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
        backgroundColor: colors.primary,
    },
    dayText: {
        fontSize: 16,
        color: colors.text,
    },
    currentDayText: {
        color: colors.text,
        fontWeight: "bold",
    },
});
