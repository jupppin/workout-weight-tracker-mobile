/**
 * Browse Screen
 *
 * Browse workouts by muscle group with search functionality.
 *
 * Features:
 * - Sticky search bar at top
 * - Horizontal scrolling filter chips for muscle groups
 * - Workout list with tap navigation
 * - Long press for quick actions
 * - Empty states for search and filters
 * - Theme-aware styling
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { spacing, typography, borderRadius } from '../../theme';
import {
  SearchBar,
  FilterChip,
  WorkoutListItem,
  EmptyWorkoutList,
} from '../../components';
import { useDatabaseContext, useSearch } from '../../hooks';
import { useTheme } from '../../context';
import {
  getMuscleGroups,
  searchWorkouts,
  getWorkoutsByMuscleGroup,
  getFavoriteIds,
  toggleFavorite,
} from '../../database/queries';
import type { MuscleGroup, WorkoutWithMuscleGroup } from '../../database/schema';

/**
 * Browse screen component
 */
export default function BrowseScreen() {
  const router = useRouter();
  const { db, isLoading: dbLoading, userId } = useDatabaseContext();
  const { colors } = useTheme();

  // State
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([]);
  const [allWorkouts, setAllWorkouts] = useState<WorkoutWithMuscleGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Load muscle groups and favorites on mount
  useEffect(() => {
    if (db && userId) {
      try {
        const groups = getMuscleGroups(db);
        setMuscleGroups(groups);
        // Load all workouts initially via search with empty query
        const workouts = searchWorkouts(db, '', 100);
        setAllWorkouts(workouts);
        // Load favorite IDs
        const favorites = getFavoriteIds(db, userId);
        setFavoriteIds(favorites);
      } catch (error) {
        console.error('Error loading muscle groups:', error);
      }
    }
  }, [db, userId]);

  // Search function for the useSearch hook
  const performSearch = useCallback(
    (query: string): WorkoutWithMuscleGroup[] => {
      if (!db) return [];
      try {
        return searchWorkouts(db, query, 50);
      } catch (error) {
        console.error('Search error:', error);
        return [];
      }
    },
    [db]
  );

  // Search hook
  const {
    query,
    isSearching,
    results: searchResults,
    setQuery,
    clearSearch,
  } = useSearch({
    searchFn: performSearch,
    debounceMs: 300,
    initialResults: allWorkouts,
  });

  // Filter workouts by muscle group
  const filteredByMuscleGroup = useMemo(() => {
    if (!db || !selectedMuscleGroup) return [];
    try {
      const workouts = getWorkoutsByMuscleGroup(db, selectedMuscleGroup);
      // Add muscle group name to each workout
      const muscleGroup = muscleGroups.find((mg) => mg.id === selectedMuscleGroup);
      return workouts.map((w) => ({
        ...w,
        muscle_group_name: muscleGroup?.name || '',
      }));
    } catch (error) {
      console.error('Filter error:', error);
      return [];
    }
  }, [db, selectedMuscleGroup, muscleGroups]);

  // Determine which workouts to display
  const displayedWorkouts = useMemo(() => {
    // If searching, show search results
    if (query.length > 0) {
      return searchResults;
    }
    // If filtering by muscle group, show filtered results
    if (selectedMuscleGroup) {
      return filteredByMuscleGroup;
    }
    // Otherwise show all workouts
    return allWorkouts;
  }, [query, searchResults, selectedMuscleGroup, filteredByMuscleGroup, allWorkouts]);

  // Handle search text change
  const handleSearchChange = useCallback(
    (text: string) => {
      setQuery(text);
      setSearchQuery(text);
      // Clear muscle group filter when searching
      if (text.length > 0) {
        setSelectedMuscleGroup(null);
      }
    },
    [setQuery]
  );

  // Handle muscle group filter selection
  const handleMuscleGroupSelect = useCallback(
    (muscleGroupId: string | null) => {
      setSelectedMuscleGroup(muscleGroupId);
      // Clear search when filtering
      if (muscleGroupId !== null && query.length > 0) {
        clearSearch();
        setSearchQuery('');
      }
    },
    [query, clearSearch]
  );

  // Handle workout press - navigate to detail
  const handleWorkoutPress = useCallback(
    (workoutId: string) => {
      Keyboard.dismiss();
      router.push(`/workout/${workoutId}`);
    },
    [router]
  );

  // Handle workout long press - show quick actions
  const handleWorkoutLongPress = useCallback(
    (workoutId: string) => {
      const workout = displayedWorkouts.find((w) => w.id === workoutId);
      if (!workout) return;

      Alert.alert(workout.name, 'Quick Actions', [
        {
          text: 'Log Now',
          onPress: () => router.push(`/log/${workoutId}`),
        },
        {
          text: 'View History',
          onPress: () => router.push(`/workout/${workoutId}`),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]);
    },
    [displayedWorkouts, router]
  );

  // Handle favorite toggle
  const handleFavoriteToggle = useCallback(
    (workoutId: string) => {
      if (!db || !userId) return;

      try {
        const result = toggleFavorite(db, userId, workoutId);
        // Update local state
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          if (result.isFavorite) {
            next.add(workoutId);
          } else {
            next.delete(workoutId);
          }
          return next;
        });
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
        onLongPress={handleWorkoutLongPress}
        isLast={index === displayedWorkouts.length - 1}
        isFavorite={favoriteIds.has(item.id)}
        onFavoriteToggle={handleFavoriteToggle}
      />
    ),
    [handleWorkoutPress, handleWorkoutLongPress, displayedWorkouts.length, favoriteIds, handleFavoriteToggle]
  );

  // Loading state
  if (dbLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Filter options for chips
  const filterOptions = muscleGroups.map((mg) => ({
    id: mg.id,
    label: mg.name,
  }));

  // Empty state message based on context
  const getEmptyMessage = () => {
    if (query.length > 0) {
      return {
        message: `No results for "${query}"`,
        suggestion: 'Try a different search term or create a custom workout',
      };
    }
    if (selectedMuscleGroup) {
      const muscleGroup = muscleGroups.find((mg) => mg.id === selectedMuscleGroup);
      return {
        message: `No ${muscleGroup?.name || ''} workouts found`,
        suggestion: 'Try selecting a different muscle group',
      };
    }
    return {
      message: 'No workouts available',
      suggestion: 'Workouts will appear here once added',
    };
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Sticky header with search and filters */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        {/* Search bar */}
        <View style={styles.searchContainer}>
          <SearchBar
            placeholder="Search workouts..."
            value={searchQuery}
            onChangeText={handleSearchChange}
            debounceMs={300}
          />
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* All chip */}
          <FilterChip
            label="All"
            selected={selectedMuscleGroup === null && query.length === 0}
            onPress={() => handleMuscleGroupSelect(null)}
          />
          {/* Muscle group chips */}
          {filterOptions.map((option) => (
            <FilterChip
              key={option.id}
              label={option.label}
              selected={selectedMuscleGroup === option.id}
              onPress={() => handleMuscleGroupSelect(option.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Search results indicator */}
      {isSearching && (
        <View style={[styles.searchingIndicator, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.searchingText, { color: colors.textSecondary }]}>Searching...</Text>
        </View>
      )}

      {/* Workout list */}
      {displayedWorkouts.length > 0 ? (
        <FlatList
          data={displayedWorkouts}
          renderItem={renderWorkoutItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyWorkoutList {...getEmptyMessage()} />
        </View>
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
  header: {
    borderBottomWidth: 1,
    paddingBottom: spacing.md,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  filterContainer: {
    marginTop: spacing.md,
  },
  filterContent: {
    paddingHorizontal: spacing.lg,
  },
  searchingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  searchingText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.sm,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});
