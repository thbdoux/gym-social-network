import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Switch,
  Animated,
  PanResponder,
  Keyboard,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useLanguage } from '../../../context/LanguageContext';
import { WorkoutTemplateFormData, Exercise, ExerciseSet } from '../WorkoutTemplateWizard';
import { Ionicons } from '@expo/vector-icons';
import ExerciseSelector from '../ExerciseSelector';

type StepExercisesProps = {
  formData: WorkoutTemplateFormData;
  updateFormData: (data: Partial<WorkoutTemplateFormData>) => void;
  errors: Record<string, string>;
};

// Default set template
const DEFAULT_SET: ExerciseSet = {
  reps: 10,
  weight: 0,
  rest_time: 60 // 60 seconds
};

const StepExercises = ({ formData, updateFormData, errors }: StepExercisesProps) => {
  const { t, language } = useLanguage();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // State for the exercise selector modal
  const [exerciseSelectorVisible, setExerciseSelectorVisible] = useState(false);
  
  const [editExerciseIndex, setEditExerciseIndex] = useState<number | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  
  const [currentExerciseName, setCurrentExerciseName] = useState('');
  const [currentExerciseSets, setCurrentExerciseSets] = useState<ExerciseSet[]>([{...DEFAULT_SET}]);
  const [currentExerciseNotes, setCurrentExerciseNotes] = useState('');
  const [draggedExerciseIndex, setDraggedExerciseIndex] = useState<number | null>(null);
  const [restTimeEnabled, setRestTimeEnabled] = useState(true);
  
  // Superset state variables
  const [pairingMode, setPairingMode] = useState<boolean>(false);
  const [pairingSourceIndex, setPairingSourceIndex] = useState<number | null>(null);
  const [currentExerciseIsSuperset, setCurrentExerciseIsSuperset] = useState(false);
  const [currentSupersetRestTime, setCurrentSupersetRestTime] = useState(90);
  const [currentSupersetWithExercise, setCurrentSupersetWithExercise] = useState<number | null>(null);
  
  // Recently used exercises for the selector component
  const [recentExercises, setRecentExercises] = useState<string[]>([]);
  
  // Pan responder for drag and drop functionality
  const pan = useRef(new Animated.ValueXY()).current;
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: 0,
          y: (pan as any)._value.y
        });
      },
      onPanResponderMove: Animated.event(
        [null, { dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();
        // Reset position after dropping
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false
        }).start();
        
        // Logic to reorder based on drop position would go here
        if (draggedExerciseIndex !== null && gesture.dy !== 0) {
          const direction = gesture.dy > 0 ? 'down' : 'up';
          handleMoveExercise(draggedExerciseIndex, direction);
        }
        
        setDraggedExerciseIndex(null);
      }
    })
  ).current;
  
  // Reset edit state when modal is opened for new exercise
  useEffect(() => {
    if (editExerciseIndex === null && exerciseSelectorVisible) {
      setCurrentExerciseName('');
      setCurrentExerciseSets([{...DEFAULT_SET}]);
      setCurrentExerciseNotes('');
      setRestTimeEnabled(true);
      setCurrentExerciseIsSuperset(false);
      setCurrentSupersetWithExercise(null);
      setCurrentSupersetRestTime(90);
    }
  }, [exerciseSelectorVisible, editExerciseIndex]);
  
  // Update current exercise info when editing
  useEffect(() => {
    if (editExerciseIndex !== null && formData.exercises[editExerciseIndex]) {
      const exercise = formData.exercises[editExerciseIndex];
      setCurrentExerciseName(exercise.name);
      setCurrentExerciseSets([...exercise.sets]);
      setCurrentExerciseNotes(exercise.notes || '');
      
      // Check if rest time is enabled for this exercise
      const hasRestTime = exercise.sets.some(set => set.rest_time > 0);
      setRestTimeEnabled(hasRestTime);
      
      // Set superset data
      setCurrentExerciseIsSuperset(!!exercise.is_superset);
      setCurrentSupersetWithExercise(exercise.superset_with || null);
      setCurrentSupersetRestTime(exercise.superset_rest_time || 90);
    }
  }, [editExerciseIndex, formData.exercises]);
  
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
    setExerciseSelectorVisible(true);
  };
  
  // Handle selecting an exercise from the ExerciseSelector
  const handleSelectExercise = (exerciseName: string) => {
    setCurrentExerciseName(exerciseName);
    setExerciseSelectorVisible(false);
    setEditModalVisible(true);
    
    // Add to recent exercises if it's an ID-based exercise
    // In a real implementation, you would store the exercise ID
    if (exerciseName.startsWith('exercise_')) {
      const exerciseId = exerciseName.split('_')[1];
      setRecentExercises(prev => {
        // Remove if already exists
        const filtered = prev.filter(id => id !== exerciseId);
        // Add to beginning (most recent)
        return [exerciseId, ...filtered].slice(0, 10); // Keep only 10 most recent
      });
    }
  };
  
  // Handle adding a set - copies values from previous set
  const handleAddSet = () => {
    if (currentExerciseSets.length > 0) {
      // Copy values from the last set
      const lastSet = currentExerciseSets[currentExerciseSets.length - 1];
      setCurrentExerciseSets([...currentExerciseSets, {...lastSet}]);
    } else {
      setCurrentExerciseSets([...currentExerciseSets, {...DEFAULT_SET}]);
    }
  };
  
  // Handle removing a set
  const handleRemoveSet = (index: number) => {
    const updatedSets = [...currentExerciseSets];
    updatedSets.splice(index, 1);
    setCurrentExerciseSets(updatedSets);
  };
  
  // Handle updating a set
  const handleUpdateSet = (index: number, field: keyof ExerciseSet, value: number) => {
    const updatedSets = [...currentExerciseSets];
    updatedSets[index] = {
      ...updatedSets[index],
      [field]: value
    };
    setCurrentExerciseSets(updatedSets);
  };
  
  // Handle toggle for rest time
  const handleToggleRestTime = (value: boolean) => {
    setRestTimeEnabled(value);
    
    // Update all sets to have either default rest time or zero
    const updatedSets = currentExerciseSets.map(set => ({
      ...set,
      rest_time: value ? (set.rest_time > 0 ? set.rest_time : 60) : 0
    }));
    
    setCurrentExerciseSets(updatedSets);
  };
  
  // Handle saving the current exercise
  const handleSaveExercise = () => {
    if (!currentExerciseName.trim()) {
      Alert.alert(t('error'), t('exercise_name_required'));
      return;
    }
    
    if (currentExerciseSets.length === 0) {
      Alert.alert(t('error'), t('at_least_one_set_required'));
      return;
    }
    
    // Ensure each set has an order field based on its index
    const setsWithOrder = currentExerciseSets.map((set, index) => ({
      ...set,
      order: index
    }));
    
    const newExercise: Exercise = {
      name: currentExerciseName,
      sets: setsWithOrder,
      notes: currentExerciseNotes.trim() || undefined,
      equipment: '', // Default empty equipment if needed
      is_superset: currentExerciseIsSuperset,
      superset_with: currentSupersetWithExercise,
      superset_rest_time: currentExerciseIsSuperset ? currentSupersetRestTime : undefined
    };
    
    const updatedExercises = [...formData.exercises];
    
    if (editExerciseIndex !== null) {
      // Update existing exercise
      const previousExercise = updatedExercises[editExerciseIndex];
      const hadSuperset = previousExercise.is_superset && previousExercise.superset_with !== null;
      const oldSupersetWith = previousExercise.superset_with;
      
      updatedExercises[editExerciseIndex] = {
        ...newExercise,
        order: updatedExercises[editExerciseIndex]?.order ?? editExerciseIndex
      };
      
      // If this exercise was previously in a superset but no longer is,
      // we need to update the paired exercise as well
      if (hadSuperset && !currentExerciseIsSuperset && oldSupersetWith !== null) {
        const pairedIndex = updatedExercises.findIndex(ex => ex.order === oldSupersetWith);
        if (pairedIndex !== -1) {
          updatedExercises[pairedIndex].is_superset = false;
          updatedExercises[pairedIndex].superset_with = null;
          updatedExercises[pairedIndex].superset_rest_time = undefined;
        }
      }
    } else {
      // Add new exercise
      updatedExercises.push({
        ...newExercise,
        order: updatedExercises.length // Use the new index as the order
      });
    }
    
    updateFormData({ exercises: updatedExercises });
    setEditModalVisible(false);
  };
  
  // Handle editing an exercise
  const handleEditExercise = (index: number) => {
    setEditExerciseIndex(index);
    setEditModalVisible(true);
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
              
              // If this exercise was in a superset with the removed exercise,
              // update its superset_with value
              if (exercise.superset_with !== null) {
                if (exercise.superset_with === exerciseToRemove.order) {
                  exercise.is_superset = false;
                  exercise.superset_with = null;
                  exercise.superset_rest_time = undefined;
                } else if (exercise.superset_with > exerciseToRemove.order) {
                  // Decrement superset_with value for exercises paired with exercises after the removed one
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
  
  // Updated handleMoveExercise function to maintain superset relationships
  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === formData.exercises.length - 1)
    ) {
      return;
    }
    
    const updatedExercises = [...formData.exercises];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Save superset relationships before swapping
    const exercise = updatedExercises[index];
    const targetExercise = updatedExercises[targetIndex];
    
    // Get the superset information before swapping
    const exerciseOrder = exercise.order;
    const targetOrder = targetExercise.order;
    const exerciseSuperset = exercise.superset_with;
    const targetSuperset = targetExercise.superset_with;
    
    // Swap positions
    [updatedExercises[index], updatedExercises[targetIndex]] = 
    [updatedExercises[targetIndex], updatedExercises[index]];
    
    // Update order values
    updatedExercises[index].order = exerciseOrder;
    updatedExercises[targetIndex].order = targetOrder;
    
    // Update superset relationships
    if (exerciseSuperset !== null && exerciseSuperset !== undefined) {
      // Find exercises that have this exercise as their superset pair
      for (const ex of updatedExercises) {
        if (ex.superset_with === exerciseOrder) {
          // Update to point to the new order
          ex.superset_with = targetOrder;
        }
      }
    }
    
    if (targetSuperset !== null && targetSuperset !== undefined) {
      // Find exercises that have target exercise as their superset pair
      for (const ex of updatedExercises) {
        if (ex.superset_with === targetOrder) {
          // Update to point to the new order
          ex.superset_with = exerciseOrder;
        }
      }
    }
    
    updateFormData({ exercises: updatedExercises });
  };
  
  // Start dragging an exercise
  const handleStartDrag = (index: number) => {
    setDraggedExerciseIndex(index);
  };
  
  // Superset functions
  
  // Function to start pairing an exercise
  const handleStartPairing = (index: number) => {
    setPairingMode(true);
    setPairingSourceIndex(index);
  };

  // Function to cancel pairing mode
  const handleCancelPairing = () => {
    setPairingMode(false);
    setPairingSourceIndex(null);
  };

  // Function to pair exercises as a superset
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
    sourceExercise.superset_rest_time = 90;  // Default 90 seconds
    targetExercise.superset_rest_time = 90;

    updateFormData({ exercises: updatedExercises });
    setPairingMode(false);
    setPairingSourceIndex(null);
  };

  // Function to remove a superset pairing
  const handleRemoveSuperset = (index: number) => {
    const updatedExercises = [...formData.exercises];
    const exercise = updatedExercises[index];
    
    if (exercise.superset_with !== null && exercise.superset_with !== undefined) {
      // Find the paired exercise
      const pairedIndex = updatedExercises.findIndex(ex => ex.order === exercise.superset_with);
      
      if (pairedIndex !== -1) {
        // Remove the superset relationship from the paired exercise
        updatedExercises[pairedIndex].superset_with = null;
        updatedExercises[pairedIndex].is_superset = false;
        updatedExercises[pairedIndex].superset_rest_time = undefined;
      }
      
      // Remove the superset relationship from this exercise
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

  // Function to update superset rest time
  const handleUpdateSupersetRestTime = (index: number, restTime: number) => {
    const updatedExercises = [...formData.exercises];
    const exercise = updatedExercises[index];
    
    if (exercise.is_superset && exercise.superset_with !== null && exercise.superset_with !== undefined) {
      // Update rest time for this exercise
      exercise.superset_rest_time = restTime;
      
      // Find the paired exercise and update its rest time too
      const pairedIndex = updatedExercises.findIndex(ex => ex.order === exercise.superset_with);
      if (pairedIndex !== -1) {
        updatedExercises[pairedIndex].superset_rest_time = restTime;
      }
      
      updateFormData({ exercises: updatedExercises });
    }
  };
  
  // Format rest time for display
  const formatRestTime = (seconds: number): string => {
    if (seconds === 0) return '-';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  return (
    <View style={styles.container}>
      {/* Header with exercise count */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('add_exercises')}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>
            {formData.exercises.length} {formData.exercises.length === 1 ? t('exercise') : t('exercises')}
          </Text>
        </View>
      </View>
      
      {/* Error message if any */}
      {errors.exercises && (
        <Text style={styles.errorText}>{errors.exercises}</Text>
      )}
      
      {/* Pairing mode indicator */}
      {pairingMode && (
        <View style={styles.pairingModeIndicator}>
          <Ionicons name="link" size={16} color="#0ea5e9" />
          <Text style={styles.pairingModeText}>{t('select_exercise_to_pair')}</Text>
          <TouchableOpacity onPress={handleCancelPairing} style={styles.cancelPairingButton}>
            <Ionicons name="close-circle" size={16} color="#EF4444" />
            <Text style={styles.cancelPairingText}>{t('cancel')}</Text>
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
            <Animated.View 
              key={index} 
              style={[
                styles.exerciseCard,
                draggedExerciseIndex === index && {
                  transform: [{ translateY: pan.y }],
                  elevation: 5,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                },
                exercise.is_superset && styles.supersetCard
              ]}
              {...(draggedExerciseIndex === index ? panResponder.panHandlers : {})}
            >
              <TouchableOpacity
                style={styles.exerciseHeader}
                onPress={() => handleEditExercise(index)}
                onLongPress={() => handleStartDrag(index)}
                delayLongPress={200}
              >
                <View style={styles.exerciseNameContainer}>
                  {exercise.is_superset && (
                    <View style={styles.supersetBadge}>
                      <Ionicons name="link" size={12} color="#0ea5e9" />
                      <Text style={styles.supersetBadgeText}>{t('superset')}</Text>
                    </View>
                  )}
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                </View>
                <Text style={styles.setCount}>
                  {exercise.sets.length} {exercise.sets.length === 1 ? t('set') : t('sets')}
                </Text>
              </TouchableOpacity>
              
              <View style={styles.exerciseDetails}>
                {/* First set info as summary */}
                <View style={styles.setInfo}>
                  <View style={styles.setInfoItem}>
                    <Text style={styles.setInfoLabel}>{t('reps')}:</Text>
                    <Text style={styles.setInfoValue}>{exercise.sets[0].reps}</Text>
                  </View>
                  <View style={styles.setInfoItem}>
                    <Text style={styles.setInfoLabel}>{t('weight')}:</Text>
                    <Text style={styles.setInfoValue}>
                      {exercise.sets[0].weight > 0 ? `${exercise.sets[0].weight}kg` : '-'}
                    </Text>
                  </View>
                  <View style={styles.setInfoItem}>
                    <Text style={styles.setInfoLabel}>{t('rest')}:</Text>
                    <Text style={styles.setInfoValue}>
                      {formatRestTime(exercise.sets[0].rest_time)}
                    </Text>
                  </View>
                </View>
                
                {/* Exercise notes preview if they exist */}
                {exercise.notes && (
                  <Text style={styles.exerciseNotes} numberOfLines={1}>
                    {exercise.notes}
                  </Text>
                )}
              </View>
              
              {/* Superset info */}
              {exercise.is_superset && exercise.superset_with !== null && (
                <View style={styles.supersetContainer}>
                  <Text style={styles.supersetPairText}>
                    {t('paired_with')}: {getPairedExerciseName(exercise)}
                  </Text>
                  <Text style={styles.supersetRestText}>
                    {t('superset_rest')}: {formatRestTime(exercise.superset_rest_time || 90)}
                  </Text>
                </View>
              )}
              
              {/* Controls */}
              <View style={styles.exerciseControls}>
                {pairingMode ? (
                  pairingSourceIndex !== index ? (
                    // Target exercise for pairing
                    <TouchableOpacity
                      style={styles.pairButton}
                      onPress={() => handlePairExercises(index)}
                    >
                      <Ionicons name="link" size={16} color="#0ea5e9" />
                      <Text style={styles.controlText}>{t('pair_as_superset')}</Text>
                    </TouchableOpacity>
                  ) : (
                    // Source exercise (cancel pairing)
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={handleCancelPairing}
                    >
                      <Ionicons name="close-circle" size={16} color="#EF4444" />
                      <Text style={[styles.controlText, styles.removeText]}>{t('cancel')}</Text>
                    </TouchableOpacity>
                  )
                ) : (
                  // Regular controls
                  <>
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={() => handleEditExercise(index)}
                    >
                      <Ionicons name="create-outline" size={16} color="#0ea5e9" />
                      <Text style={styles.controlText}>{t('edit')}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.controlButton}
                      onPress={() => handleRemoveExercise(index)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      <Text style={[styles.controlText, styles.removeText]}>{t('remove')}</Text>
                    </TouchableOpacity>
                    
                    {exercise.is_superset ? (
                      <TouchableOpacity
                        style={styles.controlButton}
                        onPress={() => handleRemoveSuperset(index)}
                      >
                        <Ionicons name="link-off" size={16} color="#EF4444" />
                        <Text style={[styles.controlText, styles.removeText]}>{t('remove_superset')}</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.controlButton}
                        onPress={() => handleStartPairing(index)}
                      >
                        <Ionicons name="link" size={16} color="#0ea5e9" />
                        <Text style={styles.controlText}>{t('make_superset')}</Text>
                      </TouchableOpacity>
                    )}
                    
                    <View style={styles.orderControls}>
                      <TouchableOpacity
                        style={[
                          styles.orderButton,
                          index === 0 && styles.orderButtonDisabled
                        ]}
                        onPress={() => handleMoveExercise(index, 'up')}
                        disabled={index === 0}
                      >
                        <Ionicons name="chevron-up" size={16} color={index === 0 ? "#6B7280" : "#0ea5e9"} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.orderButton,
                          index === formData.exercises.length - 1 && styles.orderButtonDisabled
                        ]}
                        onPress={() => handleMoveExercise(index, 'down')}
                        disabled={index === formData.exercises.length - 1}
                      >
                        <Ionicons name="chevron-down" size={16} color={index === formData.exercises.length - 1 ? "#6B7280" : "#0ea5e9"} />
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </Animated.View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="barbell-outline" size={48} color="#6B7280" />
            <Text style={styles.emptyStateText}>{t('no_exercises_yet')}</Text>
            <Text style={styles.emptyStateSubtext}>{t('tap_to_add_exercises')}</Text>
          </View>
        )}
      </ScrollView>
      
      {/* Add exercise button */}
      <TouchableOpacity
        style={styles.addButton}
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
      
      {/* Exercise edit modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={[
            styles.modalContent,
            keyboardVisible && { height: Platform.OS === 'ios' ? '90%' : '95%' }
          ]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editExerciseIndex !== null ? t('edit_exercise') : t('configure_exercise')}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <ScrollView
              style={styles.editModalScroll}
              contentContainerStyle={[
                styles.editModalContent,
                { paddingBottom: keyboardVisible ? keyboardHeight + 100 : 100 }
              ]}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            >
              {/* Exercise name */}
              <View style={styles.exerciseNameContainer}>
                <Text style={styles.exerciseEditLabel}>{t('exercise_name')}</Text>
                <TextInput
                  style={styles.exerciseNameInput}
                  value={currentExerciseName}
                  onChangeText={setCurrentExerciseName}
                  placeholder={t('enter_exercise_name')}
                  placeholderTextColor="#9CA3AF"
                  selectionColor="#0ea5e9"
                />
              </View>
              
              {/* Superset information if applicable */}
              {currentExerciseIsSuperset && currentSupersetWithExercise !== null && (
                <View style={styles.supersetInfoSection}>
                  <Text style={styles.exerciseEditLabel}>{t('superset_info')}</Text>
                  <View style={styles.supersetInfoContent}>
                    <Ionicons name="link" size={16} color="#0ea5e9" style={{ marginRight: 8 }} />
                    <Text style={styles.supersetInfoText}>
                      {t('paired_with')}: {getPairedExerciseName({
                        order: editExerciseIndex !== null ? formData.exercises[editExerciseIndex]?.order : 0,
                        superset_with: currentSupersetWithExercise
                      } as Exercise)}
                    </Text>
                  </View>
                  
                  <View style={styles.supersetRestTimeSection}>
                    <Text style={styles.exerciseEditLabel}>{t('superset_rest_time')} (s)</Text>
                    <TextInput
                      style={styles.supersetRestTimeInput}
                      value={currentSupersetRestTime.toString()}
                      onChangeText={(text) => setCurrentSupersetRestTime(parseInt(text) || 90)}
                      keyboardType="number-pad"
                      maxLength={3}
                    />
                  </View>
                </View>
              )}
              
              {/* Rest time toggle */}
              <View style={styles.restTimeToggleContainer}>
                <Text style={styles.exerciseEditLabel}>{t('rest_time')}</Text>
                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>{restTimeEnabled ? t('enabled') : t('disabled')}</Text>
                  <Switch
                    value={restTimeEnabled}
                    onValueChange={handleToggleRestTime}
                    trackColor={{ false: '#374151', true: 'rgba(14, 165, 233, 0.4)' }}
                    thumbColor={restTimeEnabled ? '#0ea5e9' : '#6B7280'}
                  />
                </View>
              </View>
              
              {/* Sets section */}
              <View style={styles.setsSection}>
                <View style={styles.setsSectionHeader}>
                  <Text style={styles.exerciseEditLabel}>{t('sets')}</Text>
                  <TouchableOpacity
                    style={styles.addSetButton}
                    onPress={handleAddSet}
                  >
                    <Ionicons name="add" size={16} color="#0ea5e9" />
                    <Text style={styles.addSetText}>{t('add_set')}</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Sets header */}
                <View style={styles.setsHeader}>
                  <Text style={[styles.setHeaderText, { flex: 0.5 }]}>{t('set')}</Text>
                  <Text style={styles.setHeaderText}>{t('reps')}</Text>
                  <Text style={styles.setHeaderText}>{t('weight')} (kg)</Text>
                  {restTimeEnabled && (
                    <Text style={styles.setHeaderText}>{t('rest')} (s)</Text>
                  )}
                  <View style={{ width: 40 }} />
                </View>
                
                {/* Set rows */}
                {currentExerciseSets.map((set, index) => (
                  <View key={index} style={styles.setRow}>
                    <Text style={[styles.setNumberText, { flex: 0.5 }]}>{index + 1}</Text>
                    
                    <View style={styles.setInputContainer}>
                      <TextInput
                        style={styles.setInput}
                        value={set.reps.toString()}
                        onChangeText={(text) => handleUpdateSet(index, 'reps', parseInt(text) || 0)}
                        keyboardType="number-pad"
                        maxLength={3}
                      />
                    </View>
                    
                    <View style={styles.setInputContainer}>
                      <TextInput
                        style={styles.setInput}
                        value={set.weight > 0 ? set.weight.toString() : ''}
                        onChangeText={(text) => handleUpdateSet(index, 'weight', parseFloat(text) || 0)}
                        keyboardType="decimal-pad"
                        maxLength={5}
                        placeholder="0"
                        placeholderTextColor="#6B7280"
                      />
                    </View>
                    
                    {restTimeEnabled && (
                      <View style={styles.setInputContainer}>
                        <TextInput
                          style={styles.setInput}
                          value={set.rest_time.toString()}
                          onChangeText={(text) => handleUpdateSet(index, 'rest_time', parseInt(text) || 0)}
                          keyboardType="number-pad"
                          maxLength={3}
                        />
                      </View>
                    )}
                    
                    <TouchableOpacity
                      style={[
                        styles.removeSetButton, 
                        currentExerciseSets.length === 1 && styles.removeSetButtonDisabled
                      ]}
                      onPress={() => handleRemoveSet(index)}
                      disabled={currentExerciseSets.length === 1}
                    >
                      <Ionicons 
                        name="trash-outline" 
                        size={16} 
                        color={currentExerciseSets.length === 1 ? "#6B7280" : "#EF4444"} 
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              
              {/* Notes section */}
              <View style={styles.notesSection}>
                <Text style={styles.exerciseEditLabel}>{t('notes')} ({t('optional')})</Text>
                <TextInput
                  style={styles.notesInput}
                  value={currentExerciseNotes}
                  onChangeText={setCurrentExerciseNotes}
                  placeholder={t('exercise_notes_placeholder')}
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>
            
            {/* Save button */}
            <TouchableOpacity
              style={[
                styles.saveExerciseButton,
                keyboardVisible && { bottom: Platform.OS === 'ios' ? keyboardHeight : 0 }
              ]}
              onPress={handleSaveExercise}
            >
              <Ionicons name="save-outline" size={18} color="#FFFFFF" />
              <Text style={styles.saveExerciseText}>{t('save_exercise')}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    color: '#FFFFFF',
  },
  countBadge: {
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0ea5e9',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 16,
  },
  exercisesList: {
    flex: 1,
  },
  exercisesListContent: {
    paddingBottom: 80, // Add padding for button
  },
  exerciseCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
  },
  supersetCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#0ea5e9',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  supersetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  supersetBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0ea5e9',
    marginLeft: 2,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  setCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0ea5e9',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  exerciseDetails: {
    marginBottom: 8,
  },
  setInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  setInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setInfoLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginRight: 4,
  },
  setInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E7EB',
  },
  exerciseNotes: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#9CA3AF',
  },
  // Superset info styles
  supersetContainer: {
    marginTop: 4,
    marginBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  supersetPairText: {
    fontSize: 13,
    color: '#E5E7EB',
    marginBottom: 4,
  },
  supersetRestText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  pairingModeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
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
    marginLeft: 8,
  },
  cancelPairingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
    marginLeft: 4,
  },
  exerciseControls: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 8,
    marginTop: 4,
    justifyContent: 'space-between',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  controlText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#0ea5e9',
    marginLeft: 4,
  },
  removeText: {
    color: '#EF4444',
  },
  orderControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  orderButtonDisabled: {
    opacity: 0.5,
  },
  pairButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  emptyState: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E7EB',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0284c7',
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
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalCloseButton: {
    padding: 4,
  },
  
  // Edit modal styles
  editModalScroll: {
    flex: 1,
  },
  editModalContent: {
    padding: 16,
    paddingBottom: 100, // Space for save button
  },
  exerciseNameContainer: {
    marginBottom: 20,
  },
  exerciseEditLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 8,
  },
  exerciseNameInput: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#FFFFFF',
  },
  
  // Superset info in edit modal
  supersetInfoSection: {
    marginBottom: 16,
    backgroundColor: 'rgba(14, 165, 233, 0.05)',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0ea5e9',
  },
  supersetInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  supersetInfoText: {
    fontSize: 14,
    color: '#E5E7EB',
    flex: 1,
  },
  supersetRestTimeSection: {
    marginTop: 4,
  },
  supersetRestTimeInput: {
    backgroundColor: '#1F2937',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 14,
  },
  
  // Rest time toggle
  restTimeToggleContainer: {
    marginBottom: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  
  // Sets section
  setsSection: {
    marginBottom: 20,
  },
  setsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addSetText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0ea5e9',
    marginLeft: 4,
  },
  setsHeader: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  setHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  setNumberText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0ea5e9',
    textAlign: 'center',
  },
  setInputContainer: {
    flex: 1,
    paddingHorizontal: 4,
  },
  setInput: {
    backgroundColor: '#1F2937',
    borderRadius: 6,
    height: 38,
    paddingHorizontal: 8,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 14,
  },
  removeSetButton: {
    width: 40,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeSetButtonDisabled: {
    opacity: 0.5,
  },
  
  // Notes section
  notesSection: {
    marginBottom: 20,
  },
  notesInput: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#FFFFFF',
    minHeight: 80,
  },
  
  // Save button
  saveExerciseButton: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#0284c7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  saveExerciseText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});

export default StepExercises;