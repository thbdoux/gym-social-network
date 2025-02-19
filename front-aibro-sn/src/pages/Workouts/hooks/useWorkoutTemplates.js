// hooks/useWorkoutTemplates.js
import { useState, useEffect } from 'react';
import api from '../../../api';

export const useWorkoutTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      console.log('Fetching templates...');  // Debug log
      const response = await api.get('/workouts/templates/');
      setTemplates(response.data?.results || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching templates:', err);  // Debug log
      setError('Failed to load workout templates');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async (templateData) => {
    try {
      const response = await api.post('/workouts/templates/', {
        name: templateData.name,
        description: templateData.description,
        split_method: templateData.split_method,
        difficulty_level: templateData.difficulty_level,
        estimated_duration: templateData.estimated_duration,
        equipment_required: templateData.equipment_required,
        tags: templateData.tags,
        is_public: templateData.is_public
      });

      const newTemplate = response.data;

      // Add exercises if they exist
      if (templateData.exercises?.length > 0) {
        for (const exercise of templateData.exercises) {
          await api.post(`/workouts/templates/${newTemplate.id}/add_exercise/`, {
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
        }
      }

      await fetchTemplates();
      return newTemplate;
    } catch (err) {
      console.error('Failed to create template:', err);
      throw err;
    }
  };

  const updateTemplate = async (templateId, updates) => {
    try {
      // Update template base info
      const response = await api.patch(`/workouts/templates/${templateId}/`, {
        name: updates.name,
        description: updates.description,
        split_method: updates.split_method,
        difficulty_level: updates.difficulty_level,
        estimated_duration: updates.estimated_duration,
        equipment_required: updates.equipment_required,
        tags: updates.tags,
        is_public: updates.is_public
      });

      // Update exercises if they exist
      if (updates.exercises) {
        const exercisePromises = updates.exercises.map(async (exercise) => {
          if (!exercise.id || exercise.id.toString().startsWith('temp-')) {
            // Add new exercise
            return api.post(`/workouts/templates/${templateId}/exercises/`, {
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
            return api.patch(`/workouts/templates/${templateId}/exercises/${exercise.id}/`, {
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
      }

      // Refresh templates to get updated data
      await fetchTemplates();
      return response.data;
    } catch (err) {
      setError('Failed to update workout template');
      throw err;
    }
  };


  const deleteTemplate = async (templateId) => {
    try {
      await api.delete(`/workouts/templates/${templateId}/`);
      setTemplates(prevTemplates => prevTemplates.filter(t => t.id !== templateId));
    } catch (err) {
      console.error('Failed to delete template:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  return {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refreshTemplates: fetchTemplates
  };
};