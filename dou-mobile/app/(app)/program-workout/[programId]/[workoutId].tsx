// app/(app)/program-workout/[programId]/[workoutId].tsx
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
import { useAuth } from '../../../../hooks/useAuth';
import { useLanguage } from '../../../../context/LanguageContext';
import { useProgramWorkout, useUpdateProgramWorkout, useRemoveWorkoutFromProgram } from '../../../../hooks/query/useProgramQuery';
import { useProgram } from '../../../../hooks/query/useProgramQuery';

// Shared components
import ExerciseSelector from '../../../../components/workouts/ExerciseSelector';
import ExerciseConfigurator, { Exercise, ExerciseSet } from '../../../../components/workouts/ExerciseConfigurator';
import ExerciseCard from '../../../../components/workouts/ExerciseCard';
import { SupersetManager } from '../../../../components/workouts/utils/SupersetManager';

// Colors - using the same color scheme as the workout template page for consistency
const COLORS = {
  primary: "#0ea5e9", // Blue
  secondary: "#0284c7", // Darker blue
  tertiary: "#0369a1", // Even darker blue
  background: "#080f19", // Dark background
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

export default function ProgramWorkoutDetailScreen() {
  // Get IDs from route params
  const params = useLocalSearchParams();
  
  // Extract IDs with fallbacks
  const rawProgramId = params.programId;
  const rawWorkoutId = params.workoutId;
  
  let programId: number = 0;
  let workoutId: number = 0;
  
  // Handle different types of program ID that might come through
  if (typeof rawProgramId === 'string') {
    programId = parseInt(rawProgramId, 10) || 0;
  } else if (typeof rawProgramId === 'number') {
    programId = rawProgramId;
  } else if (Array.isArray(rawProgramId) && rawProgramId.length > 0) {
    const firstId = rawProgramId[0];
    programId = typeof firstId === 'string' ? parseInt(firstId, 10) || 0 : 
                typeof firstId === 'number' ? firstId : 0;
  }
  
  // Handle different types of workout ID that might come through
  if (typeof rawWorkoutId === 'string') {
    workoutId = parseInt(rawWorkoutId, 10) || 0;
  } else if (typeof rawWorkoutId === 'number') {
    workoutId = rawWorkoutId;
  } else if (Array.isArray(rawWorkoutId) && rawWorkoutId.length > 0) {
    const firstId = rawWorkoutId[0];
    workoutId = typeof firstId === 'string' ? parseInt(firstId, 10) || 0 : 
                typeof firstId === 'number' ? firstId : 0;
  }
  
  // State for workout details
  const [workoutName, setWorkoutName] = useState('');
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [workoutDifficulty, setWorkoutDifficulty] = useState('beginner');
  const [preferredWeekday, setPreferredWeekday] = useState(0);
  
  // State for edit modes
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
  const { data: workout, isLoading: isWorkoutLoading, refetch: refetchWorkout } = useProgramWorkout(programId, workoutId);
  const { data: program, isLoading: isProgramLoading } = useProgram(programId);
  const { mutateAsync: updateProgramWorkout } = useUpdateProgramWorkout();
  const { mutateAsync: removeWorkoutFromProgram } = useRemoveWorkoutFromProgram();
  
  // Initialize form state when workout data is loaded
  useEffect(() => {
    if (workout) {
      setWorkoutName(workout.name);
      setWorkoutDescription(workout.description || '');
      setWorkoutDuration(workout.estimated_duration || 0);
      setWorkoutDifficulty(workout.difficulty_level || 'beginner');
      setPreferredWeekday(workout.preferred_weekday || 0);
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
  
  // Check if current user is the program creator
  const isCreator = program?.creator_username === user?.username;
  
  // Get weekday name
  const getWeekdayName = (day?: number): string => {
    if (day === undefined) return '';
    const weekdays = [t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday'), t('sunday')];
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
  
  // Handle options menu - similar to workout page
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
          text: t('remove_workout'),
          style: 'destructive',
          onPress: handleRemoveWorkout
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
          text: t('weekday'),
          onPress: () => handleEditWorkoutWeekday()
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

  // Handle editing weekday
  const handleEditWorkoutWeekday = () => {
    const weekdays = [
      t('monday'), 
      t('tuesday'), 
      t('wednesday'), 
      t('thursday'), 
      t('friday'), 
      t('saturday'), 
      t('sunday')
    ];
    
    const options = weekdays.map((day, index) => ({
      text: day,
      onPress: () => {
        setPreferredWeekday(index);
        handleSaveWorkoutField('preferred_weekday', index);
      }
    }));
    
    // Add cancel option
    options.push({
      text: t('cancel'),
      style: 'cancel'
    });
    
    Alert.alert(
      t('select_weekday'),
      t('choose_preferred_weekday'),
      options
    );
  };

  // Handle saving individual workout field
  const handleSaveWorkoutField = async (field, value) => {
    try {
      // Create update object based on current workout data to ensure all required fields are included
      const updates = { 
        // Include current workout data first
        name: workout.name,
        description: workout.description || '',
        estimated_duration: workout.estimated_duration || 0,
        difficulty_level: workout.difficulty_level || 'beginner',
        preferred_weekday: workout.preferred_weekday || 0,
        split_method: workout.split_method,
        order: workout.order,
        program: programId,
        // Then add our updated field
        [field]: value
      };
      
      // Important: Include the existing exercises to prevent them from being deleted
      if (workout && workout.exercises) {
        updates.exercises = workout.exercises;
      }
      
      await updateProgramWorkout({
        programId,
        workoutId,
        updates
      });
      
      await refetchWorkout();
    } catch (error) {
      console.error(`Failed to update workout ${field}:`, error);
      Alert.alert(t('error'), t('failed_to_update_workout'));
    }
  };
  
  // Handle saving workout edits (for exercise editing mode)
  const handleDoneEditingExercises = async () => {
    setEditExercisesMode(false);
    setPairingMode(false);
    setPairingSourceIndex(null);
    await refetchWorkout();
  };
  
  // Handle removing the workout from program
  const handleRemoveWorkout = () => {
    Alert.alert(
      t('remove_workout'),
      t('confirm_remove_workout'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('remove'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await removeWorkoutFromProgram({
                programId,
                workoutId
              });
              router.back();
            } catch (error) {
              console.error('Failed to remove workout:', error);
              Alert.alert(t('error'), t('failed_to_remove_workout'));
            }
          }
        }
      ]
    );
  };
  
  // Handle editing an exercise
  const handleEditExercise = (index) => {
    const exercise = workout.exercises[index];
    setCurrentExercise({...exercise});
    setExerciseConfiguratorVisible(true);
  };
  
  // Handle saving an exercise (new or edited)
  const handleSaveExercise = (exercise) => {
    // Create a copy of the current workout exercises
    const updatedExercises = [...workout.exercises];
    
    if (currentExercise?.id) {
      // Update existing exercise
      const index = updatedExercises.findIndex(ex => ex.id === currentExercise.id);
      if (index !== -1) {
        updatedExercises[index] = {
          ...exercise,
          id: currentExercise.id,
          order: currentExercise.order
        };
      }
    } else {
      // Add new exercise
      updatedExercises.push({
        ...exercise,
        id: Date.now(), // Temporary ID for the UI
        order: updatedExercises.length
      });
    }
    
    // Update the workout with the new exercises
    const updates = {
      ...workout,
      exercises: updatedExercises
    };
    
    updateProgramWorkout({
      programId,
      workoutId,
      updates
    }).then(() => {
      setExerciseConfiguratorVisible(false);
      setCurrentExercise(null);
      refetchWorkout();
    }).catch(error => {
      console.error('Failed to update exercise:', error);
      Alert.alert(t('error'), t('failed_to_update_exercise'));
    });
  };
  
  // Handle adding a set to an exercise
  const handleAddSet = (exercise) => {
    // Create a new set based on the last set or with default values
    const lastSet = exercise.sets.length > 0 ? {...exercise.sets[exercise.sets.length - 1]} : { reps: 8, weight: 0, rest_time: 60 };
    const newSets = [...exercise.sets, lastSet];
    
    // Create a copy of the exercises array
    const updatedExercises = [...workout.exercises];
    const index = updatedExercises.findIndex(ex => ex.id === exercise.id);
    
    if (index !== -1) {
      // Update the exercise with the new set
      updatedExercises[index] = {
        ...exercise,
        sets: newSets
      };
      
      // Update the workout
      const updates = {
        ...workout,
        exercises: updatedExercises
      };
      
      updateProgramWorkout({
        programId,
        workoutId,
        updates
      }).then(() => {
        refetchWorkout();
      }).catch(error => {
        console.error('Failed to add set:', error);
        Alert.alert(t('error'), t('failed_to_add_set'));
      });
    }
  };
  
  // Handle removing a set from an exercise
  const handleRemoveSet = (exercise, setIndex) => {
    if (exercise.sets.length <= 1) {
      Alert.alert(t('error'), t('exercise_needs_at_least_one_set'));
      return;
    }
    
    const newSets = exercise.sets.filter((_, index) => index !== setIndex);
    
    // Create a copy of the exercises array
    const updatedExercises = [...workout.exercises];
    const index = updatedExercises.findIndex(ex => ex.id === exercise.id);
    
    if (index !== -1) {
      // Update the exercise with the new sets
      updatedExercises[index] = {
        ...exercise,
        sets: newSets
      };
      
      // Update the workout
      const updates = {
        ...workout,
        exercises: updatedExercises
      };
      
      updateProgramWorkout({
        programId,
        workoutId,
        updates
      }).then(() => {
        refetchWorkout();
      }).catch(error => {
        console.error('Failed to remove set:', error);
        Alert.alert(t('error'), t('failed_to_remove_set'));
      });
    }
  };
  
  // Handle updating a set's values
  const handleUpdateSet = (exercise, setIndex, field, value) => {
    const newSets = [...exercise.sets];
    newSets[setIndex] = {
      ...newSets[setIndex],
      [field]: value
    };
    
    // Create a copy of the exercises array
    const updatedExercises = [...workout.exercises];
    const index = updatedExercises.findIndex(ex => ex.id === exercise.id);
    
    if (index !== -1) {
      // Update the exercise with the modified sets
      updatedExercises[index] = {
        ...exercise,
        sets: newSets
      };
      
      // Update the workout
      const updates = {
        ...workout,
        exercises: updatedExercises
      };
      
      updateProgramWorkout({
        programId,
        workoutId,
        updates
      }).then(() => {
        refetchWorkout();
      }).catch(error => {
        console.error('Failed to update set:', error);
        Alert.alert(t('error'), t('failed_to_update_set'));
      });
    }
  };
  
  // Handle deleting an exercise
  const handleDeleteExercise = (exerciseId) => {
    Alert.alert(
      t('delete_exercise'),
      t('confirm_delete_exercise'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          style: 'destructive',
          onPress: () => {
            // Filter out the exercise to delete
            const updatedExercises = workout.exercises.filter(ex => ex.id !== exerciseId);
            
            // Update exercise order values
            updatedExercises.forEach((ex, idx) => {
              ex.order = idx;
            });
            
            // Update the workout
            const updates = {
              ...workout,
              exercises: updatedExercises
            };
            
            updateProgramWorkout({
              programId,
              workoutId,
              updates
            }).then(() => {
              refetchWorkout();
            }).catch(error => {
              console.error('Failed to delete exercise:', error);
              Alert.alert(t('error'), t('failed_to_delete_exercise'));
            });
          }
        }
      ]
    );
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
    
    // Create a copy of the exercises array
    const updatedExercises = SupersetManager.createSuperset(
      workout.exercises,
      pairingSourceIndex,
      targetIndex,
      90
    );
    
    // Update the workout
    const updates = {
      ...workout,
      exercises: updatedExercises
    };
    
    updateProgramWorkout({
      programId,
      workoutId,
      updates
    }).then(() => {
      setPairingMode(false);
      setPairingSourceIndex(null);
      refetchWorkout();
    }).catch(error => {
      console.error('Failed to create superset:', error);
      Alert.alert(t('error'), t('failed_to_create_superset'));
    });
  };
  
  // Remove superset pairing
  const handleRemoveSuperset = (index) => {
    // Create a copy of the exercises array
    const updatedExercises = SupersetManager.removeSuperset(
      workout.exercises,
      index
    );
    
    // Update the workout
    const updates = {
      ...workout,
      exercises: updatedExercises
    };
    
    updateProgramWorkout({
      programId,
      workoutId,
      updates
    }).then(() => {
      refetchWorkout();
    }).catch(error => {
      console.error('Failed to remove superset:', error);
      Alert.alert(t('error'), t('failed_to_remove_superset'));
    });
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
    
    // Use the SupersetManager to reorder exercises while maintaining superset relationships
    const updatedExercises = SupersetManager.reorderExercises(
      workout.exercises,
      index,
      targetIndex
    );
    
    // Update the workout
    const updates = {
      ...workout,
      exercises: updatedExercises
    };
    
    updateProgramWorkout({
      programId,
      workoutId,
      updates
    }).then(() => {
      refetchWorkout();
    }).catch(error => {
      console.error('Failed to move exercise:', error);
      Alert.alert(t('error'), t('failed_to_move_exercise'));
    });
  };
  
  // Update exercise notes
  const handleUpdateExerciseNotes = (exercise, notes) => {
    // Create a copy of the exercises array
    const updatedExercises = [...workout.exercises];
    const index = updatedExercises.findIndex(ex => ex.id === exercise.id);
    
    if (index !== -1) {
      // Update the exercise notes
      updatedExercises[index] = {
        ...exercise,
        notes
      };
      
      // Update the workout
      const updates = {
        ...workout,
        exercises: updatedExercises
      };
      
      updateProgramWorkout({
        programId,
        workoutId,
        updates
      }).then(() => {
        refetchWorkout();
      }).catch(error => {
        console.error('Failed to update notes:', error);
        Alert.alert(t('error'), t('failed_to_update_notes'));
      });
    }
  };
  
  // Update superset rest time
  const handleUpdateSupersetRestTime = (exercise, time) => {
    if (!exercise.is_superset || exercise.superset_with === null) {
      return;
    }
    
    // Create a copy of the exercises array
    const updatedExercises = SupersetManager.updateSupersetRestTime(
      workout.exercises,
      workout.exercises.findIndex(ex => ex.id === exercise.id),
      time
    );
    
    // Update the workout
    const updates = {
      ...workout,
      exercises: updatedExercises
    };
    
    updateProgramWorkout({
      programId,
      workoutId,
      updates
    }).then(() => {
      refetchWorkout();
    }).catch(error => {
      console.error('Failed to update superset rest time:', error);
      Alert.alert(t('error'), t('failed_to_update_rest_time'));
    });
  };
  
  // Calculate loading state
  const isLoading = isWorkoutLoading || isProgramLoading;
  
  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }
  
  // Render error state if workout or program not found
  if (!workout || !program) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={60} color="#EF4444" />
        <Text style={styles.errorTitle}>{t('workout_not_found')}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>{t('back_to_program')}</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#080f19" />
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          {/* Top row with back button, title and actions */}
          <View style={styles.headerTopRow}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle} numberOfLines={1}>
              {workout.name}
            </Text>
            
            <View style={styles.headerActions}>
              {isCreator && !editExercisesMode && (
                <TouchableOpacity 
                  style={styles.optionsButton}
                  onPress={handleOptionsMenu}
                >
                  <Ionicons name="ellipsis-vertical" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              
              {editExercisesMode && (
                <TouchableOpacity 
                  style={styles.doneButton}
                  onPress={handleDoneEditingExercises}
                >
                  <Text style={styles.doneButtonText}>{t('done')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {/* Program info row */}
          <View style={styles.programInfoRow}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{t('workout')}</Text>
            </View>
            
            <View style={styles.programInfo}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.text.secondary} />
              <Text style={styles.programText}>{program.name}</Text>
            </View>
          </View>
          
          {/* Compact workout details */}
          <View style={styles.workoutInfoRow}>
            {/* Difficulty */}
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>{getDifficultyIndicator(workout.difficulty_level)}</Text>
              <Text style={styles.infoText}>{t(workout.difficulty_level)}</Text>
            </View>
            
            {/* Duration */}
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={16} color={COLORS.text.secondary} />
              <Text style={styles.infoText}>{workout.estimated_duration} {t('min')}</Text>
            </View>
            
            {/* Weekday */}
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.text.secondary} />
              <Text style={styles.infoText}>{getWeekdayName(workout.preferred_weekday)}</Text>
            </View>
          </View>
          
          {/* Description (shown only if it exists) */}
          {workout.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionLabel}>{t('description')}</Text>
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
            <Text style={styles.exerciseCount}>
              {workout.exercises?.length || 0} {t('total')}
            </Text>
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
                    showAllSets={true} // Always show detailed view
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
                    onUpdateNotes={(notes) => handleUpdateExerciseNotes(exercise, notes)}
                    onUpdateSupersetRestTime={(time) => handleUpdateSupersetRestTime(exercise, time)}
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
      
      {/* Edit mode reminder (if in edit exercises mode) */}
      {editExercisesMode && (
        <View style={styles.editModeReminder}>
          <Text style={styles.editModeText}>
            {t('tap_exercises_to_edit')}
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
    padding: 12,
    paddingBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 10,
    marginRight: 5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionsButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  doneButton: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  programInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  programInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  programText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  workoutInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    marginHorizontal: 6,
    minWidth: '45%',
  },
  infoIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text.primary,
    marginLeft: 6,
  },
  descriptionContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 12,
    padding: 10,
  },
  descriptionLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
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
  
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  typeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  contentContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
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
  },
  exerciseCount: {
    fontSize: 14,
    color: COLORS.text.secondary,
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
    bottom: 20,
    right: 20,
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