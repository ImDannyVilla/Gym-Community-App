import {View, Text, TextInput, StyleSheet, Pressable, ScrollView, Alert} from "react-native"
import {useState} from "react"
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context"
import {MaterialCommunityIcons} from "@expo/vector-icons"
import {useLocalSearchParams, useRouter} from "expo-router"
import {getToken} from "../../lib/tokenStorage"
import { colors } from "../../lib/theme"
import { API_BASE_URL } from "../../lib/api"

export default function editProfile()
{
    const router = useRouter();

    const {name, username, about, weight, lastWorkout, currentWorkout} = useLocalSearchParams();

    const [newName, setNewName] = useState(name || "");
    const [newUsername, setNewUsername] = useState(username || "");
    const [newAbout, setNewAbout] = useState(about || "");
    const [newWeight, setNewWeight] = useState(weight || "");
    const [newLastWorkout, setNewLastWorkout] = useState(lastWorkout || "");
    const [newCurrentWorkout, setNewCurrentWorkout] = useState(currentWorkout || "");

    const [inputHeight, setInputHeight] = useState(60);

    const saveProfile = async () => 
    {
        try
        {
            // Extract integer from weight string (e.g. "185 lbs" -> 185)
            const numericWeight = newWeight ? parseInt(newWeight.replace(/[^0-9]/g, ''), 10) : null;

            const payload = {
                full_name: newName,
                user_name: newUsername, 
                bio: newAbout,
                weight: isNaN(numericWeight) ? null : numericWeight,
                last_workout: newLastWorkout,
                current_workout: newCurrentWorkout
            };

            const token = await getToken();
            console.log("Token retrieved:", token);

            const response = await fetch(`${API_BASE_URL}/users/me/profile`, {
                method: "PUT", 
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            
            if(response.ok)
            {
                // Update frontend state variables that are passed back (using the original camelCase formats)
                const returnPayload = {
                    name: newName,
                    username: newUsername, 
                    about: newAbout,
                    weight: newWeight, // Keep string for UI
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
                    Alert.alert("Unauthorized", "Please log in again to save your profile.");
                } else {
                    Alert.alert("Save Failed", "There was an error saving your profile.");
                }
            }
        }
        catch(error)
        {
            console.log("Failed to reach server", error);
            Alert.alert("Network Error", "Could not connect to the server. Make sure it is running.");
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
});
