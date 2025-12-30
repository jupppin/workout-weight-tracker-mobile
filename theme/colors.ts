/**
 * Color palette for the Workout Weight Tracker app
 * Dark mode is the default theme
 */

export const colors = {
  // Background colors
  background: '#0D0D0D',
  surface: '#1A1A1A',
  surfaceElevated: '#262626',

  // Primary accent color
  primary: '#6366F1', // Indigo - stands out well on dark backgrounds
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

export type ColorName = keyof typeof colors;
