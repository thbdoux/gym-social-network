// app/(app)/workout/[id].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  TextInput,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

// Custom hooks
import { useAuth } from '../../../hooks/useAuth';
import { useLanguage } from '../../../context/LanguageContext';
import {
  useWorkoutTemplate,
  useUpdateWorkoutTemplate,
  useDeleteWorkoutTemplate,
  useUpdateTemplateExercise,
  useAddExerciseToTemplate,
  useDeleteTemplateExercise
} from '../../../hooks/query/useWorkoutQuery';

// Shared components
import ExerciseSelector from '../../../components/workouts/ExerciseSelector';
import ExerciseConfigurator, { Exercise, ExerciseSet } from '../../../components/workouts/ExerciseConfigurator';
import ExerciseCard from '../../../components/workouts/ExerciseCard';
import WorkoutOptionsMenu from '../../../components/workouts/WorkoutOptionsMenu';
import { SupersetManager } from '../../../components/workouts/utils/SupersetManager';

// Colors
const COLORS = {
  primary: "#0ea5e9", // Blue
  secondary: "#0284c7", // Darker blue
  tertiary: "#0369a1", // Even darker blue
  background: "#111827", // Dark background
  card: "#1F2937", // Card background
  text: {
    primary: "#FFFFFF",
    secondary: "rgba(255, 255, 255, 0.7)",
    tertiary: "rgba(255, 255, 255, 0.5)"
  },
  border: "rgba(255, 255, 255, 0.1)",
  success: "#10b981", // Green
  danger: "#ef4444" // Red
};

// Default set template for new exercises
const DEFAULT_SET = {
  reps: 10,
  weight: 0,
  rest_time: 60 // 60 seconds
};

