import {View, Text, StyleSheet} from "react-native"
import { colors } from "../../lib/theme";

export default function Chest()
{
    return (
        <View style={styles.container}>
            <Text style={styles.text}>This is the workout page for chest</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: "center",
        alignItems: "center",
    },
    text: {
        color: colors.text,
        fontSize: 16,
    }
});
