/**
 * ConfirmDialog Component
 *
 * Modal confirmation dialog for dangerous actions.
 * Features:
 * - Clear title and message
 * - Cancel and confirm buttons
 * - Destructive styling for dangerous actions
 * - Accessible modal behavior
 * - Overlay backdrop with tap-to-dismiss
 * - Theme-aware styling
 */

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { spacing, typography, borderRadius, shadows } from '../theme';
import { useTheme } from '../context';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { colors } = useTheme();
  const confirmButtonColor = isDestructive ? colors.error : colors.primary;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable
        style={[styles.overlay, { backgroundColor: colors.overlay }]}
        onPress={onCancel}
        accessibilityRole="button"
        accessibilityLabel="Close dialog"
      >
        <Pressable
          style={[styles.dialog, { backgroundColor: colors.surface }]}
          onPress={(e) => e.stopPropagation()}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={isLoading}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
            >
              <Text style={[styles.cancelButtonText, { color: colors.primary }]}>{cancelLabel}</Text>
            </TouchableOpacity>

            <View style={[styles.buttonDivider, { backgroundColor: colors.divider }]} />

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
              disabled={isLoading}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={confirmButtonColor} />
              ) : (
                <Text
                  style={[
                    styles.confirmButtonText,
                    { color: confirmButtonColor },
                    isDestructive && styles.destructiveText,
                  ]}
                >
                  {confirmLabel}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  dialog: {
    borderRadius: borderRadius.xl,
    width: '100%',
    maxWidth: 320,
    ...shadows.lg,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  buttonContainer: {
    flexDirection: 'row',
    minHeight: 48,
  },
  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  buttonDivider: {
    width: StyleSheet.hairlineWidth,
  },
  cancelButton: {},
  confirmButton: {},
  cancelButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
  },
  confirmButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  destructiveText: {
    fontWeight: typography.fontWeight.semibold,
  },
});
