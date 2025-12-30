/**
 * Design system for the Workout Weight Tracker app
 * Mobile-first with dark mode default
 */

export { colors } from './colors';
export type { ColorName } from './colors';

/**
 * Spacing scale (in pixels)
 * Based on 4px base unit for consistent rhythm
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export type SpacingKey = keyof typeof spacing;

/**
 * Typography scale
 * Minimum 16px for body text to prevent zoom on iOS
 */
export const typography = {
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },

  // Font weights
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Line heights (multipliers)
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

/**
 * Border radius values
 * Rounded corners for friendly, modern feel
 */
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

/**
 * Shadow presets for elevated surfaces
 */
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

/**
 * Touch target sizes
 * Minimum 44pt (iOS) / 48dp (Android) for accessibility
 */
export const touchTargets = {
  minimum: 44,
  comfortable: 48,
  large: 56,
} as const;

/**
 * Animation durations
 */
export const animation = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

/**
 * Common component styles
 */
export const componentStyles = {
  // Card/Surface container
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
  },

  // Screen container
  screenContainer: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },

  // Section padding
  sectionPadding: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
} as const;
