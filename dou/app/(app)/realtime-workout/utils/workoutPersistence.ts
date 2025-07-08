import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_WORKOUT_KEY = 'active_workout_session';
const WORKOUT_HISTORY_KEY = 'workout_history';

interface RestTimerState {
  isActive: boolean;
  totalSeconds: number;
  startTime: string;
  remainingSeconds: number;
}

export interface ActiveWorkoutSession {
  id: string;
  name: string;
  notes?: string;
  exercises: any[];
  started: boolean;
  startTime: string;
  duration: number;
  currentExerciseIndex: number;
  sourceType: 'template' | 'program' | 'custom';
  templateId?: number;
  programId?: number;
  workoutId?: number;
  gym_id?: number;
  lastUpdated: string;
  // Rest timer state
  restTimer?: RestTimerState;
}

export class WorkoutPersistenceManager {
  private static instance: WorkoutPersistenceManager;
  
  static getInstance(): WorkoutPersistenceManager {
    if (!WorkoutPersistenceManager.instance) {
      WorkoutPersistenceManager.instance = new WorkoutPersistenceManager();
    }
    return WorkoutPersistenceManager.instance;
  }

  // Save active workout session
  async saveActiveWorkout(workout: ActiveWorkoutSession): Promise<void> {
    try {
      const workoutData = {
        ...workout,
        lastUpdated: new Date().toISOString()
      };
      
      console.log('Saving workout persistence with rest timer:', workoutData.restTimer?.isActive);
      await AsyncStorage.setItem(ACTIVE_WORKOUT_KEY, JSON.stringify(workoutData));
    } catch (error) {
      console.error('Error saving active workout:', error);
      throw error;
    }
  }

  // Get active workout session
  async getActiveWorkout(): Promise<ActiveWorkoutSession | null> {
    try {
      const data = await AsyncStorage.getItem(ACTIVE_WORKOUT_KEY);
      if (!data) return null;
      
      const workout = JSON.parse(data);
      
      // Check if workout is too old (more than 24 hours)
      const lastUpdated = new Date(workout.lastUpdated);
      const now = new Date();
      const hoursDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        // Auto-archive old workout
        await this.archiveOldWorkout(workout);
        await this.clearActiveWorkout();
        return null;
      }
      
      // Handle rest timer persistence
      if (workout.restTimer?.isActive) {
        const restStartTime = new Date(workout.restTimer.startTime).getTime();
        const now = new Date().getTime();
        const elapsedSeconds = Math.floor((now - restStartTime) / 1000);
        const remainingSeconds = Math.max(0, workout.restTimer.totalSeconds - elapsedSeconds);
        
        console.log('Loading rest timer - elapsed:', elapsedSeconds, 'remaining:', remainingSeconds);
        
        if (remainingSeconds > 0) {
          workout.restTimer.remainingSeconds = remainingSeconds;
        } else {
          // Timer has expired while app was closed
          console.log('Rest timer expired while app was closed');
          workout.restTimer = undefined;
        }
      }
      
      return workout;
    } catch (error) {
      console.error('Error getting active workout:', error);
      return null;
    }
  }

  // Clear active workout (when completed or cancelled)
  async clearActiveWorkout(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ACTIVE_WORKOUT_KEY);
    } catch (error) {
      console.error('Error clearing active workout:', error);
    }
  }

  // Check if there's an active workout
  async hasActiveWorkout(): Promise<boolean> {
    const workout = await this.getActiveWorkout();
    return workout !== null;
  }

  // Archive old workout to history (for recovery)
  private async archiveOldWorkout(workout: ActiveWorkoutSession): Promise<void> {
    try {
      const historyData = await AsyncStorage.getItem(WORKOUT_HISTORY_KEY);
      const history = historyData ? JSON.parse(historyData) : [];
      
      // Add to history with archived flag
      history.unshift({
        ...workout,
        archived: true,
        archivedAt: new Date().toISOString()
      });
      
      // Keep only last 10 archived workouts
      const trimmedHistory = history.slice(0, 10);
      
      await AsyncStorage.setItem(WORKOUT_HISTORY_KEY, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('Error archiving old workout:', error);
    }
  }

  // Get workout history (for recovery purposes)
  async getWorkoutHistory(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(WORKOUT_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting workout history:', error);
      return [];
    }
  }

  // Update workout timer data
  async updateWorkoutTimer(duration: number, isActive: boolean): Promise<void> {
    try {
      const workout = await this.getActiveWorkout();
      if (workout) {
        workout.duration = duration;
        workout.lastUpdated = new Date().toISOString();
        await this.saveActiveWorkout(workout);
      }
    } catch (error) {
      console.error('Error updating workout timer:', error);
    }
  }

  // Update rest timer data
  async updateRestTimer(restTimer?: RestTimerState): Promise<void> {
    try {
      const workout = await this.getActiveWorkout();
      if (workout) {
        workout.restTimer = restTimer;
        workout.lastUpdated = new Date().toISOString();
        await this.saveActiveWorkout(workout);
        console.log('Updated rest timer in persistence:', restTimer?.isActive);
      }
    } catch (error) {
      console.error('Error updating rest timer:', error);
    }
  }
}

// Hook to use workout persistence
import { useState, useEffect } from 'react';

export const useWorkoutPersistence = () => {
  const [persistenceManager] = useState(() => WorkoutPersistenceManager.getInstance());
  const [hasActiveWorkout, setHasActiveWorkout] = useState(false);
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkoutSession | null>(null);

  const checkActiveWorkout = async () => {
    const hasActive = await persistenceManager.hasActiveWorkout();
    const active = await persistenceManager.getActiveWorkout();
    setHasActiveWorkout(hasActive);
    setActiveWorkout(active);
  };

  useEffect(() => {
    checkActiveWorkout();
  }, []);

  return {
    persistenceManager,
    hasActiveWorkout,
    activeWorkout,
    checkActiveWorkout,
  };
};