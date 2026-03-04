import React from "react"
import { Pressable, Text, StyleSheet } from "react-native";

export default function MuscleCard({ title, onPress }) {
    return (
        <Pressable
            onPress={onPress}
            style={(state) => {
            
                const pressed = state.pressed;
                
                if(pressed)
                {
                    return [styles.card, styles.pressed];
                }
                else
                {
                    return [styles.card];
                }
            }}
        >

        </Pressable>
    )
}

const styles = StyleSheet.create({
    card: {
        //jusfifyContents: "grid",
        backgroundColor: "rgb(115, 2, 2)",
        height: 150,
        width: "45%",
        borderRadius: 20,
        //alignSelf: "center",
        marginBottom: 20,
        padding: 16,
    },

    pressed: {
        opacity: 0.9,
    },
    title: {
        fontSize: 10,
        color: "black",
    },

});