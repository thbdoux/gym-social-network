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
      // Ensure we're working with an array of logs
      const logsArray = Array.isArray(response) ? response : 
                       response.results ? response.results : [];
      setWorkoutLogs(logsArray);
      setError(null);
    } catch (err) {
      setError('Failed to load workout logs');
      console.error('Error fetching workout logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createLogFromInstance = async (instanceId, date = new Date().toISOString()) => {
    try {
      const data = await api.post('/workouts/logs/log_from_instance/', {
        instance_id: instanceId,
        date
      });
      setWorkoutLogs(prevLogs => [data, ...prevLogs]);
      return data;
    } catch (err) {
      setError('Failed to create workout log');
      console.error('Error creating workout log:', err);
      throw err;
    }
  };

  const updateLog = async (logId, updates) => {
    try {
      const data = await api.post(`/workouts/logs/${logId}/update_exercise/`, updates);
      setWorkoutLogs(prevLogs => 
        prevLogs.map(log => log.id === logId ? data : log)
      );
      return data;
    } catch (err) {
      setError('Failed to update workout log');
      console.error('Error updating workout log:', err);
      throw err;
    }
  };

  const getStats = async (startDate, endDate) => {
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('start_date', startDate);
      if (endDate) queryParams.append('end_date', endDate);
      
      return await api.get(`/workouts/logs/stats/?${queryParams}`);
    } catch (err) {
      setError('Failed to load workout stats');
      console.error('Error fetching workout stats:', err);
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
    getStats,
    refreshLogs: fetchLogs
  };
};