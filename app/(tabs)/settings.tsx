/**
 * Settings Screen
 *
 * User preferences and app configuration.
 * Organized into sections:
 * - Account: User avatar, display name, sign in/out
 * - Preferences: Weight unit toggle, theme selection
 * - Data: Export data, clear all entries
 * - About: App version, rate app, send feedback
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  Alert,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, borderRadius, touchTargets } from '../../theme';
import {
  SettingsSection,
  SettingsRow,
  SegmentedControl,
  ConfirmDialog,
} from '../../components';
import { useUserPreferences, type WeightUnit, type Theme } from '../../hooks';
import { useDatabaseContext } from '../../hooks/useDatabase';
import { useTheme, usePreferences } from '../../context';

// App version - would typically come from app.json or build config
const APP_VERSION = '1.0.0';

// Weight unit options for segmented control
const WEIGHT_UNIT_OPTIONS = [
  { value: 'lbs' as const, label: 'lbs' },
  { value: 'kg' as const, label: 'kg' },
];

// Theme options for segmented control
const THEME_OPTIONS = [
  { value: 'dark' as const, label: 'Dark' },
  { value: 'light' as const, label: 'Light' },
];

/**
 * User Avatar Placeholder
 */
function UserAvatar({ displayName, colors }: { displayName: string; colors: any }) {
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
      <Text style={[styles.avatarText, { color: colors.text }]}>{initials || 'U'}</Text>
    </View>
  );
}

/**
 * Editable Display Name Component
 */
