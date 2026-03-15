import {Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform} from "react-native"
import {useState} from "react"
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context"
import {MaterialCommunityIcons} from "@expo/vector-icons"

export default function editUsername()
{
    const [text, onChangeText] = useState("")

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

                <Text style={styles.text}>Edit Username: </Text>

                {/* <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}> */}
                    <TextInput 
                        style={styles.input} 
                        onChangeText={onChangeText}
                        value={text} 
                        placeholder="e.g. gorlockthedestroyer"
                    />
                {/* </KeyboardAvoidingView>  */}
            </SafeAreaView>
        </SafeAreaProvider>
    );
};

const styles = StyleSheet.create({
    screenContainer:
    {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    save:
    {
        position: "absolute",
        top: 0, 
        right: 0
    },
    text:
    {
        textAlign: "left"
    },
    input:
    {
        height: "10%",
        width: "90%",
        borderWidth: 1,
    },
});
