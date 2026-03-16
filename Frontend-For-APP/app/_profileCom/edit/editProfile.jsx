import {Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform} from "react-native"
import {useState} from "react"
import {SafeAreaProvider, SafeAreaView} from "react-native-safe-area-context"
import {MaterialCommunityIcons} from "@expo/vector-icons"
import {useLocalSearchParams, useRouter} from "expo-router"

export default function editProfile()
{
    const router = useRouter();

    const {username, about} = useLocalSearchParams();

    const [newUsername, setNewUsername] = useState(username || "");
    const [newAbout, setNewAbout] = useState(about || "");

    const [inputHeight, setInputHeight] = useState(60);

    const saveProfile = () => 
    {
        // TO DO: Send the username to the database backend
        router.navigate({pathname: "/_profileCom/profile", params: {username: newUsername, about: newAbout}});
    };

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.screenContainer}>
                <Pressable onPress={saveProfile} style={styles.save}>
                    <MaterialCommunityIcons name="check-bold" size={40} color="#000" />
                </Pressable>

                <Text style={styles.text}>Username:</Text>

                {/* <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}> */}
                    <TextInput 
                        style={styles.input} 
                        onChangeText={setNewUsername}
                        value={newUsername} 
                        placeholder="e.g. gorlockthedestroyer"
                    />
                {/* </KeyboardAvoidingView> */}

                <Text style={styles.text}>About:</Text>

                <TextInput
                    onChangeText={setNewAbout}
                    value={newAbout}
                    placeholder="This is a a little about me!"
                    multiline
                    onContentSizeChange={(event) => {setInputHeight(event.nativeEvent.contentSize.height);}}
                    style={[styles.input, {height: Math.max(60, inputHeight)}]}
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
        width: "12%",
        borderRadius: 10,
        alignSelf: "flex-end",
        borderWidth: 1
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
        borderRadius: 10,
        textAlignVertical: "top"
    },
});
