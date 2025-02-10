import { useState, useEffect } from 'react';
import api from '../../../api';

export const useWorkoutTemplates = () => {
  const [workoutTemplates, setWorkoutTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all workout templates
  const fetchWorkoutTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/workouts/templates/');
      const templates = response.data.results || response.data || [];
      setWorkoutTemplates(Array.isArray(templates) ? templates : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Failed to load workout templates');
      setWorkoutTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  // Create a new workout template and optionally add it to a program
  const createWorkout = async (workoutData, programId = null) => {
    try {
      setLoading(true);
      
      // First create the template
      const templateData = {
        name: workoutData.name,
        description: workoutData.description,
        split_method: workoutData.split_method,
        difficulty_level: workoutData.difficulty_level || 'intermediate',
        estimated_duration: workoutData.estimated_duration || 60,
        equipment_required: [...new Set(workoutData.exercises.map(e => e.equipment).filter(Boolean))],
        tags: workoutData.tags || [],
        is_public: true
      };

      const templateResponse = await api.post('/workouts/templates/', templateData);
      const newTemplate = templateResponse.data;

      // Add exercises to the template
      for (const exercise of workoutData.exercises) {
        await api.post(`/workouts/templates/${newTemplate.id}/add_exercise/`, {
          name: exercise.name,
          equipment: exercise.equipment,
          notes: exercise.notes || '',
          order: exercise.order,
          sets: exercise.sets.map((set, idx) => ({
            reps: parseInt(set.reps),
            weight: parseFloat(set.weight),
            rest_time: parseInt(set.rest_time),
            order: idx
          }))
        });
      }

      // If a programId is provided, add the template to the program
      if (programId) {
        await api.post(`/workouts/programs/${programId}/add_workout/`, {
          template_id: newTemplate.id,
          preferred_weekday: workoutData.preferred_weekday,
          order: workoutData.order || 0
        });
      }

      await fetchWorkoutTemplates();
      return newTemplate;
    } catch (err) {
      console.error('Error creating workout:', err);
      throw new Error(err.response?.data?.detail || 'Failed to create workout');
    } finally {
      setLoading(false);
    }
  };

  // Update the day of a workout in a program
  const handleDayChange = async (programId, instanceId, newDay) => {
    try {
      const response = await api.post(`/workouts/programs/${programId}/update_workout/`, {
        instance_id: instanceId,
        preferred_weekday: newDay,
        update_type: 'weekday' // Add this to specify we're only updating the weekday
      });
      
      return response.data;
    } catch (err) {
      console.error('Error updating workout day:', err);
      throw new Error('Failed to update workout day');
    }
  };

  // Duplicate a workout in a program
  const handleDuplicateWorkout = async (programId, instanceId) => {
    try {
      await api.post(`/workouts/programs/${programId}/duplicate_workout/`, {
        instance_id: instanceId
      });
    } catch (err) {
      throw new Error('Failed to duplicate workout');
    }
  };

  // Delete a workout (from template or program)
  const deleteWorkout = async (workoutId, programId = null) => {
    try {
      setLoading(true);
      
      if (programId) {
        // Remove from program
        await api.post(`/workouts/programs/${programId}/remove_workout/`, {
          instance_id: workoutId
        });
      } else {
        // Delete the template entirely
        await api.delete(`/workouts/templates/${workoutId}/`);
        await fetchWorkoutTemplates();
      }
    } catch (err) {
      throw new Error('Failed to delete workout');
    } finally {
      setLoading(false);
    }
  };

  // Update an existing workout template
  const updateWorkout = async (templateId, updates) => {
    try {
      setLoading(true);
      
      const updateData = {
        name: updates.name,
        description: updates.description,
        split_method: updates.split_method,
        difficulty_level: updates.difficulty_level,
        estimated_duration: updates.estimated_duration,
        equipment_required: [...new Set(updates.exercises.map(e => e.equipment).filter(Boolean))],
        tags: updates.tags || [],
        exercises: updates.exercises.map((ex, i) => ({
          ...ex,
          order: i,
          sets: ex.sets.map((set, j) => ({
            ...set,
            order: j,
            reps: parseInt(set.reps),
            weight: parseFloat(set.weight),
            rest_time: parseInt(set.rest_time)
          }))
        }))
      };

      await api.post(`/workouts/templates/${templateId}/update_workout/`, updateData);
      await fetchWorkoutTemplates();
    } catch (err) {
      throw new Error('Failed to update workout');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchWorkoutTemplates();
  }, []);

  return {
    workoutTemplates,
    loading,
    error,
    createWorkout,
    updateWorkout,
    deleteWorkout,
    handleDayChange,
    handleDuplicateWorkout,
    refreshTemplates: fetchWorkoutTemplates
  };
};

export default useWorkoutTemplates;