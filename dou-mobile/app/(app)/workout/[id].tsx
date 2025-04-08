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
  Modal,
  FlatList,
  Switch
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

// Exercise data imports - similar to what's used in Step2Exercises.tsx
import { EXERCISE_CATEGORIES, getAllExercises, searchExercises } from '../../../components/workouts/data/exerciseData';

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
  
  // State
  const [editMode, setEditMode] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [workoutDifficulty, setWorkoutDifficulty] = useState('beginner');
  const [workoutFocus, setWorkoutFocus] = useState('');
  const [editingExerciseId, setEditingExerciseId] = useState(null);
  
  // New state for exercise management
  const [exerciseModalVisible, setExerciseModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentExerciseName, setCurrentExerciseName] = useState('');
  const [currentExerciseSets, setCurrentExerciseSets] = useState([{...DEFAULT_SET}]);
  const [currentExerciseNotes, setCurrentExerciseNotes] = useState('');
  const [restTimeEnabled, setRestTimeEnabled] = useState(true);
  
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
    setEditingExerciseId(null);
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
  
  // New functions for adding exercises

  // Handle opening the add exercise modal
  const handleAddExercise = () => {
    setExerciseModalVisible(true);
  };

  // Handle selecting an exercise from the list
  const handleSelectExercise = (exerciseName) => {
    setCurrentExerciseName(exerciseName);
    setExerciseModalVisible(false);
    setEditModalVisible(true);
    
    // Reset exercise configuration
    setCurrentExerciseSets([{...DEFAULT_SET}]);
    setCurrentExerciseNotes('');
    setRestTimeEnabled(true);
  };

  // Handle adding a set to the current exercise being configured
  const handleAddSetToCurrent = () => {
    if (currentExerciseSets.length > 0) {
      // Copy values from the last set
      const lastSet = currentExerciseSets[currentExerciseSets.length - 1];
      setCurrentExerciseSets([...currentExerciseSets, {...lastSet}]);
    } else {
      setCurrentExerciseSets([...currentExerciseSets, {...DEFAULT_SET}]);
    }
  };

  // Handle removing a set from the current exercise being configured
  const handleRemoveSetFromCurrent = (index) => {
    const updatedSets = [...currentExerciseSets];
    updatedSets.splice(index, 1);
    setCurrentExerciseSets(updatedSets);
  };

  // Handle updating a set in the current exercise being configured
  const handleUpdateCurrentSet = (index, field, value) => {
    const updatedSets = [...currentExerciseSets];
    updatedSets[index] = {
      ...updatedSets[index],
      [field]: value
    };
    setCurrentExerciseSets(updatedSets);
  };

  // Handle toggle for rest time
  const handleToggleRestTime = (value) => {
    setRestTimeEnabled(value);
    
    // Update all sets to have either default rest time or zero
    const updatedSets = currentExerciseSets.map(set => ({
      ...set,
      rest_time: value ? (set.rest_time > 0 ? set.rest_time : 60) : 0
    }));
    
    setCurrentExerciseSets(updatedSets);
  };

  // Save the configured exercise to the workout
  const handleSaveNewExercise = async () => {
    if (!currentExerciseName.trim()) {
      Alert.alert(t('error'), t('exercise_name_required'));
      return;
    }
    
    if (currentExerciseSets.length === 0) {
      Alert.alert(t('error'), t('at_least_one_set_required'));
      return;
    }
    
    try {
      // Ensure each set has proper values
      const formattedSets = currentExerciseSets.map((set, index) => ({
        reps: set.reps || 0,
        weight: set.weight || 0,
        rest_time: restTimeEnabled ? (set.rest_time || 60) : 0,
        order: index
      }));
      
      const newExercise = {
        name: currentExerciseName,
        sets: formattedSets,
        notes: currentExerciseNotes || undefined,
        is_superset: false, // Default to not being a superset
        superset_with: null,
        order: workout.exercises ? workout.exercises.length : 0 // Add to the end
      };
      
      await addExercise({
        templateId: workoutId,
        exercise: newExercise
      });
      
      // Close modal and refresh data
      setEditModalVisible(false);
      refetch();
      
      // Reset state
      setCurrentExerciseName('');
      setCurrentExerciseSets([{...DEFAULT_SET}]);
      setCurrentExerciseNotes('');
      setSearchTerm('');
    } catch (error) {
      console.error('Failed to add exercise:', error);
      Alert.alert(t('error'), t('failed_to_add_exercise'));
    }
  };
  
  // Filter exercises based on search term
  const filteredExercises = searchTerm.length > 0
    ? searchExercises(searchTerm)
    : selectedCategory 
      ? EXERCISE_CATEGORIES.find(cat => cat.id === selectedCategory)?.exercises || []
      : getAllExercises();
  
  // Delete an exercise from the workout
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
  
  // Render a single exercise (always expanded)
  const renderExercise = (exercise, index) => {
    const isEditing = editingExerciseId === exercise.id;
    const isSuperset = exercise.is_superset;
    const pairedExerciseName = exercise.superset_paired_exercise?.name;
    
    return (
      <View key={index} style={[
        styles.exerciseContainer,
        isSuperset && styles.supersetContainer
      ]}>
        {/* Superset badge */}
        {isSuperset && (
          <View style={styles.supersetBadge}>
            <Ionicons name="git-branch-outline" size={14} color="#FFFFFF" />
            <Text style={styles.supersetBadgeText}>{t('superset')}</Text>
          </View>
        )}
        
        {/* Exercise Header */}
        <View style={styles.exerciseHeader}>
          <View style={styles.exerciseNameSection}>
            <Text style={styles.exerciseName}>{exercise.name}</Text>
            
            {/* Show paired exercise if this is a superset */}
            {isSuperset && pairedExerciseName && (
              <View style={styles.supersetPair}>
                <Ionicons name="swap-horizontal" size={14} color="#9CA3AF" />
                <Text style={styles.supersetPairText}>{pairedExerciseName}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.exerciseHeaderRight}>
            {exercise.sets?.length > 0 && (
              <View style={styles.setCountBadge}>
                <Text style={styles.setCountText}>{exercise.sets.length} {t('sets')}</Text>
              </View>
            )}
            
            {isCreator && editMode && (
              <View style={styles.exerciseActions}>
                <TouchableOpacity 
                  style={styles.editExerciseButton}
                  onPress={() => setEditingExerciseId(isEditing ? null : exercise.id)}
                >
                  <Ionicons 
                    name={isEditing ? "close-outline" : "create-outline"} 
                    size={18} 
                    color={COLORS.text.secondary} 
                  />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.deleteExerciseButton}
                  onPress={() => handleDeleteExercise(exercise.id)}
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        
        {/* Exercise sets - always visible */}
        <View style={styles.setsContainer}>
          {/* Superset rest time */}
          {isSuperset && exercise.superset_rest_time > 0 && (
            <View style={styles.supersetRestTimeInfo}>
              <Text style={styles.supersetRestTimeLabel}>
                {t('superset_rest')}:
              </Text>
              <Text style={styles.supersetRestTimeValue}>
                {formatRestTime(exercise.superset_rest_time)}
              </Text>
            </View>
          )}
          
          {/* Sets header */}
          <View style={styles.setsHeader}>
            <Text style={styles.setsHeaderText}>{t('set')}</Text>
            <Text style={styles.setsHeaderText}>{t('reps')}</Text>
            <Text style={styles.setsHeaderText}>{t('weight')} (kg)</Text>
            <Text style={styles.setsHeaderText}>{t('rest')} (s)</Text>
            {isEditing && <Text style={[styles.setsHeaderText, { flex: 0.5 }]}></Text>}
          </View>
          
          {/* Sets list */}
          {exercise.sets.map((set, setIndex) => (
            <View key={setIndex} style={styles.setRow}>
              <Text style={styles.setNumber}>{setIndex + 1}</Text>
              
              {isEditing ? (
                <>
                  <TextInput
                    style={styles.setInputValue}
                    value={set.reps?.toString() || ''}
                    onChangeText={(text) => handleUpdateSet(exercise, setIndex, 'reps', parseInt(text) || 0)}
                    keyboardType="number-pad"
                  />
                  <TextInput
                    style={styles.setInputValue}
                    value={set.weight?.toString() || ''}
                    onChangeText={(text) => handleUpdateSet(exercise, setIndex, 'weight', parseFloat(text) || 0)}
                    keyboardType="decimal-pad"
                  />
                  <TextInput
                    style={styles.setInputValue}
                    value={set.rest_time?.toString() || ''}
                    onChangeText={(text) => handleUpdateSet(exercise, setIndex, 'rest_time', parseInt(text) || 0)}
                    keyboardType="number-pad"
                  />
                  <TouchableOpacity 
                    style={[styles.removeSetButton, { flex: 0.5 }]} 
                    onPress={() => handleRemoveSet(exercise, setIndex)}
                  >
                    <Ionicons name="remove-circle-outline" size={18} color={COLORS.danger} />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.setValue}>{set.reps || '-'}</Text>
                  <Text style={styles.setValue}>{set.weight || '-'}</Text>
                  <Text style={styles.setValue}>{set.rest_time || '-'}</Text>
                </>
              )}
            </View>
          ))}
          
          {/* Add set button (only in edit mode) */}
          {isEditing && (
            <TouchableOpacity 
              style={styles.addSetButton}
              onPress={() => handleAddSet(exercise)}
            >
              <Ionicons name="add-circle-outline" size={18} color={COLORS.success} />
              <Text style={styles.addSetButtonText}>{t('add_set')}</Text>
            </TouchableOpacity>
          )}
          
          {/* Exercise notes if present */}
          {exercise.notes && (
            <View style={styles.exerciseNotes}>
              <Text style={styles.exerciseNotesLabel}>{t('notes')}:</Text>
              {isEditing ? (
                <TextInput
                  style={styles.exerciseNotesInput}
                  value={exercise.notes}
                  onChangeText={(text) => {
                    updateExercise({
                      templateId: workoutId,
                      exerciseId: exercise.id,
                      exercise: {
                        ...exercise,
                        notes: text
                      }
                    });
                  }}
                  multiline
                  numberOfLines={2}
                />
              ) : (
                <Text style={styles.exerciseNotesText}>{exercise.notes}</Text>
              )}
            </View>
          )}
        </View>
      </View>
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
      
      {/* Compact Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerControls}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerActions}>
            {isCreator && !editMode && (
              <>
                <TouchableOpacity 
                  style={styles.headerAction}
                  onPress={() => setEditMode(true)}
                >
                  <Ionicons name="create-outline" size={22} color="#FFFFFF" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.headerAction}
                  onPress={handleDeleteWorkout}
                >
                  <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </>
            )}
            
            {editMode && (
              <>
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
              </>
            )}
          </View>
        </View>
        
        {/* Workout Title (editable in edit mode) */}
        {editMode ? (
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
        
        {/* Type badge & creator info with inline details */}
        <View style={styles.infoRow}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {isTemplate ? t('template') : t('workout')}
            </Text>
          </View>
          
          <View style={styles.creatorInfo}>
            <Ionicons name="person" size={14} color={COLORS.text.secondary} />
            <Text style={styles.creatorText}>{workout.creator_username}</Text>
          </View>
        </View>
        
        {/* Compact workout details in a single row */}
        <View style={styles.compactDetailsRow}>
          <View style={styles.compactDetailItem}>
            <Ionicons name="barbell-outline" size={14} color={COLORS.text.secondary} />
            <Text style={styles.compactDetailText}>
              {formatFocus(workout.focus)}
            </Text>
          </View>
          
          <View style={styles.compactDetailDivider} />
          
          <View style={styles.compactDetailItem}>
            <Ionicons name="time-outline" size={14} color={COLORS.text.secondary} />
            <Text style={styles.compactDetailText}>
              {workout.estimated_duration} {t('min')}
            </Text>
          </View>
          
          <View style={styles.compactDetailDivider} />
          
          <View style={styles.compactDetailItem}>
            <Text style={styles.compactDetailText}>
              {getDifficultyIndicator(workout.difficulty_level)}
            </Text>
          </View>
          
          {!isTemplate && workout.preferred_weekday !== undefined && (
            <>
              <View style={styles.compactDetailDivider} />
              <View style={styles.compactDetailItem}>
                <Ionicons name="calendar-outline" size={14} color={COLORS.text.secondary} />
                <Text style={styles.compactDetailText}>
                  {getWeekdayName(workout.preferred_weekday)}
                </Text>
              </View>
            </>
          )}
        </View>
        
        {/* Description (editable in edit mode) - only if available */}
        {(editMode || workout.description) && (
          <View style={styles.descriptionContainer}>
            {editMode ? (
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
        <View style={styles.exercisesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('exercises')}</Text>
            <View style={styles.exerciseControls}>
              {editMode && (
                <TouchableOpacity
                  style={styles.addExerciseButton}
                  onPress={handleAddExercise}
                >
                  <Ionicons name="add-circle" size={18} color={COLORS.success} />
                  <Text style={styles.addExerciseText}>{t('add_exercise')}</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.exerciseCount}>
                {workout.exercises?.length || 0} {t('total')}
              </Text>
            </View>
          </View>
          
          {workout.exercises && workout.exercises.length > 0 ? (
            <View style={styles.exercisesList}>
              {workout.exercises.map((exercise, index) => renderExercise(exercise, index))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="barbell-outline" size={48} color={COLORS.text.tertiary} />
              <Text style={styles.emptyStateText}>{t('no_exercises')}</Text>
              {editMode && (
                <TouchableOpacity
                  style={styles.emptyStateAddButton}
                  onPress={handleAddExercise}
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
      
      {/* Edit mode reminder (if in edit mode) */}
      {editMode && (
        <View style={styles.editModeReminder}>
          <Text style={styles.editModeText}>
            {t('tap_exercises_to_edit')}
          </Text>
        </View>
      )}

      {/* Exercise Selection Modal */}
      <Modal
        visible={exerciseModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setExerciseModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('select_exercise')}</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setExerciseModalVisible(false)}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            {/* Search bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={16} color="#9CA3AF" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder={t('search_exercises')}
                placeholderTextColor="#9CA3AF"
                selectionColor="#0ea5e9"
              />
              {searchTerm.length > 0 && (
                <TouchableOpacity
                  style={styles.clearSearchButton}
                  onPress={() => setSearchTerm('')}
                >
                  <Ionicons name="close" size={14} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Category tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryTabs}
              contentContainerStyle={styles.categoryTabsContent}
            >
              <TouchableOpacity
                style={[
                  styles.categoryTab,
                  selectedCategory === null && styles.categoryTabSelected
                ]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text style={[
                  styles.categoryTabText,
                  selectedCategory === null && styles.categoryTabTextSelected
                ]}>
                  {t('all')}
                </Text>
              </TouchableOpacity>
              
              {EXERCISE_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryTab,
                    selectedCategory === category.id && styles.categoryTabSelected
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Text style={[
                    styles.categoryTabText,
                    selectedCategory === category.id && styles.categoryTabTextSelected
                  ]}>
                    {t(category.displayName.toLowerCase())}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {/* Exercises list */}
            <FlatList
              data={filteredExercises}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.exerciseListModal}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.exerciseItemModal}
                  onPress={() => handleSelectExercise(item.name)}
                >
                  <Text style={styles.exerciseItemText}>{item.name}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <View style={styles.emptySearch}>
                  <Text style={styles.emptySearchText}>
                    {searchTerm.length > 0 
                      ? t('no_matching_exercises') 
                      : t('no_exercises_in_category')}
                  </Text>
                  
                  {/* Custom exercise button */}
                  <TouchableOpacity
                    style={styles.customExerciseButton}
                    onPress={() => {
                      if (searchTerm.length > 0) {
                        handleSelectExercise(searchTerm);
                      } else {
                        Alert.alert(t('enter_exercise_name'), t('enter_custom_exercise_name'));
                      }
                    }}
                  >
                    <Ionicons name="add" size={16} color="#0ea5e9" />
                    <Text style={styles.customExerciseText}>
                      {searchTerm.length > 0 
                        ? t('add_custom_exercise_with_name', { name: searchTerm }) 
                        : t('add_custom_exercise')}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Exercise Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('configure_exercise')}</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.editModalScroll} contentContainerStyle={styles.editModalContent}>
              {/* Exercise name */}
              <View style={styles.configItemContainer}>
                <Text style={styles.configLabel}>{t('exercise_name')}</Text>
                <TextInput
                  style={styles.configInput}
                  value={currentExerciseName}
                  onChangeText={setCurrentExerciseName}
                  placeholder={t('enter_exercise_name')}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              
              {/* Rest time toggle */}
              <View style={styles.configItemContainer}>
                <Text style={styles.configLabel}>{t('rest_time')}</Text>
                <View style={styles.toggleContainer}>
                  <Text style={styles.toggleLabel}>
                    {restTimeEnabled ? t('enabled') : t('disabled')}
                  </Text>
                  <Switch
                    value={restTimeEnabled}
                    onValueChange={handleToggleRestTime}
                    trackColor={{ false: '#374151', true: 'rgba(14, 165, 233, 0.4)' }}
                    thumbColor={restTimeEnabled ? '#0ea5e9' : '#6B7280'}
                  />
                </View>
              </View>
              
              {/* Sets */}
              <View style={styles.configItemContainer}>
                <View style={styles.setsHeaderRow}>
                  <Text style={styles.configLabel}>{t('sets')}</Text>
                  <TouchableOpacity style={styles.addSetButtonConfig} onPress={handleAddSetToCurrent}>
                    <Ionicons name="add-circle" size={16} color="#10b981" />
                    <Text style={styles.addSetButtonConfigText}>{t('add_set')}</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Sets header */}
                <View style={styles.setsHeaderConfig}>
                  <Text style={styles.setHeaderTextConfig}>{t('set')}</Text>
                  <Text style={styles.setHeaderTextConfig}>{t('reps')}</Text>
                  <Text style={styles.setHeaderTextConfig}>{t('weight')} (kg)</Text>
                  {restTimeEnabled && (
                    <Text style={styles.setHeaderTextConfig}>{t('rest')} (s)</Text>
                  )}
                  <View style={{ width: 30 }} />
                </View>
                
                {/* Set rows */}
                {currentExerciseSets.map((set, index) => (
                  <View key={index} style={styles.setRowConfig}>
                    <Text style={styles.setNumberConfig}>{index + 1}</Text>
                    
                    <TextInput
                      style={styles.setInputConfig}
                      value={set.reps.toString()}
                      onChangeText={(text) => handleUpdateCurrentSet(index, 'reps', parseInt(text) || 0)}
                      keyboardType="number-pad"
                    />
                    
                    <TextInput
                      style={styles.setInputConfig}
                      value={set.weight.toString()}
                      onChangeText={(text) => handleUpdateCurrentSet(index, 'weight', parseFloat(text) || 0)}
                      keyboardType="decimal-pad"
                    />
                    
                    {restTimeEnabled && (
                      <TextInput
                        style={styles.setInputConfig}
                        value={set.rest_time.toString()}
                        onChangeText={(text) => handleUpdateCurrentSet(index, 'rest_time', parseInt(text) || 0)}
                        keyboardType="number-pad"
                      />
                    )}
                    
                    <TouchableOpacity
                      style={styles.removeSetButtonConfig}
                      onPress={() => handleRemoveSetFromCurrent(index)}
                      disabled={currentExerciseSets.length <= 1}
                    >
                      <Ionicons 
                        name="trash-outline" 
                        size={16} 
                        color={currentExerciseSets.length <= 1 ? "#6B7280" : "#ef4444"} 
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              
              {/* Notes */}
              <View style={styles.configItemContainer}>
                <Text style={styles.configLabel}>{t('notes')} ({t('optional')})</Text>
                <TextInput
                  style={styles.notesInput}
                  value={currentExerciseNotes}
                  onChangeText={setCurrentExerciseNotes}
                  placeholder={t('exercise_notes_placeholder')}
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                />
              </View>
              
              {/* Save button */}
              <TouchableOpacity style={styles.saveExerciseButton} onPress={handleSaveNewExercise}>
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.saveExerciseText}>{t('save_exercise')}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  // Redesigned compact header styles
  header: {
    padding: 16,
    paddingBottom: 12, // Reduced padding to make header more compact
  },
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12, // Reduced margin
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
  headerAction: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6, // Reduced margin
  },
  headerTitleInput: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6, // Reduced margin
  },
  typeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 10,
  },
  typeBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: 4,
  },
  // New compact details row
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
  // Content styles
  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  exercisesSection: {
    padding: 16,
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
  },
  exerciseControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 12,
  },
  addExerciseText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.success,
    marginLeft: 4,
  },
  exerciseCount: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  exercisesList: {
    marginBottom: 16,
  },
  exerciseContainer: {
    marginBottom: 12,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  exerciseHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setCountBadge: {
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 10,
  },
  setCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
  },
  editExerciseButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    marginRight: 6,
  },
  deleteExerciseButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  setsContainer: {
    padding: 12,
  },
  setsHeader: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  setsHeaderText: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
  },
  setRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  setNumber: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  setValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.text.primary,
  },
  setInputValue: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.text.primary,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    padding: 4,
    marginHorizontal: 2,
  },
  removeSetButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 6,
  },
  addSetButtonText: {
    fontSize: 14,
    color: COLORS.success,
    marginLeft: 6,
  },
  exerciseNotes: {
    marginTop: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 10,
  },
  exerciseNotesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  exerciseNotesText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
  },
  exerciseNotesInput: {
    fontSize: 14,
    color: COLORS.text.secondary,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    padding: 6,
    textAlignVertical: 'top',
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
    paddingHorizontal: 16,
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
    height: 40,
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
  supersetContainer: {
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)',
    backgroundColor: 'rgba(7, 89, 133, 0.1)',
  },
  supersetBadge: {
    position: 'absolute',
    top: -8,
    right: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  supersetBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 3,
  },
  exerciseNameSection: {
    flex: 1,
  },
  supersetPair: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  supersetPairText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  supersetRestTimeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    padding: 8,
    marginBottom: 12,
    borderRadius: 8,
  },
  supersetRestTimeLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginRight: 4,
  },
  supersetRestTimeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalCloseButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 15,
  },
  
  // Search styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#FFFFFF',
    fontSize: 14,
  },
  clearSearchButton: {
    padding: 4,
  },
  
  // Category tabs
  categoryTabs: {
    maxHeight: 50,
    marginBottom: 8,
  },
  categoryTabsContent: {
    paddingHorizontal: 16,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    marginRight: 8,
  },
  categoryTabSelected: {
    backgroundColor: COLORS.primary,
  },
  categoryTabText: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  categoryTabTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  
  // Exercise list in modal
  exerciseListModal: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  exerciseItemModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  exerciseItemText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  emptySearch: {
    padding: 20,
    alignItems: 'center',
  },
  emptySearchText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  customExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  customExerciseText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
    marginLeft: 8,
  },
  
  // Exercise Edit Modal
  editModalScroll: {
    flex: 1,
  },
  editModalContent: {
    padding: 16,
    paddingBottom: 100, // Space for save button
  },
  configItemContainer: {
    marginBottom: 20,
  },
  configLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  configInput: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  toggleLabel: {
    fontSize: 16,
    color: COLORS.text.primary,
  },
  
  // Sets in config modal
  setsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addSetButtonConfig: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addSetButtonConfigText: {
    fontSize: 14,
    color: COLORS.success,
    marginLeft: 4,
  },
  setsHeaderConfig: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  setHeaderTextConfig: {
    flex: 1,
    fontSize: 12,
    color: COLORS.text.tertiary,
    textAlign: 'center',
  },
  setRowConfig: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  setNumberConfig: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
  },
  setInputConfig: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 6,
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal: 4,
  },
  removeSetButtonConfig: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notesInput: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveExerciseButton: {
    backgroundColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  saveExerciseText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  
  // Switch component for React Native - used in toggles
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
});