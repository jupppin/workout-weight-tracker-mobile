/**
 * IncrementButton Component
 *
 * Large, thumb-friendly button for adjusting weight values.
 * Features press animation for tactile feedback.
 * Designed for quick gym logging with minimal precision required.
 */

import React from 'react';
import { StyleSheet, Text, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { colors, spacing, typography, borderRadius, touchTargets } from '../theme';

interface IncrementButtonProps {
  value: number; // +5, -5, +10, -10
  onPress: () => void;
  disabled?: boolean;
  size?: 'default' | 'large';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function IncrementButton({
  value,
  onPress,
  disabled = false,
  size = 'default',
}: IncrementButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.9, { damping: 15, stiffness: 500 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSequence(
      withSpring(1.05, { damping: 15, stiffness: 500 }),
      withSpring(1, { damping: 15, stiffness: 400 })
    );
  };

  const handlePress = () => {
    if (!disabled) {
      onPress();
    }
  };

  // Determine styling based on value (positive vs negative)
  const isPositive = value > 0;
  const displayValue = isPositive ? `+${value}` : `${value}`;
  const isLargeValue = Math.abs(value) >= 10;

  const containerSize = size === 'large' ? styles.containerLarge : styles.container;
  const textSize = size === 'large' ? styles.textLarge : styles.text;

  return (
    <AnimatedPressable
      style={[
        containerSize,
        isPositive ? styles.positive : styles.negative,
        isLargeValue && styles.largeValue,
        disabled && styles.disabled,
        animatedStyle,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${isPositive ? 'Add' : 'Subtract'} ${Math.abs(value)} pounds`}
      accessibilityState={{ disabled }}
    >
      <Text
        style={[
          textSize,
          isPositive ? styles.textPositive : styles.textNegative,
          disabled && styles.textDisabled,
        ]}
      >
        {displayValue}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: touchTargets.large,
    height: touchTargets.large,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  containerLarge: {
    width: 72,
    height: touchTargets.large,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    paddingHorizontal: spacing.md,
  },
  positive: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: colors.success,
  },
  negative: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: colors.error,
  },
  largeValue: {
    // Slight emphasis for larger increments
  },
  disabled: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    opacity: 0.5,
  },
  text: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  textLarge: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  textPositive: {
    color: colors.success,
  },
  textNegative: {
    color: colors.error,
  },
  textDisabled: {
    color: colors.textTertiary,
  },
});

export default IncrementButton;
