/**
 * HistoryEntry Component
 *
 * A row component for displaying workout history entries.
 * Designed for quick scanning with clear date, weight, and reps display.
 *
 * Features:
 * - Date formatted for readability (Today, Yesterday, or full date)
 * - Weight and reps prominently displayed
 * - Optional notes indicator
 * - Subtle styling that doesn't overwhelm
 * - PR (Personal Record) badge when applicable
 * - Theme-aware styling
 */

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, borderRadius } from '../theme';
import { useTheme } from '../context';

interface HistoryEntryProps {
  /** Entry ID */
  id: string;
  /** Weight value */
  weight: number;
  /** Number of reps */
  reps: number;
  /** ISO date string when recorded */
  recordedAt: string;
  /** Optional notes */
  notes?: string | null;
  /** Weight unit to display */
  weightUnit?: 'lbs' | 'kg';
  /** Whether this entry is a personal record */
  isPR?: boolean;
  /** Whether this is the first (most recent) entry */
  isFirst?: boolean;
  /** Whether this is the last entry in the list */
  isLast?: boolean;
}

/**
 * Format date for display
 * Shows "Today", "Yesterday", or formatted date
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Format time for display
 */
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function HistoryEntry({
  weight,
  reps,
  recordedAt,
  notes,
  weightUnit = 'lbs',
  isPR = false,
  isFirst = false,
  isLast = false,
}: HistoryEntryProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderBottomColor: colors.divider },
        isFirst && styles.containerFirst,
        isLast && styles.containerLast,
      ]}
    >
      {/* Date column */}
      <View style={styles.dateColumn}>
        <Text style={[styles.dateText, { color: colors.text }]}>{formatDate(recordedAt)}</Text>
        <Text style={[styles.timeText, { color: colors.textTertiary }]}>{formatTime(recordedAt)}</Text>
      </View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Weight and reps */}
        <View style={styles.statsRow}>
          <Text style={[styles.weight, { color: colors.text }]}>
            {weight}
            <Text style={[styles.unit, { color: colors.textSecondary }]}> {weightUnit}</Text>
          </Text>
          <Text style={[styles.separator, { color: colors.textTertiary }]}>x</Text>
          <Text style={[styles.reps, { color: colors.text }]}>
            {reps}
            <Text style={[styles.unit, { color: colors.textSecondary }]}> reps</Text>
          </Text>
        </View>

        {/* Notes indicator */}
        {notes && notes.length > 0 && (
          <View style={styles.notesRow}>
            <Ionicons
              name="chatbubble-outline"
              size={12}
              color={colors.textTertiary}
            />
            <Text style={[styles.notesText, { color: colors.textTertiary }]} numberOfLines={1}>
              {notes}
            </Text>
          </View>
        )}
      </View>

      {/* PR badge */}
      {isPR && (
        <View style={[styles.prBadge, { backgroundColor: colors.surfaceElevated }]}>
          <Ionicons name="trophy" size={12} color={colors.warning} />
          <Text style={[styles.prText, { color: colors.warning }]}>PR</Text>
        </View>
      )}
    </View>
  );
}

/**
 * EmptyHistory Component
 *
 * Displayed when workout has no logged entries.
 */
export function EmptyHistory() {
  const { colors } = useTheme();

  return (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="time-outline"
        size={48}
        color={colors.textTertiary}
      />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No history yet</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Log your first workout to start tracking progress
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  containerFirst: {
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
  },
  containerLast: {
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
    borderBottomWidth: 0,
  },
  dateColumn: {
    width: 72,
    marginRight: spacing.md,
  },
  dateText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  timeText: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  weight: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  separator: {
    fontSize: typography.fontSize.base,
    marginHorizontal: spacing.sm,
  },
  reps: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  unit: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
  },
  notesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  notesText: {
    fontSize: typography.fontSize.xs,
    marginLeft: spacing.xs,
    flex: 1,
  },
  prBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  prText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    marginLeft: spacing.xs,
  },
  // Empty state styles
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.lg,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.base,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});

export default HistoryEntry;
