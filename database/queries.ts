/**
 * Database Query Functions
 *
 * This module provides all common database queries for the Workout Weight Tracker app.
 * All functions use expo-sqlite's synchronous API.
 *
 * FRONTEND INTEGRATION NOTES:
 * - All queries return properly typed objects ready for UI consumption
 * - Weight entries include workout and muscle group names for display
 * - Search functions support partial matching for real-time search
 * - getLastEntry can be used to pre-fill weight input forms
 */

// Database type - uses any to avoid importing expo-sqlite on web
type SQLiteDatabase = any;
import {
  User,
  MuscleGroup,
  Workout,
  WeightEntry,
  WorkoutWithMuscleGroup,
  WeightEntryWithWorkout,
  Favorite,
} from './schema';
import { generateUUID, getCurrentTimestamp, escapeLikePattern } from './utils';

// Result type for recent workouts (includes last entry info)
export interface RecentWorkoutResult {
  workout_id: string;
  workout_name: string;
  muscle_group_id: string;
  muscle_group_name: string;
  last_weight: number;
  last_reps: number;
  last_recorded_at: string;
}

// Result type for workout history
export interface WorkoutHistoryEntry {
  id: string;
  weight: number;
  reps: number;
  notes: string | null;
  recorded_at: string;
}

// Input type for logging a new entry
export interface LogEntryInput {
  userId: string;
  workoutId: string;
  weight: number;
  reps?: number;
  notes?: string;
  recordedAt?: string; // Optional: defaults to now
}

/**
 * Gets workouts the user has recently logged entries for.
 * Returns workout details along with the most recent entry info.
 *
 * FRONTEND USE: Display on home screen as "Recent Workouts" quick access.
 * The mobile app can use last_weight to pre-fill the weight input.
 */
export function getRecentWorkouts(
  db: SQLiteDatabase,
  userId: string,
  limit: number = 10
): RecentWorkoutResult[] {
  const query = `
    SELECT DISTINCT
      w.id as workout_id,
      w.name as workout_name,
      mg.id as muscle_group_id,
      mg.name as muscle_group_name,
      we.weight as last_weight,
      we.reps as last_reps,
      we.recorded_at as last_recorded_at
    FROM weight_entries we
    INNER JOIN workouts w ON we.workout_id = w.id
    INNER JOIN muscle_groups mg ON w.muscle_group_id = mg.id
    WHERE we.user_id = ?
    AND we.id IN (
      SELECT id FROM weight_entries we2
      WHERE we2.workout_id = we.workout_id
      AND we2.user_id = ?
      ORDER BY we2.recorded_at DESC
      LIMIT 1
    )
    ORDER BY we.recorded_at DESC
    LIMIT ?
  `;

  return db.getAllSync(query, [userId, userId, limit]) as RecentWorkoutResult[];
}

/**
 * Gets all workouts for a specific muscle group.
 * Returns workouts sorted alphabetically by name.
 *
 * FRONTEND USE: Display workout list when user selects a muscle group.
 */
export function getWorkoutsByMuscleGroup(
  db: SQLiteDatabase,
  muscleGroupId: string
): Workout[] {
  const query = `
    SELECT id, name, muscle_group_id, is_custom, created_by, created_at
    FROM workouts
    WHERE muscle_group_id = ?
    ORDER BY name ASC
  `;

  return db.getAllSync(query, [muscleGroupId]) as Workout[];
}

/**
 * Searches workouts by name (case-insensitive partial match).
 * Returns workouts with their muscle group name for display.
 *
 * FRONTEND USE: Real-time search as user types in search field.
 * Results include muscle group name for context in search results.
 */
export function searchWorkouts(
  db: SQLiteDatabase,
  searchQuery: string,
  limit: number = 20
): WorkoutWithMuscleGroup[] {
  const escapedQuery = escapeLikePattern(searchQuery);
  const pattern = `%${escapedQuery}%`;

  const query = `
    SELECT
      w.id,
      w.name,
      w.muscle_group_id,
      w.is_custom,
      w.created_by,
      w.created_at,
      mg.name as muscle_group_name
    FROM workouts w
    INNER JOIN muscle_groups mg ON w.muscle_group_id = mg.id
    WHERE w.name LIKE ? ESCAPE '\\'
    ORDER BY
      CASE WHEN w.name LIKE ? ESCAPE '\\' THEN 0 ELSE 1 END,
      w.name ASC
    LIMIT ?
  `;

  // Prioritize results that start with the query
  const startsWithPattern = `${escapedQuery}%`;

  return db.getAllSync(query, [
    pattern,
    startsWithPattern,
    limit,
  ]) as WorkoutWithMuscleGroup[];
}

