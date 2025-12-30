/**
 * SearchBar Component
 *
 * A mobile-optimized search input with:
 * - Search icon for clear visual affordance
 * - Clear button when text is present
 * - Debounced onChange for performance
 * - Accessible touch targets (minimum 48pt)
 * - Theme-aware styling
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, borderRadius, touchTargets } from '../theme';
import { useTheme } from '../context';

interface SearchBarProps {
  /** Placeholder text shown when input is empty */
  placeholder?: string;
  /** Current search value */
  value: string;
  /** Called when search value changes (already debounced if using useSearch hook) */
  onChangeText: (text: string) => void;
  /** Debounce delay in milliseconds (default: 300) */
  debounceMs?: number;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Called when input is focused */
  onFocus?: () => void;
  /** Called when input is blurred */
  onBlur?: () => void;
}

export function SearchBar({
  placeholder = 'Search...',
  value,
  onChangeText,
  debounceMs = 300,
  autoFocus = false,
  onFocus,
  onBlur,
}: SearchBarProps) {
  const { colors } = useTheme();
  // Local state for immediate UI updates
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Sync external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const handleChangeText = useCallback(
    (text: string) => {
      // Update local state immediately for responsive UI
      setLocalValue(text);

      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Debounce the actual search callback
      debounceTimeoutRef.current = setTimeout(() => {
        onChangeText(text);
      }, debounceMs);
    },
    [onChangeText, debounceMs]
  );

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChangeText('');
    // Keep focus on input after clearing
    inputRef.current?.focus();
  }, [onChangeText]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);

  const handleSubmit = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  const showClearButton = localValue.length > 0;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderColor: colors.surface },
        isFocused && { borderColor: colors.primary, backgroundColor: colors.surfaceElevated },
      ]}
    >
      {/* Search icon */}
      <View style={styles.iconContainer}>
        <Ionicons
          name="search"
          size={20}
          color={isFocused ? colors.primary : colors.textSecondary}
        />
      </View>

      {/* Text input */}
      <TextInput
        ref={inputRef}
        style={[styles.input, { color: colors.text }]}
        value={localValue}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSubmitEditing={handleSubmit}
        accessibilityLabel={placeholder}
        accessibilityRole="search"
      />

      {/* Clear button */}
      {showClearButton && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClear}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Clear search"
          accessibilityRole="button"
        >
          <View style={styles.clearIconContainer}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    minHeight: touchTargets.comfortable,
    paddingHorizontal: spacing.md,
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    paddingVertical: spacing.md,
    minHeight: touchTargets.comfortable,
  },
  clearButton: {
    marginLeft: spacing.sm,
  },
  clearIconContainer: {
    padding: spacing.xs,
  },
});

export default SearchBar;
