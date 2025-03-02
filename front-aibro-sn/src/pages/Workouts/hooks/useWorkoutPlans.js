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
      const allPlans = response.data?.results || [];
      
      // Use the is_owner field from the serializer to verify ownership
      // Only display programs that the user owns, has explicitly forked, or that have been shared with them
      const filteredPlans = allPlans.filter(plan => {
        return (
          plan.is_owner ||                                // User created this plan
          (plan.program_shares && plan.program_shares.length > 0) || // Plan shared with user
          (plan.forked_from !== null)                     // User explicitly forked this plan
        );
      });
      
      setWorkoutPlans(filteredPlans);
      setError(null);
      return filteredPlans;
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
      const response = await api.post(`/workouts/programs/${planId}/add_workout/`, {
        template_id: templateId,
        preferred_weekday: weekday
      });
      await fetchWorkoutPlans();
      return response.data;
    } catch (err) {
      console.error('Error adding workout:', err.response || err);
      setError('Failed to add workout to plan');
      throw err;
    }
  };

  // Updated updateWorkoutInstance function in useWorkoutPlans.js
  const updateWorkoutInstance = async (planId, workoutId, updates) => {
    try {
        console.log(`Updating workout instance ${workoutId} in plan ${planId}`);
        console.log('Update data:', updates);
        
        // If this is just a weekday update, get the full workout data and update just the day
        if (Object.keys(updates).length === 1 && 'preferred_weekday' in updates) {
            console.log('This is a weekday-only update');
            
            // 1. Get current workout data
            const currentWorkoutResponse = await api.get(`/workouts/programs/${planId}/workouts/${workoutId}/`);
            const currentWorkout = currentWorkoutResponse.data;
            
            console.log('Current workout before update:', currentWorkout);
            console.log('Current exercises count:', currentWorkout.exercises?.length);
            
            // 2. Create updated workout with just the weekday changed
            const updatedWorkout = {
                ...currentWorkout,
                preferred_weekday: updates.preferred_weekday
            };
            
            console.log('Sending update with day change only:', updatedWorkout);
            console.log('Exercises included in update:', updatedWorkout.exercises?.length);
            
            // 3. Send the full data back
            const response = await api.put(
                `/workouts/programs/${planId}/workouts/${workoutId}/`,
                updatedWorkout,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                }
            );
            
            console.log('Response after update:', response.data);
            console.log('Exercises after update:', response.data.exercises?.length);
            
            await fetchWorkoutPlans();
            return response.data;
        }
        
        // Otherwise, proceed with normal full update
        console.log('This is a full update including multiple fields');
        
        const formattedUpdates = {
            name: updates.name,
            description: updates.description || '',
            split_method: updates.split_method,
            preferred_weekday: updates.preferred_weekday,
            difficulty_level: updates.difficulty_level,
            equipment_required: updates.equipment_required,
            estimated_duration: updates.estimated_duration,
            tags: updates.tags,
            order: updates.order,
            program: updates.program,
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

        console.log('Sending formatted update:', formattedUpdates);
        console.log('Exercises in formatted update:', formattedUpdates.exercises?.length);

        const response = await api.put(
            `/workouts/programs/${planId}/workouts/${workoutId}/`,
            formattedUpdates,
            {
                headers: {
                    'Content-Type': 'application/json',
                }
            }
        );

        console.log('Response after full update:', response.data);
        await fetchWorkoutPlans();
        return response.data;
    } catch (err) {
        console.error('Error updating workout:', err.response || err);
        throw err;
    }
};

  const removeWorkoutFromPlan = async (planId, workoutId) => {
    try {
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