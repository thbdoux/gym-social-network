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