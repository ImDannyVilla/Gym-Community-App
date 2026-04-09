import {View, Text, StyleSheet} from "react-native";
import {Tabs} from "react-native-collapsible-tab-view";

export default function Posts()
{
    return (
        <Tabs.ScrollView style={{ backgroundColor: "#F8F9FA" }} contentContainerStyle={styles.scrollContainer}>
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
        </Tabs.ScrollView>
    );
}

const styles = StyleSheet.create({
    scrollContainer: {
        paddingBottom: 40,
    },
    postCard: {
        backgroundColor: "#FFFFFF",
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "black",
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
        marginRight: 12,
    },
    postAuthor: {
        fontWeight: "bold",
        fontSize: 16,
        color: "black",
    },
    postText: {
        fontSize: 14,
        color: "#2e2727",
        lineHeight: 20,
    }
});
