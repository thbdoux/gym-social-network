// context/AnalyticsContext.tsx
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../../hooks/useAuth';
import { useUserLogs } from '../../../../hooks/query/useLogQuery';
import { 
  calculateWeeklyMetrics, 
  getMuscleGroups, 
  getExercises,
  WeeklyMetrics,
  MuscleGroupData,
  ExerciseData,
  WorkoutLog,
} from '../utils/analyticsUtils';
import { inspectWorkoutLogs } from '../utils/debugUtils';

interface AnalyticsContextType {
  isLoading: boolean;
  error: Error | null;
  weeklyMetrics: WeeklyMetrics[];
  muscleGroups: MuscleGroupData[];
  exercises: ExerciseData[];
  selectedMuscleGroup: string | undefined;
  selectedExercise: string | undefined;
  timeRange: number; // Number of weeks to show
  setSelectedMuscleGroup: (muscleGroup: string | undefined) => void;
  setSelectedExercise: (exercise: string | undefined) => void;
  setTimeRange: (weeks: number) => void;
  resetFilters: () => void;
  dataError: string | null;
  logs: WorkoutLog[]; // Expose logs for new components
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { data: logs, isLoading, error } = useUserLogs(user?.username);
  
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | undefined>(undefined);
  const [selectedExercise, setSelectedExercise] = useState<string | undefined>(undefined);
  const [timeRange, setTimeRange] = useState<number>(12);
  const [dataError, setDataError] = useState<string | null>(null);
  
  // Run data inspection when logs are loaded
  useEffect(() => {
    if (logs && logs.length > 0) {
      try {
        // Debug logs structure
        // console.log('Inspecting workout logs data structure');
        // inspectWorkoutLogs(logs);
        setDataError(null);
      } catch (err) {
        console.error('Error inspecting logs:', err);
        setDataError('Error analyzing workout data. Please try again later.');
      }
    }
  }, [logs]);
  
  // Reset exercise when muscle group changes
  useEffect(() => {
    setSelectedExercise(undefined);
  }, [selectedMuscleGroup]);
  
  // Memoize muscle groups to prevent recalculation
  const muscleGroups = useMemo(() => {
    if (!logs || logs.length === 0) return [];
    
    try {
      return getMuscleGroups(logs);
    } catch (err) {
      console.error('Error getting muscle groups:', err);
      return [];
    }
  }, [logs]);
  
  // Memoize exercises to prevent recalculation
  const exercises = useMemo(() => {
    if (!logs || logs.length === 0) return [];
    
    try {
      return getExercises(logs, selectedMuscleGroup);
    } catch (err) {
      console.error('Error getting exercises:', err);
      return [];
    }
  }, [logs, selectedMuscleGroup]);
  
  // Memoize weekly metrics to prevent recalculation
  const weeklyMetrics = useMemo(() => {
    if (!logs || logs.length === 0) return [];
    
    try {
      return calculateWeeklyMetrics(
        logs,
        timeRange,
        selectedMuscleGroup,
        selectedExercise
      );
    } catch (err) {
      console.error('Error calculating metrics:', err);
      setDataError('Error calculating metrics. Please try again later.');
      return [];
    }
  }, [logs, selectedMuscleGroup, selectedExercise, timeRange]);
  
  // Memoize resetFilters to prevent recreation
  const resetFilters = useCallback(() => {
    setSelectedMuscleGroup(undefined);
    setSelectedExercise(undefined);
    setTimeRange(8);
  }, []);
  
  // Memoize context value to prevent unnecessary renders
  const value = useMemo(() => ({
    isLoading,
    error,
    weeklyMetrics,
    muscleGroups,
    exercises,
    selectedMuscleGroup,
    selectedExercise,
    timeRange,
    setSelectedMuscleGroup,
    setSelectedExercise,
    setTimeRange,
    resetFilters,
    dataError,
    logs: logs || [], // Provide logs to components that need them
  }), [
    isLoading, 
    error, 
    weeklyMetrics, 
    muscleGroups, 
    exercises, 
    selectedMuscleGroup, 
    selectedExercise, 
    timeRange,
    resetFilters,
    dataError,
    logs,
  ]);
  
  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

export default AnalyticsContext;