// hooks/useWorkoutLogs.js
import { useState, useEffect } from 'react';
import api from '../../../api';

export const useWorkoutLogs = () => {
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/workouts/logs/');
      setWorkoutLogs(response.data?.results || []);
      setError(null);
    } catch (err) {
      setError('Failed to load workout logs');
      console.error('Error fetching workout logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createLogFromInstance = async (instanceId, logData = {}) => {
    try {
      const response = await api.post('/workouts/logs/log_from_instance/', {
        instance_id: instanceId,
        date: new Date().toISOString().slice(0, 16),
        gym_id: logData.gym_id,
        notes: logData.notes,
        mood_rating: logData.mood_rating || 7,
        perceived_difficulty: logData.perceived_difficulty || 7,
        performance_notes: logData.performance_notes,
        completed: logData.completed || false
      });
      setWorkoutLogs(prevLogs => [response.data, ...prevLogs]);
      return response.data;
    } catch (err) {
      setError('Failed to create workout log');
      throw err;
    }
  };

  const createCustomLog = async (logData) => {
    try {
      const response = await api.post('/workouts/logs/create_custom/', {
        date: logData.date.slice(0, 16),
        gym_id: logData.gym_id,
        notes: logData.notes,
        exercises: logData.exercises.map((ex, index) => ({
          name: ex.name,
          equipment: ex.equipment,
          notes: ex.notes,
          order: index,
          sets: ex.sets.map((set, setIndex) => ({
            reps: parseInt(set.reps),
            weight: parseFloat(set.weight),
            rest_time: parseInt(set.rest_time),
            order: setIndex
          }))
        })),
        mood_rating: logData.mood_rating || 7,
        perceived_difficulty: logData.perceived_difficulty || 7,
        performance_notes: logData.performance_notes,
        completed: logData.completed || false
      });
      setWorkoutLogs(prevLogs => [response.data, ...prevLogs]);
      return response.data;
    } catch (err) {
      setError('Failed to create custom workout log');
      throw err;
    }
  };

  const updateLog = async (logId, updates) => {
    try {
      // First update the basic log info
      const response = await api.patch(`/workouts/logs/${logId}/`, {
        date: updates.date?.slice(0, 16),
        gym_id: updates.gym_id,
        notes: updates.notes,
        mood_rating: updates.mood_rating,
        perceived_difficulty: updates.perceived_difficulty,
        performance_notes: updates.performance_notes,
        completed: updates.completed
      });

      let updatedLog = response.data;

      // Then update exercises if they exist
      if (updates.exercises) {
        const exercisePromises = updates.exercises.map(async (exercise) => {
          if (!exercise.id || exercise.id.toString().startsWith('temp-')) {
            // Add new exercise
            return api.post(`/workouts/logs/${logId}/exercises/`, {
              name: exercise.name,
              equipment: exercise.equipment,
              notes: exercise.notes,
              order: exercise.order,
              sets: exercise.sets.map((set, idx) => ({
                reps: parseInt(set.reps),
                weight: parseFloat(set.weight),
                rest_time: parseInt(set.rest_time),
                order: idx
              }))
            });
          } else {
            // Update existing exercise
            return api.patch(`/workouts/logs/${logId}/exercises/${exercise.id}/`, {
              name: exercise.name,
              equipment: exercise.equipment,
              notes: exercise.notes,
              sets: exercise.sets.map((set, idx) => ({
                reps: parseInt(set.reps),
                weight: parseFloat(set.weight),
                rest_time: parseInt(set.rest_time),
                order: idx
              }))
            });
          }
        });

        await Promise.all(exercisePromises);
        
        // Get the updated log with all changes
        const refreshResponse = await api.get(`/workouts/logs/${logId}/`);
        updatedLog = refreshResponse.data;
      }

      setWorkoutLogs(prevLogs => 
        prevLogs.map(log => log.id === logId ? updatedLog : log)
      );

      return updatedLog;
    } catch (err) {
      console.error('Error updating log:', err);
      setError('Failed to update workout log');
      throw err;
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return {
    workoutLogs,
    isLoading,
    error,
    createLogFromInstance,
    updateLog,
    refreshLogs: fetchLogs
  };
};
