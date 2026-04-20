import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, iconSizes, layout } from '../../lib/theme';

export default function BottomNav({ state, descriptors, navigation, active }) {
  // If no state is passed (fallback usage), behave like before
  if (!state) {
    const navItems = [
      { key: "community", label: "Community", route: "/community", icon: "people" },
      { key: "workouts", label: "Workouts", route: "/workouts", icon: "barbell" },
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
            // fallback uses global router push 
            onPress={() => {}}
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

  return (
    <View style={[styles.navRow, { paddingVertical: spacing.sm, borderTopColor: colors.divider }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        let iconName = "home";
        if (route.name === "community") iconName = "people";
        if (route.name === "workouts") iconName = "barbell";
        if (route.name === "profile") iconName = "person";

        const mappedLabel = 
          route.name === "workouts" ? "Workouts" : 
          route.name === "community" ? "Community" :
          route.name === "profile" ? "Profile" : label;

        return (
          <Pressable
            key={route.key}
            style={({ pressed }) => [
              styles.navButton,
              isFocused && styles.navButtonActive,
              pressed && styles.navButtonPressed,
            ]}
            onPress={onPress}
          >
            <Ionicons
              name={iconName}
              size={iconSizes.navIcon}
              color={isFocused ? colors.text : colors.textTertiary}
            />
            <Text 
              style={[
                styles.buttonText, 
                isFocused && styles.buttonTextActive
              ]}
            >
              {mappedLabel}
            </Text>
          </Pressable>
        );
      })}
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
