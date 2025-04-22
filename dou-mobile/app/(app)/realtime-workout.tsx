// app/(app)/realtime-workout.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  ScrollView,
  BackHandler,
  TextInput,
  AppState,
  Dimensions,
  FlatList,
  Animated,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { useCreateLog } from '../../hooks/query/useLogQuery';
import { useProgram } from '../../hooks/query/useProgramQuery';
import { useWorkoutTemplate } from '../../hooks/query/useWorkoutQuery';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { createThemedStyles, withAlpha } from '../../utils/createThemedStyles';

// Import custom components
import RealtimeExerciseCard from '../../components/workouts/RealtimeExerciseCard';
import RealtimeExerciseSelector from '../../components/workouts/RealtimeExerciseSelector';
import RestTimer from '../../components/workouts/RestTimer';
import WorkoutCompleteModal from '../../components/workouts/WorkoutCompleteModal';

export default function RealtimeWorkoutLogger() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { palette } = useTheme();
  const styles = themedStyles(palette);
  const { mutateAsync: createLog } = useCreateLog();
  
  // Get search params from URL
  const params = useLocalSearchParams();
  const sourceType = params.source as string || 'custom';
  const templateId = params.templateId ? Number(params.templateId) : null;
  const programId = params.programId ? Number(params.programId) : null;
  const workoutId = params.workoutId ? Number(params.workoutId) : null;
  
  // Use React Query to fetch template or program workout data if needed
  const { data: template } = useWorkoutTemplate(templateId);
  const { data: program } = useProgram(programId);
  const programWorkout = program?.workouts?.find(w => w.id === workoutId);
  
  // Workout state
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [workoutCompleted, setWorkoutCompleted] = useState(false);
  
  // Exercise & set tracking
  const [exercises, setExercises] = useState<any[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [selectingExercise, setSelectingExercise] = useState(false);
  const [editingPrevious, setEditingPrevious] = useState(false);
  
  // Timer states
  const [workoutTimerActive, setWorkoutTimerActive] = useState(false);
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [restTimeSeconds, setRestTimeSeconds] = useState(0);
  
  // Modals
  const [completeModalVisible, setCompleteModalVisible] = useState(false);
  
  // AppState for background timer handling
  const appStateRef = useRef(AppState.currentState);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Refs
  const exerciseFlatListRef = useRef<FlatList>(null);
  const exerciseScrollViewRef = useRef<ScrollView>(null);
  
  // Screen dimensions
  const { width: screenWidth } = Dimensions.get('window');
  
  // Animation values
  const headerOpacity = useRef(new Animated.Value(1)).current;
  
  // Local storage key for this workout
  const storageKey = useRef(`realtime_workout_${new Date().toISOString()}`).current;
  
  // Timer storage keys
  const timerStartKey = `${storageKey}_timer_start`;
  const timerTotalKey = `${storageKey}_timer_total`;
  const timerActiveKey = `${storageKey}_timer_active`;
  const timerPauseKey = `${storageKey}_timer_pause`;

  // Initialize workout based on source
  useEffect(() => {
    const initializeWorkout = async () => {
      // Try to load workout from local storage first (for resuming)
      const savedWorkout = await loadWorkoutFromStorage();
      
      if (savedWorkout) {
        // Restore saved workout state
        setWorkoutName(savedWorkout.name);
        setWorkoutNotes(savedWorkout.notes || '');
        setExercises(savedWorkout.exercises);
        setWorkoutStarted(savedWorkout.started);
        setWorkoutDuration(savedWorkout.duration || 0);
        setCurrentExerciseIndex(savedWorkout.currentExerciseIndex || 0);
        
        // Restore timer state if it was active
        const timerWasActive = await AsyncStorage.getItem(timerActiveKey) === 'true';
        if (timerWasActive && savedWorkout.started) {
          startWorkoutTimer();
        }
        
        return;
      }
      
      // Otherwise initialize based on source
      let initialName = '';
      let initialExercises: any[] = [];
      
      if (sourceType === 'template' && template) {
        initialName = template.name;
        initialExercises = prepareExercisesFromTemplate(template);
      } else if (sourceType === 'program' && programWorkout) {
        initialName = programWorkout.name;
        initialExercises = prepareExercisesFromProgramWorkout(programWorkout);
      }
      
      setWorkoutName(initialName);
      setExercises(initialExercises);
    };
    
    initializeWorkout();
    
    // Set up back button handler
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    // Clean up all storage when component unmounts
    return () => {
      backHandler.remove();
      clearAllWorkoutStorage();
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [template, programWorkout]);
  
  // Save workout state to storage whenever it changes
  useEffect(() => {
    if (workoutStarted) {
      saveWorkoutToStorage();
    }
  }, [workoutName, workoutNotes, exercises, workoutStarted, workoutDuration, currentExerciseIndex]);
  
  // Background/foreground handling for timer
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: string) => {
      if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App is going to background - save current timestamp if timer is active
        if (workoutTimerActive) {
          await AsyncStorage.setItem(timerPauseKey, new Date().toISOString());
        }
      } else if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App is coming back to foreground - calculate elapsed time if timer was active
        if (workoutTimerActive) {
          const pauseTimeStr = await AsyncStorage.getItem(timerPauseKey);
          if (pauseTimeStr) {
            const pauseTime = new Date(pauseTimeStr).getTime();
            const now = new Date().getTime();
            const elapsedSeconds = Math.floor((now - pauseTime) / 1000);
            
            // Update total duration in storage
            const currentTotalStr = await AsyncStorage.getItem(timerTotalKey) || '0';
            const newTotal = parseInt(currentTotalStr) + elapsedSeconds;
            await AsyncStorage.setItem(timerTotalKey, newTotal.toString());
            
            // Update start time to now (since we've accounted for the background time)
            await AsyncStorage.setItem(timerStartKey, new Date().toISOString());
            
            // Update state
            setWorkoutDuration(newTotal);
          }
        }
      }
      
      appStateRef.current = nextAppState;
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [workoutTimerActive]);
  
  // Timer update interval when app is in foreground
  useEffect(() => {
    if (workoutTimerActive) {
      // Clear any existing interval
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      
      // Set up interval to update timer every second
      timerIntervalRef.current = setInterval(async () => {
        // Get timer start time and total duration from storage
        const startTimeStr = await AsyncStorage.getItem(timerStartKey);
        const totalStr = await AsyncStorage.getItem(timerTotalKey) || '0';
        
        if (startTimeStr) {
          const startTime = new Date(startTimeStr).getTime();
          const now = new Date().getTime();
          const activeDuration = Math.floor((now - startTime) / 1000);
          const totalDuration = parseInt(totalStr) + activeDuration;
          
          // Update UI state (but not storage every second to avoid excessive writes)
          setWorkoutDuration(totalDuration);
        }
      }, 1000);
    } else if (timerIntervalRef.current) {
      // Clear interval when timer is paused
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [workoutTimerActive]);
  
  // Helper functions for preparing exercises
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

  const handleUncompleteSet = (exerciseIndex: number, setIndex: number) => {
    setExercises(prev => {
      const newExercises = [...prev];
      const exercise = {...newExercises[exerciseIndex]};
      const sets = [...exercise.sets];
      
      // Mark the set as not completed but keep the actual values
      sets[setIndex] = {
        ...sets[setIndex],
        completed: false
      };
      
      exercise.sets = sets;
      newExercises[exerciseIndex] = exercise;
      return newExercises;
    });
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
  
  // Storage functions
  const saveWorkoutToStorage = async () => {
    try {
      const workoutData = {
        name: workoutName,
        notes: workoutNotes,
        exercises,
        started: workoutStarted,
        duration: workoutDuration,
        currentExerciseIndex,
        timestamp: new Date().toISOString()
      };
      
      await AsyncStorage.setItem(storageKey, JSON.stringify(workoutData));
    } catch (error) {
      console.error('Error saving workout data:', error);
    }
  };
  
  const loadWorkoutFromStorage = async () => {
    try {
      // Try to get the most recent workout data
      const keys = await AsyncStorage.getAllKeys();
      const workoutKeys = keys.filter(key => key.startsWith('realtime_workout_') && !key.includes('_timer_'));
      
      if (workoutKeys.length === 0) return null;
      
      // Sort keys by timestamp (newest first)
      workoutKeys.sort((a, b) => b.localeCompare(a));
      
      // Get most recent workout data
      const data = await AsyncStorage.getItem(workoutKeys[0]);
      if (!data) return null;
      
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading workout data:', error);
      return null;
    }
  };
  
  const clearWorkoutFromStorage = async () => {
    try {
      await AsyncStorage.removeItem(storageKey);
      await AsyncStorage.removeItem(timerStartKey);
      await AsyncStorage.removeItem(timerTotalKey);
      await AsyncStorage.removeItem(timerActiveKey);
      await AsyncStorage.removeItem(timerPauseKey);
    } catch (error) {
      console.error('Error clearing workout data:', error);
    }
  };
  
  const clearAllWorkoutStorage = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const workoutKeys = keys.filter(key => key.startsWith('realtime_workout_'));
      
      if (workoutKeys.length > 0) {
        await AsyncStorage.multiRemove(workoutKeys);
      }
    } catch (error) {
      console.error('Error clearing all workout data:', error);
    }
  };
  
  // Timer functions using AsyncStorage
  const startWorkoutTimer = async () => {
    try {
      // Set timer as active
      await AsyncStorage.setItem(timerActiveKey, 'true');
      
      // Record start time if not already set
      const existingStartTime = await AsyncStorage.getItem(timerStartKey);
      if (!existingStartTime) {
        await AsyncStorage.setItem(timerStartKey, new Date().toISOString());
      }
      
      // Initialize total duration if not set
      if (!(await AsyncStorage.getItem(timerTotalKey))) {
        await AsyncStorage.setItem(timerTotalKey, '0');
      }
      
      // Update UI
      setWorkoutTimerActive(true);
    } catch (error) {
      console.error('Error starting workout timer:', error);
    }
  };
  
  const pauseWorkoutTimer = async () => {
    try {
      if (!workoutTimerActive) return;
      
      // Calculate elapsed time since timer was started
      const startTimeStr = await AsyncStorage.getItem(timerStartKey);
      const totalStr = await AsyncStorage.getItem(timerTotalKey) || '0';
      
      if (startTimeStr) {
        const startTime = new Date(startTimeStr).getTime();
        const now = new Date().getTime();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        const newTotal = parseInt(totalStr) + elapsedSeconds;
        
        // Save new total duration
        await AsyncStorage.setItem(timerTotalKey, newTotal.toString());
        
        // Clear start time
        await AsyncStorage.removeItem(timerStartKey);
        
        // Set timer as inactive
        await AsyncStorage.setItem(timerActiveKey, 'false');
        
        // Update UI
        setWorkoutDuration(newTotal);
        setWorkoutTimerActive(false);
      }
    } catch (error) {
      console.error('Error pausing workout timer:', error);
    }
  };
  
  const toggleWorkoutTimer = async () => {
    if (workoutTimerActive) {
      await pauseWorkoutTimer();
    } else {
      await startWorkoutTimer();
    }
  };
  
  const startRestTimer = (seconds: number) => {
    setRestTimeSeconds(seconds);
    setRestTimerActive(true);
  };
  
  const stopRestTimer = () => {
    setRestTimerActive(false);
  };
  
  // Format time for display
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handlers
  const handleBackPress = () => {
    if (workoutStarted) {
      Alert.alert(
        t('exit_workout'),
        t('exit_workout_confirmation'),
        [
          { text: t('cancel'), style: 'cancel' },
          { 
            text: t('exit_and_save'),
            onPress: async () => {
              await pauseWorkoutTimer();
              saveWorkoutToStorage();
              router.back();
            }
          },
          {
            text: t('exit_without_saving'),
            style: 'destructive',
            onPress: async () => {
              await pauseWorkoutTimer();
              clearAllWorkoutStorage();
              router.back();
            }
          }
        ]
      );
      return true;
    }
    
    clearAllWorkoutStorage();
    router.back();
    return true;
  };
  
  const handleCompleteExercise = () => {
    // Verify if all sets are completed
    const currentExercise = exercises[currentExerciseIndex];
    const allSetsCompleted = currentExercise.sets.every((set: any) => set.completed);
    
    if (!allSetsCompleted) {
      Alert.alert(
        t('incomplete_sets'),
        t('not_all_sets_completed'),
        [
          { text: t('cancel'), style: 'cancel' },
          { 
            text: t('continue_anyway'),
            onPress: () => navigateToNextExercise()
          }
        ]
      );
      return;
    }
    
    navigateToNextExercise();
  };
  
  const navigateToNextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      exerciseFlatListRef.current?.scrollToIndex({ 
        animated: true, 
        index: currentExerciseIndex + 1 
      });
    } else {
      // If this was the last exercise, prompt to add a new one
      setSelectingExercise(true);
    }
  };
  
  const handleStartWorkout = async () => {
    if (!workoutName.trim()) {
      Alert.alert(t('error'), t('please_enter_workout_name'));
      return;
    }
    
    setWorkoutStarted(true);
    await startWorkoutTimer();
    
    // If no exercises yet, show exercise selector
    if (exercises.length === 0) {
      setSelectingExercise(true);
    }
  };
  
  const handleAddExercise = (exercise: any) => {
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
    
    setExercises(prev => [...prev, newExercise]);
    setCurrentExerciseIndex(exercises.length);
    setSelectingExercise(false);
  };
  
  const handleCompleteSet = (exerciseIndex: number, setIndex: number, setData: any) => {
    setExercises(prev => {
      const newExercises = [...prev];
      const exercise = {...newExercises[exerciseIndex]};
      const sets = [...exercise.sets];
      sets[setIndex] = {
        ...sets[setIndex],
        ...setData,
        completed: true
      };
      exercise.sets = sets;
      newExercises[exerciseIndex] = exercise;
      return newExercises;
    });
  };
  
  const handleUpdateSet = (exerciseIndex: number, setIndex: number, setData: any) => {
    setExercises(prev => {
      const newExercises = [...prev];
      const exercise = {...newExercises[exerciseIndex]};
      const sets = [...exercise.sets];
      sets[setIndex] = {
        ...sets[setIndex],
        ...setData
      };
      exercise.sets = sets;
      newExercises[exerciseIndex] = exercise;
      return newExercises;
    });
  };
  
  const handleAddSet = (exerciseIndex: number) => {
    setExercises(prev => {
      const newExercises = [...prev];
      const exercise = {...newExercises[exerciseIndex]};
      const lastSet = exercise.sets[exercise.sets.length - 1];
      
      // Get the correct values from the last set (handle both actual and planned values)
      const newSet = {
        id: `set-${Date.now()}`,
        reps: lastSet.actual_reps !== undefined ? lastSet.actual_reps : lastSet.reps,
        weight: lastSet.actual_weight !== undefined ? lastSet.actual_weight : lastSet.weight,
        rest_time: lastSet.rest_time,
        order: exercise.sets.length,
        completed: false,
        actual_reps: lastSet.actual_reps !== undefined ? lastSet.actual_reps : lastSet.reps,
        actual_weight: lastSet.actual_weight !== undefined ? lastSet.actual_weight : lastSet.weight,
        rest_time_completed: false
      };
      
      exercise.sets = [...exercise.sets, newSet];
      newExercises[exerciseIndex] = exercise;
      return newExercises;
    });
  };
  
  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    setExercises(prev => {
      const newExercises = [...prev];
      const exercise = {...newExercises[exerciseIndex]};
      
      // Don't remove if it's the only set
      if (exercise.sets.length <= 1) {
        Alert.alert(t('error'), t('cannot_remove_only_set'));
        return prev;
      }
      
      // Remove the specific set
      const sets = [...exercise.sets];
      sets.splice(setIndex, 1);
      
      // Update the order property for each set
      sets.forEach((set, idx) => {
        set.order = idx;
      });
      
      exercise.sets = sets;
      newExercises[exerciseIndex] = exercise;
      return newExercises;
    });
  };
  
  const handleNavigateToExercise = (index: number) => {
    setCurrentExerciseIndex(index);
    setEditingPrevious(index < currentExerciseIndex);
    
    // Scroll to the exercise
    if (exerciseScrollViewRef.current) {
      exerciseScrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  };
  
  const handleCompleteWorkout = async () => {
    // Pause timer when showing complete modal
    await pauseWorkoutTimer();
    setCompleteModalVisible(true);
    
    // Animate header
    Animated.sequence([
      Animated.timing(headerOpacity, {
        toValue: 0.7,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      })
    ]).start();
  };
  
  const handleSubmitWorkout = async (additionalData: any = {}) => {
    try {
      // Format workout data for submission
      const formattedExercises = exercises.map((exercise,index) => ({
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
        name: workoutName,
        description: '',
        notes: workoutNotes,
        duration_minutes: Math.round(workoutDuration / 60),
        mood_rating: additionalData.mood_rating || 3,
        difficulty_level: additionalData.difficulty_level || 'moderate',
        completed: true,
        exercises: formattedExercises,
        template_id: templateId,
        program_id: programId,
        program_workout_id: workoutId,
        tags: additionalData.tags || [],
        source_type: sourceType === 'custom' ? 'none' : sourceType
      };
      
      // Submit workout log
      await createLog(workoutData);
      
      // Clear storage
      await clearWorkoutFromStorage();
      
      // Navigate back with success message
      Alert.alert(t('success'), t('workout_logged_successfully'), [
        { text: t('ok'), onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error saving workout log:', error);
      Alert.alert(t('error'), t('error_saving_workout_log'));
    }
  };
  
  const handleCancelCompleteWorkout = async () => {
    // Resume timer if canceling the completion
    if (!workoutCompleted) {
      await startWorkoutTimer();
    }
    setCompleteModalVisible(false);
  };
  
  // Helper to get exercise completion status
  const getExerciseCompletionStatus = (exercise: any) => {
    if (!exercise || !exercise.sets) return { completed: 0, total: 0, percentage: 0 };
    
    const total = exercise.sets.length;
    const completed = exercise.sets.filter((set: any) => set.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  };
  
  // Calculate completion status
  const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedSets = exercises.reduce((acc, ex) => {
    return acc + ex.sets.filter((set: any) => set.completed).length;
  }, 0);
  const completionPercentage = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  
  // Determine if current exercise has all sets completed
  const isCurrentExerciseComplete = () => {
    if (!exercises[currentExerciseIndex]) return false;
    return exercises[currentExerciseIndex].sets.every((set: any) => set.completed);
  };
  
  // Check if there are any exercises with incomplete sets
  const hasIncompleteExercises = exercises.some(ex => 
    ex.sets.some((set: any) => !set.completed)
  );
  
  // Render functions
  const renderStartScreen = () => (
    <View style={styles.startScreen}>
      <LinearGradient
        colors={['#4F46E5', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <Text style={styles.startTitle}>
          {t('start_workout')}
        </Text>
      </LinearGradient>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>
          {t('workout_name')}
        </Text>
        <TextInput
          style={styles.textInput}
          value={workoutName}
          onChangeText={setWorkoutName}
          placeholder={t('enter_workout_name')}
          placeholderTextColor="#9CA3AF"
        />
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>
          {t('notes')} ({t('optional')})
        </Text>
        <TextInput
          style={styles.textAreaInput}
          value={workoutNotes}
          onChangeText={setWorkoutNotes}
          placeholder={t('enter_notes')}
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleBackPress}
        >
          <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStartWorkout}
        >
          <Text style={styles.startButtonText}>{t('start')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  const renderWorkoutScreen = () => (
    <>
      {/* Workout header with timer and complete button */}
      <Animated.View style={{ opacity: headerOpacity }}>
        <LinearGradient
          colors={['#4F46E5', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.workoutHeader}
        >
          <View style={styles.headerLeftSection}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackPress}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.workoutTitle} numberOfLines={1}>
              {workoutName}
            </Text>
          </View>
          
          <View style={styles.headerRightSection}>
            {/* Timer */}
            <TouchableOpacity 
              style={styles.timerContainer}
              onPress={toggleWorkoutTimer}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={workoutTimerActive ? "pause-circle" : "play-circle"} 
                size={24} 
                color="#FFFFFF" 
                style={styles.timerIcon}
              />
              <Text style={styles.timerText}>
                {formatTime(workoutDuration)}
              </Text>
            </TouchableOpacity>
            
            {/* Complete Workout Button */}
            <TouchableOpacity
              style={[
                styles.completeWorkoutButton,
                { backgroundColor: hasIncompleteExercises ? 'rgba(245, 158, 11, 0.9)' : 'rgba(16, 185, 129, 0.9)' }
              ]}
              onPress={handleCompleteWorkout}
            >
              <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
              <Text style={styles.completeWorkoutText}>{t('complete')}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
      
      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View 
          style={[
            styles.progressBar, 
            { 
              width: `${completionPercentage}%`,
              backgroundColor: completionPercentage === 100 
                ? '#10B981' // success green
                : '#7C3AED' // purple
            }
          ]} 
        />
        <Text style={styles.progressText}>
          {completedSets} / {totalSets} {t('sets')} ({completionPercentage}%)
        </Text>
      </View>
      
      {/* Exercise List (Horizontal Cards) */}
      <View style={styles.exerciseListContainer}>
        <FlatList
          ref={exerciseFlatListRef}
          data={exercises}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, index) => `exercise-preview-${index}`}
          contentContainerStyle={styles.exerciseListContent}
          renderItem={({ item, index }) => {
            const status = getExerciseCompletionStatus(item);
            const isActive = index === currentExerciseIndex;
            
            return (
              <TouchableOpacity
                style={[
                  styles.exerciseCard,
                  isActive && styles.activeExerciseCard
                ]}
                onPress={() => handleNavigateToExercise(index)}
              >
                <View style={styles.exerciseCardHeader}>
                  <View style={[
                    styles.exerciseNumberBadge,
                    isActive ? styles.activeExerciseNumberBadge : null
                  ]}>
                    <Text style={[
                      styles.exerciseNumberText,
                      isActive ? styles.activeExerciseNumberText : null
                    ]}>
                      {index + 1}
                    </Text>
                  </View>
                  
                  {status.completed === status.total && status.total > 0 ? (
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  ) : status.completed > 0 ? (
                    <Text style={styles.partialCompleteText}>
                      {status.completed}/{status.total}
                    </Text>
                  ) : null}
                </View>
                
                <Text 
                  style={[
                    styles.exerciseCardName,
                    isActive && styles.activeExerciseCardName
                  ]}
                  numberOfLines={2}
                >
                  {item.name}
                </Text>
                
                {/* Progress indicator */}
                <View style={styles.exerciseProgressContainer}>
                  <View 
                    style={[
                      styles.exerciseProgress, 
                      { 
                        width: `${status.percentage}%`,
                        backgroundColor: status.percentage === 100 
                          ? '#10B981' // success green
                          : '#F59E0B' // warning amber
                      }
                    ]} 
                  />
                </View>
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            <TouchableOpacity
              style={styles.addExerciseCard}
              onPress={() => setSelectingExercise(true)}
            >
              <View style={styles.addExerciseIcon}>
                <Ionicons name="add" size={24} color="#4F46E5" />
              </View>
              <Text style={styles.addExerciseText}>{t('add')}</Text>
            </TouchableOpacity>
          }
        />
      </View>
      
      {/* Rest timer if active */}
      {restTimerActive && (
        <RestTimer
          seconds={restTimeSeconds}
          onComplete={stopRestTimer}
          onCancel={stopRestTimer}
          themePalette={{
            accent: '#4F46E5',
            highlight: '#7C3AED',
            success: '#10B981',
            warning: '#F59E0B',
            error: '#EF4444',
            text: '#FFFFFF',
            text_secondary: '#E5E7EB',
            text_tertiary: '#9CA3AF',
            border: '#4B5563',
            card_background: '#1F2937',
            input_background: '#374151'
          }}
        />
      )}
      
      {/* Main workout view */}
      <View style={styles.workoutContent}>
        {/* Main exercise area */}
        <ScrollView 
            ref={exerciseScrollViewRef}
            style={styles.exerciseArea}
            showsVerticalScrollIndicator={false}
        >
            {exercises.length > 0 && currentExerciseIndex < exercises.length ? (
            <RealtimeExerciseCard
                exercise={exercises[currentExerciseIndex]}
                exerciseIndex={currentExerciseIndex}
                onCompleteSet={handleCompleteSet}
                onUncompleteSet={handleUncompleteSet}
                onUpdateSet={handleUpdateSet}
                onAddSet={handleAddSet}
                onRemoveSet={handleRemoveSet}
                onStartRestTimer={startRestTimer}
                editingPrevious={editingPrevious}
                themePalette={{
                accent: '#4F46E5',
                highlight: '#7C3AED',
                success: '#10B981',
                warning: '#F59E0B',
                error: '#EF4444',
                text: '#E5E7EB',
                text_secondary: '#9CA3AF',
                text_tertiary: '#6B7280',
                border: '#4B5563',
                card_background: '#1F2937',
                input_background: '#374151'
                }}
            />
            ) : (
            <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                {t('no_exercises_added')}
                </Text>
                <TouchableOpacity
                style={styles.addExerciseButton}
                onPress={() => setSelectingExercise(true)}
                >
                <Text style={styles.addExerciseButtonText}>{t('add_exercise')}</Text>
                </TouchableOpacity>
            </View>
            )}
            
            {/* Add some bottom padding for scrolling */}
            <View style={styles.bottomPadding} />
        </ScrollView>
        </View>

        {/* Exercise Selector Modal */}
        <Modal
        visible={selectingExercise}
        animationType="slide"
        onRequestClose={() => setSelectingExercise(false)}
        statusBarTranslucent={true}
        >
        <SafeAreaView style={styles.modalContainer}>
            <RealtimeExerciseSelector
            onSelectExercise={handleAddExercise}
            onCancel={() => setSelectingExercise(false)}
            themePalette={{
                accent: '#4F46E5',
                highlight: '#7C3AED',
                success: '#10B981',
                warning: '#F59E0B',
                error: '#EF4444',
                text: '#E5E7EB',
                text_secondary: '#9CA3AF',
                text_tertiary: '#6B7280',
                border: '#4B5563',
                card_background: '#1F2937',
                page_background: '#111827',
                input_background: '#374151',
                info: '#3B82F6' // Add info color for "recent" tag
            }}
            />
        </SafeAreaView>
        </Modal>
      
      {/* Complete Workout Modal */}
      <WorkoutCompleteModal
        visible={completeModalVisible}
        onSubmit={handleSubmitWorkout}
        onCancel={handleCancelCompleteWorkout}
        completionPercentage={completionPercentage}
        hasIncompleteExercises={hasIncompleteExercises}
        themePalette={{
          accent: '#4F46E5',
          highlight: '#7C3AED',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          text: '#E5E7EB',
          text_secondary: '#9CA3AF',
          text_tertiary: '#6B7280',
          border: '#4B5563',
          card_background: '#1F2937',
          input_background: '#374151'
        }}
      />
    </>
  );
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
      <View style={styles.container}>
        {workoutStarted ? renderWorkoutScreen() : renderStartScreen()}
      </View>
    </SafeAreaView>
  );
}

const themedStyles = createThemedStyles((palette) => ({

    modalContainer: {
        flex: 1,
        backgroundColor: '#111827', // Match the app background color
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        },

  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: '#111827', // dark background
  },
  container: {
    flex: 1,
    backgroundColor: '#111827', // dark background
  },
  startScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    margin: 16,
    backgroundColor: '#1F2937', // darker card background
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  gradientHeader: {
    width: '100%',
    padding: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    alignItems: 'center',
  },
  startTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  inputContainer: {
    width: '90%',
    marginTop: 20,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#E5E7EB', // light gray text
    fontWeight: '500',
  },
  textInput: {
    width: '100%',
    height: 50,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151', // border color
    backgroundColor: '#374151', // input background
    color: '#FFFFFF',
  },
  textAreaInput: {
    width: '100%',
    height: 100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151', // border color
    backgroundColor: '#374151', // input background
    color: '#FFFFFF',
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginTop: 30,
  },
  cancelButton: {
    width: '48%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4B5563', // border color
    backgroundColor: 'transparent',
  },
  cancelButtonText: {
    color: '#E5E7EB',
    fontSize: 16,
    fontWeight: '600',
  },
  startButton: {
    width: '48%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#7C3AED', // purple highlight
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Workout screen header
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
  
  // Progress bar
  progressBarContainer: {
    height: 28,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
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
  
  // Exercise list
  exerciseListContainer: {
    backgroundColor: '#1F2937',
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
    backgroundColor: '#374151',
    borderRadius: 12,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeExerciseCard: {
    backgroundColor: '#4F46E5',
    borderWidth: 2,
    borderColor: '#7C3AED',
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
    color: '#4F46E5',
  },
  partialCompleteText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: 'bold',
  },
  exerciseCardName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#E5E7EB',
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
    borderColor: 'rgba(79, 70, 229, 0.3)',
    borderStyle: 'dashed',
  },
  addExerciseIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  addExerciseText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '500',
  },
  
  // Main content
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
    backgroundColor: '#1F2937',
  },
  emptyStateText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#9CA3AF',
  },
  addExerciseButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: '#7C3AED',
  },
  addExerciseButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  bottomPadding: {
    height: 80,
  }
}));