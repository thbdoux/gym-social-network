// components/workouts/workout-steps/StepExercises.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import { useRecentExerciseNames } from '../../../hooks/query/useLogQuery';
import { formatRestTime } from '../../../app/(app)/workout/formatters';

// Import the modals
import ExerciseSelector from '../ExerciseSelector';
import ExerciseConfigurator from '../ExerciseConfigurator';
import { ExerciseCard } from '../../../app/(app)/workout-log/components/ExerciseCard';
// Types - should match the ones from WorkoutLogWizard
export type ExerciseSet = {
  id?: number;
  reps?: number | null;
  weight?: number | null;
  weight_unit?: 'kg' | 'lbs';
  weight_unit_display?: string;
  weight_display?: string;
  duration?: number | null;
  distance?: number | null;
  rest_time: number;
  order?: number;
};

export type Exercise = {
  id?: number;
  name: string;
  equipment?: string;
  notes?: string;
  order?: number;
  effort_type?: 'reps' | 'time' | 'distance';
  effort_type_display?: string;
  superset_with?: number | null;
  is_superset?: boolean;
  superset_rest_time?: number;
  sets: ExerciseSet[];
};

type StepExercisesProps = {
  formData: {
    exercises: Exercise[];
    [key: string]: any;
  };
  updateFormData: (updates: any) => void;
  errors: Record<string, string>;
};

// Helper function to get default set based on effort type
const getDefaultSet = (effortType: 'reps' | 'time' | 'distance' = 'reps'): ExerciseSet => {
  switch (effortType) {
    case 'time':
      return {
        duration: 30,
        weight: null,
        weight_unit: 'kg',
        rest_time: 60
      };
    case 'distance':
      return {
        distance: 100,
        duration: null,
        rest_time: 120
      };
    case 'reps':
    default:
      return {
        reps: 10,
        weight: 20,
        weight_unit: 'kg',
        rest_time: 60
      };
  }
};

