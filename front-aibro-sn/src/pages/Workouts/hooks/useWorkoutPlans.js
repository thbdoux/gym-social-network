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
      const updatedPlans = response.data?.results || [];
      setWorkoutPlans(updatedPlans);
      setError(null);
      return updatedPlans;
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

  const createPlan = async (planData) => {
    try {
      const response = await api.post('/workouts/programs/', planData);
      await fetchWorkoutPlans();
      return response.data;
    } catch (err) {
      setError('Failed to create workout plan');
      throw err;
    }
  };

  const updatePlan = async (planId, updates) => {
    try {
      const response = await api.patch(`/workouts/programs/${planId}/`, updates);
      await fetchWorkoutPlans();
      return response.data;
    } catch (err) {
      setError('Failed to update workout plan');
      throw err;
    }
  };

  const deletePlan = async (planId) => {
    try {
      await api.delete(`/workouts/programs/${planId}/`);
      await fetchWorkoutPlans();
    } catch (err) {
      setError('Failed to delete workout plan');
      throw err;
    }
  };

  const addWorkoutToPlan = async (planId, templateId, weekday) => {
    try {
      console.log('Adding workout to plan:', {
        planId,
        templateId,
        weekday
      });
      const response = await api.post(`/workouts/programs/${planId}/add_workout/`, {
        template_id: templateId,
        preferred_weekday: weekday
      });
      console.log('Add workout response:', response.data);
      await fetchWorkoutPlans();
      return response.data;
    } catch (err) {
      console.error('Error adding workout:', err.response || err);
      setError('Failed to add workout to plan');
      throw err;
    }
  };

  const updateWorkoutInstance = async (planId, workoutId, updates) => {
    try {
        // Log the request details
        console.log('Request details:', {
            url: `/workouts/programs/${planId}/workouts/${workoutId}/`,
            method: 'PATCH',
            data: updates
        });

        // For minimal updates (preferred_weekday only)
        if (Object.keys(updates).length === 1 && 'preferred_weekday' in updates) {
            const response = await api.patch(
                `/workouts/programs/${planId}/workouts/${workoutId}/`,
                updates,  // Send the updates directly
                {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );
            await fetchWorkoutPlans();
            return response.data;
        }

        // For full updates
        const formattedUpdates = {
            name: updates.name,
            description: updates.description || '',
            split_method: updates.split_method,
            preferred_weekday: updates.preferred_weekday,
            order:updates.order,
            program:updates.program,
            exercises: updates.exercises?.map(exercise => ({
                name: exercise.name,
                equipment: exercise.equipment || '',
                notes: exercise.notes || '',
                order: exercise.order,
                sets: exercise.sets.map((set, idx) => ({
                    reps: parseInt(set.reps),
                    weight: parseFloat(set.weight),
                    rest_time: parseInt(set.rest_time),
                    order: idx
                }))
            })) || []
        };

        const response = await api.put(
            `/workouts/programs/${planId}/workouts/${workoutId}/`,
            formattedUpdates,
            {
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );

        await fetchWorkoutPlans();
        return response.data;
    } catch (err) {
        console.error('Error updating workout:', err.response || err);
        throw err;
    }
};

  const removeWorkoutFromPlan = async (planId, workoutId) => {
    try {
      console.log('Removing workout:', {planId, workoutId});
      await api.delete(`/workouts/programs/${planId}/workouts/${workoutId}/`);
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