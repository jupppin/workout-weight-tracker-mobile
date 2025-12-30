/**
 * Auth Prompt Component
 *
 * A modal/screen that prompts users to sign in or continue as guest.
 * Shows the benefits of signing in to encourage account creation.
 *
 * FRONTEND INTEGRATION NOTES:
 * - Can be used as a modal overlay or a standalone screen
 * - Shows Apple Sign In only when available on the device
 * - Handles all authentication flows internally
 * - Provides callback for when auth flow completes
 */

import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { SignInButtonGroup } from './SignInButton';
import { useAuth } from '../../hooks/useAuth';

/**
 * Benefit item shown in the prompt
 */
interface Benefit {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

/**
 * Benefits of signing in
 */
const SIGN_IN_BENEFITS: Benefit[] = [
  {
    icon: 'sync-outline',
    title: 'Sync Across Devices',
    description: 'Access your workouts on any device',
  },
  {
    icon: 'cloud-outline',
    title: 'Backup Your Data',
    description: 'Never lose your workout history',
  },
  {
    icon: 'trophy-outline',
    title: 'Track Progress',
    description: 'See your improvements over time',
  },
];

/**
 * Props for AuthPrompt component
 */
interface AuthPromptProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when prompt should close */
  onClose: () => void;
  /** Callback when user successfully signs in */
  onSignInSuccess?: () => void;
  /** Callback when user chooses to continue as guest */
  onContinueAsGuest?: () => void;
  /** Whether to show the close button */
  showCloseButton?: boolean;
  /** Custom title for the prompt */
  title?: string;
  /** Custom subtitle for the prompt */
  subtitle?: string;
}

/**
 * Auth Prompt Modal
 *
 * Displays a modal prompting the user to sign in with benefits listed.
 *
 * FRONTEND USE:
 * ```tsx
 * <AuthPrompt
 *   visible={showAuthPrompt}
 *   onClose={() => setShowAuthPrompt(false)}
 *   onSignInSuccess={handleSignInSuccess}
 *   onContinueAsGuest={handleGuest}
 * />
 * ```
 */
export function AuthPrompt({
  visible,
  onClose,
  onSignInSuccess,
  onContinueAsGuest,
  showCloseButton = true,
  title = 'Sign In',
  subtitle = 'Create an account to unlock all features',
}: AuthPromptProps) {
  const { signInWithApple, signInWithGoogle, isAppleAvailable, isLoading, error, clearError } =
    useAuth();
  const [localLoading, setLocalLoading] = useState(false);

  const handleApplePress = useCallback(async () => {
    setLocalLoading(true);
    try {
      const result = await signInWithApple();
      if (result.success) {
        onSignInSuccess?.();
        onClose();
      } else if (result.error && result.error !== 'Sign in was cancelled') {
        Alert.alert('Sign In Failed', result.error);
      }
    } finally {
      setLocalLoading(false);
    }
  }, [signInWithApple, onSignInSuccess, onClose]);

  const handleGooglePress = useCallback(async () => {
    setLocalLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        onSignInSuccess?.();
        onClose();
      } else if (result.error && result.error !== 'Sign in was cancelled') {
        Alert.alert('Sign In Failed', result.error);
      }
    } finally {
      setLocalLoading(false);
    }
  }, [signInWithGoogle, onSignInSuccess, onClose]);

  const handleGuestPress = useCallback(() => {
    onContinueAsGuest?.();
    onClose();
  }, [onContinueAsGuest, onClose]);

  const handleClose = useCallback(() => {
    clearError();
    onClose();
  }, [clearError, onClose]);

  const currentLoading = isLoading || localLoading;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          {showCloseButton && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title Section */}
          <View style={styles.titleSection}>
            <View style={styles.iconContainer}>
              <Ionicons name="fitness-outline" size={48} color={colors.primary} />
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          {/* Benefits Section */}
          <View style={styles.benefitsSection}>
            {SIGN_IN_BENEFITS.map((benefit, index) => (
              <BenefitItem key={index} benefit={benefit} />
            ))}
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Sign In Buttons */}
          <View style={styles.buttonSection}>
            <SignInButtonGroup
              onApplePress={handleApplePress}
              onGooglePress={handleGooglePress}
              onGuestPress={onContinueAsGuest ? handleGuestPress : undefined}
              isAppleAvailable={isAppleAvailable}
              isLoading={currentLoading}
              showGuestOption={!!onContinueAsGuest}
            />
          </View>

          {/* Privacy Note */}
          <Text style={styles.privacyNote}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

