/**
 * Add Exercise Modal
 *
 * Modal for creating custom exercises.
 * Allows users to add their own exercises that aren't in the preset list.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, typography, borderRadius, touchTargets } from '../theme';
import { useTheme } from '../context';
import { FilterChip } from './FilterChip';

interface MuscleGroupOption {
  id: string;
  name: string;
}

interface AddExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (name: string, muscleGroupId: string) => Promise<boolean>;
  muscleGroups: MuscleGroupOption[];
  initialMuscleGroupId?: string | null;
}

export function AddExerciseModal({
  visible,
  onClose,
  onSubmit,
  muscleGroups,
  initialMuscleGroupId,
}: AddExerciseModalProps) {
  const { colors } = useTheme();
  const [exerciseName, setExerciseName] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set initial muscle group when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedMuscleGroup(initialMuscleGroupId || null);
      setExerciseName('');
    }
  }, [visible, initialMuscleGroupId]);

  const handleSubmit = useCallback(async () => {
    const trimmedName = exerciseName.trim();

    if (!trimmedName) {
      Alert.alert('Missing Name', 'Please enter an exercise name.');
      return;
    }

    if (!selectedMuscleGroup) {
      Alert.alert('Missing Muscle Group', 'Please select a muscle group.');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await onSubmit(trimmedName, selectedMuscleGroup);
      if (success) {
        setExerciseName('');
        setSelectedMuscleGroup(null);
        onClose();
      }
    } catch (error) {
      console.error('Error creating exercise:', error);
      Alert.alert('Error', 'Failed to create exercise. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [exerciseName, selectedMuscleGroup, onSubmit, onClose]);

  const handleClose = useCallback(() => {
    setExerciseName('');
    setSelectedMuscleGroup(null);
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.text }]}>Add Exercise</Text>
            <View style={styles.closeButton} />
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Exercise Name Input */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>Exercise Name</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="e.g., Incline Dumbbell Press"
                placeholderTextColor={colors.textTertiary}
                value={exerciseName}
                onChangeText={setExerciseName}
                autoFocus
                maxLength={100}
                returnKeyType="done"
              />
            </View>

            {/* Muscle Group Selection */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: colors.text }]}>Muscle Group</Text>
              <View style={styles.muscleGroupGrid}>
                {muscleGroups.map((mg) => (
                  <FilterChip
                    key={mg.id}
                    label={mg.name}
                    selected={selectedMuscleGroup === mg.id}
                    onPress={() => setSelectedMuscleGroup(mg.id)}
                  />
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Submit Button */}
          <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: colors.primary },
                (!exerciseName.trim() || !selectedMuscleGroup || isSubmitting) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!exerciseName.trim() || !selectedMuscleGroup || isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Add exercise"
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Text style={[styles.submitButtonText, { color: colors.text }]}>Add Exercise</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    minHeight: touchTargets.comfortable,
  },
  muscleGroupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
  },
  submitButton: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: touchTargets.comfortable,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});
