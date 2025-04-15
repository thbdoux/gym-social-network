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
import { useTheme } from '../../../context/ThemeContext'; // Import ThemeContext
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
import { SupersetManager } from '../../../components/workouts/utils/SupersetManager';

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
  
  // Get theme context
  const { workoutPalette, palette } = useTheme();
  
  // Create dynamic theme colors
  const COLORS = {
    primary: workoutPalette.background,
    secondary: workoutPalette.highlight,
    tertiary: workoutPalette.border,
    background: palette.page_background,
    card: "#1F2937", // Keeping consistent with other screens
    text: {
      primary: workoutPalette.text,
      secondary: workoutPalette.text_secondary,
      tertiary: "rgba(255, 255, 255, 0.5)"
    },
    border: workoutPalette.border,
    success: "#10b981", // Keep universal success color
    danger: "#ef4444" // Keep universal danger color
  };
  
  // State for workout details
  const [workoutName, setWorkoutName] = useState('');
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [workoutDifficulty, setWorkoutDifficulty] = useState('beginner');
  const [workoutFocus, setWorkoutFocus] = useState('');
  
  // State for exercise edit mode
  const [editExercisesMode, setEditExercisesMode] = useState(false);
  const [localExercises, setLocalExercises] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // State for exercise management
  const [exerciseSelectorVisible, setExerciseSelectorVisible] = useState(false);
  const [exerciseConfiguratorVisible, setExerciseConfiguratorVisible] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [pairingMode, setPairingMode] = useState(false);
  const [pairingSourceIndex, setPairingSourceIndex] = useState(-1);
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
    }
  }, [workout]);
  
  // Initialize local exercises when edit mode is entered
  useEffect(() => {
    if (editExercisesMode && workout?.exercises) {
      // Create a deep copy to work with locally
      setLocalExercises(JSON.parse(JSON.stringify(workout.exercises)));
    }
  }, [editExercisesMode, workout?.exercises]);
  
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
  
  // Effect to exit pairing mode on back press
  useEffect(() => {
    const backHandler = () => {
      if (pairingMode) {
        setPairingMode(false);
        setPairingSourceIndex(-1);
        return true; // Handled
      }
      return false; // Not handled
    };
    
    // We'd normally add an event listener for hardware back button here
    // but for simplicity, we'll just ensure pairingMode is reset when
    // editing mode is exited
    
    return () => {
      // Cleanup if needed
    };
  }, [pairingMode]);
  
  // Check if current user is the workout creator
  const isCreator = workout?.creator_username === user?.username;
  const isTemplate = !workout?.preferred_weekday; // If it has preferred_weekday, it's an instance
  
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
  
  // Handle options menu
  const handleOptionsMenu = () => {
    Alert.alert(
      t('workout_options'),
      t('select_an_option'),
      [
        {
          text: t('edit_workout_info'),
          onPress: () => handleEditWorkoutInfo()
        },
        {
          text: t('edit_exercises'),
          onPress: () => setEditExercisesMode(true)
        },
        {
          text: t('delete_workout'),
          style: 'destructive',
          onPress: handleDeleteWorkout
        },
        {
          text: t('cancel'),
          style: 'cancel'
        }
      ]
    );
  };

  // Handle editing workout info
  const handleEditWorkoutInfo = () => {
    Alert.alert(
      t('edit_workout_info'),
      t('select_field_to_edit'),
      [
        {
          text: t('name'),
          onPress: () => handleEditWorkoutName()
        },
        {
          text: t('description'),
          onPress: () => handleEditWorkoutDescription()
        },
        {
          text: t('duration'),
          onPress: () => handleEditWorkoutDuration()
        },
        {
          text: t('difficulty'),
          onPress: () => handleEditWorkoutDifficulty()
        },
        {
          text: t('cancel'),
          style: 'cancel'
        }
      ]
    );
  };

  // Handle editing workout name
  const handleEditWorkoutName = () => {
    Alert.prompt(
      t('edit_name'),
      t('enter_new_workout_name'),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('save'),
          onPress: (name) => {
            if (name && name.trim() !== '') {
              setWorkoutName(name);
              handleSaveWorkoutField('name', name);
            }
          }
        }
      ],
      'plain-text',
      workoutName
    );
  };

  // Handle editing workout description
  const handleEditWorkoutDescription = () => {
    Alert.prompt(
      t('edit_description'),
      t('enter_new_workout_description'),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('save'),
          onPress: (description) => {
            setWorkoutDescription(description || '');
            handleSaveWorkoutField('description', description || '');
          }
        }
      ],
      'plain-text',
      workoutDescription
    );
  };

  // Handle editing workout duration
  const handleEditWorkoutDuration = () => {
    Alert.prompt(
      t('edit_duration'),
      t('enter_duration_in_minutes'),
      [
        {
          text: t('cancel'),
          style: 'cancel'
        },
        {
          text: t('save'),
          onPress: (durationText) => {
            const duration = parseInt(durationText || '0', 10);
            setWorkoutDuration(duration);
            handleSaveWorkoutField('estimated_duration', duration);
          }
        }
      ],
      'plain-text',
      workoutDuration.toString(),
      'numeric'
    );
  };

  // Handle editing workout difficulty
  const handleEditWorkoutDifficulty = () => {
    Alert.alert(
      t('edit_difficulty'),
      t('select_difficulty_level'),
      [
        {
          text: t('beginner'),
          onPress: () => {
            setWorkoutDifficulty('beginner');
            handleSaveWorkoutField('difficulty_level', 'beginner');
          }
        },
        {
          text: t('intermediate'),
          onPress: () => {
            setWorkoutDifficulty('intermediate');
            handleSaveWorkoutField('difficulty_level', 'intermediate');
          }
        },
        {
          text: t('advanced'),
          onPress: () => {
            setWorkoutDifficulty('advanced');
            handleSaveWorkoutField('difficulty_level', 'advanced');
          }
        },
        {
          text: t('cancel'),
          style: 'cancel'
        }
      ]
    );
  };

  // Handle saving individual workout field
  const handleSaveWorkoutField = async (field, value) => {
    try {
      const updates = { [field]: value };
      await updateWorkout({
        id: workoutId,
        updates
      });
      await refetch();
    } catch (error) {
      console.error(`Failed to update workout ${field}:`, error);
      Alert.alert(t('error'), t('failed_to_update_workout'));
    }
  };
  
  // Handle cancelling edit mode
  const handleCancelEditing = () => {
    setPairingMode(false);
    setEditExercisesMode(false);
    setHasUnsavedChanges(false);
  };
  
  // Handle saving changes in edit mode
  const handleSaveChanges = async () => {
    setPairingMode(false); // Exit pairing mode if active
    try {
      // Save each exercise to the backend
      for (const exercise of localExercises) {
        if (workout.exercises.some(e => e.id === exercise.id)) {
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
      for (const originalExercise of workout.exercises) {
        if (!localExercises.some(e => e.id === originalExercise.id)) {
          // This exercise was deleted, so remove it from the backend
          await deleteExercise({
            templateId: workoutId,
            exerciseId: originalExercise.id
          });
        }
      }
      
      // Exit edit mode and refresh data
      setEditExercisesMode(false);
      setHasUnsavedChanges(false);
      await refetch();
    } catch (error) {
      console.error('Failed to save exercises:', error);
      Alert.alert(t('error'), t('failed_to_save_changes'));
    }
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
    const exerciseIndex = localExercises.findIndex(e => e.id === exercise.id);
    if (exerciseIndex === -1) return;
    
    // Create a deep copy of the exercises array
    const updatedExercises = JSON.parse(JSON.stringify(localExercises));
    
    // Get last set for reference or create default
    const lastSet = exercise.sets.length > 0 
      ? {...exercise.sets[exercise.sets.length - 1]} 
      : { reps: 10, weight: 0, rest_time: 60 };
    
    // Add the new set
    updatedExercises[exerciseIndex].sets.push(lastSet);
    
    // Update local state
    setLocalExercises(updatedExercises);
    setHasUnsavedChanges(true);
  };

  // Handle removing a set from an exercise
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

  // Handle updating a set's values
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
  
  // Start superset pairing mode
  const handleMakeSuperset = (index) => {
    // Enter pairing mode and store the source exercise index
    setPairingMode(true);
    setPairingSourceIndex(index);
  };
  
  // Cancel pairing mode
  const handleCancelPairing = () => {
    setPairingMode(false);
    setPairingSourceIndex(-1);
  };
  
  // Pair exercises as superset
  const handleSelectPair = (targetIndex) => {
    if (pairingSourceIndex === targetIndex) {
      Alert.alert(t('error'), t('cannot_pair_with_itself'));
      return;
    }
    
    // Create the superset relationship using SupersetManager
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
  
  // Remove superset pairing
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
  
  // Handle moving exercise up
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
  
  // Handle moving exercise down
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
  
  // Handle editing an exercise
  const handleEditExercise = (index) => {
    // Use localExercises when in edit mode, otherwise use workout.exercises
    const exercise = editExercisesMode 
      ? localExercises[index] 
      : workout.exercises[index];
    setCurrentExercise({...exercise});
    setExerciseConfiguratorVisible(true);
  };
  
  // Handle deleting an exercise
  const handleDeleteExercise = (exerciseIndex) => {
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
  };
  
  // Handle updating exercise notes
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
  
  // Handle saving an exercise (edited)
  const handleSaveExercise = (exercise) => {
    if (editExercisesMode) {
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
    } else {
      // Direct API call when not in edit mode
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
        }).then(() => refetch());
      } else {
        // Add new exercise
        addExercise({
          templateId: workoutId,
          exercise: {
            ...exercise,
            order: workout.exercises ? workout.exercises.length : 0
          }
        }).then(() => refetch());
      }
    }
    
    setExerciseConfiguratorVisible(false);
    setCurrentExercise(null);
  };
  
  // Handle selecting an exercise from the selector
  const handleSelectExercise = (exerciseName) => {
    // Create a new exercise with the selected name
    const newExerciseId = Date.now(); // Simple ID generation
    const newExercise = {
      id: newExerciseId,
      name: exerciseName,
      sets: [{ reps: 10, weight: 0, rest_time: 60 }],
      order: localExercises.length
    };
    
    // Add to local exercises
    const updatedExercises = [...localExercises, newExercise];
    setLocalExercises(updatedExercises);
    setHasUnsavedChanges(true);
    setExerciseSelectorVisible(false);
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: COLORS.background }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, { color: COLORS.text.primary }]}>{t('loading')}</Text>
      </View>
    );
  }
  
  // Render error state if workout not found
  if (!workout) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: COLORS.background }]}>
        <Ionicons name="alert-circle-outline" size={60} color={COLORS.danger} />
        <Text style={[styles.errorTitle, { color: COLORS.text.primary }]}>
          {isTemplate ? t('template_not_found') : t('workout_not_found')}
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={[styles.backButtonText, { color: COLORS.text.primary }]}>{t('back_to_workouts')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: COLORS.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        {/* Top Row: Back button, Title, Options */}
        <View style={styles.headerTopRow}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {workout.name}
            </Text>
          </View>
          
          {isCreator && !editExercisesMode ? (
            <TouchableOpacity 
              style={styles.optionsButton}
              onPress={handleOptionsMenu}
            >
              <Ionicons name="ellipsis-vertical" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
          ) : editExercisesMode ? (
            // Simplified edit mode actions - just Save and Cancel
            <View style={styles.editModeActions}>
              {/* Cancel button */}
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleCancelEditing}
              >
                <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
              </TouchableOpacity>
              
              {/* Save button - single button for all changes */}
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSaveChanges}
              >
                <Ionicons name="save-outline" size={16} color={COLORS.text.primary} style={styles.saveButtonIcon} />
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
          <View style={[styles.typeBadge, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
            <Text style={styles.typeBadgeText}>
              {isTemplate ? t('template') : t('workout')}
            </Text>
          </View>
        </View>
        
        {/* Workout Info Row */}
        <View style={styles.workoutInfoRow}>
          
          {/* Duration */}
          <View style={styles.workoutInfoItem}>
            <Ionicons name="time-outline" size={14} color={COLORS.text.secondary} />
            <Text style={styles.infoText}>
              {workout.estimated_duration} {t('min')}
            </Text>
          </View>
          
          {/* Difficulty */}
          <View style={styles.workoutInfoItem}>
            <Text style={styles.infoIcon}>
              {getDifficultyIndicator(workout.difficulty_level)}
            </Text>
            <Text style={styles.infoText}>
              {t(workout.difficulty_level || 'beginner')}
            </Text>
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
        
        {/* Description - only if available */}
        {workout.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText} numberOfLines={2}>
              {workout.description}
            </Text>
          </View>
        )}
      </LinearGradient>
      
      {/* Exercise List */}
      <ScrollView style={styles.contentContainer}>
        {/* Pairing mode indicator */}
        {pairingMode && (
          <View style={[styles.pairingModeIndicator, { 
            backgroundColor: `rgba(${hexToRgb(COLORS.primary)}, 0.1)` 
          }]}>
            <Ionicons name="link" size={16} color={COLORS.primary} />
            <Text style={[styles.pairingModeText, { color: COLORS.primary }]}>{t('select_exercise_to_pair')}</Text>
            <TouchableOpacity onPress={handleCancelPairing} style={[styles.cancelPairingButton, {
              backgroundColor: 'rgba(239, 68, 68, 0.2)'
            }]}>
              <Ionicons name="close-circle" size={16} color={COLORS.danger} />
              <Text style={[styles.cancelPairingText, { color: COLORS.danger }]}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.exercisesSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>{t('exercises')}</Text>
            <View style={styles.exerciseControls}>
              <Text style={[styles.exerciseCount, { color: COLORS.text.secondary }]}>
                {editExercisesMode 
                  ? localExercises?.length || 0 
                  : workout.exercises?.length || 0
                } {t('total')}
              </Text>
            </View>
          </View>
          
          {editExercisesMode ? (
            // In edit mode, map over localExercises
            localExercises && localExercises.length > 0 ? (
              <View style={styles.exercisesList}>
                {localExercises.map((exercise, index) => {
                  // Find paired exercise name if this is a superset
                  const pairedExerciseName = exercise.is_superset && exercise.superset_with !== null
                    ? localExercises.find(ex => ex.order === exercise.superset_with)?.name
                    : null;
                  
                  return (
                    <ExerciseCard
                      key={index}
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
                })}
              </View>
            ) : (
              // Empty state for edit mode
              <View style={[styles.emptyState, { backgroundColor: COLORS.card }]}>
                <Ionicons name="barbell-outline" size={48} color={COLORS.text.tertiary} />
                <Text style={[styles.emptyStateText, { color: COLORS.text.tertiary }]}>{t('no_exercises')}</Text>
                <TouchableOpacity 
                  style={[styles.emptyStateAddButton, { 
                    backgroundColor: `rgba(${hexToRgb(COLORS.success)}, 0.1)` 
                  }]}
                  onPress={() => setExerciseSelectorVisible(true)}
                >
                  <Ionicons name="add-circle" size={20} color={COLORS.success} />
                  <Text style={[styles.emptyStateAddText, { color: COLORS.success }]}>{t('add_your_first_exercise')}</Text>
                </TouchableOpacity>
              </View>
            )
          ) : (
            // Normal mode - display workout.exercises
            workout.exercises && workout.exercises.length > 0 ? (
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
                      showAllSets={true}
                      editMode={false}
                      exerciseIndex={index}
                      // Important: Ensure these are passed even in view mode
                      isFirst={index === 0}
                      isLast={index === workout.exercises.length - 1}
                    />
                  );
                })}
              </View>
            ) : (
              // Empty state for normal mode
              <View style={[styles.emptyState, { backgroundColor: COLORS.card }]}>
                <Ionicons name="barbell-outline" size={48} color={COLORS.text.tertiary} />
                <Text style={[styles.emptyStateText, { color: COLORS.text.tertiary }]}>{t('no_exercises')}</Text>
                {isCreator && (
                  <TouchableOpacity
                    style={[styles.emptyStateAddButton, { 
                      backgroundColor: `rgba(${hexToRgb(COLORS.success)}, 0.1)` 
                    }]}
                    onPress={() => setEditExercisesMode(true)}
                  >
                    <Ionicons name="add-circle" size={20} color={COLORS.success} />
                    <Text style={[styles.emptyStateAddText, { color: COLORS.success }]}>{t('add_exercises')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )
          )}
        </View>
        
        {/* Tags Section (if any) */}
        {workout.tags && workout.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={[styles.sectionTitle, { color: COLORS.text.primary }]}>{t('tags')}</Text>
            <View style={styles.tagsContainer}>
              {workout.tags.map((tag, index) => (
                <View key={index} style={[styles.tag, { 
                  backgroundColor: `rgba(${hexToRgb(COLORS.primary)}, 0.2)` 
                }]}>
                  <Text style={[styles.tagText, { color: COLORS.text.secondary }]}>#{tag}</Text>
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
            { backgroundColor: COLORS.primary },
            keyboardVisible && { bottom: 80 } // Move up when keyboard is visible
          ]}
          onPress={() => setExerciseSelectorVisible(true)}
        >
          <Ionicons name="add" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
      )}
      
      {/* Edit mode reminder (if in edit exercises mode) */}
      {editExercisesMode && (
        <View style={[styles.editModeReminder, { 
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          borderTopColor: 'rgba(255, 255, 255, 0.1)'
        }]}>
          <Text style={[styles.editModeText, { color: COLORS.text.secondary }]}>
            {pairingMode 
              ? t('select_exercise_to_pair_with') 
              : t('tap_exercises_to_edit')}
          </Text>
          {pairingMode && (
            <TouchableOpacity 
              style={[styles.cancelPairingButton, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}
              onPress={() => setPairingMode(false)}
            >
              <Text style={[styles.cancelPairingText, { color: COLORS.danger }]}>{t('cancel_pairing')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
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
              ? (editExercisesMode 
                  ? localExercises 
                  : workout?.exercises
                ).find(ex => ex.order === currentExercise.superset_with)?.name || null
              : null
          }
          isEdit={!!currentExercise?.id}
        />
      )}
    </SafeAreaView>
  );
}

// Utility function to convert hex colors to RGB string for rgba()
function hexToRgb(hex) {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `${r}, ${g}, ${b}`;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    padding: 12,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 5,
  },
  optionsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  editModeActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 13,
    fontWeight: '500',
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
  saveButtonIcon: {
    marginRight: 4,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  doneButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  doneButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
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
    color: 'rgba(255, 255, 255, 0.7)',
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
    color: '#FFFFFF',
    marginLeft: 4,
  },
  infoIcon: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
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
  contentContainer: {
    flex: 1,
    padding: 16,
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
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  cancelPairingText: {
    fontSize: 12,
    fontWeight: '500',
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
  },
  exerciseControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseCount: {
    fontSize: 14,
  },
  exercisesList: {
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 12,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  emptyStateAddText: {
    fontSize: 14,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
  },
  bottomPadding: {
    height: 80,
  },
  // Edit mode reminder
  editModeReminder: {
    padding: 12,
    borderTopWidth: 1,
  },
  editModeText: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Floating add button
  floatingAddButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});