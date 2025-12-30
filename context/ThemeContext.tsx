/**
 * ThemeContext
 *
 * Provides app-wide theme management with database persistence.
 * Supports dark and light themes.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useDatabaseContext } from '../hooks/useDatabase';
import { getUserById, updateTheme } from '../database/userQueries';

export type Theme = 'dark' | 'light';

// Dark theme colors
export const darkColors = {
  // Background colors
  background: '#0D0D0D',
  surface: '#1A1A1A',
  surfaceElevated: '#262626',

  // Primary accent color
  primary: '#6366F1',
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',

  // Text colors
  text: '#FFFFFF',
  textSecondary: '#A3A3A3',
  textTertiary: '#737373',
  textInverse: '#0D0D0D',

  // Semantic colors
  success: '#22C55E',
  successLight: '#4ADE80',
  error: '#EF4444',
  errorLight: '#F87171',
  warning: '#F59E0B',
  warningLight: '#FBBF24',

  // Border and divider
  border: '#333333',
  divider: '#262626',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Tab bar
  tabBarBackground: '#0D0D0D',
  tabBarBorder: '#1A1A1A',
  tabIconDefault: '#737373',
  tabIconSelected: '#6366F1',
} as const;

// Light theme colors
export const lightColors = {
  // Background colors
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceElevated: '#FAFAFA',

  // Primary accent color
  primary: '#6366F1',
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',

  // Text colors
  text: '#1A1A1A',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textInverse: '#FFFFFF',

  // Semantic colors
  success: '#22C55E',
  successLight: '#4ADE80',
  error: '#EF4444',
  errorLight: '#F87171',
  warning: '#F59E0B',
  warningLight: '#FBBF24',

  // Border and divider
  border: '#E5E5E5',
  divider: '#EEEEEE',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.3)',

  // Tab bar
  tabBarBackground: '#FFFFFF',
  tabBarBorder: '#E5E5E5',
  tabIconDefault: '#999999',
  tabIconSelected: '#6366F1',
} as const;

// Use a generic type that works for both dark and light colors
export type ThemeColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  success: string;
  successLight: string;
  error: string;
  errorLight: string;
  warning: string;
  warningLight: string;
  border: string;
  divider: string;
  overlay: string;
  tabBarBackground: string;
  tabBarBorder: string;
  tabIconDefault: string;
  tabIconSelected: string;
};

interface ThemeContextValue {
  theme: Theme;
  colors: ThemeColors;
  isDark: boolean;
  setTheme: (theme: Theme) => Promise<boolean>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { db, userId } = useDatabaseContext();
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('dark');

  // Load theme from database on mount
  useEffect(() => {
    if (!db || !userId) return;

    try {
      const user = getUserById(db, userId);
      if (user && user.theme) {
        setThemeState(user.theme as Theme);
      }
    } catch (err) {
      console.error('Failed to load theme preference:', err);
    }
  }, [db, userId]);

  // Update theme in database and state
  const setTheme = useCallback(
    async (newTheme: Theme): Promise<boolean> => {
      if (!db || !userId) return false;

      try {
        const success = updateTheme(db, userId, newTheme);
        if (success) {
          setThemeState(newTheme);
        }
        return success;
      } catch (err) {
        console.error('Failed to update theme:', err);
        return false;
      }
    },
    [db, userId]
  );

  const value = useMemo(
    () => ({
      theme,
      colors: theme === 'dark' ? darkColors : lightColors,
      isDark: theme === 'dark',
      setTheme,
    }),
    [theme, setTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    // Return default dark theme if context not available
    return {
      theme: 'dark',
      colors: darkColors,
      isDark: true,
      setTheme: async () => false,
    };
  }
  return context;
}

export { ThemeContext };
