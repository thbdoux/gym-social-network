import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import { WorkoutTemplateFormData } from '../WorkoutTemplateWizard';
import { Ionicons } from '@expo/vector-icons';
import ExerciseSelector from '../ExerciseSelector';
import ExerciseConfigurator from '../ExerciseConfigurator';
import ExerciseCard, { Exercise as CardExercise, ExerciseSet as CardExerciseSet } from '../ExerciseCard';
import { useRecentExercises, useRecentExerciseNames } from './../../../hooks/query/useLogQuery';

// Type mappings to ensure compatibility
type Exercise = CardExercise;
type ExerciseSet = CardExerciseSet;

type StepExercisesProps = {
  formData: WorkoutTemplateFormData;
  updateFormData: (data: Partial<WorkoutTemplateFormData>) => void;
  errors: Record<string, string>;
};

const StepExercises = ({ formData, updateFormData, errors }: StepExercisesProps) => {
  const { t } = useLanguage();
  const { workoutPalette, palette } = useTheme();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Modal states
  const [exerciseSelectorVisible, setExerciseSelectorVisible] = useState(false);
  const [exerciseConfiguratorVisible, setExerciseConfiguratorVisible] = useState(false);
  
  // Edit state
  const [editExerciseIndex, setEditExerciseIndex] = useState<number | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  
  // Superset pairing state
  const [pairingMode, setPairingMode] = useState<boolean>(false);
  const [pairingSourceIndex, setPairingSourceIndex] = useState<number | null>(null);
  
  // Recently used exercises for the selector component
  // const [recentExercises, setRecentExercises] = useState<string[]>([]);
  // const { data: recentExercises = [] } = useRecentExercises(30, 15);
  const { data: recentExercises = [], isLoading: isLoadingRecent } = useRecentExerciseNames(30, 15);
  // Add keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Handle adding a new exercise - open the exercise selector
  const handleAddExercise = () => {
    setEditExerciseIndex(null);
    setSelectedExercise(null);
    setExerciseSelectorVisible(true);
  };
  
  // Handle selecting an exercise from the ExerciseSelector
  const handleSelectExercise = (exercise: any) => {
    setSelectedExercise(exercise);
    setExerciseSelectorVisible(false);
    setExerciseConfiguratorVisible(true);
    
    // Add to recent exercises if it has an ID
    if (exercise.id && !exercise.id.startsWith('custom_')) {
      setRecentExercises(prev => {
        const filtered = prev.filter(id => id !== exercise.id);
        return [exercise.id, ...filtered].slice(0, 10);
      });
    }
  };
  
  // Handle saving exercise from configurator
  const handleSaveExercise = (configuredExercise: Exercise) => {
    const updatedExercises = [...formData.exercises];
    
    // Create the exercise object with proper order
    const exerciseToSave: Exercise = {
      ...configuredExercise,
      order: editExerciseIndex !== null ? updatedExercises[editExerciseIndex]?.order ?? editExerciseIndex : updatedExercises.length
    };
    
    if (editExerciseIndex !== null) {
      // Update existing exercise
      const previousExercise = updatedExercises[editExerciseIndex];
      const hadSuperset = previousExercise.is_superset && previousExercise.superset_with !== null;
      const oldSupersetWith = previousExercise.superset_with;
      
      updatedExercises[editExerciseIndex] = exerciseToSave;
      
      // Handle superset relationship changes
      if (hadSuperset && !configuredExercise.is_superset && oldSupersetWith !== null) {
        const pairedIndex = updatedExercises.findIndex(ex => ex.order === oldSupersetWith);
        if (pairedIndex !== -1) {
          updatedExercises[pairedIndex].is_superset = false;
          updatedExercises[pairedIndex].superset_with = null;
          updatedExercises[pairedIndex].superset_rest_time = undefined;
        }
      }
    } else {
      // Add new exercise
      updatedExercises.push(exerciseToSave);
    }
    
    updateFormData({ exercises: updatedExercises });
    setExerciseConfiguratorVisible(false);
    setEditExerciseIndex(null);
    setSelectedExercise(null);
  };
  
  // Handle editing an exercise
  const handleEditExercise = (index: number) => {
    const exercise = formData.exercises[index];
    setSelectedExercise(exercise);
    setEditExerciseIndex(index);
    setExerciseConfiguratorVisible(true);
  };
  
  // Handle removing an exercise
  const handleRemoveExercise = (index: number) => {
    Alert.alert(
      t('remove_exercise'),
      t('remove_exercise_confirmation'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('remove'), 
          style: 'destructive',
          onPress: () => {
            const updatedExercises = [...formData.exercises];
            const exerciseToRemove = updatedExercises[index];
            
            // If this is part of a superset, update the paired exercise
            if (exerciseToRemove.is_superset && exerciseToRemove.superset_with !== null) {
              const pairedIndex = updatedExercises.findIndex(
                ex => ex.order === exerciseToRemove.superset_with
              );
              
              if (pairedIndex !== -1) {
                updatedExercises[pairedIndex].is_superset = false;
                updatedExercises[pairedIndex].superset_with = null;
                updatedExercises[pairedIndex].superset_rest_time = undefined;
              }
            }
            
            // Remove the exercise
            updatedExercises.splice(index, 1);
            
            // Update order values for remaining exercises
            updatedExercises.forEach((exercise, idx) => {
              exercise.order = idx;
              
              // Update superset relationships
              if (exercise.superset_with !== null && exercise.superset_with !== undefined) {
                if (exercise.superset_with === exerciseToRemove.order) {
                  exercise.is_superset = false;
                  exercise.superset_with = null;
                  exercise.superset_rest_time = undefined;
                } else if (exercise.superset_with > exerciseToRemove.order) {
                  exercise.superset_with--;
                }
              }
            });
            
            updateFormData({ exercises: updatedExercises });
          }
        }
      ]
    );
  };
  
  // Handle moving exercise up/down
  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === formData.exercises.length - 1)
    ) {
      return;
    }
    
    const updatedExercises = [...formData.exercises];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    const exercise = updatedExercises[index];
    const targetExercise = updatedExercises[targetIndex];
    const exerciseOrder = exercise.order;
    const targetOrder = targetExercise.order;
    
    // Swap positions
    [updatedExercises[index], updatedExercises[targetIndex]] = 
    [updatedExercises[targetIndex], updatedExercises[index]];
    
    // Update order values
    updatedExercises[index].order = exerciseOrder;
    updatedExercises[targetIndex].order = targetOrder;
    
    // Update superset relationships
    for (const ex of updatedExercises) {
      if (ex.superset_with === exerciseOrder) {
        ex.superset_with = targetOrder;
      } else if (ex.superset_with === targetOrder) {
        ex.superset_with = exerciseOrder;
      }
    }
    
    updateFormData({ exercises: updatedExercises });
  };
  
  // Superset functions
  const handleStartPairing = (index: number) => {
    setPairingMode(true);
    setPairingSourceIndex(index);
  };

  const handleCancelPairing = () => {
    setPairingMode(false);
    setPairingSourceIndex(null);
  };

  const handlePairExercises = (targetIndex: number) => {
    if (pairingSourceIndex === null || pairingSourceIndex === targetIndex) {
      return;
    }

    const updatedExercises = [...formData.exercises];
    const sourceExercise = updatedExercises[pairingSourceIndex];
    const targetExercise = updatedExercises[targetIndex];

    // Set up the superset relationship
    sourceExercise.superset_with = targetExercise.order;
    sourceExercise.is_superset = true;
    targetExercise.superset_with = sourceExercise.order;
    targetExercise.is_superset = true;

    // Add default superset rest time
    sourceExercise.superset_rest_time = 90;
    targetExercise.superset_rest_time = 90;

    updateFormData({ exercises: updatedExercises });
    setPairingMode(false);
    setPairingSourceIndex(null);
  };

  const handleRemoveSuperset = (index: number) => {
    const updatedExercises = [...formData.exercises];
    const exercise = updatedExercises[index];
    
    if (exercise.superset_with !== null && exercise.superset_with !== undefined) {
      // Find the paired exercise
      const pairedIndex = updatedExercises.findIndex(ex => ex.order === exercise.superset_with);
      
      if (pairedIndex !== -1) {
        updatedExercises[pairedIndex].superset_with = null;
        updatedExercises[pairedIndex].is_superset = false;
        updatedExercises[pairedIndex].superset_rest_time = undefined;
      }
      
      exercise.superset_with = null;
      exercise.is_superset = false;
      exercise.superset_rest_time = undefined;
      
      updateFormData({ exercises: updatedExercises });
    }
  };

  // Function to get the paired exercise name for display
  const getPairedExerciseName = (exercise: Exercise): string | null => {
    if (!exercise.superset_with && exercise.superset_with !== 0) return null;
    
    const pairedExercise = formData.exercises.find(ex => ex.order === exercise.superset_with);
    return pairedExercise ? pairedExercise.name : null;
  };

  // Handle exercise card updates
  const handleUpdateSet = (exerciseIndex: number, setIndex: number, field: keyof ExerciseSet, value: number | string | null) => {
    const updatedExercises = [...formData.exercises];
    const exercise = updatedExercises[exerciseIndex];
    const updatedSets = [...exercise.sets];
    
    if (field === 'weight_unit') {
      updatedSets[setIndex] = {
        ...updatedSets[setIndex],
        [field]: value as 'kg' | 'lbs'
      };
    } else {
      updatedSets[setIndex] = {
        ...updatedSets[setIndex],
        [field]: value
      };
    }
    
    exercise.sets = updatedSets;
    updateFormData({ exercises: updatedExercises });
  };

  const handleAddSet = (exerciseIndex: number) => {
    const updatedExercises = [...formData.exercises];
    const exercise = updatedExercises[exerciseIndex];
    const lastSet = exercise.sets[exercise.sets.length - 1];
    
    // Copy the last set structure based on effort type
    let newSet: ExerciseSet;
    const effortType = exercise.effort_type || 'reps';
    
    if (lastSet) {
      newSet = { ...lastSet };
    } else {
      // Default set based on effort type
      switch (effortType) {
        case 'time':
          newSet = { duration: 30, weight: null, weight_unit: 'kg', rest_time: 60 };
          break;
        case 'distance':
          newSet = { distance: 100, duration: null, rest_time: 120 };
          break;
        default:
          newSet = { reps: 10, weight: 20, weight_unit: 'kg', rest_time: 60 };
      }
    }
    
    exercise.sets.push(newSet);
    updateFormData({ exercises: updatedExercises });
  };

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    const updatedExercises = [...formData.exercises];
    const exercise = updatedExercises[exerciseIndex];
    
    if (exercise.sets.length > 1) {
      exercise.sets.splice(setIndex, 1);
      updateFormData({ exercises: updatedExercises });
    }
  };

  const handleUpdateNotes = (exerciseIndex: number, notes: string) => {
    const updatedExercises = [...formData.exercises];
    updatedExercises[exerciseIndex].notes = notes;
    updateFormData({ exercises: updatedExercises });
  };

  const handleUpdateSupersetRestTime = (exerciseIndex: number, time: number) => {
    const updatedExercises = [...formData.exercises];
    const exercise = updatedExercises[exerciseIndex];
    
    if (exercise.is_superset && exercise.superset_with !== null && exercise.superset_with !== undefined) {
      exercise.superset_rest_time = time;
      
      // Update the paired exercise too
      const pairedIndex = updatedExercises.findIndex(ex => ex.order === exercise.superset_with);
      if (pairedIndex !== -1) {
        updatedExercises[pairedIndex].superset_rest_time = time;
      }
      
      updateFormData({ exercises: updatedExercises });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with exercise count */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: workoutPalette.text }]}>
          {t('add_exercises')}
        </Text>
        <View style={[
          styles.countBadge, 
          { backgroundColor: `${workoutPalette.highlight}20` }
        ]}>
          <Text style={[styles.countText, { color: workoutPalette.highlight }]}>
            {formData.exercises.length} {formData.exercises.length === 1 ? t('exercise') : t('exercises')}
          </Text>
        </View>
      </View>
      
      {/* Error message if any */}
      {errors.exercises && (
        <Text style={[styles.errorText, { color: palette.error }]}>
          {errors.exercises}
        </Text>
      )}
      
      {/* Pairing mode indicator */}
      {pairingMode && (
        <View style={[
          styles.pairingModeIndicator,
          { backgroundColor: `${workoutPalette.highlight}10` }
        ]}>
          <Ionicons name="link" size={16} color={workoutPalette.highlight} />
          <Text style={[styles.pairingModeText, { color: workoutPalette.highlight }]}>
            {t('select_exercise_to_pair')}
          </Text>
          <TouchableOpacity onPress={handleCancelPairing} style={styles.cancelPairingButton}>
            <Ionicons name="close-circle" size={16} color={palette.error} />
            <Text style={[styles.cancelPairingText, { color: palette.error }]}>
              {t('cancel')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Exercise list */}
      <ScrollView 
        style={styles.exercisesList}
        contentContainerStyle={styles.exercisesListContent}
        showsVerticalScrollIndicator={false}
      >
        {formData.exercises.length > 0 ? (
          formData.exercises.map((exercise, index) => (
            <ExerciseCard
              key={index}
              exercise={exercise}
              pairedExerciseName={getPairedExerciseName(exercise)}
              exerciseIndex={index}
              editMode={!pairingMode}
              showAllSets={false}
              isFirst={index === 0}
              isLast={index === formData.exercises.length - 1}
              pairingMode={pairingMode && pairingSourceIndex !== index}
              onEdit={() => handleEditExercise(index)}
              onDelete={() => handleRemoveExercise(index)}
              onMakeSuperset={() => handleStartPairing(index)}
              onRemoveSuperset={() => handleRemoveSuperset(index)}
              onMoveUp={() => handleMoveExercise(index, 'up')}
              onMoveDown={() => handleMoveExercise(index, 'down')}
              onAddSet={() => handleAddSet(index)}
              onRemoveSet={(setIndex) => handleRemoveSet(index, setIndex)}
              onUpdateSet={(setIndex, field, value) => handleUpdateSet(index, setIndex, field, value)}
              onUpdateNotes={(notes) => handleUpdateNotes(index, notes)}
              onUpdateSupersetRestTime={(time) => handleUpdateSupersetRestTime(index, time)}
              onSelect={() => handlePairExercises(index)}
            />
          ))
        ) : (
          <View style={[
            styles.emptyState,
            { 
              backgroundColor: palette.card_background,
              borderColor: palette.border
            }
          ]}>
            <Ionicons name="barbell-outline" size={48} color={palette.text_tertiary} />
            <Text style={[styles.emptyStateText, { color: palette.text }]}>
              {t('no_exercises_yet')}
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: palette.text_tertiary }]}>
              {t('tap_to_add_exercises')}
            </Text>
          </View>
        )}
      </ScrollView>
      
      {/* Add exercise button */}
      <TouchableOpacity
        style={[styles.addButton, { backgroundColor: workoutPalette.highlight }]}
        onPress={handleAddExercise}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.addButtonText}>{t('add_exercise')}</Text>
      </TouchableOpacity>
      
      {/* ExerciseSelector Modal */}
      <ExerciseSelector
        visible={exerciseSelectorVisible}
        onClose={() => setExerciseSelectorVisible(false)}
        onSelectExercise={handleSelectExercise}
        recentExercises={recentExercises}
      />
      
      {/* ExerciseConfigurator Modal */}
      <ExerciseConfigurator
        visible={exerciseConfiguratorVisible}
        onClose={() => {
          setExerciseConfiguratorVisible(false);
          setEditExerciseIndex(null);
          setSelectedExercise(null);
        }}
        onSave={handleSaveExercise}
        exerciseName={selectedExercise?.name || ''}
        initialEffortType={selectedExercise?.effort_type || 'reps'}
        initialSets={editExerciseIndex !== null ? formData.exercises[editExerciseIndex]?.sets : undefined}
        initialNotes={editExerciseIndex !== null ? formData.exercises[editExerciseIndex]?.notes : ''}
        initialEquipment={selectedExercise?.equipment || ''}
        // initialEquipmentKey={selectedExercise?.equipmentKey || ''}
        isSuperset={editExerciseIndex !== null ? formData.exercises[editExerciseIndex]?.is_superset : false}
        supersetWith={editExerciseIndex !== null ? formData.exercises[editExerciseIndex]?.superset_with : null}
        supersetRestTime={editExerciseIndex !== null ? formData.exercises[editExerciseIndex]?.superset_rest_time || 90 : 90}
        supersetPairedExerciseName={editExerciseIndex !== null ? getPairedExerciseName(formData.exercises[editExerciseIndex]) : null}
        isEdit={editExerciseIndex !== null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
  },
  pairingModeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  pairingModeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  cancelPairingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  cancelPairingText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  exercisesList: {
    flex: 1,
  },
  exercisesListContent: {
    paddingBottom: 80, // Add padding for button
  },
  emptyState: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default StepExercises;