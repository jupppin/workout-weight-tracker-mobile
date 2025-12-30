/**
 * Favorites Screen
 *
 * Displays the user's favorited workouts for quick access.
 *
 * Features:
 * - List of favorited workouts
 * - Filter by muscle group
 * - Empty state when no favorites
 * - Tap to navigate to workout detail
 * - Swipe or button to unfavorite
 * - Theme-aware styling
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, borderRadius } from '../../theme';
import { WorkoutListItem, FilterChip } from '../../components';
import { useDatabaseContext } from '../../hooks';
import { useTheme } from '../../context';
import { getFavorites, toggleFavorite, getMuscleGroups } from '../../database/queries';
import type { WorkoutWithMuscleGroup, MuscleGroup } from '../../database/schema';

/**
 * Empty state component when no favorites
 */
function EmptyFavorites({ colors }: { colors: any }) {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="heart-outline"
        size={64}
        color={colors.textTertiary}
      />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No favorites yet
      </Text>
      <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
        Tap the heart on any workout to add it here for quick access.
      </Text>
    </View>
  );
}

/**
 * Favorites screen component
 */
export default function FavoritesScreen() {
  const router = useRouter();
  const { db, isLoading: dbLoading, userId } = useDatabaseContext();
  const { colors } = useTheme();

  // State
  const [favorites, setFavorites] = useState<WorkoutWithMuscleGroup[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load favorites and muscle groups
  const loadFavorites = useCallback(() => {
    if (!db || !userId) return;

    try {
      const data = getFavorites(db, userId);
      setFavorites(data);

      // Load muscle groups for filtering
      const groups = getMuscleGroups(db);
      setMuscleGroups(groups);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [db, userId]);

  // Filter favorites by selected muscle group
  const filteredFavorites = useMemo(() => {
    if (!selectedMuscleGroup) return favorites;
    return favorites.filter((w) => w.muscle_group_id === selectedMuscleGroup);
  }, [favorites, selectedMuscleGroup]);

  // Get unique muscle groups from favorites for filter options
  const availableMuscleGroups = useMemo(() => {
    const favoriteGroupIds = new Set(favorites.map((w) => w.muscle_group_id));
    return muscleGroups.filter((mg) => favoriteGroupIds.has(mg.id));
  }, [favorites, muscleGroups]);

  // Handle muscle group filter selection
  const handleMuscleGroupSelect = useCallback((muscleGroupId: string | null) => {
    setSelectedMuscleGroup(muscleGroupId);
  }, []);

  // Load on mount
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // Reload when screen comes into focus (to catch changes from other screens)
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
  );

  // Pull to refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadFavorites();
  }, [loadFavorites]);

  // Handle workout press - navigate to detail
  const handleWorkoutPress = useCallback(
    (workoutId: string) => {
      router.push(`/workout/${workoutId}`);
    },
    [router]
  );

  // Handle favorite toggle (unfavorite)
  const handleFavoriteToggle = useCallback(
    (workoutId: string) => {
      if (!db || !userId) return;

      try {
        toggleFavorite(db, userId, workoutId);
        // Remove from local list immediately
        setFavorites((prev) => prev.filter((w) => w.id !== workoutId));
      } catch (error) {
        console.error('Error toggling favorite:', error);
      }
    },
    [db, userId]
  );

  // Render workout item
  const renderWorkoutItem = useCallback(
    ({ item, index }: { item: WorkoutWithMuscleGroup; index: number }) => (
      <WorkoutListItem
        id={item.id}
        name={item.name}
        muscleGroupName={item.muscle_group_name}
        onPress={handleWorkoutPress}
        isLast={index === filteredFavorites.length - 1}
        isFavorite={true}
        onFavoriteToggle={handleFavoriteToggle}
      />
    ),
    [handleWorkoutPress, handleFavoriteToggle, filteredFavorites.length]
  );

  // Loading state
  if (dbLoading || isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading favorites...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Empty state message based on context
  const getEmptyMessage = () => {
    if (selectedMuscleGroup && favorites.length > 0) {
      const muscleGroup = muscleGroups.find((mg) => mg.id === selectedMuscleGroup);
      return {
        title: `No ${muscleGroup?.name || ''} favorites`,
        subtitle: 'Try selecting a different muscle group or add more favorites.',
      };
    }
    return {
      title: 'No favorites yet',
      subtitle: 'Tap the heart on any workout to add it here for quick access.',
    };
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Filter chips - only show if there are favorites */}
      {favorites.length > 0 && availableMuscleGroups.length > 0 && (
        <View style={[styles.filterHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
            keyboardShouldPersistTaps="handled"
          >
            <FilterChip
              label="All"
              selected={selectedMuscleGroup === null}
              onPress={() => handleMuscleGroupSelect(null)}
            />
            {availableMuscleGroups.map((mg) => (
              <FilterChip
                key={mg.id}
                label={mg.name}
                selected={selectedMuscleGroup === mg.id}
                onPress={() => handleMuscleGroupSelect(mg.id)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Content */}
      {filteredFavorites.length > 0 ? (
        <FlatList
          data={filteredFavorites}
          renderItem={renderWorkoutItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      ) : favorites.length > 0 ? (
        // Show filtered empty state
        <View style={styles.emptyContainer}>
          <Ionicons name="filter-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {getEmptyMessage().title}
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            {getEmptyMessage().subtitle}
          </Text>
        </View>
      ) : (
        <EmptyFavorites colors={colors} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  filterHeader: {
    borderBottomWidth: 1,
    paddingVertical: spacing.md,
  },
  filterContent: {
    paddingHorizontal: spacing.lg,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: typography.fontSize.base,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: typography.fontSize.base * typography.lineHeight.relaxed,
  },
});
