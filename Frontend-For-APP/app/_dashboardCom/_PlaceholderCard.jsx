import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, cards } from '../../lib/theme';

export default function PlaceholderCard({ title }) {
    return (
        <View style={[
            styles.card, 
            { 
                height: cards.placeholderCard.height,
                borderRadius: cards.placeholderCard.borderRadius,
            }
        ]}>
            <Text style={styles.title}>{title}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        width: "48%",
        marginBottom: 20,
        backgroundColor: colors.surface,
        borderWidth: 2,
        borderColor: colors.primary,
        borderStyle: "dashed",
        justifyContent: "center",
        alignItems: "center",
    },

    title: {
        fontWeight: "bold",
        fontSize: 16,
        color: colors.gold,
        textAlign: "center",
    },

});