function EditableDisplayName({
  value,
  onSave,
  colors,
}: {
  value: string;
  onSave: (name: string) => Promise<boolean>;
  colors: any;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = () => {
    setEditValue(value);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleSave = async () => {
    const trimmedValue = editValue.trim();
    if (!trimmedValue) {
      Alert.alert('Invalid Name', 'Display name cannot be empty.');
      return;
    }

    setIsSaving(true);
    const success = await onSave(trimmedValue);
    setIsSaving(false);

    if (success) {
      setIsEditing(false);
    } else {
      Alert.alert('Error', 'Failed to save display name. Please try again.');
    }
  };

  if (isEditing) {
    return (
      <View style={styles.editContainer}>
        <TextInput
          style={[styles.editInput, { backgroundColor: colors.surfaceElevated, color: colors.text }]}
          value={editValue}
          onChangeText={setEditValue}
          placeholder="Enter your name"
          placeholderTextColor={colors.textTertiary}
          autoFocus
          maxLength={50}
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />
        <View style={styles.editButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleCancel}
            disabled={isSaving}
          >
            <Text style={[styles.editButtonCancel, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.editButton, styles.editButtonPrimary, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Text style={[styles.editButtonSave, { color: colors.text }]}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.displayNameContainer}
      onPress={handleEdit}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Display name: ${value}. Tap to edit.`}
    >
      <Text style={[styles.displayName, { color: colors.text }]}>{value}</Text>
      <Ionicons name="pencil" size={16} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

/**
 * Settings Screen Component
 */
export default function SettingsScreen() {
  const { db, userId } = useDatabaseContext();
  const { colors, theme: currentTheme, setTheme: setContextTheme } = useTheme();
  const { weightUnit: currentWeightUnit, setWeightUnit: setContextWeightUnit } = usePreferences();
  const {
    displayName,
    isLoading,
    error,
    setDisplayName,
  } = useUserPreferences();

  // Confirm dialog state
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Handle weight unit change - update context which updates everywhere
  const handleWeightUnitChange = useCallback(
    async (unit: WeightUnit) => {
      await setContextWeightUnit(unit);
    },
    [setContextWeightUnit]
  );

  // Handle theme change - update context which updates everywhere
  const handleThemeChange = useCallback(
    async (newTheme: Theme) => {
      await setContextTheme(newTheme);
    },
    [setContextTheme]
  );

  // Handle export data (placeholder)
  const handleExportData = useCallback(() => {
    Alert.alert(
      'Coming Soon',
      'Data export functionality will be available in a future update.',
      [{ text: 'OK' }]
    );
  }, []);

  // Handle clear all entries
  const handleClearAllEntries = useCallback(() => {
    setShowClearDialog(true);
  }, []);

  // Confirm clear all entries
  const confirmClearAllEntries = useCallback(async () => {
    if (!db || !userId) {
      setShowClearDialog(false);
      return;
    }

    setIsClearing(true);

    try {
      // Delete all weight entries for the user
      db.runSync('DELETE FROM weight_entries WHERE user_id = ?', [userId]);

      setShowClearDialog(false);
      Alert.alert('Success', 'All workout entries have been deleted.');
    } catch (err) {
      console.error('Failed to clear entries:', err);
      Alert.alert('Error', 'Failed to delete entries. Please try again.');
    } finally {
      setIsClearing(false);
    }
  }, [db, userId]);

  // Handle rate app (placeholder)
  const handleRateApp = useCallback(() => {
    Alert.alert(
      'Coming Soon',
      'App rating will be available once the app is published.',
      [{ text: 'OK' }]
    );
  }, []);

  // Handle send feedback (placeholder)
  const handleSendFeedback = useCallback(() => {
    Alert.alert(
      'Coming Soon',
      'Feedback functionality will be available in a future update.',
      [{ text: 'OK' }]
    );
  }, []);

  // Dynamic styles based on theme
  const themedStyles = useMemo(
    () => ({
      container: { ...styles.container, backgroundColor: colors.background },
      loadingText: { ...styles.loadingText, color: colors.textSecondary },
      errorText: { ...styles.errorText, color: colors.text },
      errorSubtext: { ...styles.errorSubtext, color: colors.textSecondary },
      accountDivider: { ...styles.accountDivider, backgroundColor: colors.divider },
    }),
    [colors]
  );

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView style={themedStyles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={themedStyles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error) {
    return (
      <SafeAreaView style={themedStyles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={themedStyles.errorText}>Failed to load settings</Text>
          <Text style={themedStyles.errorSubtext}>{error.message}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={themedStyles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        <SettingsSection title="Account">
          <View style={styles.accountHeader}>
            <UserAvatar displayName={displayName} colors={colors} />
            <EditableDisplayName value={displayName} onSave={setDisplayName} colors={colors} />
          </View>

          <View style={themedStyles.accountDivider} />

          <SettingsRow
            variant="button"
            label="Sign In"
            icon="log-in-outline"
            subtitle="Sync your data across devices"
            onPress={() => {
              Alert.alert(
                'Coming Soon',
                'Sign in functionality will be available in a future update.',
                [{ text: 'OK' }]
              );
            }}
            isLast
          />
        </SettingsSection>

        {/* Preferences Section */}
        <SettingsSection title="Preferences">
          <SettingsRow
            variant="custom"
            label="Weight Unit"
            icon="barbell-outline"
          >
            <View style={styles.segmentedControlWrapper}>
              <SegmentedControl
                options={WEIGHT_UNIT_OPTIONS}
                selectedValue={currentWeightUnit}
                onValueChange={handleWeightUnitChange}
              />
            </View>
          </SettingsRow>

          <SettingsRow
            variant="custom"
            label="Theme"
            icon="moon-outline"
            isLast
          >
            <View style={styles.segmentedControlWrapper}>
              <SegmentedControl
                options={THEME_OPTIONS}
                selectedValue={currentTheme}
                onValueChange={handleThemeChange}
              />
            </View>
          </SettingsRow>
        </SettingsSection>

        {/* Data Section */}
        <SettingsSection title="Data">
          <SettingsRow
            variant="navigation"
            label="Export Data"
            icon="cloud-upload-outline"
            onPress={handleExportData}
          />

          <SettingsRow
            variant="button"
            label="Clear All Entries"
            icon="trash-outline"
            onPress={handleClearAllEntries}
            isDestructive
            isLast
          />
        </SettingsSection>

        {/* About Section */}
        <SettingsSection title="About">
          <SettingsRow
            variant="value"
            label="Version"
            icon="information-circle-outline"
            value={APP_VERSION}
          />

          <SettingsRow
            variant="navigation"
            label="Rate App"
            icon="star-outline"
            onPress={handleRateApp}
          />

          <SettingsRow
            variant="navigation"
            label="Send Feedback"
            icon="mail-outline"
            onPress={handleSendFeedback}
            isLast
          />
        </SettingsSection>

        {/* Footer spacing */}
        <View style={styles.footer} />
      </ScrollView>

      {/* Clear All Entries Confirmation Dialog */}
      <ConfirmDialog
        visible={showClearDialog}
        title="Clear All Entries?"
        message="This will permanently delete all your workout entries. This action cannot be undone."
        confirmLabel="Delete All"
        cancelLabel="Cancel"
        isDestructive
        isLoading={isClearing}
        onConfirm={confirmClearAllEntries}
        onCancel={() => setShowClearDialog(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  errorSubtext: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.base,
    textAlign: 'center',
  },

  // Account section styles
  accountHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
  },
  displayNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  displayName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
  },
  accountDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.lg,
  },

  // Edit display name styles
  editContainer: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  editInput: {
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    minHeight: touchTargets.minimum,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  editButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtonPrimary: {
    minWidth: 80,
  },
  editButtonCancel: {
    fontSize: typography.fontSize.base,
  },
  editButtonSave: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },

  footer: {
    height: spacing.xl,
  },

  // Segmented control wrapper with constrained width
  segmentedControlWrapper: {
    width: 140,
  },
});
