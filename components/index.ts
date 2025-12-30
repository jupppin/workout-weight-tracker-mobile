/**
 * Component Exports
 *
 * Central export point for all reusable UI components.
 */

// Existing components
export { WorkoutCard } from './WorkoutCard';
export { IncrementButton } from './IncrementButton';
export { MuscleGroupCard } from './MuscleGroupCard';
export { BigButton } from './BigButton';

// Search and filtering
export { SearchBar } from './SearchBar';
export { FilterChip, FilterChipGroup } from './FilterChip';

// List items
export { WorkoutListItem, EmptyWorkoutList } from './WorkoutListItem';
export { HistoryEntry, EmptyHistory } from './HistoryEntry';

// Favorites
export { FavoriteButton, FavoriteIndicator } from './FavoriteButton';

// Progress visualization
export {
  ProgressIndicator,
  ProgressSummary,
  CompactProgressBadge,
} from './ProgressIndicator';

// Settings components
export { SettingsSection } from './SettingsSection';
export { SettingsRow, type SettingsRowProps } from './SettingsRow';
export {
  SegmentedControl,
  type SegmentOption,
} from './SegmentedControl';
export { ConfirmDialog } from './ConfirmDialog';

// Auth components
export {
  AppleSignInButton,
  GoogleSignInButton,
  ContinueAsGuestButton,
  SignInButtonGroup,
  AuthPrompt,
  AuthPromptScreen,
} from './auth';
