import {View, Text, TextInput, StyleSheet, Pressable, ScrollView} from "react-native"
import {useState} from "react"
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context"
import {MaterialCommunityIcons} from "@expo/vector-icons"
import {useLocalSearchParams, useRouter} from "expo-router"
import Modal from "react-native-modal"
import {getToken} from "../../lib/tokenStorage"
import { colors } from "../../lib/theme"
import { API_BASE_URL } from "../../lib/api"

export default function editProfile()
{
    const router = useRouter();

    const {name, username, about, gymLevel, weight, lastWorkout, currentWorkout} = useLocalSearchParams();

    const [newName, setNewName] = useState(name || "");
    const [newUsername, setNewUsername] = useState(username || "");
    const [newAbout, setNewAbout] = useState(about || "");
    const [newGymLevel, setNewGymLevel] = useState(gymLevel || "");
    const [newWeight, setNewWeight] = useState(weight || "");
    const [newLastWorkout, setNewLastWorkout] = useState(lastWorkout || "");
    const [newCurrentWorkout, setNewCurrentWorkout] = useState(currentWorkout || "");

    const [inputHeight, setInputHeight] = useState(60);

    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [errorTitle, setErrorTitle] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const showError = (title, message) => {
        setErrorTitle(title);
        setErrorMessage(message);
        setErrorModalVisible(true);
    };

    const saveProfile = async () => 
    {
        try
        {
            const numericWeight = newWeight ? parseInt(newWeight.replace(/[^0-9]/g, ''), 10) : null;

            const payload = {
                full_name: newName,
                user_name: newUsername, 
                bio: newAbout,
                gym_level: newGymLevel,
                weight: isNaN(numericWeight) ? null : numericWeight,
                last_workout: newLastWorkout,
                current_workout: newCurrentWorkout
            };

            const token = await getToken();
            console.log("Token retrieved:", token);

            const response = await fetch(`https://gym-community-app.onrender.com/users/me/profile`, {
                method: "PUT", 
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            
            if(response.ok)
            {
                const returnPayload = {
                    name: newName,
                    username: newUsername, 
                    about: newAbout,
                    gymLevel: newGymLevel,
                    weight: newWeight,
                    lastWorkout: newLastWorkout,
                    currentWorkout: newCurrentWorkout
                };

                router.navigate({
                    pathname: "/profile", 
                    params: returnPayload
                });
            }
            else
            {
                const errorData = await response.text();
                console.log("Server error", errorData);
                if(response.status === 401 || response.status === 403) {
                    showError("Unauthorized", "Please log in again to save your profile.");
                } else {
                    showError("Save Failed", "There was an error saving your profile.");
                }
            }
        }
        catch(error)
        {
            console.log("Failed to reach server", error);
            showError("Network Error", "Could not connect to the server. Make sure it is running.");
        }
    };

    return (
        <SafeAreaProvider>
            <SafeAreaView style={[styles.screenContainer, { backgroundColor: colors.background }]}>
                <View style={styles.headerRow}>
                    <Pressable onPress={() => router.back()} style={styles.iconButton}>
                        <MaterialCommunityIcons name="arrow-left-bold" size={40} color={colors.primary} />
                    </Pressable>

                    <Pressable onPress={saveProfile} style={styles.iconButton}>
                        <MaterialCommunityIcons name="check-bold" size={40} color={colors.primary} />
                    </Pressable>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <Text style={styles.text}>Name:</Text>
                    <TextInput 
                        style={styles.input} 
                        onChangeText={setNewName}
                        value={newName} 
                        placeholder="e.g. Angel"
                        placeholderTextColor={colors.textSecondary}
                    />

                    <Text style={styles.text}>Username:</Text>
                    <TextInput 
                        style={styles.input} 
                        onChangeText={setNewUsername}
                        value={newUsername} 
                        placeholder="e.g. gorlockthedestroyer"
                        placeholderTextColor={colors.textSecondary}
                    />

                    <Text style={styles.text}>About:</Text>
                    <TextInput
                        onChangeText={setNewAbout}
                        value={newAbout}
                        placeholder="This is a a little about me!"
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        onContentSizeChange={(event) => {setInputHeight(event.nativeEvent.contentSize.height);}}
                        style={[styles.input, {height: Math.max(60, inputHeight)}]}
                    />

                    <Text style={styles.text}>Gym Level:</Text>
                    <TextInput 
                        style={styles.input} 
                        onChangeText={setNewGymLevel}
                        value={newGymLevel} 
                        placeholder="e.g. Beginner, Intermediate, Advanced"
                        placeholderTextColor={colors.textSecondary}
                    />

                    <Text style={styles.text}>Weight:</Text>
                    <TextInput 
                        style={styles.input} 
                        onChangeText={setNewWeight}
                        value={newWeight} 
                        placeholder="e.g. 185 lbs"
                        placeholderTextColor={colors.textSecondary}
                    />

                    <Text style={styles.text}>Last Workout:</Text>
                    <TextInput 
                        style={styles.input} 
                        onChangeText={setNewLastWorkout}
                        value={newLastWorkout} 
                        placeholder="e.g. Chest & Triceps"
                        placeholderTextColor={colors.textSecondary}
                    />

                    <Text style={styles.text}>Current Workout:</Text>
                    <TextInput 
                        style={styles.input} 
                        onChangeText={setNewCurrentWorkout}
                        value={newCurrentWorkout} 
                        placeholder="e.g. Back & Biceps"
                        placeholderTextColor={colors.textSecondary}
                    />
                </ScrollView>
            </SafeAreaView>

            <Modal
                isVisible={errorModalVisible}
                backdropOpacity={0.6}
                animationIn="fadeIn"
                animationOut="fadeOut"
                useNativeDriver={true}
                onBackdropPress={() => setErrorModalVisible(false)}
            >
                <View style={styles.alertBox}>
                    <Text style={styles.alertTitle}>{errorTitle}</Text>
                    <Text style={styles.alertMessage}>{errorMessage}</Text>
                    <Pressable style={styles.alertDestructiveBtn} onPress={() => setErrorModalVisible(false)}>
                        <Text style={styles.alertDestructiveBtnText}>OK</Text>
                    </Pressable>
                </View>
            </Modal>
        </SafeAreaProvider>
    );
};

const styles = StyleSheet.create({
    screenContainer:
    {
        flex: 1,
    },
    scrollContainer:
    {
        flexGrow: 1,
        paddingBottom: 40,
        rowGap: 10,
    },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        paddingHorizontal: "5%",
        marginTop: 5,
        marginBottom: 10,
    },
    iconButton: {
        width: 45,
        height: 45,
        justifyContent: "center",
        alignItems: "center",
    },
    text:
    {
        alignSelf: "center",
        width: "90%",
        textAlign: "left",
        fontSize: 16,
        marginTop: 5,
        color: colors.text
    },
    input:
    {
        alignSelf: "center",
        height: 50, 
        width: "90%",
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        color: colors.text,
        fontSize: 16,
        borderRadius: 10,
        textAlignVertical: "top",
        paddingHorizontal: 10,
        paddingTop: 12
    },
    alertBox: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 24,
        alignItems: "center",
    },
    alertTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: colors.text,
        marginBottom: 12,
    },
    alertMessage: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: "center",
        marginBottom: 24,
        lineHeight: 22,
    },
    alertDestructiveBtn: {
        width: "100%",
        paddingVertical: 14,
        borderRadius: 8,
        backgroundColor: colors.primary,
        alignItems: "center",
    },
    alertDestructiveBtnText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
});