/**
 * Benefit Item Component
 */
function BenefitItem({ benefit }: { benefit: Benefit }) {
  return (
    <View style={styles.benefitItem}>
      <View style={styles.benefitIcon}>
        <Ionicons name={benefit.icon} size={24} color={colors.primary} />
      </View>
      <View style={styles.benefitContent}>
        <Text style={styles.benefitTitle}>{benefit.title}</Text>
        <Text style={styles.benefitDescription}>{benefit.description}</Text>
      </View>
    </View>
  );
}

/**
 * Auth Prompt Screen (non-modal version)
 *
 * A full-screen version of the auth prompt for use in navigation.
 *
 * FRONTEND USE:
 * ```tsx
 * <AuthPromptScreen
 *   onSignInSuccess={() => navigation.navigate('Home')}
 *   onContinueAsGuest={() => navigation.navigate('Home')}
 * />
 * ```
 */
interface AuthPromptScreenProps {
  onSignInSuccess?: () => void;
  onContinueAsGuest?: () => void;
}

export function AuthPromptScreen({
  onSignInSuccess,
  onContinueAsGuest,
}: AuthPromptScreenProps) {
  const { signInWithApple, signInWithGoogle, isAppleAvailable, isLoading, error, clearError } =
    useAuth();
  const [localLoading, setLocalLoading] = useState(false);

  const handleApplePress = useCallback(async () => {
    setLocalLoading(true);
    try {
      const result = await signInWithApple();
      if (result.success) {
        onSignInSuccess?.();
      } else if (result.error && result.error !== 'Sign in was cancelled') {
        Alert.alert('Sign In Failed', result.error);
      }
    } finally {
      setLocalLoading(false);
    }
  }, [signInWithApple, onSignInSuccess]);

  const handleGooglePress = useCallback(async () => {
    setLocalLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        onSignInSuccess?.();
      } else if (result.error && result.error !== 'Sign in was cancelled') {
        Alert.alert('Sign In Failed', result.error);
      }
    } finally {
      setLocalLoading(false);
    }
  }, [signInWithGoogle, onSignInSuccess]);

  const currentLoading = isLoading || localLoading;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="fitness-outline" size={48} color={colors.primary} />
          </View>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>Sign in to track your workouts</Text>
        </View>

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          {SIGN_IN_BENEFITS.map((benefit, index) => (
            <BenefitItem key={index} benefit={benefit} />
          ))}
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Sign In Buttons */}
        <View style={styles.buttonSection}>
          <SignInButtonGroup
            onApplePress={handleApplePress}
            onGooglePress={handleGooglePress}
            onGuestPress={onContinueAsGuest}
            isAppleAvailable={isAppleAvailable}
            isLoading={currentLoading}
            showGuestOption={!!onContinueAsGuest}
          />
        </View>

        {/* Privacy Note */}
        <Text style={styles.privacyNote}>
          By signing in, you agree to our Terms of Service and Privacy Policy
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  titleSection: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  benefitsSection: {
    paddingVertical: spacing.lg,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
  },
  benefitIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  benefitDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  errorText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.error,
    marginLeft: spacing.sm,
  },
  buttonSection: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  privacyNote: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
    paddingTop: spacing.md,
  },
});
