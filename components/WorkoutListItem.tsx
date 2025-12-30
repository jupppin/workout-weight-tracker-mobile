/**
 * WorkoutListItem Component
 *
 * A list row item for displaying workouts in browse/search results.
 *
 * Features:
 * - Workout name prominently displayed
 * - Muscle group badge for quick categorization
 * - Optional favorite button for quick favoriting
 * - Chevron indicating navigation
 * - Long press handler for quick actions
 * - Minimum touch target height (48pt)
 * - Theme-aware styling
 */

import React, { useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { spacing, typography, borderRadius, touchTargets } from '../theme';
import { useTheme } from '../context';

/** Color for the favorite heart */
const FAVORITE_COLOR = '#FF6B6B';

interface WorkoutListItemProps {
  /** Unique workout ID */
  id: string;
  /** Workout name */
  name: string;
  /** Muscle group name for the badge */
  muscleGroupName: string;
  /** Called when item is tapped */
  onPress: (id: string) => void;
  /** Called when item is long-pressed (for quick actions) */
  onLongPress?: (id: string) => void;
  /** Whether this item is the last in the list (removes bottom border) */
  isLast?: boolean;
  /** Whether the workout is favorited */
  isFavorite?: boolean;
  /** Called when favorite button is pressed */
  onFavoriteToggle?: (id: string) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function WorkoutListItem({
  id,
  name,
  muscleGroupName,
  onPress,
  onLongPress,
  isLast = false,
  isFavorite = false,
  onFavoriteToggle,
}: WorkoutListItemProps) {
  const { colors } = useTheme();
  const favoriteScale = useSharedValue(1);

  const handlePress = useCallback(() => {
    onPress(id);
  }, [id, onPress]);

  const handleLongPress = useCallback(() => {
    onLongPress?.(id);
  }, [id, onLongPress]);

  const handleFavoritePress = useCallback(() => {
    // Trigger bounce animation
    favoriteScale.value = withSequence(
      withSpring(1.3, { damping: 8, stiffness: 400 }),
      withSpring(1, { damping: 12, stiffness: 300 })
    );
    onFavoriteToggle?.(id);
  }, [id, onFavoriteToggle, favoriteScale]);

  const favoriteAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: favoriteScale.value }],
  }));

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderBottomColor: colors.divider },
        isLast && styles.containerLast,
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={500}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${muscleGroupName}${isFavorite ? ', favorited' : ''}`}
      accessibilityHint="Tap to view workout details, long press for quick actions"
    >
      <View style={styles.content}>
        {/* Workout name */}
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {name}
        </Text>

        {/* Muscle group badge */}
        <View style={[styles.badge, { backgroundColor: colors.surfaceElevated }]}>
          <Text style={[styles.badgeText, { color: colors.textSecondary }]}>{muscleGroupName}</Text>
        </View>
      </View>

      {/* Favorite button */}
      {onFavoriteToggle && (
        <AnimatedPressable
          style={[styles.favoriteButton, favoriteAnimatedStyle]}
          onPress={handleFavoritePress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={20}
            color={isFavorite ? FAVORITE_COLOR : colors.textTertiary}
          />
        </AnimatedPressable>
      )}

      {/* Chevron indicator */}
      <Ionicons
        name="chevron-forward"
        size={20}
        color={colors.textTertiary}
        style={styles.chevron}
      />
    </TouchableOpacity>
  );
}

/**
 * EmptyWorkoutList Component
 *
 * Displayed when no workouts match the current search/filter.
 */
interface EmptyWorkoutListProps {
  /** Message to display */
  message?: string;
  /** Subtext with suggestion */
  suggestion?: string;
}

export function EmptyWorkoutList({
  message = 'No workouts found',
  suggestion = 'Try a different search or create a custom workout',
}: EmptyWorkoutListProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="barbell-outline"
        size={48}
        color={colors.textTertiary}
      />
      <Text style={[styles.emptyMessage, { color: colors.text }]}>{message}</Text>
      <Text style={[styles.emptySuggestion, { color: colors.textSecondary }]}>{suggestion}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: touchTargets.comfortable,
    borderBottomWidth: 1,
  },
  containerLast: {
    borderBottomWidth: 0,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  name: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    flex: 1,
    marginRight: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  chevron: {
    marginLeft: spacing.xs,
  },
  favoriteButton: {
    padding: spacing.sm,
    marginRight: spacing.xs,
  },
  // Empty state styles
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyMessage: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  emptySuggestion: {
    fontSize: typography.fontSize.base,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});

export default WorkoutListItem;
