import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, FlatList } from "react-native"
import { useState } from "react"
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import Modal from "react-native-modal"
import { colors } from "../../lib/theme"
import { updateMyProfile } from "../../lib/socialApi"

const GYM_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const WEIGHT_OPTIONS = Array.from({ length: 321 }, (_, i) => i + 80); // 80–400 lbs
const WEIGHT_ITEM_HEIGHT = 52;

export default function editProfile() {
    const router = useRouter();
    const { name, username, about, gymLevel, weight } = useLocalSearchParams();

    const [newName, setNewName] = useState(name || "");
    const [newUsername, setNewUsername] = useState(username || "");
    const [newAbout, setNewAbout] = useState(about || "");
    const [newGymLevel, setNewGymLevel] = useState(gymLevel || "");
    const [newWeight, setNewWeight] = useState(weight ? parseInt(weight, 10) || null : null);
    const [inputHeight, setInputHeight] = useState(60);
    const [showWeightPicker, setShowWeightPicker] = useState(false);

    const [errorModalVisible, setErrorModalVisible] = useState(false);
    const [errorTitle, setErrorTitle] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const showError = (title, message) => {
        setErrorTitle(title);
        setErrorMessage(message);
        setErrorModalVisible(true);
    };

    const saveProfile = async () => {
        try {
            const payload = {
                full_name: newName,
                user_name: newUsername,
                bio: newAbout,
                gym_level: newGymLevel || null,
                weight: newWeight || null,
            };

            const response = await updateMyProfile(payload);

            if (response) {
                router.navigate({
                    pathname: "/profile",
                    params: {
                        name: newName,
                        username: newUsername,
                        about: newAbout,
                        gymLevel: newGymLevel,
                        weight: newWeight?.toString() || "",
                    },
                });
            } else {
                showError("Save Failed", "There was an error saving your profile.");
            }
        } catch (error) {
            console.log("Failed to reach server", error);
            showError("Network Error", "Could not connect to the server. Make sure it is running.");
        }
    };

    const weightScrollIndex = newWeight
        ? Math.max(0, WEIGHT_OPTIONS.indexOf(newWeight))
        : 0;

    return (
        <SafeAreaProvider>
            <SafeAreaView style={[styles.screenContainer, { backgroundColor: colors.background }]}>
                <View style={styles.headerRow}>
                    <Pressable onPress={() => router.back()} style={styles.iconButton}>
                        <MaterialCommunityIcons name="arrow-left-bold" size={40} color={colors.primary} />
                    </Pressable>
                    <Pressable onPress={saveProfile} style={styles.iconButton}>
                        <MaterialCommunityIcons name="check-bold" size={40} color={colors.primary} />
                    </Pressable>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <Text style={styles.label}>Name:</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={setNewName}
                        value={newName}
                        placeholder="e.g. Angel"
                        placeholderTextColor={colors.textSecondary}
                    />

                    <Text style={styles.label}>Username:</Text>
                    <TextInput
                        style={styles.input}
                        onChangeText={setNewUsername}
                        value={newUsername}
                        placeholder="e.g. gorlockthedestroyer"
                        placeholderTextColor={colors.textSecondary}
                    />

                    <Text style={styles.label}>About:</Text>
                    <TextInput
                        onChangeText={setNewAbout}
                        value={newAbout}
                        placeholder="This is a little about me!"
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        onContentSizeChange={(e) => setInputHeight(e.nativeEvent.contentSize.height)}
                        style={[styles.input, { height: Math.max(60, inputHeight), textAlignVertical: "top" }]}
                    />

                    <Text style={styles.label}>Gym Level:</Text>
                    <View style={styles.chipRow}>
                        {GYM_LEVELS.map(level => (
                            <Pressable
                                key={level}
                                style={[styles.chip, newGymLevel === level && styles.chipActive]}
                                onPress={() => setNewGymLevel(newGymLevel === level ? '' : level)}
                            >
                                <Text style={[styles.chipText, newGymLevel === level && styles.chipTextActive]}>
                                    {level}
                                </Text>
                            </Pressable>
                        ))}
                    </View>

                    <Text style={styles.label}>Weight:</Text>
                    <Pressable
                        style={styles.pickerButton}
                        onPress={() => setShowWeightPicker(true)}
                    >
                        <Text style={newWeight ? styles.pickerButtonText : styles.pickerButtonPlaceholder}>
                            {newWeight ? `${newWeight} lbs` : 'Select weight'}
                        </Text>
                        <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
                    </Pressable>
                </ScrollView>
            </SafeAreaView>

            {/* Weight Picker Sheet */}
            <Modal
                isVisible={showWeightPicker}
                onBackdropPress={() => setShowWeightPicker(false)}
                style={styles.bottomModal}
                backdropOpacity={0.5}
                animationIn="slideInUp"
                animationOut="slideOutDown"
                useNativeDriver={true}
            >
                <View style={styles.pickerSheet}>
                    <View style={styles.pickerHandle} />
                    <View style={styles.pickerHeader}>
                        <Text style={styles.pickerTitle}>Select Weight</Text>
                        <Pressable onPress={() => setShowWeightPicker(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                            <Ionicons name="close" size={22} color={colors.textSecondary} />
                        </Pressable>
                    </View>
                    <FlatList
                        data={WEIGHT_OPTIONS}
                        keyExtractor={(item) => item.toString()}
                        style={styles.pickerList}
                        getItemLayout={(_, index) => ({
                            length: WEIGHT_ITEM_HEIGHT,
                            offset: WEIGHT_ITEM_HEIGHT * index,
                            index,
                        })}
                        initialScrollIndex={weightScrollIndex}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <Pressable
                                style={[styles.pickerItem, item === newWeight && styles.pickerItemActive]}
                                onPress={() => {
                                    setNewWeight(item);
                                    setShowWeightPicker(false);
                                }}
                            >
                                <Text style={[styles.pickerItemText, item === newWeight && styles.pickerItemTextActive]}>
                                    {item} lbs
                                </Text>
                                {item === newWeight && (
                                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                                )}
                            </Pressable>
                        )}
                    />
                </View>
            </Modal>

            {/* Error Modal */}
            <Modal
                isVisible={errorModalVisible}
                backdropOpacity={0.6}
                animationIn="fadeIn"
                animationOut="fadeOut"
                useNativeDriver={true}
                onBackdropPress={() => setErrorModalVisible(false)}
            >
                <View style={styles.alertBox}>
                    <Text style={styles.alertTitle}>{errorTitle}</Text>
                    <Text style={styles.alertMessage}>{errorMessage}</Text>
                    <Pressable style={styles.alertDestructiveBtn} onPress={() => setErrorModalVisible(false)}>
                        <Text style={styles.alertDestructiveBtnText}>OK</Text>
                    </Pressable>
                </View>
            </Modal>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    screenContainer: { flex: 1 },
    scrollContainer: { flexGrow: 1, paddingBottom: 40, rowGap: 10 },
    headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        paddingHorizontal: "5%",
        marginTop: 5,
        marginBottom: 10,
    },
    iconButton: { width: 45, height: 45, justifyContent: "center", alignItems: "center" },
    label: {
        alignSelf: "center",
        width: "90%",
        textAlign: "left",
        fontSize: 16,
        marginTop: 5,
        color: colors.text,
    },
    input: {
        alignSelf: "center",
        width: "90%",
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: '#1a1a1a',
        color: colors.text,
        fontSize: 16,
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    chipRow: {
        flexDirection: "row",
        alignSelf: "center",
        width: "90%",
        gap: 10,
    },
    chip: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: '#1a1a1a',
        alignItems: "center",
    },
    chipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    chipText: {
        color: colors.textSecondary,
        fontSize: 14,
        fontWeight: "600",
    },
    chipTextActive: {
        color: "#fff",
    },
    pickerButton: {
        alignSelf: "center",
        width: "90%",
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: '#1a1a1a',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    pickerButtonText: {
        color: colors.text,
        fontSize: 16,
    },
    pickerButtonPlaceholder: {
        color: colors.textSecondary,
        fontSize: 16,
    },
    bottomModal: { justifyContent: "flex-end", margin: 0 },
    pickerSheet: {
        backgroundColor: '#111',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 34,
    },
    pickerHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#333',
        borderRadius: 2,
        alignSelf: "center",
        marginTop: 12,
        marginBottom: 4,
    },
    pickerHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    pickerTitle: {
        color: colors.text,
        fontSize: 16,
        fontWeight: "700",
    },
    pickerList: {
        height: 350,
    },
    pickerItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        height: WEIGHT_ITEM_HEIGHT,
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    pickerItemActive: {
        backgroundColor: `${colors.primary}18`,
    },
    pickerItemText: {
        color: colors.textSecondary,
        fontSize: 16,
    },
    pickerItemTextActive: {
        color: colors.primary,
        fontWeight: "700",
    },
    alertBox: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 24,
        alignItems: "center",
    },
    alertTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: colors.text,
        marginBottom: 12,
    },
    alertMessage: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: "center",
        marginBottom: 24,
        lineHeight: 22,
    },
    alertDestructiveBtn: {
        width: "100%",
        paddingVertical: 14,
        borderRadius: 8,
        backgroundColor: colors.primary,
        alignItems: "center",
    },
    alertDestructiveBtnText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
});
