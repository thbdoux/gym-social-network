// hooks/useWorkoutLogs.js
import { useState, useEffect } from 'react';
import api from '../../../api';

export const useWorkoutLogs = (activeProgram) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextWorkout, setNextWorkout] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/workouts/logs/');
      
      setLogs(response.data?.results || []);
      
      // Update next workout if active program exists
      if (activeProgram?.workouts?.length) {
        const nextWorkoutData = getNextWorkout(activeProgram);
        setNextWorkout(nextWorkoutData);
      } else {
        setNextWorkout(null);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError('Failed to load workout logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };
  
  const formatLogForAPI = (logData) => {
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
  
  const updateLog = async (logId, logData) => {
    try {
      const formattedData = formatLogForAPI({
        ...logData,
        // Include IDs for existing exercises and sets
        exercises: logData.exercises.map(exercise => ({
          ...exercise,
          sets: exercise.sets.map(set => ({
            ...set,
            id: set.id || undefined // Include ID only if it exists
          })),
          id: exercise.id || undefined // Include ID only if it exists
        }))
      });

      const response = await api.patch(`/workouts/logs/${logId}/`, formattedData);
      await fetchLogs();
      return response.data;
    } catch (err) {
      console.error('Error updating workout log:', err);
      setError('Failed to update workout log');
      throw err;
    }
  };
  
  const createLog = async (logData) => {
    try {
      const formattedData = formatLogForAPI(logData);
      const response = await api.post('/workouts/logs/', formattedData);
      await fetchLogs();
      return response.data;
    } catch (err) {
      console.error('Error creating workout log:', err);
      setError('Failed to create workout log');
      throw err;
    }
  };

  // Get the next scheduled workout from active program
  const getNextWorkout = (program) => {
    if (!program?.workouts?.length) return null;

    const today = new Date();
    const dayOfWeek = today.getDay(); // 0-6 (Sunday-Saturday)

    // Find the next workout after today
    const nextWorkout = program.workouts
      .filter(w => w.preferred_weekday >= dayOfWeek)
      .sort((a, b) => a.preferred_weekday - b.preferred_weekday)[0];

    if (nextWorkout) {
      return {
        ...nextWorkout,
        workout_name: nextWorkout.name || 'Scheduled Workout',
        date: 'Next ' + ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][nextWorkout.preferred_weekday],
        gym_name: 'Scheduled',
        duration: nextWorkout.estimated_duration || 60,
        exercise_count: nextWorkout.exercises?.length || 0
      };
    }

    // If we didn't find a workout later this week, return the first workout of next week
    if (program.workouts.length > 0) {
      const firstWorkoutNextWeek = [...program.workouts]
        .sort((a, b) => a.preferred_weekday - b.preferred_weekday)[0];
        
      return {
        ...firstWorkoutNextWeek,
        workout_name: firstWorkoutNextWeek.name || 'Scheduled Workout',
        date: 'Next ' + ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][firstWorkoutNextWeek.preferred_weekday],
        gym_name: 'Scheduled',
        duration: firstWorkoutNextWeek.estimated_duration || 60,
        exercise_count: firstWorkoutNextWeek.exercises?.length || 0
      };
    }

    return null;
  };

  // Transform logs to include required display properties
  const transformedLogs = logs.map(log => {
    // Keep all original data and add display properties
    const transformedLog = {
      ...log,
      workout_name: log.name || 'Custom Workout',
      date: new Date(log.date).toLocaleDateString(),
      gym_name: log.gym?.name || 'Not specified',
      duration: log.duration || 60,
      exercise_count: log.exercises?.length || 0,
      performance_rating: Math.round(((log.mood_rating + (log.perceived_difficulty || 5)) / 2) * 10)
    };

    // Ensure exercises and sets are properly structured
    if (transformedLog.exercises) {
      transformedLog.exercises = transformedLog.exercises.map(exercise => ({
        ...exercise,
        sets: exercise.sets || [],
        equipment: exercise.equipment || '',
        notes: exercise.notes || ''
      }));
    }

    return transformedLog;
  });

  useEffect(() => {
    fetchLogs();
  }, [activeProgram]);

  return {
    logs: transformedLogs,
    nextWorkout,
    loading,
    error,
    createLog,
    updateLog,
    refreshLogs: fetchLogs
  };
};