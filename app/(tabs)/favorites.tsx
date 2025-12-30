/**
 * Favorites Screen
 *
 * Displays the user's favorited workouts for quick access.
 *
 * Features:
 * - List of favorited workouts
 * - Empty state when no favorites
 * - Tap to navigate to workout detail
 * - Swipe or button to unfavorite
 * - Theme-aware styling
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, borderRadius } from '../../theme';
import { WorkoutListItem } from '../../components';
import { useDatabaseContext } from '../../hooks';
import { useTheme } from '../../context';
import { getFavorites, toggleFavorite } from '../../database/queries';
import type { WorkoutWithMuscleGroup } from '../../database/schema';

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
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load favorites
  const loadFavorites = useCallback(() => {
    if (!db || !userId) return;

    try {
      const data = getFavorites(db, userId);
      setFavorites(data);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [db, userId]);

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
        isLast={index === favorites.length - 1}
        isFavorite={true}
        onFavoriteToggle={handleFavoriteToggle}
      />
    ),
    [handleWorkoutPress, handleFavoriteToggle, favorites.length]
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {favorites.length > 0 ? (
        <FlatList
          data={favorites}
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
