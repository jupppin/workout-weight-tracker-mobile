/**
 * Authentication Hook
 *
 * Provides authentication state management and sign-in/sign-out functionality.
 * Integrates with the auth service and database for user management.
 *
 * FRONTEND INTEGRATION NOTES:
 * - Wrap your app with AuthProvider to access auth state
 * - Use useAuth() hook in components to access auth functions
 * - The hook automatically handles database user creation on sign-in
 * - Guest data can optionally be migrated when signing in
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';

// Conditionally import expo-sqlite only on native platforms
const SQLite = Platform.OS !== 'web' ? require('expo-sqlite') : null;
import {
  signInWithApple as authSignInWithApple,
  signInWithGoogle as authSignInWithGoogle,
  signOut as authSignOut,
  getCurrentUser,
  isAuthenticated as checkIsAuthenticated,
  isAppleSignInAvailable,
  type AuthUser,
  type AuthResult,
} from '../services/auth';
import {
  createUser,
  getUserByAuthId,
  getOrCreateLocalUser,
  linkAuthProvider,
  type CreateUserInput,
} from '../database/userQueries';
import type { User } from '../database/schema';

/**
 * Auth state managed by the hook
 */
export interface AuthState {
  /** Current database user (includes local/guest users) */
  user: User | null;
  /** Auth-specific user data (null for guest users) */
  authUser: AuthUser | null;
  /** Whether auth state is being loaded */
  isLoading: boolean;
  /** Whether user is authenticated (not guest) */
  isAuthenticated: boolean;
  /** Whether Apple Sign In is available */
  isAppleAvailable: boolean;
  /** Any error from auth operations */
  error: string | null;
}

/**
 * Auth context value including state and actions
 */
export interface AuthContextValue extends AuthState {
  /** Sign in with Apple */
  signInWithApple: () => Promise<AuthResult>;
  /** Sign in with Google */
  signInWithGoogle: () => Promise<AuthResult>;
  /** Sign out and return to guest mode */
  signOut: () => Promise<void>;
  /** Clear any error message */
  clearError: () => void;
  /** Refresh auth state from storage */
  refreshAuthState: () => Promise<void>;
}

// Default context value
const defaultAuthContext: AuthContextValue = {
  user: null,
  authUser: null,
  isLoading: true,
  isAuthenticated: false,
  isAppleAvailable: false,
  error: null,
  signInWithApple: async () => ({ success: false, error: 'Auth not initialized' }),
  signInWithGoogle: async () => ({ success: false, error: 'Auth not initialized' }),
  signOut: async () => {},
  clearError: () => {},
  refreshAuthState: async () => {},
};

// Create context
const AuthContext = createContext<AuthContextValue>(defaultAuthContext);

/**
 * Props for AuthProvider component
 */
interface AuthProviderProps {
  children: ReactNode;
  /** Database instance for user queries */
  database: any;
  /** Callback when user changes (for syncing with other providers) */
  onUserChange?: (user: User | null) => void;
}

/**
 * Auth Provider Component
 *
 * Provides authentication state and methods to the component tree.
 * Should wrap the app at a high level, after DatabaseProvider.
 *
 * FRONTEND USE:
 * ```tsx
 * <DatabaseProvider>
 *   {({ db }) => (
 *     <AuthProvider database={db}>
 *       <App />
 *     </AuthProvider>
 *   )}
 * </DatabaseProvider>
 * ```
 */
