import {View, Text, TextInput, StyleSheet, Pressable, ScrollView} from "react-native"
import {useState} from "react"
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context"
import {MaterialCommunityIcons} from "@expo/vector-icons"
import {useLocalSearchParams, useRouter} from "expo-router"
import { colors } from "../../lib/theme"

export default function editProfile()
{
    const router = useRouter();

    const {name, username, about, weight, calorieIntake, lastWorkout, currentWorkout} = useLocalSearchParams();

    const [newName, setNewName] = useState(name || "");
    const [newUsername, setNewUsername] = useState(username || "");
    const [newAbout, setNewAbout] = useState(about || "");
    const [newWeight, setNewWeight] = useState(weight || "");
    const [newCalorieIntake, setNewCalorieIntake] = useState(calorieIntake || "");
    const [newLastWorkout, setNewLastWorkout] = useState(lastWorkout || "");
    const [newCurrentWorkout, setNewCurrentWorkout] = useState(currentWorkout || "");

    const [inputHeight, setInputHeight] = useState(60);

    const saveProfile = async () => 
    {
        try
        {
            const payload = {
                name: newName,
                username: newUsername, 
                about: newAbout,
                weight: newWeight,
                calorieIntake: newCalorieIntake,
                lastWorkout: newLastWorkout,
                currentWorkout: newCurrentWorkout
            };

            const response = await fetch("The URL for the backend", {
                method: "PUT", 
                body: JSON.stringify(payload)
            });
            
            if(response.ok)
            {
                router.navigate({
                    pathname: "/_profileCom/profile", 
                    params: payload
                });
            }
            else
            {
                console.log("Server error");
            }
        }
        catch(error)
        {
            console.log("Failed to reach server");
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
                        placeholder="e.g. FUCK YOU"
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

                    <Text style={styles.text}>Daily Calorie Intake:</Text>
                    <TextInput 
                        style={styles.input} 
                        onChangeText={setNewCalorieIntake}
                        value={newCalorieIntake} 
                        placeholder="e.g. 2,500 kcal"
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
