// hooks/useWorkoutPlans.js (Refactored)
import { useState, useEffect } from 'react';
import { programService } from '../../../api/services';

/**
 * Hook for managing workout plans/programs
 * 
 * @returns {Object} Workout plans state and operations
 */
export const useWorkoutPlans = () => {
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  /**
   * Fetches workout plans from the API
   * 
   * @returns {Promise<Array>} The fetched workout plans
   */
  const fetchWorkoutPlans = async () => {
    try {
      setLoading(true);
      const plans = await programService.getPrograms();
      setWorkoutPlans(plans);
      setError(null);
      return plans;
    } catch (err) {
      setError('Failed to load workout plans');
      setWorkoutPlans([]);
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch workout plans on mount
  useEffect(() => {
    fetchWorkoutPlans();
  }, []);

  /**
   * Creates a new workout plan
   * 
   * @param {Object} planData - Plan data
   * @returns {Promise<Object>} Created plan
   */
  const createPlan = async (planData) => {
    try {
      const newPlan = await programService.createProgram(planData);
      await fetchWorkoutPlans();
      return newPlan;
    } catch (err) {
      setError('Failed to create workout plan');
      throw err;
    }
  };

  /**
   * Updates an existing workout plan
   * 
   * @param {number|string} planId - Plan ID
   * @param {Object} updates - Plan updates
   * @returns {Promise<Object>} Updated plan
   */
  const updatePlan = async (planId, updates) => {
    try {
      const updatedPlan = await programService.updateProgram(planId, updates);
      await fetchWorkoutPlans();
      return updatedPlan;
    } catch (err) {
      setError('Failed to update workout plan');
      throw err;
    }
  };

  /**
   * Deletes a workout plan
   * 
   * @param {number|string} planId - Plan ID
   * @returns {Promise<void>}
   */
  const deletePlan = async (planId) => {
    try {
      await programService.deleteProgram(planId);
      await fetchWorkoutPlans();
    } catch (err) {
      setError('Failed to delete workout plan');
      throw err;
    }
  };

  /**
   * Adds a workout to a plan
   * 
   * @param {number|string} planId - Plan ID
   * @param {number|string} templateId - Template ID
   * @param {number} weekday - Preferred weekday (0-6)
   * @returns {Promise<Object>} Added workout
   */
  const addWorkoutToPlan = async (planId, templateId, weekday) => {
    try {
      const result = await programService.addWorkoutToProgram(planId, templateId, weekday);
      await fetchWorkoutPlans();
      return result;
    } catch (err) {
      console.error('Error adding workout:', err);
      setError('Failed to add workout to plan');
      throw err;
    }
  };

  /**
   * Updates a workout in a plan
   * 
   * @param {number|string} planId - Plan ID
   * @param {number|string} workoutId - Workout ID
   * @param {Object} updates - Workout updates
   * @returns {Promise<Object>} Updated workout
   */
  const updateWorkoutInstance = async (planId, workoutId, updates) => {
    try {
      const result = await programService.updateProgramWorkout(planId, workoutId, updates);
      await fetchWorkoutPlans();
      return result;
    } catch (err) {
      console.error('Error updating workout:', err);
      throw err;
    }
  };

  /**
   * Removes a workout from a plan
   * 
   * @param {number|string} planId - Plan ID
   * @param {number|string} workoutId - Workout ID
   * @returns {Promise<Array>} Updated plans
   */
  const removeWorkoutFromPlan = async (planId, workoutId) => {
    try {
      await programService.removeWorkoutFromProgram(planId, workoutId);
      const updatedPlans = await fetchWorkoutPlans();
      return updatedPlans;
    } catch (err) {
      console.error('Error removing workout:', err);
      throw err;
    }
  };

  return {
    workoutPlans,
    loading,
    error,
    createPlan,
    updatePlan,
    deletePlan,
    addWorkoutToPlan,
    updateWorkoutInstance,
    removeWorkoutFromPlan,
    refreshPlans: fetchWorkoutPlans
  };
};