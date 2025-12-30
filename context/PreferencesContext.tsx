/**
 * PreferencesContext
 *
 * Provides app-wide user preferences including weight unit.
 * This context is separate from theme to allow more granular updates.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useDatabaseContext } from '../hooks/useDatabase';
import { getUserById, updateWeightUnit } from '../database/userQueries';

export type WeightUnit = 'lbs' | 'kg';

interface PreferencesContextValue {
  weightUnit: WeightUnit;
  setWeightUnit: (unit: WeightUnit) => Promise<boolean>;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

interface PreferencesProviderProps {
  children: React.ReactNode;
}

export function PreferencesProvider({ children }: PreferencesProviderProps) {
  const { db, userId } = useDatabaseContext();
  const [weightUnit, setWeightUnitState] = useState<WeightUnit>('lbs');

  // Load weight unit from database on mount
  useEffect(() => {
    if (!db || !userId) return;

    try {
      const user = getUserById(db, userId);
      if (user && user.weight_unit) {
        setWeightUnitState(user.weight_unit as WeightUnit);
      }
    } catch (err) {
      console.error('Failed to load weight unit preference:', err);
    }
  }, [db, userId]);

  // Update weight unit in database and state
  const setWeightUnit = useCallback(
    async (unit: WeightUnit): Promise<boolean> => {
      if (!db || !userId) return false;

      try {
        const success = updateWeightUnit(db, userId, unit);
        if (success) {
          setWeightUnitState(unit);
        }
        return success;
      } catch (err) {
        console.error('Failed to update weight unit:', err);
        return false;
      }
    },
    [db, userId]
  );

  const value = useMemo(
    () => ({
      weightUnit,
      setWeightUnit,
    }),
    [weightUnit, setWeightUnit]
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  if (!context) {
    // Return defaults if context not available
    return {
      weightUnit: 'lbs',
      setWeightUnit: async () => false,
    };
  }
  return context;
}

export { PreferencesContext };
