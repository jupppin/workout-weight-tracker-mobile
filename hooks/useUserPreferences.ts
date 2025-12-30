/**
 * useUserPreferences Hook
 *
 * Manages user preferences with database persistence.
 * Provides current values and setters for:
 * - weightUnit (lbs/kg)
 * - theme (dark/light)
 * - displayName
 *
 * Uses the database context for persistence.
 */

import { useState, useEffect, useCallback } from 'react';
import { useDatabaseContext } from './useDatabase';
import {
  getUserById,
  updateUserPreferences,
  updateWeightUnit,
  updateTheme,
} from '../database/userQueries';
import type { User } from '../database/schema';

export type WeightUnit = 'lbs' | 'kg';
export type Theme = 'dark' | 'light';

interface UserPreferencesState {
  weightUnit: WeightUnit;
  theme: Theme;
  displayName: string;
  isLoading: boolean;
  error: Error | null;
}

interface UserPreferencesActions {
  setWeightUnit: (unit: WeightUnit) => Promise<boolean>;
  setTheme: (theme: Theme) => Promise<boolean>;
  setDisplayName: (name: string) => Promise<boolean>;
  refreshPreferences: () => void;
}

export type UseUserPreferencesReturn = UserPreferencesState & UserPreferencesActions;

/**
 * Hook for managing user preferences with database persistence
 */
export function useUserPreferences(): UseUserPreferencesReturn {
  const { db, userId, isLoading: dbLoading, error: dbError } = useDatabaseContext();

  const [state, setState] = useState<UserPreferencesState>({
    weightUnit: 'lbs',
    theme: 'dark',
    displayName: 'Workout User',
    isLoading: true,
    error: null,
  });

  // Load preferences from database
  const loadPreferences = useCallback(() => {
    if (!db || !userId) {
      setState((prev) => ({
        ...prev,
        isLoading: dbLoading,
        error: dbError,
      }));
      return;
    }

    try {
      const user = getUserById(db, userId);
      if (user) {
        setState({
          weightUnit: user.weight_unit,
          theme: user.theme,
          displayName: user.display_name,
          isLoading: false,
          error: null,
        });
      } else {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: new Error('User not found'),
        }));
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err : new Error('Failed to load preferences'),
      }));
    }
  }, [db, userId, dbLoading, dbError]);

  // Load preferences when database is ready
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Update weight unit
  const setWeightUnit = useCallback(
    async (unit: WeightUnit): Promise<boolean> => {
      if (!db || !userId) return false;

      try {
        const success = updateWeightUnit(db, userId, unit);
        if (success) {
          setState((prev) => ({ ...prev, weightUnit: unit }));
        }
        return success;
      } catch (err) {
        console.error('Failed to update weight unit:', err);
        return false;
      }
    },
    [db, userId]
  );

  // Update theme
  const setTheme = useCallback(
    async (theme: Theme): Promise<boolean> => {
      if (!db || !userId) return false;

      try {
        const success = updateTheme(db, userId, theme);
        if (success) {
          setState((prev) => ({ ...prev, theme }));
        }
        return success;
      } catch (err) {
        console.error('Failed to update theme:', err);
        return false;
      }
    },
    [db, userId]
  );

  // Update display name
  const setDisplayName = useCallback(
    async (name: string): Promise<boolean> => {
      if (!db || !userId) return false;

      try {
        const success = updateUserPreferences(db, userId, { displayName: name });
        if (success) {
          setState((prev) => ({ ...prev, displayName: name }));
        }
        return success;
      } catch (err) {
        console.error('Failed to update display name:', err);
        return false;
      }
    },
    [db, userId]
  );

  return {
    ...state,
    setWeightUnit,
    setTheme,
    setDisplayName,
    refreshPreferences: loadPreferences,
  };
}
