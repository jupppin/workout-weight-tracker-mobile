/**
 * User-Related Database Queries
 *
 * This module provides queries specifically for user management,
 * authentication, and user preferences.
 */

// Database type - uses any to avoid importing expo-sqlite on web
type SQLiteDatabase = any;
import { User } from './schema';
import { generateUUID, getCurrentTimestamp } from './utils';

// Input type for creating a new user
export interface CreateUserInput {
  displayName: string;
  authProvider?: 'apple' | 'google' | 'local';
  authId?: string;
  weightUnit?: 'lbs' | 'kg';
  theme?: 'dark' | 'light';
}

// Input type for updating user preferences
export interface UpdateUserPreferencesInput {
  displayName?: string;
  weightUnit?: 'lbs' | 'kg';
  theme?: 'dark' | 'light';
}

/**
 * Creates a new user in the database.
 * Returns the created user with all fields populated.
 *
 * FRONTEND USE: Called after successful authentication or guest signup.
 */
export function createUser(
  db: SQLiteDatabase,
  input: CreateUserInput
): User {
  const id = generateUUID();
  const createdAt = getCurrentTimestamp();
  const weightUnit = input.weightUnit || 'lbs';
  const theme = input.theme || 'dark';

  const query = `
    INSERT INTO users (id, display_name, auth_provider, auth_id, weight_unit, theme, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.runSync(query, [
    id,
    input.displayName,
    input.authProvider || null,
    input.authId || null,
    weightUnit,
    theme,
    createdAt,
  ]);

  return {
    id,
    display_name: input.displayName,
    auth_provider: input.authProvider || null,
    auth_id: input.authId || null,
    weight_unit: weightUnit,
    theme,
    created_at: createdAt,
  };
}

/**
 * Gets a user by their ID.
 *
 * FRONTEND USE: Load current user's data on app startup.
 */
export function getUserById(
  db: SQLiteDatabase,
  userId: string
): User | null {
  const query = `
    SELECT id, display_name, auth_provider, auth_id, weight_unit, theme, created_at
    FROM users
    WHERE id = ?
  `;

  return db.getFirstSync(query, [userId]) as User | null;
}

/**
 * Gets a user by their auth provider and auth ID.
 * Useful for finding existing users during authentication.
 *
 * FRONTEND USE: Check if user exists during sign-in flow.
 */
export function getUserByAuthId(
  db: SQLiteDatabase,
  authProvider: 'apple' | 'google' | 'local',
  authId: string
): User | null {
  const query = `
    SELECT id, display_name, auth_provider, auth_id, weight_unit, theme, created_at
    FROM users
    WHERE auth_provider = ? AND auth_id = ?
  `;

  return db.getFirstSync(query, [authProvider, authId]) as User | null;
}

/**
 * Updates user preferences (display name, weight unit, theme).
 * Returns true if update was successful.
 *
 * FRONTEND USE: Called from settings screen when user changes preferences.
 */
export function updateUserPreferences(
  db: SQLiteDatabase,
  userId: string,
  updates: UpdateUserPreferencesInput
): boolean {
  const setClauses: string[] = [];
  const values: (string | null)[] = [];

  if (updates.displayName !== undefined) {
    setClauses.push('display_name = ?');
    values.push(updates.displayName);
  }

  if (updates.weightUnit !== undefined) {
    setClauses.push('weight_unit = ?');
    values.push(updates.weightUnit);
  }

  if (updates.theme !== undefined) {
    setClauses.push('theme = ?');
    values.push(updates.theme);
  }

  if (setClauses.length === 0) {
    return false;
  }

  values.push(userId);

  const query = `
    UPDATE users
    SET ${setClauses.join(', ')}
    WHERE id = ?
  `;

  const result = db.runSync(query, values);
  return result.changes > 0;
}

/**
 * Updates user's weight unit preference.
 * Convenience function for quick unit toggle.
 *
 * FRONTEND USE: Called when user toggles lbs/kg in settings.
 */
export function updateWeightUnit(
  db: SQLiteDatabase,
  userId: string,
  weightUnit: 'lbs' | 'kg'
): boolean {
  const query = `
    UPDATE users
    SET weight_unit = ?
    WHERE id = ?
  `;

  const result = db.runSync(query, [weightUnit, userId]);
  return result.changes > 0;
}

/**
 * Updates user's theme preference.
 * Convenience function for quick theme toggle.
 *
 * FRONTEND USE: Called when user toggles dark/light mode.
 */
export function updateTheme(
  db: SQLiteDatabase,
  userId: string,
  theme: 'dark' | 'light'
): boolean {
  const query = `
    UPDATE users
    SET theme = ?
    WHERE id = ?
  `;

  const result = db.runSync(query, [theme, userId]);
  return result.changes > 0;
}

/**
 * Links an authentication provider to an existing user.
 * Useful for linking Apple/Google accounts to existing local accounts.
 *
 * FRONTEND USE: Called when user links a new auth method in settings.
 */
export function linkAuthProvider(
  db: SQLiteDatabase,
  userId: string,
  authProvider: 'apple' | 'google',
  authId: string
): boolean {
  const query = `
    UPDATE users
    SET auth_provider = ?, auth_id = ?
    WHERE id = ?
  `;

  const result = db.runSync(query, [authProvider, authId, userId]);
  return result.changes > 0;
}

/**
 * Deletes a user and all their data.
 * This is a cascading delete that removes all associated entries.
 *
 * FRONTEND USE: Called when user requests account deletion.
 * WARNING: This is irreversible.
 */
export function deleteUser(
  db: SQLiteDatabase,
  userId: string
): boolean {
  // Delete all weight entries first (foreign key constraint)
  db.runSync('DELETE FROM weight_entries WHERE user_id = ?', [userId]);

  // Delete custom workouts created by user
  db.runSync('DELETE FROM workouts WHERE created_by = ?', [userId]);

  // Delete the user
  const result = db.runSync('DELETE FROM users WHERE id = ?', [userId]);
  return result.changes > 0;
}

/**
 * Gets or creates a local user (for offline/guest mode).
 * If no local user exists, creates one. Otherwise returns existing.
 *
 * FRONTEND USE: Initialize app in offline/guest mode.
 */
export function getOrCreateLocalUser(
  db: SQLiteDatabase,
  displayName: string = 'Guest'
): User {
  const existingUser = db.getFirstSync(
    "SELECT * FROM users WHERE auth_provider = 'local' LIMIT 1"
  ) as User | null;

  if (existingUser) {
    return existingUser;
  }

  return createUser(db, {
    displayName,
    authProvider: 'local',
    authId: 'local-user',
  });
}

/**
 * Counts total users in the database.
 * Primarily for debugging/admin purposes.
 */
export function getUserCount(db: SQLiteDatabase): number {
  const result = db.getFirstSync(
    'SELECT COUNT(*) as count FROM users'
  ) as { count: number } | null;
  return result?.count ?? 0;
}
