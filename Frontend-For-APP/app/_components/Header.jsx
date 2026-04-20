import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography, colors, layout, spacing } from '../../lib/theme';

export default function Header({ title, subtitle, rightComponent }) {
  return (
    <View style={[styles.header, { paddingTop: layout.headerHeight - 40, paddingBottom: spacing.md, paddingHorizontal: layout.screenPadding }]}>
      <View style={styles.headerContent}>
        <View style={styles.titleContainer}>
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
  titleContainer: {
    flex: 1,
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
