/**
 * SettingsSection Component
 *
 * Container component for grouping related settings with a title.
 * Follows iOS-style settings layout with clean visual hierarchy.
 */

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { spacing, typography, borderRadius } from '../theme';
import { useTheme } from '../context';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

export function SettingsSection({ title, children }: SettingsSectionProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>
      </View>
      <View style={[styles.content, { backgroundColor: colors.surface }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  content: {
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    overflow: 'hidden',
  },
});
