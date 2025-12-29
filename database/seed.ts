/**
 * Database Seed Data
 *
 * This module provides seed data for muscle groups and workouts.
 * Includes 50+ real exercises organized by muscle group.
 */

import * as SQLite from 'expo-sqlite';
import { generateUUID } from './utils';

// Muscle group seed data with consistent IDs for reference
export const MUSCLE_GROUP_IDS = {
  chest: 'mg-chest-001',
  back: 'mg-back-002',
  legs: 'mg-legs-003',
  shoulders: 'mg-shoulders-004',
  biceps: 'mg-biceps-005',
  triceps: 'mg-triceps-006',
  core: 'mg-core-007',
} as const;

interface MuscleGroupSeed {
  id: string;
  name: string;
  display_order: number;
}

interface WorkoutSeed {
  name: string;
  muscle_group_id: string;
}

const muscleGroups: MuscleGroupSeed[] = [
  { id: MUSCLE_GROUP_IDS.chest, name: 'Chest', display_order: 1 },
  { id: MUSCLE_GROUP_IDS.back, name: 'Back', display_order: 2 },
  { id: MUSCLE_GROUP_IDS.legs, name: 'Legs', display_order: 3 },
  { id: MUSCLE_GROUP_IDS.shoulders, name: 'Shoulders', display_order: 4 },
  { id: MUSCLE_GROUP_IDS.biceps, name: 'Biceps', display_order: 5 },
  { id: MUSCLE_GROUP_IDS.triceps, name: 'Triceps', display_order: 6 },
  { id: MUSCLE_GROUP_IDS.core, name: 'Core', display_order: 7 },
];

const workouts: WorkoutSeed[] = [
  // Chest exercises (10)
  { name: 'Bench Press', muscle_group_id: MUSCLE_GROUP_IDS.chest },
  { name: 'Incline Dumbbell Press', muscle_group_id: MUSCLE_GROUP_IDS.chest },
  { name: 'Cable Flyes', muscle_group_id: MUSCLE_GROUP_IDS.chest },
  { name: 'Dips (Chest)', muscle_group_id: MUSCLE_GROUP_IDS.chest },
  { name: 'Push-ups', muscle_group_id: MUSCLE_GROUP_IDS.chest },
  { name: 'Decline Bench Press', muscle_group_id: MUSCLE_GROUP_IDS.chest },
  { name: 'Pec Deck Machine', muscle_group_id: MUSCLE_GROUP_IDS.chest },
  { name: 'Dumbbell Flyes', muscle_group_id: MUSCLE_GROUP_IDS.chest },
  { name: 'Incline Barbell Press', muscle_group_id: MUSCLE_GROUP_IDS.chest },
  { name: 'Machine Chest Press', muscle_group_id: MUSCLE_GROUP_IDS.chest },

  // Back exercises (10)
  { name: 'Lat Pulldown', muscle_group_id: MUSCLE_GROUP_IDS.back },
  { name: 'Barbell Row', muscle_group_id: MUSCLE_GROUP_IDS.back },
  { name: 'Seated Cable Row', muscle_group_id: MUSCLE_GROUP_IDS.back },
  { name: 'Pull-ups', muscle_group_id: MUSCLE_GROUP_IDS.back },
  { name: 'Deadlift', muscle_group_id: MUSCLE_GROUP_IDS.back },
  { name: 'T-Bar Row', muscle_group_id: MUSCLE_GROUP_IDS.back },
  { name: 'Face Pulls', muscle_group_id: MUSCLE_GROUP_IDS.back },
  { name: 'Dumbbell Row', muscle_group_id: MUSCLE_GROUP_IDS.back },
  { name: 'Chin-ups', muscle_group_id: MUSCLE_GROUP_IDS.back },
  { name: 'Rack Pulls', muscle_group_id: MUSCLE_GROUP_IDS.back },

  // Leg exercises (10)
  { name: 'Squat', muscle_group_id: MUSCLE_GROUP_IDS.legs },
  { name: 'Leg Press', muscle_group_id: MUSCLE_GROUP_IDS.legs },
  { name: 'Romanian Deadlift', muscle_group_id: MUSCLE_GROUP_IDS.legs },
  { name: 'Leg Curl', muscle_group_id: MUSCLE_GROUP_IDS.legs },
  { name: 'Leg Extension', muscle_group_id: MUSCLE_GROUP_IDS.legs },
  { name: 'Calf Raises', muscle_group_id: MUSCLE_GROUP_IDS.legs },
  { name: 'Lunges', muscle_group_id: MUSCLE_GROUP_IDS.legs },
  { name: 'Hip Thrust', muscle_group_id: MUSCLE_GROUP_IDS.legs },
  { name: 'Bulgarian Split Squat', muscle_group_id: MUSCLE_GROUP_IDS.legs },
  { name: 'Hack Squat', muscle_group_id: MUSCLE_GROUP_IDS.legs },

  // Shoulder exercises (8)
  { name: 'Overhead Press', muscle_group_id: MUSCLE_GROUP_IDS.shoulders },
  { name: 'Lateral Raises', muscle_group_id: MUSCLE_GROUP_IDS.shoulders },
  { name: 'Front Raises', muscle_group_id: MUSCLE_GROUP_IDS.shoulders },
  { name: 'Rear Delt Fly', muscle_group_id: MUSCLE_GROUP_IDS.shoulders },
  { name: 'Arnold Press', muscle_group_id: MUSCLE_GROUP_IDS.shoulders },
  { name: 'Shrugs', muscle_group_id: MUSCLE_GROUP_IDS.shoulders },
  { name: 'Upright Row', muscle_group_id: MUSCLE_GROUP_IDS.shoulders },
  { name: 'Cable Lateral Raise', muscle_group_id: MUSCLE_GROUP_IDS.shoulders },

  // Biceps exercises (7)
  { name: 'Barbell Curl', muscle_group_id: MUSCLE_GROUP_IDS.biceps },
  { name: 'Hammer Curl', muscle_group_id: MUSCLE_GROUP_IDS.biceps },
  { name: 'Preacher Curl', muscle_group_id: MUSCLE_GROUP_IDS.biceps },
  { name: 'Incline Dumbbell Curl', muscle_group_id: MUSCLE_GROUP_IDS.biceps },
  { name: 'Cable Curl', muscle_group_id: MUSCLE_GROUP_IDS.biceps },
  { name: 'Concentration Curl', muscle_group_id: MUSCLE_GROUP_IDS.biceps },
  { name: 'EZ Bar Curl', muscle_group_id: MUSCLE_GROUP_IDS.biceps },

  // Triceps exercises (7)
  { name: 'Tricep Pushdown', muscle_group_id: MUSCLE_GROUP_IDS.triceps },
  { name: 'Skull Crushers', muscle_group_id: MUSCLE_GROUP_IDS.triceps },
  { name: 'Overhead Tricep Extension', muscle_group_id: MUSCLE_GROUP_IDS.triceps },
  { name: 'Close-grip Bench Press', muscle_group_id: MUSCLE_GROUP_IDS.triceps },
  { name: 'Dips (Triceps)', muscle_group_id: MUSCLE_GROUP_IDS.triceps },
  { name: 'Tricep Kickbacks', muscle_group_id: MUSCLE_GROUP_IDS.triceps },
  { name: 'Rope Pushdown', muscle_group_id: MUSCLE_GROUP_IDS.triceps },

  // Core exercises (7)
  { name: 'Cable Crunch', muscle_group_id: MUSCLE_GROUP_IDS.core },
  { name: 'Hanging Leg Raise', muscle_group_id: MUSCLE_GROUP_IDS.core },
  { name: 'Plank', muscle_group_id: MUSCLE_GROUP_IDS.core },
  { name: 'Russian Twist', muscle_group_id: MUSCLE_GROUP_IDS.core },
  { name: 'Ab Rollout', muscle_group_id: MUSCLE_GROUP_IDS.core },
  { name: 'Woodchoppers', muscle_group_id: MUSCLE_GROUP_IDS.core },
  { name: 'Dead Bug', muscle_group_id: MUSCLE_GROUP_IDS.core },
];

