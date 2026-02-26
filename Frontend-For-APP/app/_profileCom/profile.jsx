import { router } from "expo-router"
import {View, Text, Image, Pressable, StyleSheet} from "react-native"

const changeProfilePhoto = () =>
{
    // TO DO: Get the user's image by opening their gallery and allowing them to choose any image of their choice
};

export default function Profile()
{
    return (
        <View style={styles.container}>
            <View style={styles.photoContainer}>
                <Image source={{ uri: 'https://picsum.photos/800/400' }} style={styles.profilePhoto} resizeMode="cover" />

                <Pressable style={styles.editProfilePhoto} onPress={changeProfilePhoto}>
                    {/* Change later to an actual icon describing image uploading*/}
                    <Text style={styles.plusIcon}>+</Text>  
                </Pressable>
            </View>

            <Text style={styles.name}>Name</Text>

            <Text style={styles.userName}>@Username</Text>

            <Text style={styles.aboutHeader}>About</Text>

            <Text style={styles.about}>This is just a sample about paragraph for the user. This is just a sample about paragraph for the user. This is just a sample about paragraph for the user. This is just a sample about paragraph for the user. This is just a sample about paragraph for the user. This is just a sample about paragraph for the user. This is just a sample about paragraph for the user. This is just a sample about paragraph for the user. This is just a sample about paragraph for the user. This is just a sample about paragraph for the user.</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: 
    {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    photoContainer:
    {
        flex:1,
        position: "absolute",
        top: "5%",
    },
    profilePhoto:
    {
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#ccc"
    },
    editProfilePhoto:
    {
        position: "absolute",
        bottom: 0,
        right: 0,
        borderRadius: 18,
        width: 20,
        height: 20
    },
    plusIcon:
    {
        position: "relative",
        fontSize: 24,
        fontWeight: "bold",
    },
    name:
    {
        position: "absolute",
        top: "25%",
        fontWeight: "bold",
        fontSize: 24
    },
    userName:
    {
        position: "absolute",
        top: "30%",
        fontSize: 16
    },
    aboutHeader:
    {
        position: "absolute",
        top: "40%",
        fontSize: 18,
        fontWeight: "bold",
        width: "90%",
        textAlign: "left"
    },
    about:
    {
        position: "absolute",
        fontSize: 16,
        top: "45%",
        width: "90%"
    }
}); 
