import { useState, useEffect } from 'react';
import api from '../../../api';

export const useWorkoutPlans = () => {
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkoutPlans = async () => {
    try {
      setLoading(true);
      const response = await api.get('/workouts/programs/');
      const plans = response.data.results || response.data || [];
      setWorkoutPlans(Array.isArray(plans) ? plans : []);
      return plans;
    } catch (err) {
      console.error('Error fetching plans:', err);
      setWorkoutPlans([]);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshPlanData = async (planId) => {
    try {
      console.log("planId on refreshPlanData : ",planId)
      // Ensure planId is converted to string if it's an object
      const id = typeof planId === 'object' ? planId.id : planId;
      const response = await api.get(`/workouts/programs/${id}/`);
      const updatedPlan = response.data;
  
      setWorkoutPlans(prevPlans => 
        prevPlans.map(p => p.id === id ? updatedPlan : p)
      );
  
      return updatedPlan;
    } catch (err) {
      console.error('Error refreshing plan data:', err);
      throw new Error('Failed to refresh plan data');
    }
  };

  const createPlan = async (planData) => {
    try {
      const response = await api.post('/workouts/programs/', planData);
      setWorkoutPlans(prevPlans => [...prevPlans, response.data]);
      return response.data;
    } catch (err) {
      console.error('Error creating plan:', err);
      throw err;
    }
  };

  const deletePlan = async (planId) => {
    try {
      await api.delete(`/workouts/programs/${planId}/`);
      setWorkoutPlans(prevPlans => prevPlans.filter(p => p.id !== planId));
    } catch (err) {
      console.error('Error deleting plan:', err);
      throw err;
    }
  };

  const togglePlanActive = async (planId) => {
    try {
      const response = await api.post(`/workouts/programs/${planId}/toggle_active/`);
      
      // Update all plans to reflect the new active state
      setWorkoutPlans(prevPlans => 
        prevPlans.map(p => ({
          ...p,
          is_active: p.id === planId ? response.data.is_active : false
        }))
      );

      // Refresh user data to update current_program in profile
      await api.get('/users/me/').then(response => {
        // Assuming you have some way to update the global user state
        // This could be through context, redux, or other state management
        if (typeof onUserUpdate === 'function') {
          onUserUpdate(response.data);
        }
      });
      
      return response.data;
    } catch (err) {
      console.error('Error toggling plan status:', err);
      throw err;
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchWorkoutPlans();
  }, []);

  return {
    workoutPlans,
    loading,
    createPlan,
    deletePlan,
    togglePlanActive,
    refreshPlanData,
    fetchWorkoutPlans
  };
};