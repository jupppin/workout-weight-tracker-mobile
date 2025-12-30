/**
 * Hooks Exports
 *
 * Central export point for all custom hooks.
 */

export {
  useDatabase,
  useDatabaseContext,
  DatabaseProvider,
  DatabaseContext,
} from './useDatabase';

export { useSearch, useFilter } from './useSearch';

export {
  useUserPreferences,
  type WeightUnit,
  type Theme,
  type UseUserPreferencesReturn,
} from './useUserPreferences';

export {
  useAuth,
  useAuthState,
  AuthProvider,
  AuthContext,
  type AuthState,
  type AuthContextValue,
} from './useAuth';
