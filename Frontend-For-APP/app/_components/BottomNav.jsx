import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, iconSizes, layout } from '../../lib/theme';
import { useWorkoutStore } from '../../stores/workoutStore';

export default function BottomNav({ state, descriptors, navigation }) {
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const isWorkoutActive = useWorkoutStore(s => s.isActive);

  // Define tab routes
  const tabs = [
    { name: 'workouts', label: 'My Workouts', route: '/(tabs)/workouts', icon: 'barbell' },
    { name: 'community', label: 'Community', route: '/(tabs)/community', icon: 'people' },
    { name: 'profile', label: 'Profile', route: '/(tabs)/profile', icon: 'person' },
  ];

  // If state is passed (from tab navigator), use it
  if (state && descriptors && navigation) {
    return (
      <View style={[styles.navRow, { paddingVertical: spacing.sm, paddingBottom: insets.bottom + 8, borderTopColor: colors.divider }]}>
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
          if (route.name === "workouts") iconName = "barbell";
          if (route.name === "community") iconName = "people";
          if (route.name === "profile") iconName = "person";

          const mappedLabel =
            route.name === "workouts" ? "My Workouts" :
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
                color={isFocused ? colors.primary : colors.textTertiary}
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

  // Standalone mode (rendered at root level) - use expo-router
  return (
    <View style={[styles.navRow, { paddingVertical: spacing.sm, paddingBottom: insets.bottom + 8, borderTopColor: colors.divider }]}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.route || pathname.startsWith(tab.route + '/');

        return (
          <Pressable
            key={tab.name}
            style={({ pressed }) => [
              styles.navButton,
              isActive && styles.navButtonActive,
              pressed && styles.navButtonPressed,
            ]}
            onPress={() => {
              if (tab.name === 'workouts' && isWorkoutActive) {
                router.push('/activeWorkout');
              } else {
                router.push(tab.route);
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={tab.icon}
              size={iconSizes.navIcon}
              color={isActive ? colors.primary : colors.textTertiary}
            />
            <Text 
              style={[
                styles.buttonText, 
                isActive && styles.buttonTextActive
              ]}
            >
              {tab.label}
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
  },
  navButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
  },
  navButtonActive: {
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
    color: colors.primary,
  },
});
