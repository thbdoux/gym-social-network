// src/api/utils/responseParser.js

/**
 * Extracts results array from paginated responses or returns data directly
 * 
 * @param {Object} response - The API response object
 * @returns {Array|Object} The results array or original data
 */
 export const extractData = (response) => {
    // For paginated responses
    if (response.data && response.data.results !== undefined) {
      return response.data.results;
    }
    
    // For direct data responses
    return response.data;
  };
  
  /**
   * Formats workout log data for API submission
   * 
   * @param {Object} logData - The log data to format
   * @returns {Object} Formatted log data
   */
  export const formatLogData = (logData) => {
    return {
      name: logData.name,
      date: logData.date,
      gym: logData.gym,
      program: logData.program,
      based_on_instance: logData.based_on_instance,
      notes: logData.notes || "",
      completed: logData.completed,
      mood_rating: logData.mood_rating || 5,
      perceived_difficulty: logData.perceived_difficulty || 5,
      performance_notes: logData.performance_notes || "",
      exercises: logData.exercises.map(exercise => ({
        id: exercise.id, // Include ID if it exists (for updates)
        name: exercise.name,
        equipment: exercise.equipment || "",
        notes: exercise.notes || "",
        order: exercise.order,
        sets: exercise.sets.map(set => ({
          id: set.id, // Include set ID if it exists
          reps: parseInt(set.reps) || 0,
          weight: parseFloat(set.weight) || 0,
          rest_time: parseInt(set.rest_time) || 60,
          order: set.order
        }))
      }))
    };
  };
  
  /**
   * Transforms workout logs for display
   * 
   * @param {Array} logs - Array of raw log data
   * @returns {Array} Transformed logs with additional display properties
   */
  export const transformLogs = (logs) => {
    return logs.map(log => ({
      ...log,
      workout_name: log.name || 'Custom Workout',
      date: new Date(log.date).toLocaleDateString(),
      gym_name: log.gym?.name || 'Not specified',
      duration: log.duration || 60,
      exercise_count: log.exercises?.length || 0,
      performance_rating: Math.round(((log.mood_rating + (log.perceived_difficulty || 5)) / 2) * 10),
      exercises: log.exercises ? log.exercises.map(exercise => ({
        ...exercise,
        sets: exercise.sets || [],
        equipment: exercise.equipment || '',
        notes: exercise.notes || ''
      })) : []
    }));
  };