/**
 * Database Schema and Migration Logic
 *
 * This module handles table creation and schema migrations for the
 * Workout Weight Tracker app using expo-sqlite.
 */

// Database type - uses any to avoid importing expo-sqlite on web
type SQLiteDatabase = any;

// Type definitions for database entities
export interface User {
  id: string;
  display_name: string;
  auth_provider: 'apple' | 'google' | 'local' | null;
  auth_id: string | null;
  weight_unit: 'lbs' | 'kg';
  theme: 'dark' | 'light';
  created_at: string;
}

export interface MuscleGroup {
  id: string;
  name: string;
  display_order: number;
}

export interface Workout {
  id: string;
  name: string;
  muscle_group_id: string;
  is_custom: number; // SQLite stores boolean as 0/1
  created_by: string | null;
  created_at: string;
}

export interface WeightEntry {
  id: string;
  user_id: string;
  workout_id: string;
  weight: number;
  reps: number;
  notes: string | null;
  recorded_at: string;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  workout_id: string;
  created_at: string;
}

// Extended types with joined data for frontend consumption
export interface WorkoutWithMuscleGroup extends Workout {
  muscle_group_name: string;
}

export interface WeightEntryWithWorkout extends WeightEntry {
  workout_name: string;
  muscle_group_name: string;
}

// Schema version for migrations
const SCHEMA_VERSION = 2;

/**
 * Creates all database tables if they don't exist.
 * Uses SQLite synchronous API as per expo-sqlite.
 */
export function createTables(db: SQLiteDatabase): void {
  // Users table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      auth_provider TEXT,
      auth_id TEXT,
      weight_unit TEXT DEFAULT 'lbs' CHECK(weight_unit IN ('lbs', 'kg')),
      theme TEXT DEFAULT 'dark' CHECK(theme IN ('dark', 'light')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Muscle groups table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS muscle_groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      display_order INTEGER DEFAULT 0
    );
  `);

  // Workouts table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      muscle_group_id TEXT NOT NULL,
      is_custom INTEGER DEFAULT 0,
      created_by TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (muscle_group_id) REFERENCES muscle_groups(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
  `);

  // Weight entries table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS weight_entries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      workout_id TEXT NOT NULL,
      weight REAL NOT NULL,
      reps INTEGER DEFAULT 7,
      notes TEXT,
      recorded_at TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (workout_id) REFERENCES workouts(id)
    );
  `);

  // Favorites table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      workout_id TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
      UNIQUE(user_id, workout_id)
    );
  `);

  // Create indexes for query performance
  createIndexes(db);

  // Store schema version for future migrations
  db.execSync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY
    );
  `);

  const versionResult = db.getFirstSync(
    'SELECT version FROM schema_version LIMIT 1'
  ) as { version: number } | null;

  if (!versionResult) {
    db.runSync('INSERT INTO schema_version (version) VALUES (?)', SCHEMA_VERSION);
  }
}

/**
 * Creates performance indexes for common query patterns.
 */
function createIndexes(db: SQLiteDatabase): void {
  // Index for fetching entries by user and workout (most common query)
  db.execSync(`
    CREATE INDEX IF NOT EXISTS idx_entries_user_workout
    ON weight_entries(user_id, workout_id);
  `);

  // Index for chronological queries (history, recent entries)
  db.execSync(`
    CREATE INDEX IF NOT EXISTS idx_entries_recorded
    ON weight_entries(recorded_at DESC);
  `);

  // Index for filtering workouts by muscle group
  db.execSync(`
    CREATE INDEX IF NOT EXISTS idx_workouts_muscle
    ON workouts(muscle_group_id);
  `);

  // Index for workout name searches
  db.execSync(`
    CREATE INDEX IF NOT EXISTS idx_workouts_name
    ON workouts(name);
  `);

  // Composite index for user's recent entries (supports getRecentWorkouts)
  db.execSync(`
    CREATE INDEX IF NOT EXISTS idx_entries_user_recorded
    ON weight_entries(user_id, recorded_at DESC);
  `);

  // Index for favorites lookup by user
  db.execSync(`
    CREATE INDEX IF NOT EXISTS idx_favorites_user
    ON favorites(user_id);
  `);
}

/**
 * Drops all tables (use with caution - for development/testing only)
 */
export function dropAllTables(db: SQLiteDatabase): void {
  db.execSync('DROP TABLE IF EXISTS favorites');
  db.execSync('DROP TABLE IF EXISTS weight_entries');
  db.execSync('DROP TABLE IF EXISTS workouts');
  db.execSync('DROP TABLE IF EXISTS muscle_groups');
  db.execSync('DROP TABLE IF EXISTS users');
  db.execSync('DROP TABLE IF EXISTS schema_version');
}

/**
 * Gets the current schema version
 */
export function getSchemaVersion(db: SQLiteDatabase): number {
  try {
    const result = db.getFirstSync(
      'SELECT version FROM schema_version LIMIT 1'
    ) as { version: number } | null;
    return result?.version ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Runs any pending migrations based on current schema version.
 * Add migration logic here as schema evolves.
 */
export function runMigrations(db: SQLiteDatabase): void {
  const currentVersion = getSchemaVersion(db);

  if (currentVersion < SCHEMA_VERSION) {
    // Migration to version 2: Add favorites table
    if (currentVersion < 2) {
      db.execSync(`
        CREATE TABLE IF NOT EXISTS favorites (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          workout_id TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
          UNIQUE(user_id, workout_id)
        );
      `);

      db.execSync(`
        CREATE INDEX IF NOT EXISTS idx_favorites_user
        ON favorites(user_id);
      `);
    }

    db.runSync(
      'UPDATE schema_version SET version = ?',
      SCHEMA_VERSION
    );
  }
}
