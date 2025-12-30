/**
 * Quick Log Screen
 *
 * THE MOST IMPORTANT SCREEN - Optimized for speed.
 *
 * Goal: User can log a workout in 3 taps total:
 * 1. Tap workout from home (arrives here)
 * 2. Tap +5 or -5 to adjust weight
 * 3. Tap LOG IT
 *
 * Features:
 * - Pre-fills weight from last entry
 * - Large increment buttons for thumb-friendly adjustment
 * - Prominent LOG IT button in thumb zone
 * - Optional notes field (collapsed by default)
 * - Triggers home screen refresh after logging
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { spacing, typography, borderRadius, touchTargets } from '../../theme';
import { IncrementButton, BigButton } from '../../components';
import { useDatabase } from '../../hooks/useDatabase';
import { useTheme, usePreferences, useRefresh } from '../../context';
import {
  getWorkoutById,
  getLastEntry,
  logEntry,
} from '../../database/queries';
import { formatDate, convertWeight } from '../../database/utils';
import type { WorkoutWithMuscleGroup, WeightEntry } from '../../database/schema';

// Rep options for the rep selector
const REP_OPTIONS = [5, 6, 7, 8, 9, 10];
const DEFAULT_REPS = 7;
const DEFAULT_WEIGHT = 135;

/**
 * Rep Selector Component
 * Horizontal pill selector for rep count
 */
function RepSelector({
  selectedReps,
  onSelect,
  colors,
}: {
  selectedReps: number;
  onSelect: (reps: number) => void;
  colors: any;
}) {
  return (
    <View style={repStyles.container}>
      <Text style={[repStyles.label, { color: colors.textSecondary }]}>Reps</Text>
      <View style={repStyles.pills}>
        {REP_OPTIONS.map((rep) => (
          <Pressable
            key={rep}
            style={[
              repStyles.pill,
              { backgroundColor: colors.surface },
              selectedReps === rep && { backgroundColor: colors.primary },
            ]}
            onPress={() => onSelect(rep)}
            accessibilityRole="button"
            accessibilityLabel={`${rep} reps`}
            accessibilityState={{ selected: selectedReps === rep }}
          >
            <Text
              style={[
                repStyles.pillText,
                { color: colors.textSecondary },
                selectedReps === rep && { color: colors.text },
              ]}
            >
              {rep}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const repStyles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.sm,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pills: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  pill: {
    minWidth: touchTargets.minimum,
    height: touchTargets.minimum,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  pillText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
});

/**
 * Success feedback overlay
 */
function SuccessFeedback({ colors }: { colors: any }) {
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={successStyles.container}
    >
      <View style={successStyles.content}>
        <Ionicons name="checkmark-circle" size={64} color={colors.success} />
        <Text style={[successStyles.text, { color: colors.success }]}>Logged!</Text>
      </View>
    </Animated.View>
  );
}

const successStyles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  content: {
    alignItems: 'center',
  },
  text: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing.md,
  },
});

/**
 * Quick Log Screen Component
 */
