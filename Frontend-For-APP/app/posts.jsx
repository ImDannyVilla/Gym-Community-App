import { View, Text, StyleSheet, ScrollView } from "react-native";
import { colors } from "../lib/theme";

export default function Posts()
{
    return (
        <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scrollContainer}>
            {Array.from({length: 30}).map((_, i) => (
                <View key={i} style={[styles.postCard, i === 0 && { marginTop: 16 }]}>
                    <View style={styles.postHeader}>
                        <View style={styles.avatar} />
                        <Text style={styles.postAuthor}>Another Gym User</Text>
                    </View>
                    
                    <Text style={styles.postText}>
                        User Post #{i + 1}, SAMPLE DESCRIPTION FOR THE USER POST.
                    </Text>
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        paddingBottom: 40,
    },
    postCard: {
        backgroundColor: colors.surface,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    postHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surfaceLight,
        marginRight: 12,
    },
    postAuthor: {
        fontWeight: "bold",
        fontSize: 16,
        color: colors.text,
    },
    postText: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
    }
});