/**
 * Gets the weight entry history for a specific workout and user.
 * Returns entries in reverse chronological order.
 *
 * FRONTEND USE: Display progress history/chart for a workout.
 * Can be used to show trends and personal records.
 */
export function getWorkoutHistory(
  db: SQLiteDatabase,
  workoutId: string,
  userId: string,
  limit: number = 50
): WorkoutHistoryEntry[] {
  const query = `
    SELECT id, weight, reps, notes, recorded_at
    FROM weight_entries
    WHERE workout_id = ? AND user_id = ?
    ORDER BY recorded_at DESC
    LIMIT ?
  `;

  return db.getAllSync(query, [workoutId, userId, limit]) as WorkoutHistoryEntry[];
}

/**
 * Logs a new weight entry for a workout.
 * Returns the created entry with generated ID and timestamp.
 *
 * FRONTEND USE: Called when user submits the weight logging form.
 * Returns the created entry so UI can update immediately.
 */
export function logEntry(
  db: SQLiteDatabase,
  input: LogEntryInput
): WeightEntry {
  const id = generateUUID();
  const createdAt = getCurrentTimestamp();
  const recordedAt = input.recordedAt || createdAt;
  const reps = input.reps ?? 7; // Default to 7 reps as per schema

  const query = `
    INSERT INTO weight_entries (id, user_id, workout_id, weight, reps, notes, recorded_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.runSync(query, [
    id,
    input.userId,
    input.workoutId,
    input.weight,
    reps,
    input.notes || null,
    recordedAt,
    createdAt,
  ]);

  return {
    id,
    user_id: input.userId,
    workout_id: input.workoutId,
    weight: input.weight,
    reps,
    notes: input.notes || null,
    recorded_at: recordedAt,
    created_at: createdAt,
  };
}

/**
 * Gets the most recent entry for a workout and user.
 * Returns null if no entries exist.
 *
 * FRONTEND USE: Pre-fill the weight input form with last used weight/reps.
 * This improves UX by reducing input friction.
 */
export function getLastEntry(
  db: SQLiteDatabase,
  userId: string,
  workoutId: string
): WeightEntry | null {
  const query = `
    SELECT id, user_id, workout_id, weight, reps, notes, recorded_at, created_at
    FROM weight_entries
    WHERE user_id = ? AND workout_id = ?
    ORDER BY recorded_at DESC
    LIMIT 1
  `;

  return db.getFirstSync(query, [userId, workoutId]) as WeightEntry | null;
}

/**
 * Gets all muscle groups ordered by display_order.
 *
 * FRONTEND USE: Display muscle group selection screen/tabs.
 */
export function getMuscleGroups(
  db: SQLiteDatabase
): MuscleGroup[] {
  const query = `
    SELECT id, name, display_order
    FROM muscle_groups
    ORDER BY display_order ASC
  `;

  return db.getAllSync(query) as MuscleGroup[];
}

/**
 * Gets a single workout by ID with muscle group info.
 *
 * FRONTEND USE: Display workout details screen.
 */
export function getWorkoutById(
  db: SQLiteDatabase,
  workoutId: string
): WorkoutWithMuscleGroup | null {
  const query = `
    SELECT
      w.id,
      w.name,
      w.muscle_group_id,
      w.is_custom,
      w.created_by,
      w.created_at,
      mg.name as muscle_group_name
    FROM workouts w
    INNER JOIN muscle_groups mg ON w.muscle_group_id = mg.id
    WHERE w.id = ?
  `;

  return db.getFirstSync(query, [workoutId]) as WorkoutWithMuscleGroup | null;
}

/**
 * Creates a custom workout for a user.
 * Returns the created workout.
 *
 * FRONTEND USE: Called when user creates a new custom exercise.
 */
export function createCustomWorkout(
  db: SQLiteDatabase,
  name: string,
  muscleGroupId: string,
  userId: string
): Workout {
  const id = generateUUID();
  const createdAt = getCurrentTimestamp();

  const query = `
    INSERT INTO workouts (id, name, muscle_group_id, is_custom, created_by, created_at)
    VALUES (?, ?, ?, 1, ?, ?)
  `;

  db.runSync(query, [id, name, muscleGroupId, userId, createdAt]);

  return {
    id,
    name,
    muscle_group_id: muscleGroupId,
    is_custom: 1,
    created_by: userId,
    created_at: createdAt,
  };
}

/**
 * Deletes a weight entry by ID.
 * Only allows deletion if the entry belongs to the user.
 *
 * FRONTEND USE: Called when user swipes to delete an entry.
 */
export function deleteEntry(
  db: SQLiteDatabase,
  entryId: string,
  userId: string
): boolean {
  const query = `
    DELETE FROM weight_entries
    WHERE id = ? AND user_id = ?
  `;

  const result = db.runSync(query, [entryId, userId]);
  return result.changes > 0;
}

/**
 * Updates a weight entry.
 * Only allows update if the entry belongs to the user.
 *
 * FRONTEND USE: Called when user edits an existing entry.
 */
export function updateEntry(
  db: SQLiteDatabase,
  entryId: string,
  userId: string,
  updates: { weight?: number; reps?: number; notes?: string }
): boolean {
  const setClauses: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.weight !== undefined) {
    setClauses.push('weight = ?');
    values.push(updates.weight);
  }

  if (updates.reps !== undefined) {
    setClauses.push('reps = ?');
    values.push(updates.reps);
  }

  if (updates.notes !== undefined) {
    setClauses.push('notes = ?');
    values.push(updates.notes || null);
  }

  if (setClauses.length === 0) {
    return false;
  }

  values.push(entryId, userId);

  const query = `
    UPDATE weight_entries
    SET ${setClauses.join(', ')}
    WHERE id = ? AND user_id = ?
  `;

  const result = db.runSync(query, values);
  return result.changes > 0;
}

/**
 * Gets user's personal record (max weight) for a workout.
 *
 * FRONTEND USE: Display PR badge/indicator on workout history.
 */
export function getPersonalRecord(
  db: SQLiteDatabase,
  userId: string,
  workoutId: string
): WeightEntry | null {
  const query = `
    SELECT id, user_id, workout_id, weight, reps, notes, recorded_at, created_at
    FROM weight_entries
    WHERE user_id = ? AND workout_id = ?
    ORDER BY weight DESC
    LIMIT 1
  `;

  return db.getFirstSync(query, [userId, workoutId]) as WeightEntry | null;
}

/**
 * Gets all entries for a user within a date range.
 *
 * FRONTEND USE: Generate workout summary/statistics for a time period.
 */
export function getEntriesInDateRange(
  db: SQLiteDatabase,
  userId: string,
  startDate: string,
  endDate: string
): WeightEntryWithWorkout[] {
  const query = `
    SELECT
      we.id,
      we.user_id,
      we.workout_id,
      we.weight,
      we.reps,
      we.notes,
      we.recorded_at,
      we.created_at,
      w.name as workout_name,
      mg.name as muscle_group_name
    FROM weight_entries we
    INNER JOIN workouts w ON we.workout_id = w.id
    INNER JOIN muscle_groups mg ON w.muscle_group_id = mg.id
    WHERE we.user_id = ?
    AND we.recorded_at >= ?
    AND we.recorded_at <= ?
    ORDER BY we.recorded_at DESC
  `;

  return db.getAllSync(query, [
    userId,
    startDate,
    endDate,
  ]) as WeightEntryWithWorkout[];
}

/**
 * Gets workout count by muscle group for a user.
 *
 * FRONTEND USE: Display muscle group distribution chart/stats.
 */
export function getWorkoutCountByMuscleGroup(
  db: SQLiteDatabase,
  userId: string
): { muscle_group_id: string; muscle_group_name: string; count: number }[] {
  const query = `
    SELECT
      mg.id as muscle_group_id,
      mg.name as muscle_group_name,
      COUNT(we.id) as count
    FROM muscle_groups mg
    LEFT JOIN workouts w ON mg.id = w.muscle_group_id
    LEFT JOIN weight_entries we ON w.id = we.workout_id AND we.user_id = ?
    GROUP BY mg.id, mg.name
    ORDER BY mg.display_order ASC
  `;

  return db.getAllSync(query, [userId]) as {
    muscle_group_id: string;
    muscle_group_name: string;
    count: number;
  }[];
}

// ============================================================================
// FAVORITES QUERIES
// ============================================================================

/**
 * Adds a workout to the user's favorites.
 * Returns true if the favorite was added, false if it already exists.
 *
 * FRONTEND USE: Called when user taps the favorite/heart icon on a workout.
 * The mobile app should toggle the heart icon state based on the return value.
 */
export function addFavorite(
  db: SQLiteDatabase,
  userId: string,
  workoutId: string
): boolean {
  try {
    const id = generateUUID();
    const createdAt = getCurrentTimestamp();

    const query = `
      INSERT INTO favorites (id, user_id, workout_id, created_at)
      VALUES (?, ?, ?, ?)
    `;

    db.runSync(query, [id, userId, workoutId, createdAt]);
    return true;
  } catch (error: any) {
    // If UNIQUE constraint fails, the favorite already exists
    if (error?.message?.includes('UNIQUE constraint failed')) {
      return false;
    }
    throw error;
  }
}

/**
 * Removes a workout from the user's favorites.
 * Returns true if the favorite was removed, false if it didn't exist.
 *
 * FRONTEND USE: Called when user taps the filled heart icon to unfavorite.
 */
export function removeFavorite(
  db: SQLiteDatabase,
  userId: string,
  workoutId: string
): boolean {
  const query = `
    DELETE FROM favorites
    WHERE user_id = ? AND workout_id = ?
  `;

  const result = db.runSync(query, [userId, workoutId]);
  return result.changes > 0;
}

/**
 * Checks if a workout is in the user's favorites.
 *
 * FRONTEND USE: Used to determine the initial state of the heart icon
 * when displaying a workout. Returns true if favorited.
 */
export function isFavorite(
  db: SQLiteDatabase,
  userId: string,
  workoutId: string
): boolean {
  const query = `
    SELECT 1 FROM favorites
    WHERE user_id = ? AND workout_id = ?
    LIMIT 1
  `;

  const result = db.getFirstSync(query, [userId, workoutId]);
  return result !== null;
}

/**
 * Gets all favorite workouts for a user with muscle group info.
 * Returns workouts sorted by when they were favorited (most recent first).
 *
 * FRONTEND USE: Display the user's favorites list/screen.
 * Includes muscle_group_name for display context.
 */
export function getFavorites(
  db: SQLiteDatabase,
  userId: string
): WorkoutWithMuscleGroup[] {
  const query = `
    SELECT
      w.id,
      w.name,
      w.muscle_group_id,
      w.is_custom,
      w.created_by,
      w.created_at,
      mg.name as muscle_group_name
    FROM favorites f
    INNER JOIN workouts w ON f.workout_id = w.id
    INNER JOIN muscle_groups mg ON w.muscle_group_id = mg.id
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
  `;

  return db.getAllSync(query, [userId]) as WorkoutWithMuscleGroup[];
}

/**
 * Toggles the favorite status of a workout.
 * Adds to favorites if not exists, removes if exists.
 * Returns the new favorite status.
 *
 * FRONTEND USE: Single function for heart icon toggle.
 * The mobile app can use the returned isFavorite to update UI state.
 */
export function toggleFavorite(
  db: SQLiteDatabase,
  userId: string,
  workoutId: string
): { isFavorite: boolean } {
  const currentlyFavorite = isFavorite(db, userId, workoutId);

  if (currentlyFavorite) {
    removeFavorite(db, userId, workoutId);
    return { isFavorite: false };
  } else {
    addFavorite(db, userId, workoutId);
    return { isFavorite: true };
  }
}

/**
 * Gets all favorite workout IDs for a user.
 * Returns a Set for efficient lookup.
 *
 * FRONTEND USE: Efficiently check if multiple workouts are favorited
 * (e.g., for list views with many items).
 */
export function getFavoriteIds(
  db: SQLiteDatabase,
  userId: string
): Set<string> {
  const query = `
    SELECT workout_id FROM favorites WHERE user_id = ?
  `;

  const results = db.getAllSync(query, [userId]) as { workout_id: string }[];
  return new Set(results.map((r) => r.workout_id));
}
