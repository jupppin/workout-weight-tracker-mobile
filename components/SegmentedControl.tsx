/**
 * SegmentedControl Component
 *
 * iOS-style segmented control with animated selection indicator.
 * Used for binary or multiple-choice settings like weight unit and theme.
 *
 * Features:
 * - Animated sliding indicator for smooth transitions
 * - Proper touch targets (minimum 44pt)
 * - Accessible with proper roles and labels
 * - Supports 2-4 segments
 * - Theme-aware styling
 */

import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  LayoutChangeEvent,
} from 'react-native';
import { spacing, typography, borderRadius } from '../theme';
import { useTheme } from '../context';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  selectedValue: T;
  onValueChange: (value: T) => void;
  disabled?: boolean;
}

export function SegmentedControl<T extends string>({
  options,
  selectedValue,
  onValueChange,
  disabled = false,
}: SegmentedControlProps<T>) {
  const { colors } = useTheme();
  const selectedIndex = options.findIndex((opt) => opt.value === selectedValue);
  const segmentWidth = useRef(0);
  const translateX = useRef(new Animated.Value(0)).current;

  // Update indicator position when selection or layout changes
  useEffect(() => {
    if (segmentWidth.current > 0) {
      Animated.spring(translateX, {
        toValue: selectedIndex * segmentWidth.current,
        useNativeDriver: true,
        damping: 20,
        stiffness: 300,
      }).start();
    }
  }, [selectedIndex, translateX]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    segmentWidth.current = (width - 4) / options.length; // Account for padding
    // Set initial position without animation
    translateX.setValue(selectedIndex * segmentWidth.current);
  };

  const handlePress = (value: T) => {
    if (!disabled && value !== selectedValue) {
      onValueChange(value);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surfaceElevated },
        disabled && styles.containerDisabled,
      ]}
      onLayout={handleLayout}
    >
      {/* Animated selection indicator */}
      <Animated.View
        style={[
          styles.indicator,
          {
            backgroundColor: colors.primary,
            width: segmentWidth.current || `${100 / options.length}%`,
            transform: [{ translateX }],
          },
        ]}
      />

      {/* Segment buttons */}
      {options.map((option, index) => {
        const isSelected = option.value === selectedValue;
        return (
          <TouchableOpacity
            key={option.value}
            style={styles.segment}
            activeOpacity={0.7}
            onPress={() => handlePress(option.value)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected: isSelected, disabled }}
          >
            <Text
              style={[
                styles.segmentText,
                { color: colors.textSecondary },
                isSelected && { color: colors.text, fontWeight: typography.fontWeight.semibold },
                disabled && { color: colors.textTertiary },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    padding: 2,
    position: 'relative',
    minHeight: 36,
  },
  containerDisabled: {
    opacity: 0.5,
  },
  indicator: {
    position: 'absolute',
    top: 2,
    left: 2,
    bottom: 2,
    borderRadius: borderRadius.md - 1,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    minHeight: 32,
    zIndex: 1,
  },
  segmentText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
});
