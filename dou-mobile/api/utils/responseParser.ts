// api/utils/responseParser.ts
import { AxiosResponse } from 'axios';

/**
 * Extracts results array from paginated responses or returns data directly
 * 
 * @param response - The API response object
 * @returns The results array or original data
 */
export const extractData = (response: AxiosResponse): any => {
  // For paginated responses
  if (response.data && response.data.results !== undefined) {
    return response.data.results;
  }
  
  // For direct data responses
  return response.data;
};

/**
 * Formats log data for API submission
 * 
 * @param logData - The log data to format
 * @returns Formatted log data
 */
export const formatLogData = (logData: any): any => {
  const formattedData = { ...logData };
  
  // Format exercises if they exist
  if (formattedData.exercises) {
    formattedData.exercises = formattedData.exercises.map((exercise: any) => {
      // Format each exercise
      const formattedExercise = { ...exercise };
      
      // Format sets if they exist
      if (formattedExercise.sets) {
        formattedExercise.sets = formattedExercise.sets.map((set: any, index: number) => ({
          ...set,
          reps: parseInt(String(set.reps)),
          weight: parseFloat(String(set.weight)),
          rest_time: parseInt(String(set.rest_time)),
          order: index
        }));
      }
      
      return formattedExercise;
    });
  }
  
  return formattedData;
};

/**
 * Transforms workout logs for display
 * 
 * @param logs - Array of raw log data
 * @returns Transformed logs with additional display properties
 */
export const transformLogs = (logs: any[]): any[] => {
  return logs.map(log => ({
    ...log,
    workout_name: log.name || 'Custom Workout',
    date: new Date(log.date).toLocaleDateString(),
    gym_name: log.gym?.name || 'Not specified',
    duration: log.duration || 60,
    exercise_count: log.exercises?.length || 0,
    performance_rating: Math.round(((log.mood_rating + (log.perceived_difficulty || 5)) / 2) * 10),
    exercises: log.exercises ? log.exercises.map((exercise: any) => ({
      ...exercise,
      sets: exercise.sets || [],
      equipment: exercise.equipment || '',
      notes: exercise.notes || ''
    })) : []
  }));
};