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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={palette.accent} />
      <View style={styles.container}>
        {hasActiveWorkout && activeWorkout?.started ? (
          <ActiveWorkoutScreen 
            handlers={handlers}
            workoutManager={workoutManager}
          />
        ) : (
          <WorkoutSetupScreen 
            handlers={handlers}
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