export function AuthProvider({ children, database, onUserChange }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    authUser: null,
    isLoading: true,
    isAuthenticated: false,
    isAppleAvailable: false,
    error: null,
  });

  /**
   * Updates state and notifies listener of user change
   */
  const updateState = useCallback(
    (updates: Partial<AuthState>) => {
      setState((prev) => {
        const newState = { ...prev, ...updates };
        // Notify listener if user changed
        if (onUserChange && updates.user !== undefined && updates.user !== prev.user) {
          onUserChange(updates.user);
        }
        return newState;
      });
    },
    [onUserChange]
  );

  /**
   * Initializes auth state on mount
   */
  useEffect(() => {
    async function initializeAuth() {
      if (!database) {
        return;
      }

      try {
        // Check Apple Sign In availability
        const appleAvailable = await isAppleSignInAvailable();

        // Check if user is authenticated
        const authenticated = await checkIsAuthenticated();

        if (authenticated) {
          // Load authenticated user
          const authUser = await getCurrentUser();
          if (authUser) {
            // Find or create database user
            const dbUser = getUserByAuthId(database, authUser.authProvider, authUser.authId);
            if (dbUser) {
              updateState({
                user: dbUser,
                authUser,
                isLoading: false,
                isAuthenticated: true,
                isAppleAvailable: appleAvailable,
              });
              return;
            }
          }
        }

        // Not authenticated or user not found - use guest mode
        const guestUser = getOrCreateLocalUser(database, 'Guest');
        updateState({
          user: guestUser,
          authUser: null,
          isLoading: false,
          isAuthenticated: false,
          isAppleAvailable: appleAvailable,
        });
      } catch (error) {
        console.error('Error initializing auth:', error);
        updateState({
          isLoading: false,
          error: 'Failed to initialize authentication',
          isAppleAvailable: false,
        });
      }
    }

    initializeAuth();
  }, [database, updateState]);

  /**
   * Handles successful sign-in by creating/updating database user
   */
  const handleSignInSuccess = useCallback(
    async (authUser: AuthUser): Promise<User | null> => {
      if (!database) {
        return null;
      }

      try {
        // Check if user already exists
        const existingUser = getUserByAuthId(database, authUser.authProvider, authUser.authId);

        if (existingUser) {
          return existingUser;
        }

        // Create new user
        const createInput: CreateUserInput = {
          displayName: authUser.displayName || authUser.email || 'User',
          authProvider: authUser.authProvider,
          authId: authUser.authId,
        };

        return createUser(database, createInput);
      } catch (error) {
        console.error('Error handling sign-in success:', error);
        return null;
      }
    },
    [database]
  );

  /**
   * Sign in with Apple
   */
  const signInWithApple = useCallback(async (): Promise<AuthResult> => {
    updateState({ isLoading: true, error: null });

    try {
      const result = await authSignInWithApple();

      if (result.success && result.user) {
        const dbUser = await handleSignInSuccess(result.user);
        if (dbUser) {
          updateState({
            user: dbUser,
            authUser: result.user,
            isLoading: false,
            isAuthenticated: true,
          });
          return result;
        }
      }

      updateState({
        isLoading: false,
        error: result.error || 'Sign in failed',
      });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      updateState({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [handleSignInSuccess, updateState]);

  /**
   * Sign in with Google
   */
  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    updateState({ isLoading: true, error: null });

    try {
      const result = await authSignInWithGoogle();

      if (result.success && result.user) {
        const dbUser = await handleSignInSuccess(result.user);
        if (dbUser) {
          updateState({
            user: dbUser,
            authUser: result.user,
            isLoading: false,
            isAuthenticated: true,
          });
          return result;
        }
      }

      updateState({
        isLoading: false,
        error: result.error || 'Sign in failed',
      });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      updateState({ isLoading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }, [handleSignInSuccess, updateState]);

  /**
   * Sign out and return to guest mode
   */
  const signOut = useCallback(async (): Promise<void> => {
    if (!database) {
      return;
    }

    updateState({ isLoading: true, error: null });

    try {
      await authSignOut();

      // Create or get guest user
      const guestUser = getOrCreateLocalUser(database, 'Guest');

      updateState({
        user: guestUser,
        authUser: null,
        isLoading: false,
        isAuthenticated: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      updateState({ isLoading: false, error: errorMessage });
    }
  }, [database, updateState]);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  /**
   * Refresh auth state from storage
   */
  const refreshAuthState = useCallback(async (): Promise<void> => {
    if (!database) {
      return;
    }

    updateState({ isLoading: true });

    try {
      const authenticated = await checkIsAuthenticated();

      if (authenticated) {
        const authUser = await getCurrentUser();
        if (authUser) {
          const dbUser = getUserByAuthId(database, authUser.authProvider, authUser.authId);
          if (dbUser) {
            updateState({
              user: dbUser,
              authUser,
              isLoading: false,
              isAuthenticated: true,
            });
            return;
          }
        }
      }

      const guestUser = getOrCreateLocalUser(database, 'Guest');
      updateState({
        user: guestUser,
        authUser: null,
        isLoading: false,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Error refreshing auth state:', error);
      updateState({ isLoading: false });
    }
  }, [database, updateState]);

  // Memoize context value
  const contextValue = useMemo<AuthContextValue>(
    () => ({
      ...state,
      signInWithApple,
      signInWithGoogle,
      signOut,
      clearError,
      refreshAuthState,
    }),
    [state, signInWithApple, signInWithGoogle, signOut, clearError, refreshAuthState]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access authentication state and methods
 *
 * FRONTEND USE:
 * ```tsx
 * function MyComponent() {
 *   const { user, isAuthenticated, signInWithApple, signOut } = useAuth();
 *
 *   if (isAuthenticated) {
 *     return <Text>Welcome, {user?.display_name}</Text>;
 *   }
 *
 *   return <Button onPress={signInWithApple} title="Sign In" />;
 * }
 * ```
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook to access only auth state (for components that don't need actions)
 */
export function useAuthState(): AuthState {
  const { user, authUser, isLoading, isAuthenticated, isAppleAvailable, error } = useAuth();
  return { user, authUser, isLoading, isAuthenticated, isAppleAvailable, error };
}

// Export context for advanced use cases
export { AuthContext };
