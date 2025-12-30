/**
 * FavoriteButton Component
 *
 * An animated heart icon button for favoriting workouts.
 *
 * Features:
 * - Filled heart when favorited, outline when not
 * - Scale bounce animation on toggle
 * - Uses theme colors (error/red for filled state)
 * - Minimum 44pt touch target for accessibility
 * - Handles favorite toggle via database functions
 */

import React, { useCallback } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { touchTargets } from '../theme';
import { useTheme } from '../context';

/**
 * Color for the favorite heart (slightly lighter red for better visibility)
 */
const FAVORITE_COLOR = '#FF6B6B';

interface FavoriteButtonProps {
  /** Whether the workout is currently favorited */
  isFavorite: boolean;
  /** Called when the button is pressed with the new favorite state */
  onToggle: (newState: boolean) => void;
  /** Optional size for the heart icon (default: 24) */
  size?: number;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Accessibility label */
  accessibilityLabel?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FavoriteButton({
  isFavorite,
  onToggle,
  size = 24,
  disabled = false,
  accessibilityLabel,
}: FavoriteButtonProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  // Animated scale style for bounce effect
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Handle press with bounce animation
  const handlePress = useCallback(() => {
    if (disabled) return;

    // Trigger bounce animation
    scale.value = withSequence(
      withSpring(1.3, { damping: 8, stiffness: 400 }),
      withSpring(1, { damping: 12, stiffness: 300 })
    );

    // Toggle favorite state
    onToggle(!isFavorite);
  }, [disabled, isFavorite, onToggle, scale]);

  // Determine icon and color based on favorite state
  const iconName = isFavorite ? 'heart' : 'heart-outline';
  const iconColor = isFavorite ? FAVORITE_COLOR : colors.textTertiary;

  return (
    <AnimatedPressable
      style={[styles.container, animatedStyle]}
      onPress={handlePress}
      disabled={disabled}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || (isFavorite ? 'Remove from favorites' : 'Add to favorites')}
      accessibilityState={{ selected: isFavorite, disabled }}
    >
      <Ionicons name={iconName} size={size} color={iconColor} />
    </AnimatedPressable>
  );
}

/**
 * Compact favorite indicator (smaller, for list items)
 */
interface FavoriteIndicatorProps {
  /** Whether the workout is favorited */
  isFavorite: boolean;
  /** Size of the icon (default: 16) */
  size?: number;
}

export function FavoriteIndicator({ isFavorite, size = 16 }: FavoriteIndicatorProps) {
  if (!isFavorite) return null;

  return (
    <Ionicons
      name="heart"
      size={size}
      color={FAVORITE_COLOR}
      style={styles.indicator}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: touchTargets.minimum,
    minHeight: touchTargets.minimum,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    marginLeft: 4,
  },
});

export default FavoriteButton;
