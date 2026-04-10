import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, iconSizes, layout } from '../../lib/theme';

export default function BottomNav({ active }) {
  const navItems = [
    { key: "community", label: "Community", route: "/community", icon: "people" },
    { key: "dashboard", label: "Dashboard", route: "/dashboard", icon: "home" },
    { key: "workouts", label: "My Workouts", route: "/programs/upperlower", icon: "barbell" },
    { key: "profile", label: "Profile", route: "/profile", icon: "person" },
  ];

  return (
    <View style={[styles.navRow, { paddingVertical: spacing.sm, borderTopColor: colors.divider }]}>
      {navItems.map((item) => (
        <Pressable
          key={item.key}
          style={({ pressed }) => [
            styles.navButton,
            active === item.key && styles.navButtonActive,
            pressed && styles.navButtonPressed,
          ]}
          onPress={() => router.push(item.route)}
        >
          <Ionicons
            name={item.icon}
            size={iconSizes.navIcon}
            color={active === item.key ? colors.text : colors.textTertiary}
          />
          <Text 
            style={[
              styles.buttonText, 
              active === item.key && styles.buttonTextActive
            ]}
          >
            {item.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  navRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
    borderTopWidth: 1,
    backgroundColor: colors.background,
    paddingBottom: layout.bottomNavPadding,
  },
  navButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
  },
  navButtonActive: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingVertical: spacing.sm,
  },
  navButtonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 10,
    marginTop: 2,
    color: colors.textTertiary,
    fontWeight: "600",
  },
  buttonTextActive: {
    color: colors.text,
  },
});