export default function QuickLogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { db, userId } = useDatabase();
  const { colors } = useTheme();
  const { weightUnit } = usePreferences();
  const { triggerRefresh } = useRefresh();

  // State
  const [workout, setWorkout] = useState<WorkoutWithMuscleGroup | null>(null);
  const [lastEntry, setLastEntry] = useState<WeightEntry | null>(null);
  const [weight, setWeight] = useState(DEFAULT_WEIGHT);
  const [reps, setReps] = useState(DEFAULT_REPS);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Animation for weight display
  const weightScale = useSharedValue(1);

  const weightAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: weightScale.value }],
  }));

  // Convert weight to display unit
  const convertToDisplayUnit = useCallback(
    (w: number) => {
      return weightUnit === 'kg' ? convertWeight(w, 'lbs', 'kg') : w;
    },
    [weightUnit]
  );

  // Convert weight from display unit to storage unit (lbs)
  const convertToStorageUnit = useCallback(
    (w: number) => {
      return weightUnit === 'kg' ? convertWeight(w, 'kg', 'lbs') : w;
    },
    [weightUnit]
  );

  // Load workout and last entry data
  useEffect(() => {
    if (!db || !userId || !id) return;

    try {
      const workoutData = getWorkoutById(db, id);
      setWorkout(workoutData);

      if (workoutData) {
        const entry = getLastEntry(db, userId, id);
        setLastEntry(entry);

        // Pre-fill weight from last entry (convert to display unit)
        if (entry) {
          setWeight(convertToDisplayUnit(entry.weight));
          setReps(entry.reps);
        } else {
          // Set default weight in display unit
          setWeight(convertToDisplayUnit(DEFAULT_WEIGHT));
        }
      }
    } catch (error) {
      console.error('Error loading workout data:', error);
    }
  }, [db, userId, id, convertToDisplayUnit]);

  // Handle weight increment with animation
  const handleWeightChange = useCallback((delta: number) => {
    setWeight((prev) => {
      const newWeight = Math.max(0, prev + delta);
      return newWeight;
    });

    // Pulse animation
    weightScale.value = withSequence(
      withSpring(1.1, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 400 })
    );
  }, []);

  // Handle logging the entry
  const handleLog = useCallback(async () => {
    if (!db || !userId || !id || isLogging) return;

    setIsLogging(true);

    try {
      // Convert weight to storage unit (lbs) before saving
      const weightInLbs = convertToStorageUnit(weight);

      logEntry(db, {
        userId,
        workoutId: id,
        weight: weightInLbs,
        reps,
        notes: notes.trim() || undefined,
      });

      // Show success feedback
      setShowSuccess(true);

      // Trigger refresh for home screen and other screens
      triggerRefresh();

      // Navigate back after brief delay
      setTimeout(() => {
        router.back();
      }, 800);
    } catch (error) {
      console.error('Error logging entry:', error);
      setIsLogging(false);
    }
  }, [db, userId, id, weight, reps, notes, isLogging, router, convertToStorageUnit, triggerRefresh]);

  // Format last entry info for display
  const lastEntryText = lastEntry
    ? `Last: ${convertToDisplayUnit(lastEntry.weight)} ${weightUnit} (${formatDate(lastEntry.recorded_at)})`
    : 'First time logging this workout';

  // Dynamic styles based on theme
  const themedStyles = useMemo(
    () => ({
      container: { ...styles.container, backgroundColor: colors.background },
      lastEntryContainer: { ...styles.lastEntryContainer, backgroundColor: colors.surface },
      lastEntryText: { ...styles.lastEntryText, color: colors.textSecondary },
      weightLabel: { ...styles.weightLabel, color: colors.textTertiary },
      weightValue: { ...styles.weightValue, color: colors.text },
      weightUnit: { ...styles.weightUnit, color: colors.textSecondary },
      notesToggleText: { ...styles.notesToggleText, color: colors.textSecondary },
      notesInput: {
        ...styles.notesInput,
        backgroundColor: colors.surface,
        color: colors.text
      },
      bottomContainer: {
        ...styles.bottomContainer,
        backgroundColor: colors.background,
        borderTopColor: colors.border
      },
    }),
    [colors]
  );

  return (
    <SafeAreaView style={themedStyles.container}>
      <Stack.Screen
        options={{
          title: workout?.name || 'Log Workout',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerBackTitle: 'Back',
        }}
      />

      {showSuccess && <SuccessFeedback colors={colors} />}

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Last entry info */}
          <View style={themedStyles.lastEntryContainer}>
            <Ionicons
              name="time-outline"
              size={16}
              color={colors.textTertiary}
            />
            <Text style={themedStyles.lastEntryText}>{lastEntryText}</Text>
          </View>

          {/* Weight Display - LARGE and prominent */}
          <View style={styles.weightSection}>
            <Text style={themedStyles.weightLabel}>WEIGHT</Text>
            <Animated.View style={[styles.weightDisplay, weightAnimatedStyle]}>
              <Text style={themedStyles.weightValue}>{weight}</Text>
              <Text style={themedStyles.weightUnit}>{weightUnit}</Text>
            </Animated.View>
          </View>

          {/* Increment Buttons - Thumb-friendly row */}
          <View style={styles.incrementRow}>
            <IncrementButton
              value={-10}
              onPress={() => handleWeightChange(-10)}
              size="large"
            />
            <IncrementButton
              value={-5}
              onPress={() => handleWeightChange(-5)}
            />
            <IncrementButton
              value={5}
              onPress={() => handleWeightChange(5)}
            />
            <IncrementButton
              value={10}
              onPress={() => handleWeightChange(10)}
              size="large"
            />
          </View>

          {/* Rep Selector */}
          <RepSelector selectedReps={reps} onSelect={setReps} colors={colors} />

          {/* Notes Toggle */}
          <Pressable
            style={styles.notesToggle}
            onPress={() => setShowNotes(!showNotes)}
            accessibilityRole="button"
            accessibilityLabel={showNotes ? 'Hide notes' : 'Add notes'}
          >
            <Ionicons
              name={showNotes ? 'chevron-up' : 'add'}
              size={20}
              color={colors.textSecondary}
            />
            <Text style={themedStyles.notesToggleText}>
              {showNotes ? 'Hide notes' : 'Add notes (optional)'}
            </Text>
          </Pressable>

          {/* Notes Input (collapsed by default) */}
          {showNotes && (
            <Animated.View
              entering={FadeIn.duration(200)}
              style={styles.notesContainer}
            >
              <TextInput
                style={themedStyles.notesInput}
                placeholder="Add notes about this set..."
                placeholderTextColor={colors.textTertiary}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                accessibilityLabel="Notes input"
              />
            </Animated.View>
          )}
        </ScrollView>

        {/* LOG IT Button - Fixed at bottom, always visible */}
        <View style={themedStyles.bottomContainer}>
          <BigButton
            title="LOG IT"
            onPress={handleLog}
            variant="success"
            loading={isLogging}
            disabled={weight <= 0}
            icon="checkmark-circle"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  lastEntryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
  },
  lastEntryText: {
    fontSize: typography.fontSize.sm,
    marginLeft: spacing.sm,
  },
  weightSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  weightLabel: {
    fontSize: typography.fontSize.xs,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  weightDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  weightValue: {
    fontSize: 72,
    fontWeight: typography.fontWeight.bold,
    includeFontPadding: false,
  },
  weightUnit: {
    fontSize: typography.fontSize['2xl'],
    marginLeft: spacing.sm,
  },
  incrementRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  notesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  notesToggleText: {
    fontSize: typography.fontSize.sm,
    marginLeft: spacing.xs,
  },
  notesContainer: {
    marginBottom: spacing.lg,
  },
  notesInput: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    minHeight: 80,
  },
  bottomContainer: {
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
    borderTopWidth: 1,
  },
});
