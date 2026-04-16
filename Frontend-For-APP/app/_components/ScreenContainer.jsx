import React from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, layout, spacing } from '../../lib/theme';

export default function ScreenContainer({ 
  children, 
  scrollable = true,
  keyboardAvoid = true,
  safeArea = true,
  style,
}) {
  const scrollContentStyle = {
    flexGrow: 1,
    paddingBottom: spacing.xxl + layout.bottomNavHeight,
  };

  const content = scrollable ? (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={scrollContentStyle}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bounces={true}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.staticContent, { paddingBottom: spacing.xxl + layout.bottomNavHeight }]}>
      {children}
    </View>
  );

  const containerStyle = [
    styles.container,
    { backgroundColor: colors.background },
    style,
  ];

  if (safeArea) {
    return (
      <SafeAreaView style={containerStyle} edges={['top']}>
        {keyboardAvoid ? (
          <KeyboardAvoidingView
            style={styles.keyboardAvoid}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
          >
            {content}
          </KeyboardAvoidingView>
        ) : (
          content
        )}
      </SafeAreaView>
    );
  }

  return (
    <View style={containerStyle}>
      {keyboardAvoid ? (
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  staticContent: {
    flex: 1,
  },
});
