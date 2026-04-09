import {Image, View, StyleSheet, Pressable} from "react-native";
import {Tabs} from "react-native-collapsible-tab-view";
import {useRouter} from "expo-router";

export default function Workouts()
{
    const router = useRouter();

    // Specify Workout Images 
    // (TO DO: BASE THE WORKOUT IMAGES BASED OFF HOW MANY AND WHAT WORKOUTS THE USER HAS)
    const workoutImages = 
    [
        {
            id: "1",
            name: "Chest",
            image: require("../../assets/chest.jpg"),
            route: "/userWorkouts/chest"
        },
        {
            id: "2",
            name: "Shoulder",
            image: require("../../assets/shoulder.jpg"),
            route: "/userWorkouts/shoulder"
        },
        {
            id: "3",
            name: "Back",
            image: require("../../assets/back.jpg"),
            route: "/userWorkouts/back"
        },
        {
            id: "4",
            name: "Legs",
            image: require("../../assets/legs.jpeg"),
            route: "/userWorkouts/legs"
        },
        {
            id: "5",
            name: "Arms",
            image: require("../../assets/arms.jpg"),
            route: "/userWorkouts/arms"
        },
    ];

    return (
        <Tabs.ScrollView>
            {workoutImages.map((workout, index) => (
                <Pressable key={workout.id} style={[styles.workoutCard, index === 0 && {marginTop: 16}]} onPress={() => {
                    router.push(workout.route);
                }}>
                    <Image
                        source={workout.image}
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
