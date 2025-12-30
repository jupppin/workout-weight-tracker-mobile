/**
 * Workout Detail Screen
 *
 * Shows workout information, progress, and history.
 *
 * Features:
 * - Header with workout name and muscle group
 * - Prominent "Log Workout" button
 * - Progress section showing PR and comparison to last entry
 * - Scrollable history list with most recent at top
 * - PR badges on entries that set records
 * - Swipe-to-delete on history entries
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { spacing, typography, borderRadius, touchTargets } from '../../theme';
import {
  HistoryEntry,
  EmptyHistory,
  ProgressSummary,
  ConfirmDialog,
  FavoriteButton,
} from '../../components';
import { useDatabaseContext } from '../../hooks';
import { useTheme, usePreferences } from '../../context';
import {
  getWorkoutById,
  getWorkoutHistory,
  getPersonalRecord,
  getLastEntry,
  deleteEntry,
  isFavorite,
  toggleFavorite,
} from '../../database/queries';
import { convertWeight } from '../../database/utils';
import type {
  WorkoutWithMuscleGroup,
  WeightEntry,
} from '../../database/schema';
import type { WorkoutHistoryEntry } from '../../database/queries';

/**
 * Swipeable delete action component
 */
function DeleteAction({ onPress, colors }: { onPress: () => void; colors: any }) {
  return (
    <TouchableOpacity
      style={[styles.deleteAction, { backgroundColor: colors.error }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
      <Text style={styles.deleteActionText}>Delete</Text>
    </TouchableOpacity>
  );
}

/**
 * Swipeable history entry wrapper
 */
function SwipeableHistoryEntry({
  entry,
  isPR,
  isFirst,
  isLast,
  weightUnit,
  displayWeight,
  onDelete,
  colors,
}: {
  entry: WorkoutHistoryEntry;
  isPR: boolean;
  isFirst: boolean;
  isLast: boolean;
  weightUnit: 'lbs' | 'kg';
  displayWeight: number;
  onDelete: (id: string) => void;
  colors: any;
}) {
  const swipeableRef = React.useRef<Swipeable>(null);

  const handleDelete = () => {
    swipeableRef.current?.close();
    onDelete(entry.id);
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={() => <DeleteAction onPress={handleDelete} colors={colors} />}
      overshootRight={false}
      friction={2}
    >
      <HistoryEntry
        id={entry.id}
        weight={displayWeight}
        reps={entry.reps}
        recordedAt={entry.recorded_at}
        notes={entry.notes}
        weightUnit={weightUnit}
        isPR={isPR}
        isFirst={isFirst}
        isLast={isLast}
      />
    </Swipeable>
  );
}

/**
 * Workout detail screen component
 */
export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { db, isLoading: dbLoading, userId } = useDatabaseContext();
  const { colors } = useTheme();
  const { weightUnit } = usePreferences();

  // State
  const [workout, setWorkout] = useState<WorkoutWithMuscleGroup | null>(null);
  const [history, setHistory] = useState<WorkoutHistoryEntry[]>([]);
  const [personalRecord, setPersonalRecord] = useState<WeightEntry | null>(null);
  const [lastEntry, setLastEntry] = useState<WeightEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delete confirmation dialog state
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Favorite state
  const [isFavorited, setIsFavorited] = useState(false);

  // Load workout data
  const loadWorkoutData = useCallback(async () => {
    if (!db || !id || !userId) return;

    try {
      setError(null);

      // Get workout info
      const workoutData = getWorkoutById(db, id);
      if (!workoutData) {
        setError('Workout not found');
        return;
      }
      setWorkout(workoutData);

      // Get workout history
      const historyData = getWorkoutHistory(db, id, userId, 50);
      setHistory(historyData);

      // Get personal record
      const prData = getPersonalRecord(db, userId, id);
      setPersonalRecord(prData);

      // Get last entry for comparison
      const lastEntryData = getLastEntry(db, userId, id);
      setLastEntry(lastEntryData);

      // Check favorite status
      const favoriteStatus = isFavorite(db, userId, id);
      setIsFavorited(favoriteStatus);
    } catch (err) {
      console.error('Error loading workout data:', err);
      setError('Failed to load workout data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [db, id, userId]);

  // Initial load
  useEffect(() => {
    loadWorkoutData();
  }, [loadWorkoutData]);

  // Pull to refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadWorkoutData();
  }, [loadWorkoutData]);

  // Navigate to log screen
  const handleLogWorkout = useCallback(() => {
    router.push(`/log/${id}`);
  }, [router, id]);

  // Handle delete request (show confirmation)
  const handleDeleteRequest = useCallback((entryId: string) => {
    setEntryToDelete(entryId);
    setDeleteDialogVisible(true);
  }, []);

  // Confirm delete
  const handleConfirmDelete = useCallback(async () => {
    if (!db || !userId || !entryToDelete) return;

    setIsDeleting(true);
    try {
      const success = deleteEntry(db, entryToDelete, userId);
      if (success) {
        // Refresh the list after deletion
        loadWorkoutData();
      } else {
        Alert.alert('Error', 'Failed to delete entry. Please try again.');
      }
    } catch (err) {
      console.error('Error deleting entry:', err);
      Alert.alert('Error', 'Failed to delete entry. Please try again.');
    } finally {
      setIsDeleting(false);
      setDeleteDialogVisible(false);
      setEntryToDelete(null);
    }
  }, [db, userId, entryToDelete, loadWorkoutData]);

  // Cancel delete
  const handleCancelDelete = useCallback(() => {
    setDeleteDialogVisible(false);
    setEntryToDelete(null);
  }, []);

  // Handle favorite toggle
  const handleFavoriteToggle = useCallback(() => {
    if (!db || !userId || !id) return;

    try {
      const result = toggleFavorite(db, userId, id);
      setIsFavorited(result.isFavorite);
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  }, [db, userId, id]);

  // Convert weight to display unit
  const convertToDisplayUnit = useCallback(
    (weight: number) => {
      // All weights are stored in lbs by default
      return weightUnit === 'kg' ? convertWeight(weight, 'lbs', 'kg') : weight;
    },
    [weightUnit]
  );

  // Calculate progress from history
  const progressData = useMemo(() => {
    if (history.length < 2) {
      return {
        currentWeight: history[0] ? convertToDisplayUnit(history[0].weight) : null,
        previousWeight: null,
        isImproving: null,
      };
    }

    const currentWeight = convertToDisplayUnit(history[0].weight);
    const previousWeight = convertToDisplayUnit(history[1].weight);
    const isImproving = currentWeight > previousWeight;

    return {
      currentWeight,
      previousWeight,
      isImproving,
    };
  }, [history, convertToDisplayUnit]);

  // Dynamic styles based on theme
  const themedStyles = useMemo(
    () => ({
      container: { ...styles.container, backgroundColor: colors.background },
      loadingText: { ...styles.loadingText, color: colors.textSecondary },
      errorText: { ...styles.errorText, color: colors.textSecondary },
      retryButton: { ...styles.retryButton, backgroundColor: colors.surface },
      retryButtonText: { ...styles.retryButtonText, color: colors.primary },
      muscleGroupBadge: { ...styles.muscleGroupBadge, backgroundColor: colors.surfaceElevated },
      muscleGroupText: { ...styles.muscleGroupText, color: colors.primary },
      logButton: { ...styles.logButton, backgroundColor: colors.primary },
      logButtonText: { ...styles.logButtonText, color: colors.textInverse },
      prCard: { ...styles.prCard, backgroundColor: colors.surface },
      prTitle: { ...styles.prTitle, color: colors.textSecondary },
      prValue: { ...styles.prValue, color: colors.warning },
      prUnit: { ...styles.prUnit, color: colors.textSecondary },
      prReps: { ...styles.prReps, color: colors.textSecondary },
      prEmpty: { ...styles.prEmpty, color: colors.textTertiary },
      comparisonCard: { ...styles.comparisonCard, backgroundColor: colors.surface },
      comparisonTitle: { ...styles.comparisonTitle, color: colors.textSecondary },
      lastEntryCard: { ...styles.lastEntryCard, backgroundColor: colors.surface },
      lastEntryTitle: { ...styles.lastEntryTitle, color: colors.textSecondary },
      lastEntryDate: { ...styles.lastEntryDate, color: colors.text },
      sectionTitle: { ...styles.sectionTitle, color: colors.text },
      historyCount: { ...styles.historyCount, color: colors.textSecondary },
    }),
    [colors]
  );

  // Loading state
  if (dbLoading || isLoading) {
    return (
      <SafeAreaView style={themedStyles.container}>
        <Stack.Screen
          options={{
            title: 'Loading...',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerShadowVisible: false,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={themedStyles.loadingText}>Loading workout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !workout) {
    return (
      <SafeAreaView style={themedStyles.container}>
        <Stack.Screen
          options={{
            title: 'Error',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerShadowVisible: false,
          }}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={themedStyles.errorText}>{error || 'Workout not found'}</Text>
          <TouchableOpacity
            style={themedStyles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={themedStyles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const displayPR = personalRecord ? convertToDisplayUnit(personalRecord.weight) : null;

  return (
    <SafeAreaView style={themedStyles.container}>
      <Stack.Screen
        options={{
          title: workout.name,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerRight: () => (
            <FavoriteButton
              isFavorite={isFavorited}
              onToggle={handleFavoriteToggle}
              size={24}
              accessibilityLabel={
                isFavorited
                  ? `Remove ${workout.name} from favorites`
                  : `Add ${workout.name} to favorites`
              }
            />
          ),
        }}
      />

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
        {/* Header info */}
        <View style={styles.headerInfo}>
          <View style={themedStyles.muscleGroupBadge}>
            <Text style={themedStyles.muscleGroupText}>{workout.muscle_group_name}</Text>
          </View>
        </View>

        {/* Log workout button */}
        <TouchableOpacity
          style={themedStyles.logButton}
          activeOpacity={0.8}
          onPress={handleLogWorkout}
          accessibilityRole="button"
          accessibilityLabel="Log new workout"
        >
          <Ionicons name="add" size={24} color={colors.textInverse} />
          <Text style={themedStyles.logButtonText}>Log Workout</Text>
        </TouchableOpacity>

        {/* Progress section */}
        <View style={styles.progressSection}>
          {/* Personal record card */}
          <View style={themedStyles.prCard}>
            <View style={styles.prHeader}>
              <Ionicons name="trophy" size={20} color={colors.warning} />
              <Text style={themedStyles.prTitle}>Personal Record</Text>
            </View>
            {personalRecord ? (
              <View style={styles.prContent}>
                <Text style={themedStyles.prValue}>
                  {displayPR}
                  <Text style={themedStyles.prUnit}> {weightUnit}</Text>
                </Text>
                <Text style={themedStyles.prReps}>
                  {personalRecord.reps} reps
                </Text>
              </View>
            ) : (
              <Text style={themedStyles.prEmpty}>No records yet</Text>
            )}
          </View>

          {/* Progress comparison card */}
          {history.length > 0 && (
            <View style={themedStyles.comparisonCard}>
              <Text style={themedStyles.comparisonTitle}>Latest vs Previous</Text>
              <ProgressSummary
                currentWeight={progressData.currentWeight}
                previousWeight={progressData.previousWeight}
                weightUnit={weightUnit}
                currentLabel="Latest"
                previousLabel="Previous"
              />
            </View>
          )}

          {/* Last entry info */}
          {lastEntry && (
            <View style={themedStyles.lastEntryCard}>
              <View style={styles.lastEntryHeader}>
                <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                <Text style={themedStyles.lastEntryTitle}>Last Entry</Text>
              </View>
              <Text style={themedStyles.lastEntryDate}>
                {new Date(lastEntry.recorded_at).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
            </View>
          )}
        </View>

        {/* History section */}
        <View style={styles.historySection}>
          <View style={styles.sectionHeader}>
            <Text style={themedStyles.sectionTitle}>History</Text>
            {history.length > 0 && (
              <Text style={themedStyles.historyCount}>{history.length} entries</Text>
            )}
          </View>

          <Text style={[styles.swipeHint, { color: colors.textTertiary }]}>
            Swipe left to delete
          </Text>

          {history.length > 0 ? (
            <View style={styles.historyList}>
              {history.map((entry, index) => {
                // Check if this entry is a PR (highest weight)
                const isPR = !!(personalRecord && entry.weight === personalRecord.weight);
                const displayWeight = convertToDisplayUnit(entry.weight);

                return (
                  <SwipeableHistoryEntry
                    key={entry.id}
                    entry={entry}
                    isPR={isPR}
                    isFirst={index === 0}
                    isLast={index === history.length - 1}
                    weightUnit={weightUnit}
                    displayWeight={displayWeight}
                    onDelete={handleDeleteRequest}
                    colors={colors}
                  />
                );
              })}
            </View>
          ) : (
            <EmptyHistory />
          )}
        </View>
      </ScrollView>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        visible={deleteDialogVisible}
        title="Delete Entry?"
        message="Are you sure you want to delete this workout entry? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
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
    padding: spacing.lg,
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorText: {
    marginTop: spacing.lg,
    fontSize: typography.fontSize.base,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  retryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  headerInfo: {
    marginBottom: spacing.lg,
  },
  muscleGroupBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  muscleGroupText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    minHeight: touchTargets.comfortable,
  },
  logButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginLeft: spacing.sm,
  },
  progressSection: {
    marginBottom: spacing.xl,
  },
  prCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  prHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  prTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: spacing.sm,
  },
  prContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  prValue: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
  },
  prUnit: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.normal,
  },
  prReps: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.lg,
  },
  prEmpty: {
    fontSize: typography.fontSize.base,
    fontStyle: 'italic',
  },
  comparisonCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  comparisonTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  lastEntryCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  lastEntryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastEntryTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.xs,
  },
  lastEntryDate: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.sm,
  },
  historySection: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  historyCount: {
    fontSize: typography.fontSize.sm,
  },
  swipeHint: {
    fontSize: typography.fontSize.xs,
    marginBottom: spacing.md,
  },
  historyList: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
  deleteActionText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.xs,
  },
});
