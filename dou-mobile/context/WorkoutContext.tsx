// context/WorkoutContext.tsx - Simplified single source of truth
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Alert } from 'react-native';
import { router, usePathname } from 'expo-router';
import { WorkoutPersistenceManager, ActiveWorkoutSession } from '../app/(app)/realtime-workout/utils/workoutPersistence';
import { useLanguage } from './LanguageContext';

interface WorkoutState {
  id: string;
  name: string;
  exercises: any[];
  started: boolean;
  startTime: string;
  duration: number;
  currentExerciseIndex: number;
  sourceType: 'template' | 'program' | 'custom';
  templateId?: number;
  programId?: number;
  workoutId?: number;
  isTimerActive: boolean;
}

interface WorkoutContextType {
  // State
  activeWorkout: WorkoutState | null;
  hasActiveWorkout: boolean;
  isOnWorkoutPage: boolean;
  
  // Actions
  startWorkout: (workoutData: Partial<WorkoutState>) => Promise<void>;
  updateWorkout: (updates: Partial<WorkoutState>) => Promise<void>;
  endWorkout: (force?: boolean) => Promise<void>;
  navigateToWorkout: () => void;
  
  // Timer
  toggleTimer: () => Promise<void>;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useLanguage();
  const pathname = usePathname();
  const persistenceManager = useRef(WorkoutPersistenceManager.getInstance()).current;
  
  const [activeWorkout, setActiveWorkout] = useState<WorkoutState | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check if currently on workout page
  const isOnWorkoutPage = pathname?.includes('/realtime-workout') || false;
  const hasActiveWorkout = activeWorkout !== null;
  
  // Load active workout on mount
  useEffect(() => {
    loadActiveWorkout();
  }, []);
  
  // Timer management
  useEffect(() => {
    if (activeWorkout?.isTimerActive && activeWorkout.started) {
      startTimerInterval();
    } else {
      stopTimerInterval();
    }
    
    return () => stopTimerInterval();
  }, [activeWorkout?.isTimerActive, activeWorkout?.started]);
  
  const loadActiveWorkout = async () => {
    try {
      const workout = await persistenceManager.getActiveWorkout();
      if (workout) {
        const workoutState: WorkoutState = {
          id: workout.id,
          name: workout.name,
          exercises: workout.exercises,
          started: workout.started,
          startTime: workout.startTime,
          duration: workout.duration,
          currentExerciseIndex: workout.currentExerciseIndex,
          sourceType: workout.sourceType,
          templateId: workout.templateId,
          programId: workout.programId,
          workoutId: workout.workoutId,
          isTimerActive: workout.lastUpdated ? true : false // Resume timer if recently updated
        };
        
        console.log('Loaded workout from persistence:', workoutState.name, `${workoutState.exercises.length} exercises`);
        setActiveWorkout(workoutState);
      }
    } catch (error) {
      console.error('Error loading active workout:', error);
    }
  };
  
  const saveActiveWorkout = async (workoutState: WorkoutState) => {
    try {
      const session: ActiveWorkoutSession = {
        id: workoutState.id,
        name: workoutState.name,
        exercises: workoutState.exercises,
        started: workoutState.started,
        startTime: workoutState.startTime,
        duration: workoutState.duration,
        currentExerciseIndex: workoutState.currentExerciseIndex,
        sourceType: workoutState.sourceType,
        templateId: workoutState.templateId,
        programId: workoutState.programId,
        workoutId: workoutState.workoutId,
        lastUpdated: new Date().toISOString()
      };
      
      console.log('Saving workout to persistence:', session.name, `${session.exercises.length} exercises`);
      await persistenceManager.saveActiveWorkout(session);
    } catch (error) {
      console.error('Error saving active workout:', error);
    }
  };
  
