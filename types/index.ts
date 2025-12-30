/**
 * TypeScript type definitions for the Workout Weight Tracker app
 */

/**
 * Muscle group categories
 */
export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'core'
  | 'quadriceps'
  | 'hamstrings'
  | 'glutes'
  | 'calves';

/**
 * Exercise definition
 */
export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * A single set within a workout log entry
 */
export interface WorkoutSet {
  id: string;
  setNumber: number;
  weight: number; // in user's preferred unit (kg or lb)
  reps: number;
  isWarmup?: boolean;
  notes?: string;
}

/**
 * A workout log entry for a specific exercise
 */
export interface WorkoutLog {
  id: string;
  exerciseId: string;
  date: string; // ISO date string
  sets: WorkoutSet[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * User preferences
 */
export interface UserPreferences {
  weightUnit: 'kg' | 'lb';
  theme: 'dark' | 'light' | 'system';
  defaultRestTimer: number; // in seconds
  showWarmupSets: boolean;
}

/**
 * Recent workout summary for home screen display
 */
export interface RecentWorkoutSummary {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  date: string;
  totalSets: number;
  maxWeight: number;
  totalVolume: number; // weight x reps sum
}

/**
 * Personal record for an exercise
 */
export interface PersonalRecord {
  exerciseId: string;
  maxWeight: number;
  maxWeightDate: string;
  maxVolume: number; // single set: weight x reps
  maxVolumeDate: string;
}

/**
 * Navigation parameter types for type-safe routing
 */
export type RootStackParamList = {
  '(tabs)': undefined;
  'workout/[id]': { id: string };
  'log/[id]': { id: string };
};

/**
 * Tab navigation parameter types
 */
export type TabParamList = {
  index: undefined;
  browse: undefined;
  settings: undefined;
};

/**
 * Muscle group display information
 */
export interface MuscleGroupInfo {
  id: MuscleGroup;
  name: string;
  icon: string; // Icon name from @expo/vector-icons
  exerciseCount?: number;
}

/**
 * Default muscle group data
 */
export const MUSCLE_GROUPS: MuscleGroupInfo[] = [
  { id: 'chest', name: 'Chest', icon: 'fitness-outline' },
  { id: 'back', name: 'Back', icon: 'body-outline' },
  { id: 'shoulders', name: 'Shoulders', icon: 'body-outline' },
  { id: 'biceps', name: 'Biceps', icon: 'arm-flex-outline' },
  { id: 'triceps', name: 'Triceps', icon: 'arm-flex-outline' },
  { id: 'forearms', name: 'Forearms', icon: 'hand-left-outline' },
  { id: 'core', name: 'Core', icon: 'body-outline' },
  { id: 'quadriceps', name: 'Quadriceps', icon: 'walk-outline' },
  { id: 'hamstrings', name: 'Hamstrings', icon: 'walk-outline' },
  { id: 'glutes', name: 'Glutes', icon: 'walk-outline' },
  { id: 'calves', name: 'Calves', icon: 'footsteps-outline' },
];

/**
 * Default user preferences
 */
export const DEFAULT_PREFERENCES: UserPreferences = {
  weightUnit: 'kg',
  theme: 'dark',
  defaultRestTimer: 90,
  showWarmupSets: true,
};
