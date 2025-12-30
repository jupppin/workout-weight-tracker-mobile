/**
 * SettingsRow Component
 *
 * Standard row component for settings screens with multiple variants:
 * - toggle: Switch control on the right
 * - segmented: SegmentedControl on the right
 * - navigation: Chevron arrow (for drill-down navigation)
 * - button: Standalone button style
 * - value: Display a value with optional navigation
 *
 * Follows iOS-style settings with proper touch targets and visual feedback.
 */

import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, borderRadius, touchTargets } from '../theme';
import { useTheme } from '../context';

// Base props shared by all variants
interface BaseSettingsRowProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  subtitle?: string;
  disabled?: boolean;
  isLoading?: boolean;
  isDestructive?: boolean;
  isLast?: boolean;
}

// Toggle variant props
interface ToggleRowProps extends BaseSettingsRowProps {
  variant: 'toggle';
  value: boolean;
  onValueChange: (value: boolean) => void;
}

// Navigation variant props
interface NavigationRowProps extends BaseSettingsRowProps {
  variant: 'navigation';
  value?: string;
  onPress: () => void;
}

// Button variant props
interface ButtonRowProps extends BaseSettingsRowProps {
  variant: 'button';
  onPress: () => void;
}

// Value display variant props
interface ValueRowProps extends BaseSettingsRowProps {
  variant: 'value';
  value: string;
  onPress?: () => void;
}

// Custom content variant props
interface CustomRowProps extends BaseSettingsRowProps {
  variant: 'custom';
  children: React.ReactNode;
}

export type SettingsRowProps =
  | ToggleRowProps
  | NavigationRowProps
  | ButtonRowProps
  | ValueRowProps
  | CustomRowProps;

export function SettingsRow(props: SettingsRowProps) {
  const { colors } = useTheme();
  const {
    label,
    icon,
    subtitle,
    disabled = false,
    isLoading = false,
    isDestructive = false,
    isLast = false,
    variant,
  } = props;

  const labelColor = isDestructive
    ? colors.error
    : disabled
    ? colors.textTertiary
    : colors.text;

  const iconColor = isDestructive
    ? colors.error
    : disabled
    ? colors.textTertiary
    : colors.primary;

  const renderIcon = () => {
    if (!icon) return null;
    return (
      <View style={[styles.iconContainer, { backgroundColor: colors.surfaceElevated }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
    );
  };

  const renderLabel = () => (
    <View style={styles.labelContainer}>
      <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>
        {label}
      </Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
          {subtitle}
        </Text>
      )}
    </View>
  );

  const renderLoading = () => (
    <ActivityIndicator size="small" color={colors.primary} />
  );

  const renderRightContent = () => {
    if (isLoading) return renderLoading();

    switch (variant) {
      case 'toggle':
        return (
          <Switch
            value={props.value}
            onValueChange={props.onValueChange}
            disabled={disabled}
            trackColor={{
              false: colors.surfaceElevated,
              true: colors.primaryLight,
            }}
            thumbColor={props.value ? colors.primary : colors.textSecondary}
            accessibilityLabel={label}
          />
        );

      case 'navigation':
        return (
          <View style={styles.rightContent}>
            {props.value && (
              <Text style={[styles.valueText, { color: colors.textSecondary }]} numberOfLines={1}>
                {props.value}
              </Text>
            )}
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textTertiary}
            />
          </View>
        );

      case 'value':
        return (
          <View style={styles.rightContent}>
            <Text style={[styles.valueText, { color: colors.textSecondary }]} numberOfLines={1}>
              {props.value}
            </Text>
            {props.onPress && (
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textTertiary}
              />
            )}
          </View>
        );

      case 'button':
        return null;

      case 'custom':
        return props.children;

      default:
        return null;
    }
  };

  const isInteractive =
    variant === 'navigation' ||
    variant === 'button' ||
    (variant === 'value' && props.onPress);

  const handlePress = () => {
    if (disabled || isLoading) return;

    if (variant === 'navigation' || variant === 'button') {
      props.onPress();
    } else if (variant === 'value' && props.onPress) {
      props.onPress();
    }
  };

  const rowContent = (
    <View style={[styles.row, { borderBottomColor: colors.divider }, isLast && styles.rowLast]}>
      {renderIcon()}
      {renderLabel()}
      {renderRightContent()}
    </View>
  );

  if (isInteractive) {
    return (
      <TouchableOpacity
        style={styles.touchable}
        activeOpacity={0.7}
        onPress={handlePress}
        disabled={disabled || isLoading}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: disabled || isLoading }}
      >
        {rowContent}
      </TouchableOpacity>
    );
  }

  return <View style={styles.touchable}>{rowContent}</View>;
}

const styles = StyleSheet.create({
  touchable: {
    minHeight: touchTargets.comfortable,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: touchTargets.comfortable + spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  labelContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    marginTop: 2,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '40%',
  },
  valueText: {
    fontSize: typography.fontSize.base,
    marginRight: spacing.xs,
  },
});
