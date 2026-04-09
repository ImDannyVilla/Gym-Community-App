import React, { useRef } from 'react';
import { Pressable, Text, StyleSheet, Image, View, Animated } from 'react-native';
import { colors, cards } from '../../lib/theme';

export default function MuscleCard({ title, image, onPress }) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    return (
        <Animated.View style={[styles.cardContainer, { width: cards.grid.gap * 8, transform: [{ scale: scaleAnim }] }]}>
            <Pressable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={({ pressed }) => [
                    styles.card,
                    { 
                        height: cards.muscleCard.height, 
                        borderRadius: cards.muscleCard.borderRadius,
                    },
                    pressed && styles.cardPressed
                ]}
            >
                <Image 
                    source={image} 
                    style={[styles.image, { borderRadius: cards.muscleCard.borderRadius - 2 }]}
                    resizeMode="cover"
                />
                <View style={[styles.overlay, { paddingVertical: 10, paddingHorizontal: 12, borderBottomLeftRadius: cards.muscleCard.borderRadius - 2, borderBottomRightRadius: cards.muscleCard.borderRadius - 2 }]}>
                    <Text style={styles.title}>{title}</Text>
                </View>
            </Pressable>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    cardContainer: {
        marginBottom: cards.grid.gap,
    },

    card: {
        width: "100%",
        overflow: "hidden",
        borderWidth: 2,
        borderColor: colors.primary,
    },

    cardPressed: {
        borderColor: colors.primaryDark,
        borderWidth: 3,
    },

    image: {
        width: "100%",
        height: "100%",
    },

    overlay: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "rgba(220, 38, 38, 0.8)",
    },

    title: {
        fontWeight: "bold",
        fontSize: 16,
        color: colors.text,
        textShadowColor: "rgba(0, 0, 0, 0.5)",
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },

});
