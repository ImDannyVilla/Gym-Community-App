import {Image, View, StyleSheet, Pressable} from "react-native"
import {Tabs} from "react-native-collapsible-tab-view"

export default function Workouts()
{
    // Specify the amount of workouts the user has
    let amountOfWorkouts = 5;

    // Specify Workout Images
    const workoutImage = require("../../assets/workoutImage.jpg");

    return (
        <Tabs.ScrollView>
            {Array.from({length: amountOfWorkouts}).map((_, i) => (
                <Pressable key={i} style={[styles.workoutCard, i === 0 && {marginTop: 16}]} onPress={() => {
                    console.log("Clicked Workout Card");
                }}>
                    <Image
                        source={workoutImage}
                        style={styles.Image}
                        resizeMode="cover"
                    />
                </Pressable>
            ))}
        </Tabs.ScrollView>
    );
}

const styles = StyleSheet.create({
    workoutCard:
    {
        height: 150,
        backgroundColor: "#FFFFFF",
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "black",
        overflow: "hidden"
    },
    Image:
    {
        width: "100%",
        height: "100%"
    }
});