/**
 * Seeds muscle groups into the database.
 * Skips if data already exists to prevent duplicates.
 */
export function seedMuscleGroups(db: SQLite.SQLiteDatabase): void {
  const existingCount = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM muscle_groups'
  );

  if (existingCount && existingCount.count > 0) {
    // Already seeded
    return;
  }

  const stmt = db.prepareSync(
    'INSERT INTO muscle_groups (id, name, display_order) VALUES (?, ?, ?)'
  );

  try {
    for (const group of muscleGroups) {
      stmt.executeSync([group.id, group.name, group.display_order]);
    }
  } finally {
    stmt.finalizeSync();
  }
}

/**
 * Seeds workouts into the database.
 * Skips if data already exists to prevent duplicates.
 */
export function seedWorkouts(db: SQLite.SQLiteDatabase): void {
  const existingCount = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM workouts WHERE is_custom = 0'
  );

  if (existingCount && existingCount.count > 0) {
    // Already seeded
    return;
  }

  const stmt = db.prepareSync(
    'INSERT INTO workouts (id, name, muscle_group_id, is_custom, created_by, created_at) VALUES (?, ?, ?, 0, NULL, datetime("now"))'
  );

  try {
    for (const workout of workouts) {
      const id = generateUUID();
      stmt.executeSync([id, workout.name, workout.muscle_group_id]);
    }
  } finally {
    stmt.finalizeSync();
  }
}

/**
 * Seeds all data into the database.
 * Safe to call multiple times - checks for existing data.
 */
export function seedDatabase(db: SQLite.SQLiteDatabase): void {
  seedMuscleGroups(db);
  seedWorkouts(db);
}

/**
 * Clears all seed data (for testing/development)
 */
export function clearSeedData(db: SQLite.SQLiteDatabase): void {
  db.execSync('DELETE FROM weight_entries');
  db.execSync('DELETE FROM workouts WHERE is_custom = 0');
  db.execSync('DELETE FROM muscle_groups');
}

/**
 * Returns the list of workout seeds for reference
 */
export function getWorkoutSeeds(): WorkoutSeed[] {
  return [...workouts];
}

/**
 * Returns the list of muscle group seeds for reference
 */
export function getMuscleGroupSeeds(): MuscleGroupSeed[] {
  return [...muscleGroups];
}
