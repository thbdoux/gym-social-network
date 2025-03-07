// hooks/useWorkoutLogs.js (Refactored)
import { useState, useEffect } from 'react';
import { logService, programService } from '../../../api/services';

/**
 * Hook for managing workout logs
 * 
 * @param {Object} activeProgram - Active workout program
 * @returns {Object} Workout logs state and operations
 */
export const useWorkoutLogs = (activeProgram) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nextWorkout, setNextWorkout] = useState(null);

  /**
   * Fetches workout logs from the API
   * 
   * @returns {Promise<void>}
   */
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const fetchedLogs = await logService.getLogs();
      setLogs(fetchedLogs);
      
      // Update next workout if active program exists
      if (activeProgram?.workouts?.length) {
        const nextWorkoutData = programService.getNextWorkout(activeProgram);
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
  
  /**
   * Creates a new workout log
   * 
   * @param {Object} logData - Log data
   * @returns {Promise<Object>} Created log
   */
  const createLog = async (logData) => {
    try {
      const result = await logService.createLog(logData);
      await fetchLogs();
      return result;
    } catch (err) {
      console.error('Error creating workout log:', err);
      setError('Failed to create workout log');
      throw err;
    }
  };
  
  /**
   * Updates an existing workout log
   * 
   * @param {number|string} logId - Log ID
   * @param {Object} logData - Log data
   * @returns {Promise<Object>} Updated log
   */
  const updateLog = async (logId, logData) => {
    try {
      const result = await logService.updateLog(logId, logData);
      await fetchLogs();
      return result;
    } catch (err) {
      console.error('Error updating workout log:', err);
      setError('Failed to update workout log');
      throw err;
    }
  };

  /**
   * Deletes a workout log
   * 
   * @param {number|string} logId - Log ID
   * @returns {Promise<void>}
   */
  const deleteLog = async (logId) => {
    try {
      await logService.deleteLog(logId);
      await fetchLogs();
    } catch (err) {
      console.error('Error deleting workout log:', err);
      setError('Failed to delete workout log');
      throw err;
    }
  };

  // Fetch logs when active program changes
  useEffect(() => {
    fetchLogs();
  }, [activeProgram]);

  return {
    logs,
    nextWorkout,
    loading,
    error,
    createLog,
    updateLog,
    deleteLog,
    refreshLogs: fetchLogs
  };
};