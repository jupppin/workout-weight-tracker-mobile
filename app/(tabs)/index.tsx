/**
 * Home Screen
 *
 * Main landing screen with two sections:
 * 1. Quick Log - Horizontal scroll of recent workouts for fast access
 * 2. Browse by Muscle - 2-column grid of muscle groups
 *
 * Optimized for the 3-tap goal: Open -> Tap workout -> +5 -> LOG IT
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, borderRadius } from '../../theme';
import { WorkoutCard, MuscleGroupCard } from '../../components';
import { useDatabase } from '../../hooks/useDatabase';
import { useTheme, usePreferences, useRefresh } from '../../context';
import {
  getRecentWorkouts,
  getMuscleGroups,
  getWorkoutsByMuscleGroup,
  getFavoriteIds,
  RecentWorkoutResult,
} from '../../database/queries';
import { convertWeight } from '../../database/utils';
import type { MuscleGroup } from '../../database/schema';

/**
 * Interface for muscle group with workout count
 */
interface MuscleGroupWithCount extends MuscleGroup {
  workoutCount: number;
}

/**
 * Empty state component when no recent workouts
 */
function EmptyRecentState({ colors }: { colors: any }) {
  return (
    <View style={[styles.emptyRecent, { backgroundColor: colors.surface }]}>
      <Ionicons
        name="time-outline"
        size={32}
        color={colors.textTertiary}
      />
      <Text style={[styles.emptyRecentText, { color: colors.textSecondary }]}>
        No recent workouts yet
      </Text>
      <Text style={[styles.emptyRecentSubtext, { color: colors.textTertiary }]}>
        Browse below to get started
      </Text>
    </View>
  );
}

/**
 * Loading state component
 */
function LoadingState({ colors }: { colors: any }) {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading workouts...</Text>
    </View>
  );
}

/**
 * Home screen component
 */
export default function HomeScreen() {
  const router = useRouter();
  const { db, isLoading, userId } = useDatabase();
  const { colors } = useTheme();
  const { weightUnit } = usePreferences();
  const { refreshTrigger } = useRefresh();

  const [recentWorkouts, setRecentWorkouts] = useState<RecentWorkoutResult[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroupWithCount[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load data function
  const loadData = useCallback(() => {
    if (!db || !userId) return;

    try {
      // Get recent workouts (limit to 8 for horizontal scroll)
      const recents = getRecentWorkouts(db, userId, 8);
      setRecentWorkouts(recents);

      // Get muscle groups with workout counts
      const groups = getMuscleGroups(db);
      const groupsWithCount = groups.map((group) => {
        const workouts = getWorkoutsByMuscleGroup(db, group.id);
        return {
          ...group,
          workoutCount: workouts.length,
        };
      });
      setMuscleGroups(groupsWithCount);

      // Get favorite IDs for workout cards
      const favorites = getFavoriteIds(db, userId);
      setFavoriteIds(favorites);

      setIsDataLoading(false);
      setIsRefreshing(false);
    } catch (error) {
      console.error('Error loading home screen data:', error);
      setIsDataLoading(false);
      setIsRefreshing(false);
    }
  }, [db, userId]);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload when refresh is triggered (e.g., after logging a workout)
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadData();
    }
  }, [refreshTrigger, loadData]);

  // Pull to refresh handler
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadData();
  }, [loadData]);

  // Convert weight to display unit
  const convertToDisplayUnit = useCallback(
    (weight: number) => {
      return weightUnit === 'kg' ? convertWeight(weight, 'lbs', 'kg') : weight;
    },
    [weightUnit]
  );

  // Handle workout card press - navigate directly to quick log
  const handleWorkoutPress = (workoutId: string) => {
    router.push(`/log/${workoutId}`);
  };

  // Handle muscle group press - navigate to browse filtered by muscle
  const handleMuscleGroupPress = (muscleGroupId: string) => {
    router.push({
      pathname: '/(tabs)/browse',
      params: { muscleGroup: muscleGroupId },
    });
  };

  // Dynamic styles based on theme
  const themedStyles = useMemo(
    () => ({
      container: { ...styles.container, backgroundColor: colors.background },
      sectionTitle: { ...styles.sectionTitle, color: colors.text },
    }),
    [colors]
  );

  // Show loading state
  if (isLoading || isDataLoading) {
    return (
      <SafeAreaView style={themedStyles.container}>
        <LoadingState colors={colors} />
      </SafeAreaView>
    );
  }

  const hasRecentWorkouts = recentWorkouts.length > 0;

  return (
    <SafeAreaView style={themedStyles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Section 1: Quick Log */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flash" size={20} color={colors.primary} />
            <Text style={themedStyles.sectionTitle}>Quick Log</Text>
          </View>

          {hasRecentWorkouts ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentScrollContent}
            >
              {recentWorkouts.map((workout) => (
                <WorkoutCard
                  key={workout.workout_id}
                  workoutId={workout.workout_id}
                  workoutName={workout.workout_name}
                  lastWeight={convertToDisplayUnit(workout.last_weight)}
                  lastReps={workout.last_reps}
                  muscleGroupName={workout.muscle_group_name}
                  lastRecordedAt={workout.last_recorded_at}
                  onPress={handleWorkoutPress}
                  weightUnit={weightUnit}
                  isFavorite={favoriteIds.has(workout.workout_id)}
                />
              ))}
            </ScrollView>
          ) : (
            <EmptyRecentState colors={colors} />
          )}
        </View>

        {/* Section 2: Browse by Muscle */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="grid-outline" size={20} color={colors.textSecondary} />
            <Text style={themedStyles.sectionTitle}>Browse by Muscle</Text>
          </View>

          <View style={styles.muscleGrid}>
            {muscleGroups.map((group) => (
              <View key={group.id} style={styles.gridItem}>
                <MuscleGroupCard
                  muscleGroupId={group.id}
                  muscleGroupName={group.name}
                  workoutCount={group.workoutCount}
                  onPress={handleMuscleGroupPress}
                />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginLeft: spacing.sm,
  },
  recentScrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  emptyRecent: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  emptyRecentText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.md,
  },
  emptyRecentSubtext: {
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
  muscleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
  },
  gridItem: {
    width: '50%',
    padding: spacing.xs,
  },
});
