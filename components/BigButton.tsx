/**
 * BigButton Component
 *
 * Full-width primary action button with prominent styling.
 * Used for main CTAs like "LOG IT" button.
 * Features press animation and loading state.
 */

import React from 'react';
import { StyleSheet, Text, Pressable, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, spacing, typography, borderRadius, touchTargets, shadows } from '../theme';

interface BigButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function BigButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
}: BigButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = () => {
    if (!disabled && !loading) {
      onPress();
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          container: styles.successContainer,
          text: styles.successText,
        };
      case 'secondary':
        return {
          container: styles.secondaryContainer,
          text: styles.secondaryText,
        };
      case 'primary':
      default:
        return {
          container: styles.primaryContainer,
          text: styles.primaryText,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <AnimatedPressable
      style={[
        styles.container,
        variantStyles.container,
        disabled && styles.disabled,
        animatedStyle,
      ]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'secondary' ? colors.primary : colors.textInverse}
        />
      ) : (
        <View style={styles.content}>
          {icon && (
            <Ionicons
              name={icon}
              size={24}
              color={variant === 'secondary' ? colors.primary : colors.textInverse}
              style={styles.icon}
            />
          )}
          <Text style={[styles.text, variantStyles.text, disabled && styles.disabledText]}>
            {title}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: touchTargets.large,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    ...shadows.md,
  },
  primaryContainer: {
    backgroundColor: colors.primary,
  },
  secondaryContainer: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  successContainer: {
    backgroundColor: colors.success,
  },
  disabled: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: spacing.sm,
  },
  text: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  primaryText: {
    color: colors.textInverse,
  },
  secondaryText: {
    color: colors.primary,
  },
  successText: {
    color: colors.textInverse,
  },
  disabledText: {
    color: colors.textTertiary,
  },
});

export default BigButton;
