/**
 * FilterChip Component
 *
 * A pill-shaped toggle button for filtering content.
 * Used in horizontal scroll containers for category selection.
 *
 * Design features:
 * - Clear selected/unselected visual states
 * - Minimum touch target size (48pt)
 * - Color-coded for quick scanning
 * - Theme-aware styling
 */

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { spacing, typography, borderRadius, touchTargets } from '../theme';
import { useTheme } from '../context';

interface FilterChipProps {
  /** Display label for the chip */
  label: string;
  /** Whether this chip is currently selected */
  selected: boolean;
  /** Called when chip is pressed */
  onPress: () => void;
  /** Optional icon name from Ionicons */
  icon?: string;
  /** Test ID for testing */
  testID?: string;
}

export function FilterChip({
  label,
  selected,
  onPress,
  testID,
}: FilterChipProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.border },
        selected && { backgroundColor: colors.primary, borderColor: colors.primary },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`Filter by ${label}`}
      testID={testID}
    >
      <Text
        style={[
          styles.label,
          { color: colors.textSecondary },
          selected && { color: colors.text, fontWeight: typography.fontWeight.semibold },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * FilterChipGroup Component
 *
 * A horizontal scrollable group of filter chips.
 * Handles the "All" chip automatically.
 */
interface FilterChipGroupProps {
  /** List of filter options */
  options: Array<{ id: string; label: string }>;
  /** Currently selected filter ID (null for "All") */
  selectedId: string | null;
  /** Called when selection changes */
  onSelect: (id: string | null) => void;
  /** Whether to show "All" chip (default: true) */
  showAllOption?: boolean;
}

export function FilterChipGroup({
  options,
  selectedId,
  onSelect,
  showAllOption = true,
}: FilterChipGroupProps) {
  return (
    <View style={styles.groupContainer}>
      {showAllOption && (
        <FilterChip
          label="All"
          selected={selectedId === null}
          onPress={() => onSelect(null)}
        />
      )}
      {options.map((option) => (
        <FilterChip
          key={option.id}
          label={option.label}
          selected={selectedId === option.id}
          onPress={() => onSelect(option.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    minHeight: touchTargets.minimum,
    justifyContent: 'center',
    borderWidth: 1,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  groupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default FilterChip;
