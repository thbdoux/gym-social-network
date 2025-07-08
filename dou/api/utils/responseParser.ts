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
  
  // Map frontend field names to backend field names
  
  // Map gym_id to gym if it exists (not null or undefined)
  if (formattedData.gym_id !== null && formattedData.gym_id !== undefined) {
    formattedData.gym = formattedData.gym_id;
  }
  // Always remove gym_id to avoid sending both fields
  delete formattedData.gym_id;
  
  // Map program_id to program if it exists
  if (formattedData.program_id !== null && formattedData.program_id !== undefined) {
    formattedData.program = formattedData.program_id;
  }
  // Always remove program_id to avoid sending both fields
  delete formattedData.program_id;
  
  // Map program_workout_id to based_on_instance if it exists
  if (formattedData.program_workout_id !== null && formattedData.program_workout_id !== undefined) {
    formattedData.based_on_instance = formattedData.program_workout_id;
  }
  // Always remove program_workout_id to avoid sending both fields
  delete formattedData.program_workout_id;
  
  // Map difficulty_level to perceived_difficulty if it exists
  if (formattedData.difficulty_level !== null && formattedData.difficulty_level !== undefined) {
    // Convert difficulty_level string to a numeric value
    let difficultyValue;
    switch(formattedData.difficulty_level) {
      case 'beginner':
        difficultyValue = 1;
        break;
      case 'easy':
        difficultyValue = 2;
        break;
      case 'moderate':
        difficultyValue = 3;
        break;
      case 'intermediate':
        difficultyValue = 4;
        break;
      case 'advanced':
        difficultyValue = 5;
        break;
      default:
        // Try to parse as a number if it's a string representation of a number
        difficultyValue = parseInt(String(formattedData.difficulty_level)) || 3;
    }
    formattedData.perceived_difficulty = difficultyValue;
  }
  // Remove difficulty_level to avoid confusion
  delete formattedData.difficulty_level;
  
  // Remove fields that the backend doesn't need or expect
  delete formattedData.template_id;
  delete formattedData.source_type;
  delete formattedData.duration_minutes;
  
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
    gym_name: log.gym_name || 'Not specified',
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