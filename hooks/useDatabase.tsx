/**
 * Database Hook
 *
 * Provides database initialization and access throughout the app.
 * Uses expo-sqlite for local storage.
 */

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Platform } from 'react-native';
import { createTables, runMigrations } from '../database/schema';
import { seedDatabase } from '../database/seed';
import { generateUUID } from '../database/utils';

// Only import expo-sqlite on native platforms
const SQLite = Platform.OS !== 'web' ? require('expo-sqlite') : null;

// Database instance type - any since expo-sqlite types aren't available on web
type Database = any;

// Context for sharing database across components
interface DatabaseContextValue {
  db: Database;
  isLoading: boolean;
  error: Error | null;
  userId: string | null;
}

const DatabaseContext = createContext<DatabaseContextValue>({
  db: null,
  isLoading: true,
  error: null,
  userId: null,
});

// Default user ID for single-user mode (will be replaced with auth later)
const DEFAULT_USER_ID = 'default-user-001';

/**
 * Hook to initialize and provide database access
 */
export function useDatabase() {
  const [db, setDb] = useState<Database>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function initDatabase() {
      // Skip database on web - SQLite requires native platform
      if (Platform.OS === 'web' || !SQLite) {
        console.log('Database not available on web platform');
        setError(new Error('This app requires iOS or Android. Please use Expo Go on your mobile device.'));
        setIsLoading(false);
        return;
      }

      try {
        // Open database connection
        const database = await SQLite.openDatabaseAsync('workout_tracker.db');

        // Create tables if they don't exist
        createTables(database);

        // Run any pending migrations
        runMigrations(database);

        // Seed with initial data
        seedDatabase(database);

        // Create or get default user
        const existingUser = database.getFirstSync(
          'SELECT id FROM users WHERE id = ?',
          [DEFAULT_USER_ID]
        ) as { id: string } | null;

        if (!existingUser) {
          database.runSync(
            `INSERT INTO users (id, display_name, weight_unit, theme, created_at)
             VALUES (?, ?, ?, ?, datetime('now'))`,
            [DEFAULT_USER_ID, 'Workout User', 'lbs', 'dark']
          );
        }

        setUserId(DEFAULT_USER_ID);
        setDb(database);
        setIsLoading(false);
      } catch (err) {
        console.error('Database initialization error:', err);
        setError(err instanceof Error ? err : new Error('Failed to initialize database'));
        setIsLoading(false);
      }
    }

    initDatabase();
  }, []);

  return { db, isLoading, error, userId };
}

/**
 * Provider component for database context
 */
export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const value = useDatabase();

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}

/**
 * Hook to consume database context
 */
export function useDatabaseContext() {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabaseContext must be used within a DatabaseProvider');
  }
  return context;
}

export { DatabaseContext };
