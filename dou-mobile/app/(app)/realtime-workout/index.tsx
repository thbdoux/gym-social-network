// app/(app)/realtime-workout/index.tsx - Refactored Main Component
import React, { useState, useEffect } from 'react';
import {
  View,
  SafeAreaView,
  StatusBar,
  Platform,
  BackHandler,
  Alert
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { useWorkout } from '../../../context/WorkoutContext';
import { createThemedStyles } from '../../../utils/createThemedStyles';

// Components
import WorkoutSetupScreen from './components/WorkoutSetupScreen';
import ActiveWorkoutScreen from './components/ActiveWorkoutScreen';
import { useWorkoutManager } from './hooks/useWorkoutManager';
import { useWorkoutHandlers } from './hooks/useWorkoutHandlers';

export default function RealtimeWorkoutLogger() {
  const { t } = useLanguage();
  const { palette } = useTheme();
  const styles = themedStyles(palette);
  const params = useLocalSearchParams();
  
  // Context state
  const { activeWorkout, hasActiveWorkout } = useWorkout();
  
  // Initialize workout manager with params
  const workoutManager = useWorkoutManager({
    sourceType: params.source as string || 'custom',
    templateId: params.templateId ? Number(params.templateId) : null,
    programId: params.programId ? Number(params.programId) : null,
    workoutId: params.workoutId ? Number(params.workoutId) : null,
    isResuming: params.resume === 'true'
  });

  // Get handlers
  const handlers = useWorkoutHandlers(workoutManager);

  // Enhanced handler for adding exercises (handles supersets)
  const enhancedHandleAddExercise = async (exercise: any) => {
    if (workoutManager.pendingSuperset) {
      // Add exercise to pending superset
      await handlers.handleAddExerciseToSuperset(exercise, workoutManager.pendingSuperset);
    } else {
      // Normal exercise addition
      await handlers.handleAddExercise(exercise);
    }
  };

  // Handle back button
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
            onPress: () => handlers.endWorkout()
          }
        ]
      );
      return true;
    }
    
    router.back();
    return true;
  };

  // Set up back handler
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [activeWorkout?.started]);

  // Enhanced handlers object with superset functionality
  const enhancedHandlers = {
    ...handlers,
    handleAddExercise: enhancedHandleAddExercise,
    handleCompleteSet: async (exerciseIndex: number, setIndex: number, setData: any) => {
      if (!activeWorkout) return;
      
      const updatedExercises = [...activeWorkout.exercises];
      const exercise = {...updatedExercises[exerciseIndex]};
      const sets = [...exercise.sets];
      const currentSet = sets[setIndex];
      
      sets[setIndex] = {
        ...sets[setIndex],
        ...setData,
        completed: true
      };
      exercise.sets = sets;
      updatedExercises[exerciseIndex] = exercise;
      
      // Combine set completion and rest timer start
      const updates: any = { exercises: updatedExercises };
      
      // For supersets, handle special rest timer logic
      const isSuperset = exercise.superset_group;
      let restTime = currentSet.rest_time;
      
      if (isSuperset) {
        const supersetExercises = activeWorkout.exercises.filter((ex: any) => 
          ex.superset_group === exercise.superset_group
        );
        const currentSupersetIndex = supersetExercises.findIndex((ex: any) => ex.id === exercise.id);
        const isLastInSuperset = currentSupersetIndex === supersetExercises.length - 1;
        
        if (isLastInSuperset) {
          // Use superset rest time for the end of superset cycle
          restTime = exercise.superset_rest_time || currentSet.rest_time;
        } else {
          // Move to next exercise in superset immediately (no rest between superset exercises)
          const nextSupersetExercise = supersetExercises[currentSupersetIndex + 1];
          const nextExerciseIndex = activeWorkout.exercises.findIndex((ex: any) => ex.id === nextSupersetExercise.id);
          updates.currentExerciseIndex = nextExerciseIndex;
          restTime = 0; // No rest between superset exercises
        }
      }
      
      if (restTime > 0) {
        const restTimer = {
          isActive: true,
          totalSeconds: restTime,
          startTime: new Date().toISOString(),
          remainingSeconds: restTime
        };
        updates.restTimer = restTimer;
      }

      await workoutManager.updateWorkout(updates);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={palette.accent} />
      <View style={styles.container}>
        {hasActiveWorkout && activeWorkout?.started ? (
          <ActiveWorkoutScreen 
            handlers={enhancedHandlers}
            workoutManager={workoutManager}
          />
        ) : (
          <WorkoutSetupScreen 
            handlers={enhancedHandlers}
            workoutManager={workoutManager}
            onBack={handleBackPress}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const themedStyles = createThemedStyles((palette) => ({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: palette.page_background,
  },
  container: {
    flex: 1,
    backgroundColor: palette.page_background,
  }
}));