// Utility function to format rest time
const formatRestTime = (seconds) => {
  if (!seconds) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}m ${sec > 0 ? sec + 's' : ''}`;
};

export default function WorkoutDetailScreen() {
  // Get workout ID from route params
  const { id } = useLocalSearchParams();
  const workoutId = typeof id === 'string' ? parseInt(id, 10) : 0;
  
  // State for workout details
  const [workoutName, setWorkoutName] = useState('');
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [workoutDifficulty, setWorkoutDifficulty] = useState('beginner');
  const [workoutFocus, setWorkoutFocus] = useState('');
  
  // State for edit modes
  const [editMode, setEditMode] = useState(false);
  const [editInfoMode, setEditInfoMode] = useState(false);
  const [editExercisesMode, setEditExercisesMode] = useState(false);
  
  // State for exercise management
  const [exerciseSelectorVisible, setExerciseSelectorVisible] = useState(false);
  const [exerciseConfiguratorVisible, setExerciseConfiguratorVisible] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [pairingMode, setPairingMode] = useState(false);
  const [pairingSourceIndex, setPairingSourceIndex] = useState<number | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  // Hooks
  const { user } = useAuth();
  const { t } = useLanguage();
  const { data: workout, isLoading, refetch } = useWorkoutTemplate(workoutId);
  const { mutateAsync: updateWorkout } = useUpdateWorkoutTemplate();
  const { mutateAsync: deleteWorkout } = useDeleteWorkoutTemplate();
  const { mutateAsync: updateExercise } = useUpdateTemplateExercise();
  const { mutateAsync: addExercise } = useAddExerciseToTemplate();
  const { mutateAsync: deleteExercise } = useDeleteTemplateExercise();
  
  // Initialize form state when workout data is loaded
  useEffect(() => {
    if (workout) {
      setWorkoutName(workout.name);
      setWorkoutDescription(workout.description || '');
      setWorkoutDuration(workout.estimated_duration || 0);
      setWorkoutDifficulty(workout.difficulty_level || 'beginner');
      setWorkoutFocus(workout.focus || '');
    }
  }, [workout]);
  
  // Add keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  
  // Check if current user is the workout creator
  const isCreator = workout?.creator_username === user?.username;
  const isTemplate = !workout?.preferred_weekday; // If it has preferred_weekday, it's an instance
  
  // Format focus text (convert snake_case to Title Case)
  const formatFocus = (focus?: string): string => {
    if (!focus) return '';
    return focus
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Get weekday name
  const getWeekdayName = (day?: number): string => {
    if (day === undefined) return '';
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return weekdays[day];
  };
  
  // Get difficulty indicator based on level
  const getDifficultyIndicator = (level?: string): string => {
    if (!level) return '🔥';
    switch(level?.toLowerCase()) {
      case 'beginner': return '🔥';
      case 'intermediate': return '🔥🔥';
      case 'advanced': return '🔥🔥🔥';
      default: return '🔥';
    }
  };
  
  // Handle saving workout edits
  const handleSaveWorkout = async () => {
    try {
      await updateWorkout({
        id: workoutId,
        updates: {
          name: workoutName,
          description: workoutDescription,
          estimated_duration: workoutDuration,
          difficulty_level: workoutDifficulty,
          focus: workoutFocus
        }
      });
      setEditMode(false);
      setEditInfoMode(false);
      setEditExercisesMode(false);
      await refetch();
    } catch (error) {
      console.error('Failed to update workout:', error);
      Alert.alert(t('error'), t('failed_to_update_workout'));
    }
  };
  
  // Handle canceling edit mode
  const handleCancelEdit = () => {
    // Reset form to original values
    if (workout) {
      setWorkoutName(workout.name);
      setWorkoutDescription(workout.description || '');
      setWorkoutDuration(workout.estimated_duration || 0);
      setWorkoutDifficulty(workout.difficulty_level || 'beginner');
      setWorkoutFocus(workout.focus || '');
    }
    setEditMode(false);
    setEditInfoMode(false);
    setEditExercisesMode(false);
    setPairingMode(false);
    setPairingSourceIndex(null);
  };
  
  // Handle deleting the workout
  const handleDeleteWorkout = () => {
    Alert.alert(
      t('delete_workout'),
      isTemplate ? t('confirm_delete_template') : t('confirm_delete_workout'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWorkout(workoutId);
              router.back();
            } catch (error) {
              console.error('Failed to delete workout:', error);
              Alert.alert(t('error'), t('failed_to_delete_workout'));
            }
          }
        }
      ]
    );
  };

  // Handle adding a set to an exercise
  const handleAddSet = (exercise) => {
    // Create a new set based on the last set or with default values
    const lastSet = exercise.sets.length > 0 ? {...exercise.sets[exercise.sets.length - 1]} : { reps: 8, weight: 0, rest_time: 60 };
    const newSets = [...exercise.sets, lastSet];
    
    // Update the exercise with the new set
    updateExercise({
      templateId: workoutId,
      exerciseId: exercise.id,
      exercise: {
        ...exercise,
        sets: newSets
      }
    });
  };

  // Handle removing a set from an exercise
  const handleRemoveSet = (exercise, setIndex) => {
    if (exercise.sets.length <= 1) {
      Alert.alert(t('error'), t('exercise_needs_at_least_one_set'));
      return;
    }
    
    const newSets = exercise.sets.filter((_, index) => index !== setIndex);
    
    updateExercise({
      templateId: workoutId,
      exerciseId: exercise.id,
      exercise: {
        ...exercise,
        sets: newSets
      }
    });
  };

  // Handle updating a set's values
  const handleUpdateSet = (exercise, setIndex, field, value) => {
    const newSets = [...exercise.sets];
    newSets[setIndex] = {
      ...newSets[setIndex],
      [field]: value
    };
    
    updateExercise({
      templateId: workoutId,
      exerciseId: exercise.id,
      exercise: {
        ...exercise,
        sets: newSets
      }
    });
  };
  
  // Start superset pairing mode
  const handleStartPairing = (index) => {
    setPairingMode(true);
    setPairingSourceIndex(index);
  };
  
  // Cancel pairing mode
  const handleCancelPairing = () => {
    setPairingMode(false);
    setPairingSourceIndex(null);
  };
  
  // Pair exercises as superset
  const handlePairExercises = (targetIndex) => {
    if (pairingSourceIndex === null || pairingSourceIndex === targetIndex) {
      return;
    }
    
    const sourceExercise = workout.exercises[pairingSourceIndex];
    const targetExercise = workout.exercises[targetIndex];
    
    // Set up source exercise superset
    updateExercise({
      templateId: workoutId,
      exerciseId: sourceExercise.id,
      exercise: {
        ...sourceExercise,
        is_superset: true,
        superset_with: targetExercise.order,
        superset_rest_time: 90
      }
    });
    
    // Set up target exercise superset
    updateExercise({
      templateId: workoutId,
      exerciseId: targetExercise.id,
      exercise: {
        ...targetExercise,
        is_superset: true,
        superset_with: sourceExercise.order,
        superset_rest_time: 90
      }
    });
    
    setPairingMode(false);
    setPairingSourceIndex(null);
    refetch();
  };
  
  // Remove superset pairing
  const handleRemoveSuperset = (index) => {
    const exercise = workout.exercises[index];
    
    if (exercise.is_superset && exercise.superset_with !== null) {
      // Find paired exercise
      const pairedExercise = workout.exercises.find(ex => 
        ex.order === exercise.superset_with
      );
      
      if (pairedExercise) {
        // Update paired exercise
        updateExercise({
          templateId: workoutId,
          exerciseId: pairedExercise.id,
          exercise: {
            ...pairedExercise,
            is_superset: false,
            superset_with: null,
            superset_rest_time: undefined
          }
        });
      }
      
      // Update this exercise
      updateExercise({
        templateId: workoutId,
        exerciseId: exercise.id,
        exercise: {
          ...exercise,
          is_superset: false,
          superset_with: null,
          superset_rest_time: undefined
        }
      });
      
      refetch();
    }
  };
  
  // Handle editing an exercise
  const handleEditExercise = (index) => {
    const exercise = workout.exercises[index];
    setCurrentExercise({...exercise});
    setExerciseConfiguratorVisible(true);
  };
  
  // Handle saving an exercise (new or edited)
  const handleSaveExercise = (exercise) => {
    if (currentExercise?.id) {
      // Update existing exercise
      updateExercise({
        templateId: workoutId,
        exerciseId: currentExercise.id,
        exercise: {
          ...exercise,
          id: currentExercise.id,
          order: currentExercise.order
        }
      });
    } else {
      // Add new exercise
      addExercise({
        templateId: workoutId,
        exercise: {
          ...exercise,
          order: workout.exercises ? workout.exercises.length : 0
        }
      });
    }
    
    setExerciseConfiguratorVisible(false);
    setCurrentExercise(null);
    refetch();
  };
  
  // Handle moving an exercise up or down
  const handleMoveExercise = (index, direction) => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === workout.exercises.length - 1)
    ) {
      return;
    }
    
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedExercises = SupersetManager.reorderExercises(
      workout.exercises,
      index,
      targetIndex
    );
    
    // Update all affected exercises
    Promise.all(
      updatedExercises.map(exercise => 
        updateExercise({
          templateId: workoutId,
          exerciseId: exercise.id,
          exercise
        })
      )
    ).then(() => {
      refetch();
    });
  };
  
  // Delete an exercise
  const handleDeleteExercise = (exerciseId) => {
    Alert.alert(
      t('delete_exercise'),
      t('confirm_delete_exercise'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExercise({
                templateId: workoutId,
                exerciseId: exerciseId
              });
              refetch();
            } catch (error) {
              console.error('Failed to delete exercise:', error);
              Alert.alert(t('error'), t('failed_to_delete_exercise'));
            }
          }
        }
      ]
    );
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }
  
  // Render error state if workout not found
  if (!workout) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
        <Text style={styles.errorTitle}>
          {isTemplate ? t('template_not_found') : t('workout_not_found')}
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>{t('back_to_workouts')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      
      {/* Redesigned Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        {/* Top Row: Back button, Title, Template badge, Options */}
        <View style={styles.headerTopRow}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            {editInfoMode ? (
              <TextInput
                style={styles.headerTitleInput}
                value={workoutName}
                onChangeText={setWorkoutName}
                placeholder={t('workout_name')}
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
              />
            ) : (
              <Text style={styles.headerTitle} numberOfLines={1}>
                {workout.name}
              </Text>
            )}
          </View>
          
          {isCreator && !editMode ? (
            <WorkoutOptionsMenu
              isCreator={isCreator}
              onDeleteWorkout={handleDeleteWorkout}
              onEditInfo={() => {
                setEditMode(true);
                setEditInfoMode(true);
                setEditExercisesMode(false);
              }}
              onEditExercises={() => {
                setEditMode(true);
                setEditInfoMode(false);
                setEditExercisesMode(true);
              }}
            />
          ) : editMode ? (
            <View style={styles.editActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleCancelEdit}
              >
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSaveWorkout}
              >
                <Text style={styles.saveButtonText}>{t('save')}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
        
        {/* Creator info row */}
        <View style={styles.creatorRow}>
          <View style={styles.creatorInfo}>
            <Ionicons name="person" size={14} color={COLORS.text.secondary} />
            <Text style={styles.creatorText}>{workout.creator_username}</Text>
          </View>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {isTemplate ? t('template') : t('workout')}
            </Text>
          </View>
        </View>
        
        {/* Workout Info Row */}
        <View style={styles.workoutInfoRow}>
          {/* Focus */}
          <View style={styles.workoutInfoItem}>
            <Ionicons name="barbell-outline" size={14} color={COLORS.text.secondary} />
            {editInfoMode ? (
              <TextInput
                style={styles.infoInput}
                value={workoutFocus}
                onChangeText={setWorkoutFocus}
                placeholder={t('focus')}
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
              />
            ) : (
              <Text style={styles.infoText}>
                {formatFocus(workout.focus)}
              </Text>
            )}
          </View>
          
          {/* Duration */}
          <View style={styles.workoutInfoItem}>
            <Ionicons name="time-outline" size={14} color={COLORS.text.secondary} />
            {editInfoMode ? (
              <TextInput
                style={styles.infoInput}
                value={workoutDuration.toString()}
                onChangeText={(text) => setWorkoutDuration(parseInt(text) || 0)}
                keyboardType="number-pad"
                placeholder={t('duration')}
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
              />
            ) : (
              <Text style={styles.infoText}>
                {workout.estimated_duration} {t('min')}
              </Text>
            )}
          </View>
          
          {/* Difficulty */}
          <View style={styles.workoutInfoItem}>
            <Text style={styles.infoIcon}>
              {getDifficultyIndicator(workout.difficulty_level)}
            </Text>
            {editInfoMode ? (
              <View style={styles.difficultySelector}>
                {['beginner', 'intermediate', 'advanced'].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.difficultyOption,
                      workoutDifficulty === level && styles.difficultyOptionSelected
                    ]}
                    onPress={() => setWorkoutDifficulty(level)}
                  >
                    <Text style={[
                      styles.difficultyOptionText,
                      workoutDifficulty === level && styles.difficultyOptionTextSelected
                    ]}>
                      {t(level)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.infoText}>
                {t(workout.difficulty_level || 'beginner')}
              </Text>
            )}
          </View>
          
          {/* Weekday for scheduled workouts */}
          {!isTemplate && workout.preferred_weekday !== undefined && (
            <View style={styles.workoutInfoItem}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.text.secondary} />
              <Text style={styles.infoText}>
                {getWeekdayName(workout.preferred_weekday)}
              </Text>
            </View>
          )}
        </View>
        
        {/* Description - only if available or in edit mode */}
        {(editInfoMode || workout.description) && (
          <View style={styles.descriptionContainer}>
            {editInfoMode ? (
              <TextInput
                style={styles.descriptionInput}
                value={workoutDescription}
                onChangeText={setWorkoutDescription}
                placeholder={t('workout_description')}
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                multiline
                numberOfLines={2}
              />
            ) : (
              <Text style={styles.descriptionText} numberOfLines={2}>
                {workout.description}
              </Text>
            )}
          </View>
        )}
      </LinearGradient>
      
      {/* Exercise List */}
      <ScrollView style={styles.contentContainer}>
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
        
        <View style={styles.exercisesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('exercises')}</Text>
            <View style={styles.exerciseControls}>
              <Text style={styles.exerciseCount}>
                {workout.exercises?.length || 0} {t('total')}
              </Text>
            </View>
          </View>
          
          {workout.exercises && workout.exercises.length > 0 ? (
            <View style={styles.exercisesList}>
              {workout.exercises.map((exercise, index) => {
                // Find paired exercise name if this is a superset
                const pairedExerciseName = exercise.is_superset && exercise.superset_with !== null
                  ? workout.exercises.find(ex => ex.order === exercise.superset_with)?.name
                  : null;
                
                return (
                  <ExerciseCard
                    key={index}
                    exercise={exercise}
                    pairedExerciseName={pairedExerciseName}
                    showAllSets={true} // Always show detailed view in workout detail
                    editMode={editExercisesMode}
                    isFirst={index === 0}
                    isLast={index === workout.exercises.length - 1}
                    pairingMode={pairingMode && pairingSourceIndex !== index}
                    exerciseIndex={index}
                    onEdit={() => handleEditExercise(index)}
                    onDelete={() => handleDeleteExercise(exercise.id)}
                    onMakeSuperset={() => handleStartPairing(index)}
                    onRemoveSuperset={() => handleRemoveSuperset(index)}
                    onMoveUp={() => handleMoveExercise(index, 'up')}
                    onMoveDown={() => handleMoveExercise(index, 'down')}
                    onAddSet={() => handleAddSet(exercise)}
                    onRemoveSet={(setIndex) => handleRemoveSet(exercise, setIndex)}
                    onUpdateSet={(setIndex, field, value) => 
                      handleUpdateSet(exercise, setIndex, field, value)
                    }
                    onUpdateNotes={(notes) => {
                      updateExercise({
                        templateId: workoutId,
                        exerciseId: exercise.id,
                        exercise: {
                          ...exercise,
                          notes
                        }
                      });
                    }}
                    onUpdateSupersetRestTime={(time) => {
                      // Update both exercises in the superset
                      if (exercise.is_superset && exercise.superset_with !== null) {
                        // Find paired exercise
                        const pairedExercise = workout.exercises.find(ex => 
                          ex.order === exercise.superset_with
                        );
                        
                        if (pairedExercise) {
                          // Update this exercise
                          updateExercise({
                            templateId: workoutId,
                            exerciseId: exercise.id,
                            exercise: {
                              ...exercise,
                              superset_rest_time: time
                            }
                          });
                          
                          // Update paired exercise
                          updateExercise({
                            templateId: workoutId,
                            exerciseId: pairedExercise.id,
                            exercise: {
                              ...pairedExercise,
                              superset_rest_time: time
                            }
                          });
                        }
                      }
                    }}
                    onSelect={pairingMode ? () => handlePairExercises(index) : undefined}
                  />
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="barbell-outline" size={48} color={COLORS.text.tertiary} />
              <Text style={styles.emptyStateText}>{t('no_exercises')}</Text>
              {editExercisesMode && (
                <TouchableOpacity
                  style={styles.emptyStateAddButton}
                  onPress={() => {
                    setCurrentExercise(null);
                    setExerciseSelectorVisible(true);
                  }}
                >
                  <Ionicons name="add-circle" size={20} color={COLORS.success} />
                  <Text style={styles.emptyStateAddText}>{t('add_your_first_exercise')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        
        {/* Tags Section (if any) */}
        {workout.tags && workout.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={styles.sectionTitle}>{t('tags')}</Text>
            <View style={styles.tagsContainer}>
              {workout.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
      
      {/* Floating Add Exercise Button (only in edit exercises mode) */}
      {editExercisesMode && (
        <TouchableOpacity
          style={[
            styles.floatingAddButton,
            keyboardVisible && { bottom: 80 } // Move up when keyboard is visible
          ]}
          onPress={() => {
            setCurrentExercise(null);
            setExerciseSelectorVisible(true);
          }}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}
      
      {/* Edit mode reminder (if in edit mode) */}
      {editMode && (
        <View style={styles.editModeReminder}>
          <Text style={styles.editModeText}>
            {editInfoMode 
              ? t('editing_workout_info')
              : t('tap_exercises_to_edit')}
          </Text>
        </View>
      )}
      
      {/* Exercise Selector Modal */}
      <ExerciseSelector
        visible={exerciseSelectorVisible}
        onClose={() => setExerciseSelectorVisible(false)}
        onSelectExercise={(exerciseName) => {
          setExerciseSelectorVisible(false);
          setCurrentExercise({
            name: exerciseName,
            sets: [{reps: 10, weight: 0, rest_time: 60}],
            is_superset: false,
            superset_with: null
          });
          setExerciseConfiguratorVisible(true);
        }}
      />
      
      {/* Exercise Configurator Modal */}
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
            ? workout?.exercises.find(ex => ex.order === currentExercise.superset_with)?.name || null
            : null
        }
        isEdit={!!currentExercise?.id}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 16,
    paddingBottom: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  headerTitleInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 6,
    marginRight: 8,
  },
  typeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  creatorRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  creatorText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: 4,
  },
  workoutInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 10,
  },
  workoutInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text.primary,
    marginLeft: 4,
  },
  infoIcon: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  infoInput: {
    fontSize: 14,
    color: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 6,
    padding: 4,
    paddingHorizontal: 8,
    marginLeft: 4,
    minWidth: 80,
  },
  difficultySelector: {
    flexDirection: 'row',
    marginLeft: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  difficultyOption: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  difficultyOptionSelected: {
    backgroundColor: COLORS.primary,
  },
  difficultyOptionText: {
    fontSize: 12,
    color: COLORS.text.secondary,
  },
  difficultyOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  descriptionContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  descriptionText: {
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 18,
  },
  descriptionInput: {
    fontSize: 13,
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    padding: 8,
    textAlignVertical: 'top',
    minHeight: 50,
  },
  // Keep all other styles..
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 24,
  },

  headerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  // Compact details row
  compactDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  compactDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
  compactDetailText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginLeft: 4,
  },
  compactDetailDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 6,
  },
  // Content styles
  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 0,
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
  exercisesSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    padding: 12,
  },
  exerciseControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseCount: {
    fontSize: 14,
    color: COLORS.text.secondary,
    padding:12,
  },
  exercisesList: {
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.text.tertiary,
    marginTop: 16,
    marginBottom: 12,
  },
  emptyStateAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  emptyStateAddText: {
    fontSize: 14,
    color: COLORS.success,
    marginLeft: 8,
  },
  tagsSection: {
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  tag: {
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  bottomPadding: {
    height: 80,
  },
  // Edit mode reminder
  editModeReminder: {
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  editModeText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Floating add button
  floatingAddButton: {
    position: 'absolute',
    bottom: 50,
    right: 10,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});