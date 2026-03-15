import {Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform} from "react-native"
import {useState} from "react"
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context"
import {MaterialCommunityIcons} from "@expo/vector-icons"

export default function editUsername()
{
    const [username, onChangeUsername] = useState("")
    const [about, onChangeAbout] = useState("")

    const saveUsername = () => 
    {
        // TO DO: Update the username and send the user back to the profile page
    };

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.screenContainer}>
                <Pressable onPress={saveUsername} style={styles.save}>
                    <MaterialCommunityIcons name="check-bold" size={40} color="#000" />
                </Pressable>

                <Text style={styles.text}>Username:</Text>

                {/* <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}> */}
                    <TextInput 
                        style={styles.input} 
                        onChangeText={onChangeUsername}
                        value={username} 
                        placeholder="e.g. gorlockthedestroyer"
                    />
                {/* </KeyboardAvoidingView> */}

                <Text style={styles.text}>About:</Text>

                <TextInput
                    style={styles.input}
                    onChangeText={onChangeAbout}
                    value={about}
                    placeholder="This is a a little about me!"
                />
            </SafeAreaView>
        </SafeAreaProvider>
    );
};

const styles = StyleSheet.create({
    screenContainer:
    {
        flex: 1,
        rowGap: 5
    },
    save:
    {
        alignItems: "flex-end",
    },
    text:
    {
        alignSelf: "center",
        width: "90%",
        textAlign: "left",
        fontSize: 16
    },
    input:
    {
        alignSelf: "center",
        height: "8%",
        width: "90%",
        borderWidth: 1,
        marginBottom: 20,
        fontSize: 16,
        borderRadius: 10
    },
});
