import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { typography, colors, layout, spacing } from '../../lib/theme';

export default function Header({ title, subtitle, rightComponent, showBack }) {
  return (
    <View style={[styles.header, { paddingTop: layout.headerHeight - 40, paddingBottom: spacing.md, paddingHorizontal: layout.screenPadding }]}>
      <View style={styles.headerContent}>
        {showBack && (
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={colors.primary} />
          </Pressable>
        )}
        <View style={[styles.titleContainer, showBack && styles.titleWithBack]}>
          <Text style={[styles.title, { fontSize: typography.h2.fontSize, lineHeight: typography.h2.lineHeight }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.subtitle, { fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight }]}>
              {subtitle}
            </Text>
          )}
        </View>
        {rightComponent && (
          <View style={styles.rightContainer}>
            {rightComponent}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  backButton: {
    paddingRight: spacing.sm,
    paddingVertical: spacing.xs,
  },
  titleContainer: {
    flex: 1,
  },
  titleWithBack: {
    paddingLeft: spacing.xs,
  },
  title: {
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  rightContainer: {
    marginLeft: spacing.md,
  },
});