const StepExercises: React.FC<StepExercisesProps> = ({ 
  formData, 
  updateFormData, 
  errors 
}) => {
  const { t } = useLanguage();
  const { workoutPalette, palette } = useTheme();
  
  // Modal states
  const [exerciseSelectorVisible, setExerciseSelectorVisible] = useState(false);
  const [exerciseConfiguratorVisible, setExerciseConfiguratorVisible] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [editingIndex, setEditingIndex] = useState(-1);

  // Get recent exercises for the selector
  const { data: recentExerciseNames } = useRecentExerciseNames(30, 15);

  // Create colors object for the ExerciseCard component
  const colors = {
    card: palette.card_background,
    text: {
      primary: palette.text,
      secondary: palette.text_secondary,
      tertiary: palette.text_tertiary,
    },
    border: palette.border,
    success: '#10B981',
    error: '#EF4444',
    card_background: palette.card_background,
  };

  // Handle adding a new exercise from selector
  const handleSelectExercise = useCallback((selectedExercise: any) => {
    const newExercise: Exercise = {
      id: Date.now(), // Temporary ID for new exercises
      name: selectedExercise.name,
      equipment: selectedExercise.equipment || selectedExercise.equipmentKey,
      effort_type: selectedExercise.effort_type || 'reps',
      notes: selectedExercise.notes || '',
      order: formData.exercises.length, // Set order to current length
      sets: [getDefaultSet(selectedExercise.effort_type || 'reps')],
      superset_with: null,
      is_superset: false,
      superset_rest_time: 60
    };

    setEditingExercise(newExercise);
    setEditingIndex(-1); // -1 indicates new exercise
    setExerciseConfiguratorVisible(true);
  }, [formData.exercises.length]);

  // Handle editing an existing exercise
  const handleEditExercise = useCallback((exercise: Exercise, index: number) => {
    setEditingExercise({ ...exercise });
    setEditingIndex(index);
    setExerciseConfiguratorVisible(true);
  }, []);

  // Handle saving exercise from configurator
  const handleSaveExercise = useCallback((configuredExercise: Exercise) => {
    const exercises = [...formData.exercises];
    
    if (editingIndex === -1) {
      // Adding new exercise
      configuredExercise.order = exercises.length;
      exercises.push(configuredExercise);
    } else {
      // Updating existing exercise - preserve order
      configuredExercise.order = exercises[editingIndex].order;
      exercises[editingIndex] = configuredExercise;
    }

    // Ensure all exercises have correct order property
    const reorderedExercises = exercises.map((ex, i) => ({ ...ex, order: i }));
    updateFormData({ exercises: reorderedExercises });
    
    setExerciseConfiguratorVisible(false);
    setEditingExercise(null);
    setEditingIndex(-1);
  }, [formData.exercises, editingIndex, updateFormData]);

  // Handle deleting an exercise
  const handleDeleteExercise = useCallback((index: number) => {
    const exercises = [...formData.exercises];
    const exerciseToDelete = exercises[index];
    
    // If deleting a superset exercise, break the superset first
    if (exerciseToDelete.is_superset && exerciseToDelete.superset_with !== null) {
      const pairedExerciseIndex = exercises.findIndex(
        ex => ex.order === exerciseToDelete.superset_with
      );
      
      if (pairedExerciseIndex !== -1) {
        exercises[pairedExerciseIndex] = {
          ...exercises[pairedExerciseIndex],
          is_superset: false,
          superset_with: null,
          superset_rest_time: undefined
        };
      }
    }
    
    // Remove the exercise
    const filteredExercises = exercises.filter((_, i) => i !== index);
    
    // Update order for remaining exercises and fix superset references
    const reorderedExercises = filteredExercises.map((ex, i) => {
      let updatedExercise = { ...ex, order: i };
      
      // If this exercise was in a superset with the deleted exercise, break the superset
      if (updatedExercise.is_superset && updatedExercise.superset_with === exerciseToDelete.order) {
        updatedExercise = {
          ...updatedExercise,
          is_superset: false,
          superset_with: null,
          superset_rest_time: undefined
        };
      }
      // Update superset references for exercises that were after the deleted one
      else if (updatedExercise.is_superset && updatedExercise.superset_with !== null && updatedExercise.superset_with > index) {
        updatedExercise = {
          ...updatedExercise,
          superset_with: updatedExercise.superset_with - 1
        };
      }
      
      return updatedExercise;
    });
    
    updateFormData({ exercises: reorderedExercises });
  }, [formData.exercises, updateFormData]);

  // Handle creating superset
  const handleCreateSuperset = useCallback((sourceIndex: number) => {
    const exercises = formData.exercises || [];
    
    if (exercises.length < 2) {
      Alert.alert(t('error'), t('need_two_exercises_for_superset'));
      return;
    }
    
    // Show selection modal for pairing
    const availableExercises = exercises
      .map((ex, idx) => ({ ...ex, originalIndex: idx }))
      .filter((_, idx) => idx !== sourceIndex && !_.is_superset);
      
    if (availableExercises.length === 0) {
      Alert.alert(t('error'), t('no_available_exercises_for_superset'));
      return;
    }
    
    Alert.alert(
      t('create_superset'),
      t('select_exercise_to_pair'),
      [
        { text: t('cancel'), style: 'cancel' },
        ...availableExercises.map((ex) => ({
          text: ex.name,
          onPress: () => createSupersetPair(sourceIndex, ex.originalIndex)
        }))
      ]
    );
  }, [formData.exercises, t]);

  // Create superset pair
  const createSupersetPair = useCallback((sourceIndex: number, targetIndex: number) => {
    try {
      const updatedExercises = [...formData.exercises];
      
      // Create superset relationship
      updatedExercises[sourceIndex] = {
        ...updatedExercises[sourceIndex],
        is_superset: true,
        superset_with: updatedExercises[targetIndex].order,
        superset_rest_time: 90
      };
      
      updatedExercises[targetIndex] = {
        ...updatedExercises[targetIndex],
        is_superset: true,
        superset_with: updatedExercises[sourceIndex].order,
        superset_rest_time: 90
      };
      
      updateFormData({ exercises: updatedExercises });
      
      Alert.alert(
        t('success'), 
        t('superset_created_successfully')
      );
    } catch (error) {
      console.error('Failed to create superset:', error);
      Alert.alert(t('error'), t('failed_to_create_superset'));
    }
  }, [formData.exercises, updateFormData, t]);

  // Handle breaking superset
  const handleBreakSuperset = useCallback((index: number) => {
    try {
      const updatedExercises = [...formData.exercises];
      const currentExercise = updatedExercises[index];
      
      if (currentExercise.is_superset && currentExercise.superset_with !== null) {
        // Find the paired exercise
        const pairedExerciseIndex = updatedExercises.findIndex(
          ex => ex.order === currentExercise.superset_with
        );
        
        // Remove superset relationship from current exercise
        updatedExercises[index] = {
          ...currentExercise,
          is_superset: false,
          superset_with: null,
          superset_rest_time: undefined
        };
        
        // Remove superset relationship from paired exercise if found
        if (pairedExerciseIndex !== -1) {
          updatedExercises[pairedExerciseIndex] = {
            ...updatedExercises[pairedExerciseIndex],
            is_superset: false,
            superset_with: null,
            superset_rest_time: undefined
          };
        }
        
        updateFormData({ exercises: updatedExercises });
        
        Alert.alert(
          t('success'),
          t('superset_broken_successfully')
        );
      }
    } catch (error) {
      console.error('Failed to break superset:', error);
      Alert.alert(t('error'), t('failed_to_break_superset'));
    }
  }, [formData.exercises, updateFormData, t]);

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: workoutPalette.text }]}>
            {t('exercises')}
          </Text>
          <Text style={[styles.subtitle, { color: palette.text_tertiary }]}>
            {t('add_and_configure_exercises')}
          </Text>
        </View>

        {/* Error Display */}
        {errors.exercises && (
          <View style={[styles.errorContainer, { backgroundColor: '#EF444420' }]}>
            <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
            <Text style={[styles.errorText, { color: '#EF4444' }]}>
              {errors.exercises}
            </Text>
          </View>
        )}

        {/* Add Exercise Button */}
        <TouchableOpacity
          style={[
            styles.addExerciseButton,
            { 
              backgroundColor: `${workoutPalette.highlight}15`,
              borderColor: workoutPalette.highlight,
            }
          ]}
          onPress={() => setExerciseSelectorVisible(true)}
        >
          <Ionicons name="add-circle" size={24} color={workoutPalette.highlight} />
          <Text style={[styles.addExerciseText, { color: workoutPalette.highlight }]}>
            {t('add_exercise')}
          </Text>
        </TouchableOpacity>

        {/* Exercises List */}
        {formData.exercises.length > 0 ? (
          <View style={styles.exercisesList}>
            {formData.exercises.map((exercise, index) => (
              <ExerciseCard
                key={`exercise-${exercise.id || index}`}
                exercise={exercise}
                index={index}
                exercises={formData.exercises}
                colors={colors}
                canEdit={true}
                onEdit={() => handleEditExercise(exercise, index)}
                onDelete={() => handleDeleteExercise(index)}
                onCreateSuperset={() => handleCreateSuperset(index)}
                onBreakSuperset={() => handleBreakSuperset(index)}
                t={t}
              />
            ))}
          </View>
        ) : (
          <View style={[styles.emptyState, { backgroundColor: palette.card_background }]}>
            <Ionicons name="barbell-outline" size={64} color={palette.text_tertiary} />
            <Text style={[styles.emptyStateTitle, { color: palette.text }]}>
              {t('no_exercises_added')}
            </Text>
            <Text style={[styles.emptyStateSubtitle, { color: palette.text_tertiary }]}>
              {t('tap_add_exercise_to_get_started')}
            </Text>
          </View>
        )}

        {/* Exercise Count Summary */}
        {formData.exercises.length > 0 && (
          <View style={[styles.summaryContainer, { backgroundColor: palette.input_background }]}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: palette.text_tertiary }]}>
                {t('total_exercises')}:
              </Text>
              <Text style={[styles.summaryValue, { color: workoutPalette.text }]}>
                {formData.exercises.length}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: palette.text_tertiary }]}>
                {t('total_sets')}:
              </Text>
              <Text style={[styles.summaryValue, { color: workoutPalette.text }]}>
                {formData.exercises.reduce((total, ex) => total + ex.sets.length, 0)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Exercise Selector Modal */}
      <ExerciseSelector
        visible={exerciseSelectorVisible}
        onClose={() => setExerciseSelectorVisible(false)}
        onSelectExercise={handleSelectExercise}
        recentExercises={recentExerciseNames || []}
      />

      {/* Exercise Configurator Modal */}
      {editingExercise && (
        <ExerciseConfigurator
          visible={exerciseConfiguratorVisible}
          onClose={() => {
            setExerciseConfiguratorVisible(false);
            setEditingExercise(null);
            setEditingIndex(-1);
          }}
          onSave={handleSaveExercise}
          exercise={editingExercise}
          isEdit={editingIndex !== -1}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  addExerciseText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  exercisesList: {
    marginBottom: 20,
  },
  
  // Empty state and summary styles
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderRadius: 12,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  summaryContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default StepExercises;