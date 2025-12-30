/**
 * Database Module Entry Point
 *
 * This module initializes the SQLite database and exports all database
 * functionality for the Workout Weight Tracker app.
 *
 * USAGE:
 * ```typescript
 * import { initDatabase, db, queries, userQueries } from '@/database';
 *
 * // Initialize on app startup
 * await initDatabase();
 *
 * // Use queries
 * const muscleGroups = queries.getMuscleGroups(db);
 * const recentWorkouts = queries.getRecentWorkouts(db, userId, 10);
 * ```
 *
 * FRONTEND INTEGRATION NOTES:
 * - Call initDatabase() in app startup (App.tsx or root layout)
 * - The database is ready after initDatabase() resolves
 * - All queries are synchronous and can be called directly
 * - Consider wrapping database calls in try-catch for error handling
 */

import { Platform } from 'react-native';
import { createTables, runMigrations, dropAllTables, getSchemaVersion } from './schema';
import { seedDatabase, clearSeedData } from './seed';

// Conditionally import expo-sqlite only on native platforms
const SQLite = Platform.OS !== 'web' ? require('expo-sqlite') : null;

// Database name
const DATABASE_NAME = 'workout_tracker.db';

// Database instance (initialized lazily)
let database: any = null;

/**
 * Gets the database instance.
 * Throws if database hasn't been initialized.
 */
export function getDatabase(): any {
  if (!database) {
    throw new Error(
      'Database not initialized. Call initDatabase() first.'
    );
  }
  return database;
}

/**
 * Initializes the database, creates tables, runs migrations, and seeds data.
 * This should be called once on app startup.
 *
 * FRONTEND USE: Call this in your App.tsx or root layout useEffect.
 *
 * @param options.resetDatabase - If true, drops all tables and recreates (dev only)
 */
export function initDatabase(options?: { resetDatabase?: boolean }): void {
  // Skip on web platform
  if (Platform.OS === 'web' || !SQLite) {
    console.warn('Database not available on web platform');
    return;
  }

  // Open or create the database
  database = SQLite.openDatabaseSync(DATABASE_NAME);

  // Enable foreign keys
  database.execSync('PRAGMA foreign_keys = ON;');

  // Reset database if requested (development only)
  if (options?.resetDatabase) {
    console.warn('Resetting database - all data will be lost');
    dropAllTables(database);
  }

  // Create tables if they don't exist
  createTables(database);

  // Run any pending migrations
  runMigrations(database);

  // Seed default data (muscle groups and workouts)
  seedDatabase(database);

  console.log(
    `Database initialized (version ${getSchemaVersion(database)})`
  );
}

/**
 * Closes the database connection.
 * Call this when the app is closing or during cleanup.
 */
export function closeDatabase(): void {
  if (database) {
    database.closeSync();
    database = null;
  }
}

/**
 * Resets the database to initial state.
 * WARNING: This deletes all user data.
 * Use only in development or for "reset app" functionality.
 */
export function resetDatabase(): void {
  if (!database) {
    throw new Error('Database not initialized');
  }

  dropAllTables(database);
  createTables(database);
  seedDatabase(database);

  console.log('Database reset complete');
}

/**
 * Checks if the database is initialized and ready.
 */
export function isDatabaseReady(): boolean {
  return database !== null;
}

// Export the database instance for direct access
// Note: Prefer using getDatabase() for null safety
export { database as db };

// Re-export types
export * from './schema';
export * from './utils';

// Re-export queries
export * as queries from './queries';
export * as userQueries from './userQueries';

// Re-export seed utilities (for testing/development)
export { seedDatabase, clearSeedData, MUSCLE_GROUP_IDS } from './seed';
