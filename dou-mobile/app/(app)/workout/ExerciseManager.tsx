// components/workouts/ExerciseManager.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../../context/LanguageContext';

// Import components
import ExerciseCard from '../../../components/workouts/ExerciseCard';
import ExerciseSelector from '../../../components/workouts/ExerciseSelector';
import ExerciseConfigurator from '../../../components/workouts/ExerciseConfigurator';

// Import hooks
import {
  useUpdateTemplateExercise,
  useAddExerciseToTemplate,
  useDeleteTemplateExercise
} from '../../../hooks/query/useWorkoutQuery';

// Utility functions
import { SupersetManager } from '../../../components/workouts/utils/SupersetManager';

// Default set template for new exercises
const DEFAULT_SET = {
  reps: 10,
  weight: 0,
  rest_time: 60 // 60 seconds
};

type ExerciseManagerProps = {
  visible: boolean;
  workoutId: number;
  exercises: any[];
  onClose: () => void;
  colors: any;
};

const ExerciseManager = ({
  visible,
  workoutId,
  exercises,
  onClose,
  colors
}: ExerciseManagerProps) => {
  const { t } = useLanguage();
  
  // Exercise state
  const [localExercises, setLocalExercises] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // UI state
  const [exerciseSelectorVisible, setExerciseSelectorVisible] = useState(false);
  const [exerciseConfiguratorVisible, setExerciseConfiguratorVisible] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(null);
  const [pairingMode, setPairingMode] = useState(false);
  const [pairingSourceIndex, setPairingSourceIndex] = useState(-1);
  
  // API hooks
  const { mutateAsync: updateExercise, isLoading: isUpdating } = useUpdateTemplateExercise();
  const { mutateAsync: addExercise, isLoading: isAdding } = useAddExerciseToTemplate();
  const { mutateAsync: deleteExercise, isLoading: isDeleting } = useDeleteTemplateExercise();
  
  // Compute overall loading state
  const isLoading = isUpdating || isAdding || isDeleting || isSaving;
  
  // Initialize local exercises from props
  useEffect(() => {
    if (visible && exercises) {
      // Create a deep copy to avoid modifying the original
      setLocalExercises(JSON.parse(JSON.stringify(exercises)));
    }
  }, [visible, exercises]);
  
  // Handle saving changes
  const handleSaveChanges = async () => {
    setPairingMode(false); // Exit pairing mode if active
    setIsSaving(true);
    
    try {
      // Save each exercise to the backend
      for (const exercise of localExercises) {
        if (exercises.some(e => e.id === exercise.id)) {
          // Update existing exercise
          await updateExercise({
            templateId: workoutId,
            exerciseId: exercise.id,
            exercise
          });
        } else {
          // Add new exercise
          await addExercise({
            templateId: workoutId,
            exercise
          });
        }
      }
      
      // Check for exercises that were deleted in the local state
      for (const originalExercise of exercises) {
        if (!localExercises.some(e => e.id === originalExercise.id)) {
          // This exercise was deleted, so remove it from the backend
          await deleteExercise({
            templateId: workoutId,
            exerciseId: originalExercise.id
          });
        }
      }
      
      // Reset state and close modal
      setHasUnsavedChanges(false);
      onClose();
    } catch (error) {
      console.error('Failed to save exercises:', error);
      Alert.alert(t('error'), t('failed_to_save_changes'));
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle canceling and discarding changes
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        t('unsaved_changes'),
        t('discard_changes_confirmation'),
        [
          {
            text: t('discard'),
            style: 'destructive',
            onPress: () => {
              setPairingMode(false);
              onClose();
            }
          },
          {
            text: t('continue_editing'),
            style: 'cancel'
          }
        ]
      );
    } else {
      onClose();
    }
  };
  
  // Handle adding a new exercise
  const handleAddExercise = () => {
    setExerciseSelectorVisible(true);
  };
  
  // Handle selecting an exercise from the selector
  const handleSelectExercise = (exerciseName) => {
    // Create a new exercise with the selected name
    const newExerciseId = Date.now(); // Simple ID generation
    const newExercise = {
      id: newExerciseId,
      name: exerciseName,
      sets: [{ ...DEFAULT_SET }],
      order: localExercises.length
    };
    
    // Add to local exercises
    const updatedExercises = [...localExercises, newExercise];
    setLocalExercises(updatedExercises);
    setHasUnsavedChanges(true);
    setExerciseSelectorVisible(false);
    
    // Directly open the configurator for this new exercise
    setCurrentExercise(newExercise);
    setExerciseConfiguratorVisible(true);
  };
  
  // Handle editing an exercise
  const handleEditExercise = (index) => {
    const exercise = localExercises[index];
    setCurrentExercise({...exercise});
    setExerciseConfiguratorVisible(true);
  };
  
  // Handle saving an edited exercise
  const handleSaveExercise = (exercise) => {
    if (currentExercise?.id) {
      // Update existing exercise in local state
      const exerciseIndex = localExercises.findIndex(e => e.id === currentExercise.id);
      if (exerciseIndex === -1) {
        setExerciseConfiguratorVisible(false);
        setCurrentExercise(null);
        return;
      }
      
      // Create a deep copy of the exercises array
      const updatedExercises = JSON.parse(JSON.stringify(localExercises));
      
      // Update the exercise
      updatedExercises[exerciseIndex] = {
        ...exercise,
        id: currentExercise.id,
        order: currentExercise.order
      };
      
      // Update local state
      setLocalExercises(updatedExercises);
      setHasUnsavedChanges(true);
    } else {
      // Add new exercise to local state
      const newExerciseId = Date.now(); // Simple ID generation
      const newExercise = {
        ...exercise,
        id: newExerciseId,
        order: localExercises.length
      };
      
      setLocalExercises([...localExercises, newExercise]);
      setHasUnsavedChanges(true);
    }
    
    setExerciseConfiguratorVisible(false);
    setCurrentExercise(null);
  };
  
  // Handle deleting an exercise
  const handleDeleteExercise = (exerciseIndex) => {
    Alert.alert(
      t('delete_exercise'),
      t('delete_exercise_confirmation'),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: () => {
            // Create a deep copy
            const updatedExercises = JSON.parse(JSON.stringify(localExercises));
            
            // Remove exercise
            updatedExercises.splice(exerciseIndex, 1);
            
            // Update order for remaining exercises
            updatedExercises.forEach((exercise, index) => {
              exercise.order = index;
            });
            
            // Update state
            setLocalExercises(updatedExercises);
            setHasUnsavedChanges(true);
          }
        }
      ]
    );
  };
  
  // Handle moving exercise up in the order
  const handleMoveExerciseUp = (exerciseIndex) => {
    if (exerciseIndex <= 0) return;
    
    // Create a deep copy
    const updatedExercises = JSON.parse(JSON.stringify(localExercises));
    
    // Swap exercises
    const temp = updatedExercises[exerciseIndex];
    updatedExercises[exerciseIndex] = updatedExercises[exerciseIndex - 1];
    updatedExercises[exerciseIndex - 1] = temp;
    
    // Update orders
    updatedExercises[exerciseIndex].order = exerciseIndex;
    updatedExercises[exerciseIndex - 1].order = exerciseIndex - 1;
    
    // Update state
    setLocalExercises(updatedExercises);
    setHasUnsavedChanges(true);
  };
  
  // Handle moving exercise down in the order
  const handleMoveExerciseDown = (exerciseIndex) => {
    if (exerciseIndex >= localExercises.length - 1) return;
    
    // Create a deep copy
    const updatedExercises = JSON.parse(JSON.stringify(localExercises));
    
    // Swap exercises
    const temp = updatedExercises[exerciseIndex];
    updatedExercises[exerciseIndex] = updatedExercises[exerciseIndex + 1];
    updatedExercises[exerciseIndex + 1] = temp;
    
    // Update orders
    updatedExercises[exerciseIndex].order = exerciseIndex;
    updatedExercises[exerciseIndex + 1].order = exerciseIndex + 1;
    
    // Update state
    setLocalExercises(updatedExercises);
    setHasUnsavedChanges(true);
  };
  
  // Superset creation functions
  const handleMakeSuperset = (index) => {
    setPairingMode(true);
    setPairingSourceIndex(index);
  };
  
  const handleCancelPairing = () => {
    setPairingMode(false);
    setPairingSourceIndex(-1);
  };
  
  const handleSelectPair = (targetIndex) => {
    if (pairingSourceIndex === targetIndex) {
      Alert.alert(t('error'), t('cannot_pair_with_itself'));
      return;
    }
    
    // Create the superset relationship
    const updatedExercises = SupersetManager.createSuperset(
      localExercises,
      pairingSourceIndex,
      targetIndex,
      90 // Default rest time (90 seconds)
    );
    
    // Update state
    setLocalExercises(updatedExercises);
    setHasUnsavedChanges(true);
    setPairingMode(false);
    setPairingSourceIndex(-1);
  };
  
  const handleRemoveSuperset = (exerciseIndex) => {
    // Create a deep copy
    const updatedExercises = SupersetManager.removeSuperset(
      localExercises,
      exerciseIndex
    );
    
    // Update state
    setLocalExercises(updatedExercises);
    setHasUnsavedChanges(true);
  };
  
  // Handle updating exercise sets
  const handleAddSet = (exercise) => {
    const exerciseIndex = localExercises.findIndex(e => e.id === exercise.id);
    if (exerciseIndex === -1) return;
    
    // Create a deep copy of the exercises array
    const updatedExercises = JSON.parse(JSON.stringify(localExercises));
    
    // Get last set for reference or create default
    const lastSet = exercise.sets.length > 0 
      ? {...exercise.sets[exercise.sets.length - 1]} 
      : { ...DEFAULT_SET };
    
    // Add the new set
    updatedExercises[exerciseIndex].sets.push(lastSet);
    
    // Update local state
    setLocalExercises(updatedExercises);
    setHasUnsavedChanges(true);
  };
  
  const handleRemoveSet = (exercise, setIndex) => {
    if (exercise.sets.length <= 1) {
      Alert.alert(t('error'), t('exercise_needs_at_least_one_set'));
      return;
    }
    
    const exerciseIndex = localExercises.findIndex(e => e.id === exercise.id);
    if (exerciseIndex === -1) return;
    
    // Create a deep copy of the exercises array
    const updatedExercises = JSON.parse(JSON.stringify(localExercises));
    
    // Remove the set
    updatedExercises[exerciseIndex].sets.splice(setIndex, 1);
    
    // Update local state
    setLocalExercises(updatedExercises);
    setHasUnsavedChanges(true);
  };
  
  const handleUpdateSet = (exercise, setIndex, field, value) => {
    const exerciseIndex = localExercises.findIndex(e => e.id === exercise.id);
    if (exerciseIndex === -1) return;
    
    // Create a deep copy of the exercises array
    const updatedExercises = JSON.parse(JSON.stringify(localExercises));
    
    // Update the specific set
    updatedExercises[exerciseIndex].sets[setIndex][field] = value;
    
    // Update local state
    setLocalExercises(updatedExercises);
    setHasUnsavedChanges(true);
  };
  
  const handleUpdateExerciseNotes = (exercise, notes) => {
    const exerciseIndex = localExercises.findIndex(e => e.id === exercise.id);
    if (exerciseIndex === -1) return;
    
    // Create a deep copy of the exercises array
    const updatedExercises = JSON.parse(JSON.stringify(localExercises));
    
    // Update the notes
    updatedExercises[exerciseIndex].notes = notes;
    
    // Update local state
    setLocalExercises(updatedExercises);
    setHasUnsavedChanges(true);
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleCancel}
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleCancel}
              disabled={isLoading}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>{t('edit_exercises')}</Text>
            
            <TouchableOpacity 
              style={[styles.saveButton, isLoading && styles.disabledButton]}
              onPress={handleSaveChanges}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="save" size={18} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>{t('save')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
          
          {/* Pairing mode indicator (if active) */}
          {pairingMode && (
            <View style={[styles.pairingModeIndicator, { backgroundColor: `rgba(66, 153, 225, 0.1)` }]}>
              <Ionicons name="link" size={16} color="#0ea5e9" />
              <Text style={styles.pairingModeText}>{t('select_exercise_to_pair')}</Text>
              <TouchableOpacity 
                style={styles.cancelPairingButton}
                onPress={handleCancelPairing}
              >
                <Ionicons name="close-circle" size={16} color={colors.danger} />
                <Text style={styles.cancelPairingText}>{t('cancel')}</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Exercise list */}
          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.contentContainer}
          >
            {localExercises.length > 0 ? (
              localExercises.map((exercise, index) => {
                // Find paired exercise name if this is a superset
                const pairedExerciseName = exercise.is_superset && exercise.superset_with !== null
                  ? localExercises.find(ex => ex.order === exercise.superset_with)?.name
                  : null;
                
                return (
                  <ExerciseCard
                    key={`exercise-${exercise.id || index}`}
                    exercise={exercise}
                    pairedExerciseName={pairedExerciseName}
                    showAllSets={true}
                    editMode={true}
                    isFirst={index === 0}
                    isLast={index === localExercises.length - 1}
                    pairingMode={pairingMode && pairingSourceIndex !== index}
                    exerciseIndex={index}
                    onEdit={() => handleEditExercise(index)}
                    onDelete={() => handleDeleteExercise(index)}
                    onMakeSuperset={() => handleMakeSuperset(index)}
                    onRemoveSuperset={() => handleRemoveSuperset(index)}
                    onMoveUp={() => handleMoveExerciseUp(index)}
                    onMoveDown={() => handleMoveExerciseDown(index)}
                    onAddSet={() => handleAddSet(exercise)}
                    onRemoveSet={(setIndex) => handleRemoveSet(exercise, setIndex)}
                    onUpdateSet={(setIndex, field, value) => 
                      handleUpdateSet(exercise, setIndex, field, value)
                    }
                    onUpdateNotes={(notes) => handleUpdateExerciseNotes(exercise, notes)}
                    onSelect={() => pairingMode && handleSelectPair(index)}
                  />
                );
              })
            ) : (
              <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
                <Ionicons name="barbell-outline" size={48} color={colors.text.tertiary} />
                <Text style={[styles.emptyStateText, { color: colors.text.tertiary }]}>
                  {t('no_exercises')}
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: colors.text.tertiary }]}>
                  {t('tap_add_button_to_start')}
                </Text>
              </View>
            )}
          </ScrollView>
          
          {/* Add exercise button */}
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.success }]}
            onPress={handleAddExercise}
            disabled={isLoading || pairingMode}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          {/* Exercise Selector Modal */}
          <ExerciseSelector
            visible={exerciseSelectorVisible}
            onClose={() => setExerciseSelectorVisible(false)}
            onSelectExercise={handleSelectExercise}
          />
          
          {/* Exercise Configurator Modal */}
          {currentExercise && (
            <ExerciseConfigurator
              visible={exerciseConfiguratorVisible}
              onClose={() => setExerciseConfiguratorVisible(false)}
              onSave={handleSaveExercise}
              exerciseName={currentExercise?.name || ''}
              initialSets={currentExercise?.sets || []}
              initialNotes={currentExercise?.notes || ''}
              isSuperset={currentExercise?.is_superset || false}
              supersetWith={currentExercise?.superset_with || null}
              supersetRestTime={currentExercise?.superset_rest_time || 90}
              supersetPairedExerciseName={
                currentExercise?.is_superset && currentExercise?.superset_with !== null
                  ? localExercises.find(ex => ex.order === currentExercise.superset_with)?.name || null
                  : null
              }
              isEdit={!!currentExercise?.id}
            />
          )}
        </SafeAreaView>
      </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  saveButtonText: {
    marginLeft: 6,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  pairingModeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  pairingModeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#0ea5e9',
    marginLeft: 8,
  },
  cancelPairingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  cancelPairingText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ef4444',
    marginLeft: 4,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 80, // Extra padding for the floating button
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderRadius: 12,
    marginTop: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default ExerciseManager;