/**
 * WorkoutCard Component
 *
 * Compact card for displaying recent workouts in a horizontal scroll.
 * Shows workout name, last weight used, and muscle group badge.
 * Designed for thumb-friendly quick access.
 * Optional favorite indicator shows heart icon when favorited.
 */

import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { spacing, typography, borderRadius, shadows } from '../theme';
import { useTheme } from '../context';

/** Color for the favorite heart */
const FAVORITE_COLOR = '#FF6B6B';

interface WorkoutCardProps {
  workoutId: string;
  workoutName: string;
  lastWeight: number;
  lastReps: number;
  muscleGroupName: string;
  lastRecordedAt?: string;
  weightUnit?: 'lbs' | 'kg';
  onPress: (workoutId: string) => void;
  /** Whether the workout is favorited (shows heart indicator) */
  isFavorite?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Format the date for display
 */
function formatLastDate(dateString?: string): string {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Get badge color based on muscle group
 */
function getMuscleGroupColor(muscleGroup: string): string {
  const colorMap: Record<string, string> = {
    Chest: '#EF4444',
    Back: '#3B82F6',
    Legs: '#22C55E',
    Shoulders: '#F59E0B',
    Biceps: '#8B5CF6',
    Triceps: '#EC4899',
    Core: '#06B6D4',
  };
  return colorMap[muscleGroup] || '#6366F1';
}

export function WorkoutCard({
  workoutId,
  workoutName,
  lastWeight,
  lastReps,
  muscleGroupName,
  lastRecordedAt,
  weightUnit = 'lbs',
  onPress,
  isFavorite = false,
}: WorkoutCardProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const badgeColor = getMuscleGroupColor(muscleGroupName);

  return (
    <AnimatedPressable
      style={[styles.container, { backgroundColor: colors.surface }, animatedStyle]}
      onPress={() => onPress(workoutId)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={`${workoutName}, ${lastWeight} ${weightUnit}, ${muscleGroupName}${isFavorite ? ', favorited' : ''}`}
      accessibilityHint="Tap to log this workout"
    >
      {/* Header row with badge and favorite indicator */}
      <View style={styles.headerRow}>
        {/* Muscle group badge */}
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={[styles.badgeText, { color: colors.text }]}>{muscleGroupName}</Text>
        </View>

        {/* Favorite indicator */}
        {isFavorite && (
          <Ionicons
            name="heart"
            size={14}
            color={FAVORITE_COLOR}
            style={styles.favoriteIcon}
          />
        )}
      </View>

      {/* Workout name */}
      <Text style={[styles.workoutName, { color: colors.text }]} numberOfLines={2}>
        {workoutName}
      </Text>

      {/* Last weight - prominent display */}
      <View style={styles.weightContainer}>
        <Text style={[styles.weightValue, { color: colors.text }]}>{lastWeight}</Text>
        <Text style={[styles.weightUnit, { color: colors.textSecondary }]}>{weightUnit}</Text>
      </View>

      {/* Last recorded date */}
      {lastRecordedAt && (
        <Text style={[styles.dateText, { color: colors.textTertiary }]}>{formatLastDate(lastRecordedAt)}</Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 140,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginRight: spacing.md,
    minHeight: 140,
    justifyContent: 'space-between',
    ...shadows.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  favoriteIcon: {
    marginLeft: spacing.xs,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  workoutName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.tight,
  },
  weightContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
  },
  weightValue: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
  },
  weightUnit: {
    fontSize: typography.fontSize.sm,
    marginLeft: spacing.xs,
  },
  dateText: {
    fontSize: typography.fontSize.xs,
  },
});

export default WorkoutCard;
