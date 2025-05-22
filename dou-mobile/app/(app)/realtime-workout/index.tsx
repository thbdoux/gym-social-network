// app/(app)/realtime-workout/index.tsx - Simplified to use only context
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  SafeAreaView,
  StatusBar,
  Platform,
  BackHandler,
  FlatList,
  ScrollView,
  Alert
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { router } from 'expo-router';
import { useLanguage } from '../../../context/LanguageContext';
import { useWorkout } from '../../../context/WorkoutContext';
import { useCreateLog } from '../../../hooks/query/useLogQuery';
import { useProgram } from '../../../hooks/query/useProgramQuery';
import { useWorkoutTemplate } from '../../../hooks/query/useWorkoutQuery';
import { useTheme } from '../../../context/ThemeContext';
import { createThemedStyles } from '../../../utils/createThemedStyles';
import { createWorkoutRendering } from './workoutRendering';

export default function RealtimeWorkoutLogger() {
  const { t } = useLanguage();
  const { palette } = useTheme();
  const styles = themedStyles(palette);
  const { mutateAsync: createLog } = useCreateLog();
  
  // Context is the SINGLE source of truth
  const {
    activeWorkout,
    hasActiveWorkout,
    startWorkout,
    updateWorkout,
    endWorkout,
    toggleTimer
  } = useWorkout();
  
  // Get search params
  const params = useLocalSearchParams();
  const sourceType = params.source as string || 'custom';
  const templateId = params.templateId ? Number(params.templateId) : null;
  const programId = params.programId ? Number(params.programId) : null;
  const workoutId = params.workoutId ? Number(params.workoutId) : null;
  const isResuming = params.resume === 'true';
  
  // Fetch template/program data for initial setup only
  const { data: template } = useWorkoutTemplate(templateId);
  const { data: program } = useProgram(programId);
  const programWorkout = program?.workouts?.find(w => w.id === workoutId);
  
  // Local UI state only (not workout data)
  const [workoutName, setWorkoutName] = useState('');
  const [selectingExercise, setSelectingExercise] = useState(false);
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [restTimeSeconds, setRestTimeSeconds] = useState(0);
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  
  // UI refs
  const exerciseFlatListRef = useRef<FlatList>(null);
  const exerciseScrollViewRef = useRef<ScrollView>(null);
  
  // Initialize workout name from context or template/program
  useEffect(() => {
    if (isResuming && activeWorkout) {
      // Resuming - use context data
      console.log('Resuming workout from context');
      setWorkoutName(activeWorkout.name);
    } else if (!hasActiveWorkout) {
      // New workout - use template/program data
      let initialName = '';
      if (sourceType === 'template' && template) {
        initialName = template.name;
      } else if (sourceType === 'program' && programWorkout) {
        initialName = programWorkout.name;
      }
      setWorkoutName(initialName);
    }
  }, [isResuming, activeWorkout, template, programWorkout]);
  
  // Helper functions
  const prepareExercisesFromTemplate = (template: any) => {
    return template.exercises.map((exercise: any) => ({
      ...exercise,
      sets: exercise.sets.map((set: any) => ({
        ...set,
        completed: false,
        actual_reps: set.reps,
        actual_weight: set.weight,
        rest_time_completed: false
      }))
    }));
  };
  
  const prepareExercisesFromProgramWorkout = (workout: any) => {
    return workout.exercises.map((exercise: any) => ({
      ...exercise,
      sets: exercise.sets.map((set: any) => ({
        ...set,
        completed: false,
        actual_reps: set.reps,
        actual_weight: set.weight,
        rest_time_completed: false
      }))
    }));
  };
  
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getExerciseCompletionStatus = (exercise: any) => {
    if (!exercise || !exercise.sets) return { completed: 0, total: 0, percentage: 0 };
    
    const total = exercise.sets.length;
    const completed = exercise.sets.filter((set: any) => set.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  };
  
  // Handlers that work directly with context
  const handleBackPress = () => {
    if (activeWorkout?.started) {
      Alert.alert(
        t('exit_workout'),
        t('workout_will_continue_in_background'),
        [
          { text: t('cancel'), style: 'cancel' },
          { 
            text: t('continue_later'),
            onPress: () => router.back()
          },
          {
            text: t('end_workout'),
            style: 'destructive',
            onPress: () => endWorkout(true)
          }
        ]
      );
      return true;
    }
    
    router.back();
    return true;
  };
  
  const handleStartWorkout = async () => {
    if (!workoutName.trim()) {
      Alert.alert(t('error'), t('please_enter_workout_name'));
      return;
    }
    
    let initialExercises: any[] = [];
    if (sourceType === 'template' && template) {
      initialExercises = prepareExercisesFromTemplate(template);
    } else if (sourceType === 'program' && programWorkout) {
      initialExercises = prepareExercisesFromProgramWorkout(programWorkout);
    }
    
    await startWorkout({
      name: workoutName,
      exercises: initialExercises,
      sourceType,
      templateId,
      programId,
      workoutId,
      currentExerciseIndex: 0
    });
    
    if (initialExercises.length === 0) {
      setSelectingExercise(true);
    }
  };
  
  const handleAddExercise = async (exercise: any) => {
    if (!activeWorkout) return;
    
    const newExercise = {
      ...exercise,
      id: exercise.id || `temp-${Date.now()}`,
      sets: exercise.sets || [
        {
          id: `set-${Date.now()}`,
          reps: 10,
          weight: 0,
          rest_time: 60,
          order: 0,
          completed: false,
          actual_reps: 10,
          actual_weight: 0,
          rest_time_completed: false
        }
      ]
    };
    
    const updatedExercises = [...activeWorkout.exercises, newExercise];
    await updateWorkout({ 
      exercises: updatedExercises,
      currentExerciseIndex: activeWorkout.exercises.length
    });
    setSelectingExercise(false);
  };
  
  const handleCompleteSet = async (exerciseIndex: number, setIndex: number, setData: any) => {
    if (!activeWorkout) return;
    
    const updatedExercises = [...activeWorkout.exercises];
    const exercise = {...updatedExercises[exerciseIndex]};
    const sets = [...exercise.sets];
    sets[setIndex] = {
      ...sets[setIndex],
      ...setData,
      completed: true
    };
    exercise.sets = sets;
    updatedExercises[exerciseIndex] = exercise;
    
    await updateWorkout({ exercises: updatedExercises });
  };
  
  const handleUpdateSet = async (exerciseIndex: number, setIndex: number, setData: any) => {
    if (!activeWorkout) return;
    
    const updatedExercises = [...activeWorkout.exercises];
    const exercise = {...updatedExercises[exerciseIndex]};
    const sets = [...exercise.sets];
    sets[setIndex] = { ...sets[setIndex], ...setData };
    exercise.sets = sets;
    updatedExercises[exerciseIndex] = exercise;
    
    await updateWorkout({ exercises: updatedExercises });
  };
  
  const handleNavigateToExercise = async (index: number) => {
    await updateWorkout({ currentExerciseIndex: index });
  };
  
  const handleSubmitWorkout = async (additionalData: any = {}) => {
    if (!activeWorkout) return;
    
    try {
      const formattedExercises = activeWorkout.exercises.map((exercise, index) => ({
        name: exercise.name,
        equipment: exercise.equipment || '',
        notes: exercise.notes || '',
        order: index,
        superset_with: exercise.superset_with || null,
        is_superset: !!exercise.is_superset,
        sets: exercise.sets.map((set: any, idx: number) => ({
          reps: set.actual_reps || set.reps,
          weight: set.actual_weight || set.weight,
          rest_time: set.rest_time,
          order: idx
        }))
      }));
      
      const workoutData = {
        date: new Date().toISOString().split('T')[0],
        name: activeWorkout.name,
        description: '',
        notes: additionalData.notes || '',
        duration_minutes: Math.round(activeWorkout.duration / 60),
        mood_rating: additionalData.mood_rating || 3,
        difficulty_level: additionalData.difficulty_level || 'moderate',
        completed: true,
        exercises: formattedExercises,
        template_id: activeWorkout.templateId,
        program_id: activeWorkout.programId,
        program_workout_id: activeWorkout.workoutId,
        tags: additionalData.tags || [],
        source_type: activeWorkout.sourceType === 'custom' ? 'none' : activeWorkout.sourceType
      };
      
      console.log('Submitting workout with exercises:', formattedExercises.length);
      const result = await createLog(workoutData);
      
      // End workout (clears context)
      await endWorkout(true);
      
      Alert.alert(
        t('success'), 
        t('workout_logged_successfully'),
        [{ text: t('ok'), onPress: () => router.replace('/(app)/feed') }]
      );
      
      return { success: true, workoutId: result?.id, workout: result };
    } catch (error) {
      console.error('Error saving workout log:', error);
      Alert.alert(t('error'), t('error_saving_workout_log'));
      throw error;
    }
  };
  
  // Calculate stats from active workout
  const exercises = activeWorkout?.exercises || [];
  const currentExerciseIndex = activeWorkout?.currentExerciseIndex || 0;
  const workoutDuration = activeWorkout?.duration || 0;
  const workoutStarted = activeWorkout?.started || false;
  const workoutTimerActive = activeWorkout?.isTimerActive || false;
  
  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedSets = exercises.reduce((acc, ex) => {
    return acc + ex.sets.filter((set: any) => set.completed).length;
  }, 0);
  const completionPercentage = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  const hasIncompleteExercises = exercises.some(ex => 
    ex.sets.some((set: any) => !set.completed)
  );
  
  // Simple handlers object
  const handlers = {
    handleBackPress,
    handleStartWorkout,
    handleAddExercise,
    handleCompleteSet,
    handleUncompleteSet: (exerciseIndex: number, setIndex: number) => {
      // Similar to handleCompleteSet but set completed: false
      handleCompleteSet(exerciseIndex, setIndex, { completed: false });
    },
    handleUpdateSet,
    handleAddSet: async (exerciseIndex: number) => {
      if (!activeWorkout) return;
      const exercise = activeWorkout.exercises[exerciseIndex];
      const lastSet = exercise.sets[exercise.sets.length - 1];
      
      const newSet = {
        id: `set-${Date.now()}`,
        reps: lastSet.actual_reps || lastSet.reps,
        weight: lastSet.actual_weight || lastSet.weight,
        rest_time: lastSet.rest_time,
        order: exercise.sets.length,
        completed: false,
        actual_reps: lastSet.actual_reps || lastSet.reps,
        actual_weight: lastSet.actual_weight || lastSet.weight,
        rest_time_completed: false
      };
      
      const updatedExercises = [...activeWorkout.exercises];
      updatedExercises[exerciseIndex] = {
        ...exercise,
        sets: [...exercise.sets, newSet]
      };
      
      await updateWorkout({ exercises: updatedExercises });
    },
    handleRemoveSet: async (exerciseIndex: number, setIndex: number) => {
      if (!activeWorkout) return;
      const exercise = activeWorkout.exercises[exerciseIndex];
      
      if (exercise.sets.length <= 1) {
        Alert.alert(t('error'), t('cannot_remove_only_set'));
        return;
      }
      
      const updatedSets = exercise.sets.filter((_, idx) => idx !== setIndex);
      updatedSets.forEach((set, idx) => {
        set.order = idx;
      });
      
      const updatedExercises = [...activeWorkout.exercises];
      updatedExercises[exerciseIndex] = { ...exercise, sets: updatedSets };
      
      await updateWorkout({ exercises: updatedExercises });
    },
    handleNavigateToExercise,
    handleCompleteWorkout: () => setCompleteModalVisible(true),
    handleSubmitWorkout,
    handleCancelCompleteWorkout: () => setCompleteModalVisible(false),
    toggleWorkoutTimer: toggleTimer,
    startRestTimer: (seconds: number) => {
      setRestTimeSeconds(seconds);
      setRestTimerActive(true);
    },
    stopRestTimer: () => setRestTimerActive(false),
    workoutTimerActive
  };
  
  // Set up back handler
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, []);
  
  // Create rendering
  const { renderStartScreen, renderWorkoutScreen } = createWorkoutRendering({
    styles,
    palette,
    t,
    workoutName,
    setWorkoutName,
    workoutStarted,
    workoutDuration,
    exercises,
    currentExerciseIndex,
    selectingExercise,
    setSelectingExercise,
    restTimerActive,
    restTimeSeconds,
    completeModalVisible,
    exerciseFlatListRef,
    exerciseScrollViewRef,
    handlers,
    formatTime,
    getExerciseCompletionStatus,
    completionPercentage,
    completedSets,
    totalSets,
    hasIncompleteExercises
  });
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={palette.accent} />
      <View style={styles.container}>
        {workoutStarted ? renderWorkoutScreen() : renderStartScreen()}
      </View>
    </SafeAreaView>
  );
}

