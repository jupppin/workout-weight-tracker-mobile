/**
 * ProgressIndicator Component
 *
 * Shows if user is improving at a glance:
 * - Green up arrow + percentage if weight increased
 * - Red down arrow if decreased
 * - Gray dash if same or no history
 *
 * Designed for immediate visual comprehension with color coding.
 */

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../theme';

type ProgressDirection = 'up' | 'down' | 'same' | 'none';

interface ProgressIndicatorProps {
  /** Current weight value */
  currentWeight: number | null;
  /** Previous weight value to compare against */
  previousWeight: number | null;
  /** Optional: Show percentage change */
  showPercentage?: boolean;
  /** Optional: Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Optional: Label to show */
  label?: string;
}

/**
 * Calculate progress direction and percentage
 */
function calculateProgress(
  current: number | null,
  previous: number | null
): { direction: ProgressDirection; percentage: number } {
  if (current === null || previous === null || previous === 0) {
    return { direction: 'none', percentage: 0 };
  }

  const diff = current - previous;
  const percentage = Math.round((diff / previous) * 100);

  if (diff > 0) {
    return { direction: 'up', percentage };
  } else if (diff < 0) {
    return { direction: 'down', percentage: Math.abs(percentage) };
  }
  return { direction: 'same', percentage: 0 };
}

/**
 * Get styling based on progress direction
 */
function getProgressStyle(direction: ProgressDirection) {
  switch (direction) {
    case 'up':
      return {
        color: colors.success,
        icon: 'arrow-up' as const,
        backgroundColor: 'rgba(34, 197, 94, 0.15)',
      };
    case 'down':
      return {
        color: colors.error,
        icon: 'arrow-down' as const,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
      };
    case 'same':
    case 'none':
    default:
      return {
        color: colors.textTertiary,
        icon: 'remove' as const,
        backgroundColor: colors.surfaceElevated,
      };
  }
}

/**
 * Get size dimensions
 */
function getSizeStyle(size: 'small' | 'medium' | 'large') {
  switch (size) {
    case 'small':
      return {
        iconSize: 14,
        fontSize: typography.fontSize.xs,
        padding: spacing.xs,
        paddingHorizontal: spacing.sm,
      };
    case 'large':
      return {
        iconSize: 24,
        fontSize: typography.fontSize.lg,
        padding: spacing.md,
        paddingHorizontal: spacing.lg,
      };
    case 'medium':
    default:
      return {
        iconSize: 18,
        fontSize: typography.fontSize.sm,
        padding: spacing.sm,
        paddingHorizontal: spacing.md,
      };
  }
}

export function ProgressIndicator({
  currentWeight,
  previousWeight,
  showPercentage = true,
  size = 'medium',
  label,
}: ProgressIndicatorProps) {
  const { direction, percentage } = calculateProgress(currentWeight, previousWeight);
  const progressStyle = getProgressStyle(direction);
  const sizeStyle = getSizeStyle(size);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: progressStyle.backgroundColor,
          paddingVertical: sizeStyle.padding,
          paddingHorizontal: sizeStyle.paddingHorizontal,
        },
      ]}
      accessibilityLabel={
        direction === 'up'
          ? `Improved by ${percentage} percent`
          : direction === 'down'
          ? `Decreased by ${percentage} percent`
          : 'No change'
      }
    >
      <Ionicons
        name={progressStyle.icon}
        size={sizeStyle.iconSize}
        color={progressStyle.color}
      />
      {showPercentage && direction !== 'none' && direction !== 'same' && (
        <Text
          style={[
            styles.percentage,
            { color: progressStyle.color, fontSize: sizeStyle.fontSize },
          ]}
        >
          {percentage}%
        </Text>
      )}
      {label && (
        <Text
          style={[
            styles.label,
            { color: progressStyle.color, fontSize: sizeStyle.fontSize },
          ]}
        >
          {label}
        </Text>
      )}
    </View>
  );
}

/**
 * ProgressSummary Component
 *
 * A more detailed progress display showing current vs previous values
 * with the progress indicator.
 */
interface ProgressSummaryProps {
  /** Current weight value */
  currentWeight: number | null;
  /** Previous weight value */
  previousWeight: number | null;
  /** Weight unit */
  weightUnit?: 'lbs' | 'kg';
  /** Label for current value */
  currentLabel?: string;
  /** Label for previous value */
  previousLabel?: string;
}

export function ProgressSummary({
  currentWeight,
  previousWeight,
  weightUnit = 'lbs',
  currentLabel = 'Current',
  previousLabel = 'Previous',
}: ProgressSummaryProps) {
  const { direction } = calculateProgress(currentWeight, previousWeight);
  const hasData = currentWeight !== null;

  return (
    <View style={styles.summaryContainer}>
      {/* Current value */}
      <View style={styles.summaryColumn}>
        <Text style={styles.summaryLabel}>{currentLabel}</Text>
        <Text style={styles.summaryValue}>
          {hasData ? `${currentWeight} ${weightUnit}` : '--'}
        </Text>
      </View>

      {/* Progress indicator in center */}
      <View style={styles.summaryIndicator}>
        <ProgressIndicator
          currentWeight={currentWeight}
          previousWeight={previousWeight}
          size="small"
          showPercentage={true}
        />
      </View>

      {/* Previous value */}
      <View style={[styles.summaryColumn, styles.summaryColumnRight]}>
        <Text style={styles.summaryLabel}>{previousLabel}</Text>
        <Text style={styles.summaryValueSecondary}>
          {previousWeight !== null ? `${previousWeight} ${weightUnit}` : '--'}
        </Text>
      </View>
    </View>
  );
}

/**
 * CompactProgressBadge Component
 *
 * A small inline badge showing just the direction arrow.
 * Useful for list items where space is limited.
 */
interface CompactProgressBadgeProps {
  currentWeight: number | null;
  previousWeight: number | null;
}

export function CompactProgressBadge({
  currentWeight,
  previousWeight,
}: CompactProgressBadgeProps) {
  const { direction, percentage } = calculateProgress(currentWeight, previousWeight);
  const progressStyle = getProgressStyle(direction);

  if (direction === 'none' || direction === 'same') {
    return null;
  }

  return (
    <View
      style={[styles.compactBadge, { backgroundColor: progressStyle.backgroundColor }]}
    >
      <Ionicons name={progressStyle.icon} size={12} color={progressStyle.color} />
      <Text style={[styles.compactText, { color: progressStyle.color }]}>
        {percentage}%
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  percentage: {
    fontWeight: typography.fontWeight.semibold,
    marginLeft: spacing.xs,
  },
  label: {
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.xs,
  },
  // Summary styles
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryColumn: {
    flex: 1,
  },
  summaryColumnRight: {
    alignItems: 'flex-end',
  },
  summaryLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  summaryValueSecondary: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  summaryIndicator: {
    marginHorizontal: spacing.md,
  },
  // Compact badge styles
  compactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  compactText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    marginLeft: 2,
  },
});

export default ProgressIndicator;
