/**
 * Sign In Button Components
 *
 * Provides Apple and Google sign-in buttons following platform guidelines.
 * Apple Sign In button uses the official Apple button styling.
 *
 * FRONTEND INTEGRATION NOTES:
 * - AppleSignInButton must use Apple's official styling (Apple HIG requirement)
 * - GoogleSignInButton follows Google's branding guidelines
 * - Both buttons handle loading states and disable during authentication
 */

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../theme';

/**
 * Props for sign-in buttons
 */
interface SignInButtonProps {
  /** Callback when button is pressed */
  onPress: () => void;
  /** Whether the button is in loading state */
  isLoading?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Button style variant */
  variant?: 'default' | 'outline';
}

/**
 * Apple Sign In Button
 *
 * Uses the official Apple Authentication button on iOS.
 * Shows a styled fallback on other platforms.
 *
 * IMPORTANT: On iOS, this must use Apple's official button component
 * to comply with App Store guidelines.
 *
 * FRONTEND USE:
 * ```tsx
 * <AppleSignInButton
 *   onPress={handleAppleSignIn}
 *   isLoading={isLoading}
 * />
 * ```
 */
export function AppleSignInButton({
  onPress,
  isLoading = false,
  disabled = false,
}: SignInButtonProps) {
  // Use official Apple button on iOS
  if (Platform.OS === 'ios') {
    return (
      <View style={styles.buttonContainer}>
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
          cornerRadius={borderRadius.lg}
          style={styles.appleButton}
          onPress={onPress}
        />
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={colors.background} />
          </View>
        )}
      </View>
    );
  }

  // Styled fallback for non-iOS platforms
  return (
    <TouchableOpacity
      style={[styles.button, styles.appleButtonFallback, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel="Sign in with Apple"
      accessibilityState={{ disabled: disabled || isLoading }}
    >
      {isLoading ? (
        <ActivityIndicator color={colors.background} />
      ) : (
        <>
          <Ionicons name="logo-apple" size={20} color={colors.background} style={styles.icon} />
          <Text style={[styles.buttonText, styles.appleButtonText]}>Sign in with Apple</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

/**
 * Google Sign In Button
 *
 * Custom styled button following Google's branding guidelines.
 * White background with Google colors.
 *
 * FRONTEND USE:
 * ```tsx
 * <GoogleSignInButton
 *   onPress={handleGoogleSignIn}
 *   isLoading={isLoading}
 * />
 * ```
 */
export function GoogleSignInButton({
  onPress,
  isLoading = false,
  disabled = false,
  variant = 'default',
}: SignInButtonProps) {
  const isOutline = variant === 'outline';

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isOutline ? styles.googleButtonOutline : styles.googleButton,
        disabled && styles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel="Sign in with Google"
      accessibilityState={{ disabled: disabled || isLoading }}
    >
      {isLoading ? (
        <ActivityIndicator color={isOutline ? colors.text : colors.background} />
      ) : (
        <>
          <GoogleLogo style={styles.icon} />
          <Text style={[styles.buttonText, isOutline ? styles.googleButtonTextOutline : styles.googleButtonText]}>
            Sign in with Google
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

/**
 * Google "G" Logo Component
 *
 * Renders the Google logo using the official colors.
 */
function GoogleLogo({ style }: { style?: object }) {
  return (
    <View style={[styles.googleLogoContainer, style]}>
      <Text style={styles.googleLogoText}>G</Text>
    </View>
  );
}

/**
 * Continue as Guest Button
 *
 * Secondary option for users who don't want to sign in.
 *
 * FRONTEND USE:
 * ```tsx
 * <ContinueAsGuestButton onPress={handleSkip} />
 * ```
 */
export function ContinueAsGuestButton({
  onPress,
  isLoading = false,
  disabled = false,
}: SignInButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.guestButton, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Continue as guest"
    >
      <Text style={styles.guestButtonText}>Continue as Guest</Text>
    </TouchableOpacity>
  );
}

/**
 * Sign In Button Group
 *
 * Renders both Apple and Google sign-in buttons with proper spacing.
 * Apple button is only shown when available.
 *
 * FRONTEND USE:
 * ```tsx
 * <SignInButtonGroup
 *   onApplePress={handleAppleSignIn}
 *   onGooglePress={handleGoogleSignIn}
 *   onGuestPress={handleGuest}
 *   isAppleAvailable={true}
 *   isLoading={false}
 * />
 * ```
 */
interface SignInButtonGroupProps {
  onApplePress: () => void;
  onGooglePress: () => void;
  onGuestPress?: () => void;
  isAppleAvailable?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  showGuestOption?: boolean;
}

export function SignInButtonGroup({
  onApplePress,
  onGooglePress,
  onGuestPress,
  isAppleAvailable = true,
  isLoading = false,
  disabled = false,
  showGuestOption = true,
}: SignInButtonGroupProps) {
  return (
    <View style={styles.buttonGroup}>
      {isAppleAvailable && (
        <AppleSignInButton
          onPress={onApplePress}
          isLoading={isLoading}
          disabled={disabled}
        />
      )}
      <GoogleSignInButton
        onPress={onGooglePress}
        isLoading={isLoading}
        disabled={disabled}
        variant={isAppleAvailable ? 'outline' : 'default'}
      />
      {showGuestOption && onGuestPress && (
        <>
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>
          <ContinueAsGuestButton
            onPress={onGuestPress}
            disabled={disabled}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    position: 'relative',
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  icon: {
    marginRight: spacing.sm,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Apple button styles
  appleButton: {
    width: '100%',
    height: 50,
  },
  appleButtonFallback: {
    backgroundColor: '#FFFFFF',
  },
  appleButtonText: {
    color: colors.background,
  },

  // Google button styles
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DADCE0',
  },
  googleButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  googleButtonText: {
    color: '#1F1F1F',
  },
  googleButtonTextOutline: {
    color: colors.text,
  },
  googleLogoContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLogoText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4285F4', // Google Blue
  },

  // Guest button styles
  guestButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  guestButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },

  // Button group styles
  buttonGroup: {
    width: '100%',
    gap: spacing.md,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.divider,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.textTertiary,
  },
});