// Simplified styles (same as before)
const themedStyles = createThemedStyles((palette) => ({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: palette.page_background,
  },
  container: {
    flex: 1,
    backgroundColor: palette.page_background,
  },
  
  // Simplified Start Screen Styles
  startScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.page_background,
  },
  startScreenContent: {
    width: '80%',
    alignItems: 'center',
  },
  inputSection: {
    width: '100%',
    marginBottom: 32,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  textInput: {
    width: '100%',
    height: 56,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  startButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonIcon: {
    marginRight: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Rest of styles...
  modalContainer: {
    flex: 1,
    backgroundColor: palette.page_background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerLeftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 3,
  },
  headerRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 2,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  timerIcon: {
    marginRight: 6,
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  completeWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  completeWorkoutText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 4,
  },
  progressBarContainer: {
    height: 28,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.card_background,
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: '100%',
    opacity: 0.7,
  },
  progressText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    zIndex: 1,
  },
  exerciseListContainer: {
    backgroundColor: palette.card_background,
    paddingVertical: 14,
  },
  exerciseListContent: {
    paddingHorizontal: 12,
  },
  exerciseCard: {
    width: 110,
    height: 90,
    marginRight: 10,
    padding: 10,
    backgroundColor: palette.input_background,
    borderRadius: 12,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeExerciseCard: {
    backgroundColor: palette.accent,
    borderWidth: 2,
    borderColor: palette.highlight,
  },
  deleteExerciseButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeExerciseNumberBadge: {
    backgroundColor: '#FFFFFF',
  },
  exerciseNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  activeExerciseNumberText: {
    color: palette.accent,
  },
  partialCompleteText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  exerciseCardName: {
    fontSize: 13,
    fontWeight: '500',
    color: palette.text_secondary,
    flex: 1,
  },
  activeExerciseCardName: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  exerciseProgressContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    marginTop: 6,
  },
  exerciseProgress: {
    height: '100%',
    borderRadius: 2,
  },
  addExerciseCard: {
    width: 80,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addExerciseIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  addExerciseText: {
    fontSize: 12,
    fontWeight: '500',
  },
  workoutContent: {
    flex: 1,
  },
  exerciseArea: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 16,
    borderRadius: 12,
    backgroundColor: palette.card_background,
  },
  emptyStateText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  addExerciseButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addExerciseButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 80,
  }
}));