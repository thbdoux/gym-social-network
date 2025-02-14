// hooks/useWorkoutPlans.js
import { useState, useEffect } from 'react';
import api from '../../../api';

export const useWorkoutPlans = () => {
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchWorkoutPlans = async () => {
    try {
      setLoading(true);
      const response = await api.get('/workouts/programs/');
      setWorkoutPlans(response.data?.results || []);
      setError(null);
    } catch (err) {
      setError('Failed to load workout plans');
      setWorkoutPlans([]);
    } finally {
      setLoading(false);
    }
  };
  
  
    useEffect(() => {
      fetchWorkoutPlans();
    }, []);
  const refreshPlans = async () => {
    try {
      const response = await api.get('/workouts/programs/');
      const updatedPlans = response.data?.results || [];
      setWorkoutPlans(updatedPlans);
      return updatedPlans;
    } catch (err) {
      setError('Failed to refresh plans');
      throw err;
    }
  };

  const createPlan = async (planData) => {
    try {
      const response = await api.post('/workouts/programs/', {
        name: planData.name,
        description: planData.description,
        focus: planData.focus,
        sessions_per_week: planData.sessions_per_week,
        difficulty_level: planData.difficulty_level,
        recommended_level: planData.recommended_level,
        required_equipment: planData.required_equipment,
        estimated_completion_weeks: planData.estimated_completion_weeks,
        tags: planData.tags,
        is_public: planData.is_public
      });
      
      setWorkoutPlans(prevPlans => [...prevPlans, response.data]);
      return response.data;
    } catch (err) {
      setError('Failed to create workout plan');
      throw err;
    }
  };

  const updatePlan = async (planId, updates) => {
    try {
      const response = await api.patch(`/workouts/programs/${planId}/`, updates);
      setWorkoutPlans(prevPlans => 
        prevPlans.map(plan => plan.id === planId ? response.data : plan)
      );
      return response.data;
    } catch (err) {
      setError('Failed to update workout plan');
      throw err;
    }
  };

  const deletePlan = async (planId) => {
    try {
      await api.delete(`/workouts/programs/${planId}/`);
      setWorkoutPlans(prevPlans => prevPlans.filter(p => p.id !== planId));
    } catch (err) {
      setError('Failed to delete workout plan');
      throw err;
    }
  };

  const addWorkoutToPlan = async (planId, templateId, weekday) => {
    try {
      await fetchWorkoutPlans();
      const response = await api.post(`/workouts/programs/${planId}/add_workout/`, {
        template_id: templateId,
        preferred_weekday: weekday,
        order: workoutPlans.find(p => p.id === planId)?.workouts?.length || 0
      });
      
      // Refresh plans to get updated data
      await fetchWorkoutPlans();
      return response.data;
    } catch (err) {
      setError('Failed to add workout to plan');
      throw err;
    }
  };

  const updateWorkoutInstance = async (planId, instanceId, updates) => {
    try {
      await fetchWorkoutPlans();
      const response = await api.post(`/workouts/programs/${planId}/update_workout/${instanceId}/`, updates);
      return response.data;
    } catch (err) {
      setError('Failed to update workout instance');
      throw err;
    }
  };

  const removeWorkoutFromPlan = async (planId, instanceId) => {
    try {
      await fetchWorkoutPlans();
      await api.delete(`/workouts/programs/${planId}/remove_workout/${instanceId}/`);
    } catch (err) {
      setError('Failed to remove workout from plan');
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