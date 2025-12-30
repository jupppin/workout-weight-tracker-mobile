/**
 * MuscleGroupCard Component
 *
 * Card for displaying muscle groups in a 2-column grid.
 * Shows muscle group name, icon, and workout count.
 * Designed for browse screen navigation.
 * Theme-aware styling.
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

interface MuscleGroupCardProps {
  muscleGroupId: string;
  muscleGroupName: string;
  workoutCount: number;
  onPress: (muscleGroupId: string) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Get icon and color for each muscle group
 */
function getMuscleGroupStyle(name: string): { icon: keyof typeof Ionicons.glyphMap; color: string } {
  const styleMap: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
    Chest: { icon: 'fitness', color: '#EF4444' },
    Back: { icon: 'body', color: '#3B82F6' },
    Legs: { icon: 'walk', color: '#22C55E' },
    Shoulders: { icon: 'body', color: '#F59E0B' },
    Biceps: { icon: 'barbell', color: '#8B5CF6' },
    Triceps: { icon: 'barbell', color: '#EC4899' },
    Core: { icon: 'body', color: '#06B6D4' },
  };
  return styleMap[name] || { icon: 'fitness', color: '#6366F1' };
}

export function MuscleGroupCard({
  muscleGroupId,
  muscleGroupName,
  workoutCount,
  onPress,
}: MuscleGroupCardProps) {
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

  const { icon, color } = getMuscleGroupStyle(muscleGroupName);

  return (
    <AnimatedPressable
      style={[styles.container, { backgroundColor: colors.surface }, animatedStyle]}
      onPress={() => onPress(muscleGroupId)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={`${muscleGroupName}, ${workoutCount} exercises`}
      accessibilityHint="Tap to browse exercises for this muscle group"
    >
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>

      {/* Muscle group name */}
      <Text style={[styles.name, { color: colors.text }]}>{muscleGroupName}</Text>

      {/* Workout count */}
      <Text style={[styles.count, { color: colors.textSecondary }]}>
        {workoutCount} {workoutCount === 1 ? 'exercise' : 'exercises'}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    margin: spacing.xs,
    alignItems: 'center',
    minHeight: 120,
    ...shadows.sm,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  name: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  count: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
  },
});

export default MuscleGroupCard;