  const startTimerInterval = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    timerIntervalRef.current = setInterval(() => {
      setActiveWorkout(prev => {
        if (!prev?.started || !prev.isTimerActive) return prev;
        
        const startTime = new Date(prev.startTime).getTime();
        const now = new Date().getTime();
        const newDuration = Math.floor((now - startTime) / 1000);
        
        return { ...prev, duration: newDuration };
      });
    }, 1000);
  };
  
  const stopTimerInterval = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };
  
  const startWorkout = async (workoutData: Partial<WorkoutState>) => {
    console.log('Starting new workout:', workoutData.name);
    
    const newWorkout: WorkoutState = {
      id: `workout_${Date.now()}`,
      name: workoutData.name || 'Untitled Workout',
      exercises: workoutData.exercises || [],
      started: true,
      startTime: new Date().toISOString(),
      duration: 0,
      currentExerciseIndex: 0,
      sourceType: workoutData.sourceType || 'custom',
      templateId: workoutData.templateId,
      programId: workoutData.programId,
      workoutId: workoutData.workoutId,
      isTimerActive: true,
      ...workoutData
    };
    
    setActiveWorkout(newWorkout);
    await saveActiveWorkout(newWorkout);
  };
  
  const updateWorkout = async (updates: Partial<WorkoutState>) => {
    if (!activeWorkout) return;
    
    console.log('Updating workout:', Object.keys(updates));
    const updatedWorkout = { ...activeWorkout, ...updates };
    setActiveWorkout(updatedWorkout);
    await saveActiveWorkout(updatedWorkout);
  };
  
  const toggleTimer = async () => {
    if (!activeWorkout) return;
    
    const newTimerState = !activeWorkout.isTimerActive;
    console.log('Toggle timer:', newTimerState ? 'START' : 'PAUSE');
    
    const updatedWorkout = { 
      ...activeWorkout, 
      isTimerActive: newTimerState,
      startTime: newTimerState ? new Date().toISOString() : activeWorkout.startTime
    };
    
    setActiveWorkout(updatedWorkout);
    await saveActiveWorkout(updatedWorkout);
  };
  
  const endWorkout = async (force: boolean = false) => {
    if (!activeWorkout) return;
    
    const handleEndWorkout = async () => {
      try {
        console.log('Ending workout:', activeWorkout.name);
        
        await persistenceManager.clearActiveWorkout();
        setActiveWorkout(null);
        stopTimerInterval();
        
        // Navigate away from workout page if currently on it
        if (isOnWorkoutPage) {
          router.replace('/(app)/feed');
        }
      } catch (error) {
        console.error('Error ending workout:', error);
      }
    };
    
    if (force) {
      await handleEndWorkout();
      return;
    }
    
    Alert.alert(
      t('end_workout'),
      t('end_workout_confirmation'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('end_workout'), style: 'destructive', onPress: handleEndWorkout }
      ]
    );
  };
  
  const navigateToWorkout = () => {
    if (!activeWorkout) return;
    if (isOnWorkoutPage) return; // Already on workout page
    
    console.log('Navigating to workout:', activeWorkout.name);
    
    // Simple navigation with resume flag
    const params = new URLSearchParams({
      source: activeWorkout.sourceType,
      resume: 'true',
      ...(activeWorkout.templateId && { templateId: activeWorkout.templateId.toString() }),
      ...(activeWorkout.programId && { programId: activeWorkout.programId.toString() }),
      ...(activeWorkout.workoutId && { workoutId: activeWorkout.workoutId.toString() }),
    });
    
    router.push(`/(app)/realtime-workout?${params.toString()}`);
  };
  
  const contextValue: WorkoutContextType = {
    activeWorkout,
    hasActiveWorkout,
    isOnWorkoutPage,
    startWorkout,
    updateWorkout,
    endWorkout,
    navigateToWorkout,
    toggleTimer
  };
  
  return (
    <WorkoutContext.Provider value={contextValue}>
      {children}
    </WorkoutContext.Provider>
  );
};